import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { paymentRateLimiter } from '../middleware/rateLimiter';
import { proofUpload } from '../middleware/uploadMiddleware';
import { uploadPaymentProofToR2, getSignedPaymentProofUrl } from '../services/storageService';
import { fulfillManualSubscriptionPayment } from '../services/subscriptionFulfillment';
import {
  sendLifeMemberOtpEmail,
  sendPaymentProofSubmittedNotification,
  sendPaymentRejectedNotification
} from '../services/notificationService';
import { config } from '../config/env';

const router = Router();

// --- In-Memory Cache for Bank / Payment Details (TTL: 5 minutes) ---
interface CachedPaymentSettings {
  data: any;
  timestamp: number;
}
let cachedPaymentSettings: CachedPaymentSettings | null = null;
const PAYMENT_SETTINGS_TTL_MS = 5 * 60 * 1000;

export const invalidatePaymentSettingsCache = () => {
  cachedPaymentSettings = null;
};

// GET /subscriptions/bank-details - Public / Authenticated Bank Details endpoint
router.get('/bank-details', async (_req, res: Response) => {
  try {
    if (cachedPaymentSettings && (Date.now() - cachedPaymentSettings.timestamp < PAYMENT_SETTINGS_TTL_MS)) {
      return res.json({
        success: true,
        serviceAvailable: true,
        bankDetails: cachedPaymentSettings.data
      });
    }

    const configDoc = await db.collection('system_config').doc('payment_settings').get();
    const configData = configDoc.exists ? configDoc.data() : null;

    let qrCodeUrl = configData?.qrCodeUrl || null;
    if (configData?.qrCodeStorageKey) {
      try {
        qrCodeUrl = await getSignedPaymentProofUrl(configData.qrCodeStorageKey, 'bank-qr.png');
      } catch (e) {
        console.warn('Could not generate presigned URL for bank QR code:', e);
      }
    }

    const mergedDetails = {
      ...config.payments.bankAccount,
      ...(configData?.bankDetails || {}),
      qrCodeUrl
    };

    const isConfigured = Boolean(
      mergedDetails.accountNumber?.trim() &&
      mergedDetails.accountName?.trim() &&
      mergedDetails.ifsc?.trim()
    );

    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        serviceAvailable: false,
        error: 'Payment service is temporarily out of order. Bank transfer environment configuration is missing.'
      });
    }

    cachedPaymentSettings = {
      data: mergedDetails,
      timestamp: Date.now()
    };

    return res.json({
      success: true,
      serviceAvailable: true,
      bankDetails: mergedDetails
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      serviceAvailable: false,
      error: 'Failed to retrieve payment service configuration.'
    });
  }
});

// GET /subscriptions/payment-history - List user's payment attempt history
router.get('/payment-history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;

    const attemptsSnapshot = await db.collection('paymentAttempts')
      .where('userId', '==', uid)
      .get();

    const attempts = await Promise.all(attemptsSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const createdAtDate = data.submittedAt?.toDate ? data.submittedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()));
      const dateStr = data.paymentDate || createdAtDate.toISOString().split('T')[0];

      let proofUrl = null;
      if (data.proofStorageKey) {
        try {
          proofUrl = await getSignedPaymentProofUrl(data.proofStorageKey, data.proofFileName);
        } catch (e) {
          console.warn(`Could not generate presigned URL for key ${data.proofStorageKey}:`, e);
        }
      }

      const displayStatus = data.status === 'APPROVED' || data.status === 'fulfilled' || data.status === 'paid' ? 'APPROVED' :
                            data.status === 'REJECTED' ? 'REJECTED' : 'PENDING_VERIFICATION';

      return {
        id: doc.id,
        attemptId: doc.id,
        paymentId: doc.id,
        plan: data.membershipType || data.plan || 'annual',
        article: data.membershipType === 'lifetime' ? 'BKMA Annual Pass (Life Member 50% Concession)' : 'BKMA Annual Pass Subscription',
        amount: (data.expectedAmount !== undefined && data.expectedAmount !== null) ? `₹${data.expectedAmount}` : ((data.amount !== undefined && data.amount !== null) ? `₹${data.amount}` : '₹2000'),
        amountRaw: data.expectedAmount !== undefined && data.expectedAmount !== null ? data.expectedAmount : (data.amount !== undefined && data.amount !== null ? data.amount : 2000),
        currency: 'INR',
        date: dateStr,
        paymentDate: data.paymentDate || dateStr,
        transactionRef: data.transactionReference || data.transactionRef || 'N/A',
        submittedAt: createdAtDate.toISOString(),
        status: displayStatus,
        rawStatus: data.status,
        paymentMethod: 'Manual Bank Transfer (UPI / NEFT / IMPS)',
        proofStorageKey: data.proofStorageKey || null,
        proofFileName: data.proofFileName || null,
        proofUrl: proofUrl,
        rejectionReason: data.rejectionReason || null,
        verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : data.verifiedAt || null,
        verifiedByName: data.verifiedByName || null,
        receiptNo: displayStatus === 'APPROVED' ? (data.receiptNo || null) : null,
        receiptAvailable: displayStatus === 'APPROVED',
        userName: data.userName || null,
        userEmail: data.userEmail || null
      };
    }));

    // Sort newest first
    attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    res.json({
      success: true,
      attempts
    });
  } catch (error: any) {
    console.error('List payment history error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment history' });
  }
});

// GET /subscriptions/my-subscriptions - List user's subscriptions
router.get('/my-subscriptions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;

    const subSnapshot = await db.collection('subscriptions')
      .where('userId', '==', uid)
      .get();

    const subscriptions = subSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: data.subscriptionId || doc.id,
        type: 'subscription',
        planType: data.type || data.plan || 'annual',
        amount: (data.amount !== undefined && data.amount !== null) ? `₹${data.amount}` : (data.type === 'lifetime' ? '₹1000' : '₹2000'),
        date: data.startedAt?.toDate ? data.startedAt.toDate().toISOString().split('T')[0] : (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        status: data.status === 'active' ? 'APPROVED' : 'PENDING_VERIFICATION',
        rawStatus: data.status,
        article: data.type === 'lifetime' || data.plan === 'lifetime' ? 'BKMA Annual Pass (Life Member 50% Concession)' : 'BKMA Annual Pass Subscription',
        paymentMethod: 'Manual Bank Transfer',
        transactionRef: data.transactionReference || 'N/A'
      };
    });

    const hasActiveSubscription = subscriptions.some(s => s.rawStatus === 'active');

    res.json({
      success: true,
      isSubscribed: hasActiveSubscription,
      subscriptions: subscriptions,
      activeSubscriptions: subscriptions.filter(s => s.rawStatus === 'active')
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

// Helper to mask email address
const maskEmail = (email: string): string => {
  if (!email) return '***';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const user = parts[0];
  const domain = parts[1];
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

// POST /subscriptions/request-life-member-otp - Existing Life Member OTP verification system
router.post('/request-life-member-otp', requireAuth, paymentRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.user!;
    const { uniqueId } = req.body;

    if (!uniqueId || typeof uniqueId !== 'string' || !uniqueId.trim()) {
      return res.status(400).json({ error: 'Please provide your Unique Life Member ID.' });
    }

    const normUniqueId = uniqueId.trim().toUpperCase();
    const currentUid = req.user!.uid;

    // Check if this Life Member ID has ALREADY been claimed/used by ANOTHER user account
    const existingUserQuery = await db.collection('users')
      .where('membershipNumber', '==', normUniqueId)
      .get();

    const usedByAnotherUser = existingUserQuery.docs.some(doc => {
      const d = doc.data();
      return doc.id !== currentUid && (d.isLifeMember === true || d.lifeMember === true || d.isSubscribed === true);
    });

    if (usedByAnotherUser) {
      return res.status(400).json({
        error: `This Life Member ID (${normUniqueId}) has already been used to claim a 50% concession subscription.`
      });
    }

    const existingOtpQuery = await db.collection('life_member_otps')
      .where('uniqueId', '==', normUniqueId)
      .where('verified', '==', true)
      .get();

    const verifiedByAnotherUser = existingOtpQuery.docs.some(doc => doc.data().userId !== currentUid);
    if (verifiedByAnotherUser) {
      return res.status(400).json({
        error: `This Life Member ID (${normUniqueId}) has already been used to claim a 50% concession subscription.`
      });
    }

    const allAttemptsSnapshot = await db.collection('paymentAttempts').get();
    const claimedByAnotherAttempt = allAttemptsSnapshot.docs.some(doc => {
      const d = doc.data();
      const attemptedUniqueId = (d.verifiedUniqueId || d.membershipNumber || d.uniqueId || d.lifeMemberId || '').toString().trim().toUpperCase();
      const isLifetime = d.membershipType === 'lifetime' || d.plan === 'lifetime' || d.expectedAmount === 1000 || d.amount === 1000;
      const isActiveOrPending = ['APPROVED', 'PENDING_VERIFICATION', 'paid', 'fulfilled'].includes(d.status);
      return (
        d.userId !== currentUid &&
        isLifetime &&
        isActiveOrPending &&
        attemptedUniqueId === normUniqueId
      );
    });

    if (claimedByAnotherAttempt) {
      return res.status(400).json({
        error: `This Life Member ID (${normUniqueId}) has already been used to claim a 50% concession subscription.`
      });
    }

    const userEmailLower = (email || '').toLowerCase().trim();

    // Look up Life Member record by Unique ID
    let memberData: any = null;
    const memberDoc = await db.collection('life_members').doc(normUniqueId).get();

    if (memberDoc.exists) {
      memberData = memberDoc.data();
    } else {
      const querySnap = await db.collection('life_members').where('uniqueId', '==', normUniqueId).limit(1).get();
      if (!querySnap.empty) {
        memberData = querySnap.docs[0].data();
      } else {
        const userQuery = await db.collection('users')
          .where('isLifeMember', '==', true)
          .where('membershipNumber', '==', normUniqueId)
          .limit(1)
          .get();
        if (!userQuery.empty) {
          memberData = userQuery.docs[0].data();
        }
      }
    }

    if (!memberData) {
      return res.status(404).json({
        error: `Unique Member ID "${normUniqueId}" was not found in the official KMA Life Members registry. Please check your ID or contact administration.`
      });
    }

    if (memberData.isClaimed === true && memberData.claimedByUserId && memberData.claimedByUserId !== currentUid) {
      return res.status(400).json({
        error: `This Life Member ID (${normUniqueId}) has already been used to claim a 50% concession subscription.`
      });
    }

    // Determine recipient email (Life Member registered email or logged-in user email)
    const memberEmailLower = (memberData.emailLower || memberData.email || '').toLowerCase().trim();
    const targetEmail = memberEmailLower || email;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpDocId = `${req.user!.uid}_${normUniqueId}`;
    await db.collection('life_member_otps').doc(otpDocId).set({
      userId: req.user!.uid,
      email: targetEmail,
      uniqueId: normUniqueId,
      otp,
      expiresAt,
      verified: false,
      createdAt: new Date()
    });

    const memberName = memberData.name || req.user!.name || 'Life Member';
    await sendLifeMemberOtpEmail(targetEmail, memberName, normUniqueId, otp);

    res.json({
      success: true,
      message: `A 6-digit confirmation code has been sent to the registered email (${maskEmail(targetEmail)}).`,
      maskedEmail: maskEmail(targetEmail),
      uniqueId: normUniqueId
    });
  } catch (error: any) {
    console.error('Request Life Member OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification OTP' });
  }
});

// POST /subscriptions/verify-life-member-otp - Verify 6-digit OTP code for Life Member Concession
router.post('/verify-life-member-otp', requireAuth, paymentRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { uniqueId, otp } = req.body;

    if (!uniqueId || typeof uniqueId !== 'string' || !uniqueId.trim()) {
      return res.status(400).json({ error: 'Unique Life Member ID is required.' });
    }

    if (!otp || typeof otp !== 'string' || !otp.trim() || otp.trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit OTP verification code.' });
    }

    const normUniqueId = uniqueId.trim().toUpperCase();
    const currentUid = req.user!.uid;

    // Check duplicate claims
    const existingUserQuery = await db.collection('users')
      .where('membershipNumber', '==', normUniqueId)
      .get();

    const usedByAnotherUser = existingUserQuery.docs.some(doc => {
      const d = doc.data();
      return doc.id !== currentUid && (d.isLifeMember === true || d.lifeMember === true || d.isSubscribed === true);
    });

    if (usedByAnotherUser) {
      return res.status(400).json({
        error: `This Life Member ID (${normUniqueId}) has already been used to claim a 50% concession subscription.`
      });
    }

    const allAttemptsSnapshot = await db.collection('paymentAttempts').get();
    const claimedByAnotherAttempt = allAttemptsSnapshot.docs.some(doc => {
      const d = doc.data();
      const attemptedUniqueId = (d.verifiedUniqueId || d.membershipNumber || d.uniqueId || d.lifeMemberId || '').toString().trim().toUpperCase();
      const isLifetime = d.membershipType === 'lifetime' || d.plan === 'lifetime' || d.expectedAmount === 1000 || d.amount === 1000;
      const isActiveOrPending = ['APPROVED', 'PENDING_VERIFICATION', 'paid', 'fulfilled'].includes(d.status);
      return (
        d.userId !== currentUid &&
        isLifetime &&
        isActiveOrPending &&
        attemptedUniqueId === normUniqueId
      );
    });

    if (claimedByAnotherAttempt) {
      return res.status(400).json({
        error: `This Life Member ID (${normUniqueId}) has already been used to claim a 50% concession subscription.`
      });
    }

    // Lookup OTP record in Firestore
    const otpDocId = `${currentUid}_${normUniqueId}`;
    const otpDoc = await db.collection('life_member_otps').doc(otpDocId).get();

    if (!otpDoc.exists) {
      return res.status(400).json({
        error: 'No OTP verification request found for this Life Member ID. Please click "Verify" to request a code.'
      });
    }

    const otpData = otpDoc.data()!;
    const expiryTime = otpData.expiresAt?.toDate ? otpData.expiresAt.toDate().getTime() : new Date(otpData.expiresAt).getTime();

    if (Date.now() > expiryTime) {
      return res.status(400).json({
        error: 'The verification code has expired. Please close this box and click "Verify" to get a new code.'
      });
    }

    if (String(otpData.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({
        error: 'Invalid 6-digit OTP code entered. Please check your email and try again.'
      });
    }

    // Mark OTP as verified
    await otpDoc.ref.update({
      verified: true,
      verifiedAt: new Date()
    });

    return res.json({
      success: true,
      message: 'Life Member ID verified successfully! 50% Concession rate applied (₹1,000).',
      uniqueId: normUniqueId
    });
  } catch (error: any) {
    console.error('Verify Life Member OTP error:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify OTP code' });
  }
});

// POST /subscriptions/submit-proof - Submit Payment Proof for Manual Bank Transfer
// SERVER-SIDE PRICE AUTHORITY: Expected amount is computed strictly on backend.
router.post(
  '/submit-proof',
  requireAuth,
  paymentRateLimiter,
  proofUpload.single('proof'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { uid, email, name } = req.user!;
      const { paymentDate, transactionRef, remarks, uniqueId, otp } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Please select and upload a payment proof receipt file (JPG, PNG, or PDF up to 5MB).' });
      }

      if (!paymentDate || typeof paymentDate !== 'string' || !paymentDate.trim()) {
        return res.status(400).json({ error: 'Please enter the date payment was transferred.' });
      }

      const cleanTxRef = (typeof transactionRef === 'string' && transactionRef.trim())
        ? transactionRef.trim().toUpperCase()
        : 'N/A';

      // Check if user already has an active subscription
      const existingActiveSub = await db.collection('subscriptions')
        .where('userId', '==', uid)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!existingActiveSub.empty) {
        return res.status(400).json({
          error: 'You already have an active BKMA subscription pass.'
        });
      }

      // Check for pending verification submission
      const pendingSubmission = await db.collection('paymentAttempts')
        .where('userId', '==', uid)
        .where('status', '==', 'PENDING_VERIFICATION')
        .limit(1)
        .get();

      if (!pendingSubmission.empty) {
        return res.status(400).json({
          error: 'You already have a payment proof submission awaiting administrator verification.'
        });
      }

      // SERVER-SIDE PRICING AUTHORITY COMPUTATION
      let expectedAmount = 2000;
      let isLifeMemberConcession = false;
      let verifiedUniqueId: string | null = null;

      // Check user profile for verified Life Member status & user email
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      const userEmailClean = (email || req.user?.email || userData?.email || '').toLowerCase().trim();
      const testEmails = ['reader1@gmail.com', 'reader@gmail.com'];
      const isSpecialTestUser = testEmails.includes(userEmailClean);

      if (isSpecialTestUser) {
        // Special testing subscription price for test reader
        expectedAmount = 1;
      } else if (userData?.isLifeMember === true || userData?.lifeMember === true) {
        expectedAmount = 1000;
        isLifeMemberConcession = true;
        verifiedUniqueId = userData.membershipNumber || null;
      } else if (uniqueId && otp) {
        // 2. Check existing OTP verification record
        const normUniqueId = String(uniqueId).trim().toUpperCase();

        // Verify if another user has already claimed this Life Member ID
        const existingUserCheck = await db.collection('users')
          .where('membershipNumber', '==', normUniqueId)
          .get();

        const isClaimedByOther = existingUserCheck.docs.some(doc => {
          const d = doc.data();
          return doc.id !== uid && (d.isLifeMember === true || d.lifeMember === true || d.isSubscribed === true);
        });

        if (isClaimedByOther) {
          return res.status(400).json({
            error: `This Life Member ID (${normUniqueId}) has already been used to claim a 50% concession subscription.`
          });
        }

        const otpDocId = `${uid}_${normUniqueId}`;
        const otpDoc = await db.collection('life_member_otps').doc(otpDocId).get();

        if (otpDoc.exists) {
          const otpData = otpDoc.data()!;
          const expiryTime = otpData.expiresAt?.toDate ? otpData.expiresAt.toDate().getTime() : new Date(otpData.expiresAt).getTime();

          if (Date.now() <= expiryTime && otpData.otp === String(otp).trim()) {
            expectedAmount = 1000;
            isLifeMemberConcession = true;
            verifiedUniqueId = normUniqueId;

            await otpDoc.ref.update({ verified: true, usedAt: new Date() });
          } else {
            return res.status(400).json({
              error: 'Invalid or expired OTP code for Life Member ID verification.'
            });
          }
        }
      }

      const membershipType = isLifeMemberConcession ? 'lifetime' : 'annual';

      // Upload file to Cloudflare R2
      const objectKey = await uploadPaymentProofToR2(
        req.file.buffer,
        req.file.originalname,
        uid,
        req.file.mimetype
      );

      // Create paymentAttempt document with PENDING_VERIFICATION status
      const attemptRef = db.collection('paymentAttempts').doc();
      const now = new Date();

      const currentYear = now.getFullYear();
      const yy = currentYear.toString().slice(-2);
      const yearStart = new Date(currentYear, 0, 1);

      let seq = '001';
      try {
        const yearCountSnap = await db.collection('paymentAttempts')
          .where('createdAt', '>=', yearStart)
          .get();
        seq = (yearCountSnap.size + 1).toString().padStart(3, '0');
      } catch (e) {
        console.warn('Failed to query yearCount for receiptNo, defaulting seq');
      }

      const generatedReceiptNo = `BKMA${yy}-${seq}`;

      const paymentRecord = {
        attemptId: attemptRef.id,
        receiptNo: generatedReceiptNo,
        userId: uid,
        userEmail: email || '',
        userName: name || userData?.name || 'Member',
        membershipType: membershipType,
        plan: membershipType,
        verifiedUniqueId: verifiedUniqueId || null,
        uniqueId: verifiedUniqueId || null,
        membershipNumber: verifiedUniqueId || null,
        expectedAmount: expectedAmount,
        amount: expectedAmount,
        currency: 'INR',
        paymentMethod: 'MANUAL_BANK_TRANSFER',
        provider: 'manual_bank_transfer',
        transactionReference: cleanTxRef,
        paymentDate: paymentDate.trim(),
        proofStorageKey: objectKey,
        proofFileName: req.file.originalname,
        proofMimeType: req.file.mimetype,
        proofFileSize: req.file.size,
        remarks: remarks ? String(remarks).trim() : '',
        status: 'PENDING_VERIFICATION',
        fulfillmentStatus: 'pending',
        submittedAt: now,
        createdAt: now,
        updatedAt: now
      };

      await attemptRef.set(paymentRecord);

      // Send email notification to user
      if (email) {
        sendPaymentProofSubmittedNotification({
          email: email,
          name: name || userData?.name || 'Member',
          plan: membershipType,
          amount: expectedAmount,
          transactionRef: cleanTxRef
        }).catch(err => {
          console.error('Failed to send proof submitted email:', err);
        });
      }

      res.json({
        success: true,
        message: 'Your payment proof has been submitted successfully and is awaiting administrator verification.',
        paymentId: attemptRef.id,
        status: 'PENDING_VERIFICATION',
        expectedAmount: expectedAmount
      });

    } catch (error: any) {
      console.error('Submit payment proof error:', error);
      res.status(500).json({ error: error.message || 'Failed to submit payment proof' });
    }
  }
);

// GET /subscriptions/proof-url - Get signed R2 URL for viewing payment proof
router.get('/proof-url', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const proofKey = (req.query.proofKey || req.query.key) as string;
    const { uid, role } = req.user!;

    if (!proofKey) {
      return res.status(400).json({ error: 'Storage object key is required' });
    }

    // RBAC Security Check: Authorized Admin or Owner of the payment proof
    if (role !== 'admin') {
      const attemptsSnapshot = await db.collection('paymentAttempts')
        .where('proofStorageKey', '==', proofKey)
        .where('userId', '==', uid)
        .limit(1)
        .get();

      if (attemptsSnapshot.empty) {
        return res.status(403).json({ error: 'Access denied. You can only view your own payment proofs.' });
      }
    }

    const signedUrl = await getSignedPaymentProofUrl(proofKey);

    res.json({
      success: true,
      signedUrl
    });

  } catch (error: any) {
    console.error('Get proof URL error:', error);
    res.status(500).json({ error: 'Failed to generate payment proof preview link' });
  }
});

// ============================================================================
// ADMIN PAYMENT VERIFICATION ENDPOINTS
// ============================================================================

// GET /subscriptions/admin/pending - List payment submissions for Admin Verification
router.get('/admin/pending', requireAuth, requireRole(['admin']), async (_req: AuthRequest, res: Response) => {
  try {
    const attemptsSnapshot = await db.collection('paymentAttempts').get();

    const submissions = await Promise.all(attemptsSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const submittedAtDate = data.submittedAt?.toDate ? data.submittedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());

      let proofUrl = null;
      if (data.proofStorageKey) {
        try {
          proofUrl = await getSignedPaymentProofUrl(data.proofStorageKey, data.proofFileName);
        } catch (e) {
          console.warn(`Admin proof URL gen failed for key ${data.proofStorageKey}`);
        }
      }

      return {
        id: doc.id,
        attemptId: doc.id,
        userId: data.userId,
        userName: data.userName || 'Member',
        userEmail: data.userEmail || '',
        membershipType: data.membershipType || data.plan || 'annual',
        expectedAmount: data.expectedAmount !== undefined && data.expectedAmount !== null ? data.expectedAmount : (data.amount !== undefined && data.amount !== null ? data.amount : 2000),
        transactionRef: data.transactionReference || data.transactionRef || 'N/A',
        paymentDate: data.paymentDate || 'N/A',
        submissionDate: submittedAtDate.toISOString().split('T')[0],
        submittedAt: submittedAtDate.toISOString(),
        proofStorageKey: data.proofStorageKey || '',
        proofFileName: data.proofFileName || 'receipt',
        proofUrl: proofUrl,
        remarks: data.remarks || '',
        status: data.status || 'PENDING_VERIFICATION',
        rejectionReason: data.rejectionReason || null,
        verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : data.verifiedAt || null,
        verifiedByName: data.verifiedByName || null
      };
    }));

    // Sort newest submission first
    submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    res.json({
      success: true,
      submissions
    });

  } catch (error: any) {
    console.error('List admin pending payments error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment submissions' });
  }
});

// POST /subscriptions/admin/approve/:paymentId - Admin Approve Payment
router.post('/admin/approve/:paymentId', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const adminUid = req.user!.uid;
    const adminName = req.user!.name || 'Administrator';

    const result = await fulfillManualSubscriptionPayment(paymentId, adminUid, adminName);

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to approve payment' });
    }

    res.json({
      success: true,
      message: result.message || 'Payment verified and subscription activated successfully',
      alreadyApproved: result.alreadyFulfilled,
      paymentId: paymentId
    });

  } catch (error: any) {
    console.error('Admin approve payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve payment' });
  }
});

// POST /subscriptions/admin/reject/:paymentId - Admin Reject Payment (Mandatory rejection reason)
router.post('/admin/reject/:paymentId', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;
    const adminUid = req.user!.uid;
    const adminName = req.user!.name || 'Administrator';

    if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
      return res.status(400).json({ error: 'A mandatory rejection reason is required to reject a payment submission.' });
    }

    const attemptRef = db.collection('paymentAttempts').doc(paymentId);
    const attemptDoc = await attemptRef.get();

    if (!attemptDoc.exists) {
      return res.status(404).json({ error: 'Payment submission record not found' });
    }

    const attemptData = attemptDoc.data()!;

    if (attemptData.status === 'APPROVED') {
      return res.status(400).json({ error: 'Cannot reject a payment that has already been approved.' });
    }

    const now = new Date();
    const cleanReason = rejectionReason.trim();

    await attemptRef.update({
      status: 'REJECTED',
      rejectionReason: cleanReason,
      rejectedAt: now,
      rejectedBy: adminUid,
      rejectedByName: adminName,
      updatedAt: now
    });

    // Send rejection email notification
    const userDoc = await db.collection('users').doc(attemptData.userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const userEmail = userData?.email || attemptData.userEmail;
    const userName = userData?.name || attemptData.userName || 'Member';

    if (userEmail) {
      sendPaymentRejectedNotification({
        email: userEmail,
        name: userName,
        plan: attemptData.membershipType || attemptData.plan || 'annual',
        amount: attemptData.expectedAmount || attemptData.amount || 2000,
        transactionRef: attemptData.transactionReference || attemptData.transactionRef || 'N/A',
        rejectionReason: cleanReason,
        verifiedByName: adminName
      }).catch(err => {
        console.error('Failed to send payment rejection email:', err);
      });
    }

    res.json({
      success: true,
      message: 'Payment submission has been rejected.',
      paymentId: paymentId,
      status: 'REJECTED'
    });

  } catch (error: any) {
    console.error('Admin reject payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject payment' });
  }
});

// POST /subscriptions/admin/upload-qr - Upload official Bank QR Code image
router.post('/admin/upload-qr', requireAuth, requireRole(['admin']), proofUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a QR code image file to upload (JPG or PNG up to 5MB).' });
    }

    const { uid } = req.user!;
    const objectKey = await uploadPaymentProofToR2(
      req.file.buffer,
      req.file.originalname,
      'admin-system-qr',
      req.file.mimetype
    );

    const signedUrl = await getSignedPaymentProofUrl(objectKey, req.file.originalname);
    const now = new Date();

    await db.collection('system_config').doc('payment_settings').set({
      qrCodeStorageKey: objectKey,
      qrCodeUrl: signedUrl,
      updatedAt: now,
      updatedBy: uid
    }, { merge: true });
    invalidatePaymentSettingsCache();

    res.json({
      success: true,
      message: 'Official Bank QR Code image uploaded successfully.',
      qrCodeUrl: signedUrl,
      objectKey
    });
  } catch (error: any) {
    console.error('Admin upload QR error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload QR Code image' });
  }
});

export default router;
