"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const storageService_1 = require("../services/storageService");
const subscriptionFulfillment_1 = require("../services/subscriptionFulfillment");
const notificationService_1 = require("../services/notificationService");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
// GET /subscriptions/bank-details - Public / Authenticated Bank Details endpoint
router.get('/bank-details', (_req, res) => {
    return res.json({
        success: true,
        bankDetails: env_1.config.payments.bankAccount
    });
});
// GET /subscriptions/payment-history - List user's payment attempt history
router.get('/payment-history', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const attemptsSnapshot = await firebase_1.db.collection('paymentAttempts')
            .where('userId', '==', uid)
            .get();
        const attempts = await Promise.all(attemptsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const createdAtDate = data.submittedAt?.toDate ? data.submittedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()));
            const dateStr = data.paymentDate || createdAtDate.toISOString().split('T')[0];
            let proofUrl = null;
            if (data.proofStorageKey) {
                try {
                    proofUrl = await (0, storageService_1.getSignedPaymentProofUrl)(data.proofStorageKey, data.proofFileName);
                }
                catch (e) {
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
                article: data.membershipType === 'lifetime' ? 'BKMA Life Membership Subscription' : 'BKMA Annual Pass Subscription',
                amount: data.expectedAmount ? `₹${data.expectedAmount}` : (data.amount ? `₹${data.amount}` : '₹2000'),
                amountRaw: data.expectedAmount || data.amount || 2000,
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
                receiptAvailable: displayStatus === 'APPROVED'
            };
        }));
        // Sort newest first
        attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        res.json({
            success: true,
            attempts
        });
    }
    catch (error) {
        console.error('List payment history error:', error);
        res.status(500).json({ error: 'Failed to retrieve payment history' });
    }
});
// GET /subscriptions/my-subscriptions - List user's subscriptions
router.get('/my-subscriptions', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const subSnapshot = await firebase_1.db.collection('subscriptions')
            .where('userId', '==', uid)
            .get();
        const subscriptions = subSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: data.subscriptionId || doc.id,
                type: 'subscription',
                planType: data.type || data.plan || 'annual',
                amount: data.amount ? `₹${data.amount}` : (data.type === 'lifetime' ? '₹1000' : '₹2000'),
                date: data.startedAt?.toDate ? data.startedAt.toDate().toISOString().split('T')[0] : (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                status: data.status === 'active' ? 'APPROVED' : 'PENDING_VERIFICATION',
                rawStatus: data.status,
                article: data.type === 'lifetime' || data.plan === 'lifetime' ? 'BKMA Life Membership Subscription' : 'BKMA Annual Pass Subscription',
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
    }
    catch (error) {
        console.error('List subscriptions error:', error);
        res.status(500).json({ error: 'Failed to list subscriptions' });
    }
});
// Helper to mask email address
const maskEmail = (email) => {
    if (!email)
        return '***';
    const parts = email.split('@');
    if (parts.length !== 2)
        return '***';
    const user = parts[0];
    const domain = parts[1];
    if (user.length <= 2)
        return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
};
// POST /subscriptions/request-life-member-otp - Existing Life Member OTP verification system
router.post('/request-life-member-otp', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, async (req, res) => {
    try {
        const { email } = req.user;
        const { uniqueId } = req.body;
        if (!uniqueId || typeof uniqueId !== 'string' || !uniqueId.trim()) {
            return res.status(400).json({ error: 'Please provide your Unique Life Member ID.' });
        }
        const normUniqueId = uniqueId.trim().toUpperCase();
        const userEmailLower = (email || '').toLowerCase().trim();
        // Look up Life Member record by Unique ID
        let memberData = null;
        const memberDoc = await firebase_1.db.collection('life_members').doc(normUniqueId).get();
        if (memberDoc.exists) {
            memberData = memberDoc.data();
        }
        else {
            const querySnap = await firebase_1.db.collection('life_members').where('uniqueId', '==', normUniqueId).limit(1).get();
            if (!querySnap.empty) {
                memberData = querySnap.docs[0].data();
            }
            else {
                const userQuery = await firebase_1.db.collection('users')
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
        // Validate email matching
        const memberEmailLower = (memberData.emailLower || memberData.email || '').toLowerCase().trim();
        if (memberEmailLower !== userEmailLower) {
            return res.status(403).json({
                error: `Member ID "${normUniqueId}" is registered to a different email address (${maskEmail(memberEmailLower)}). Please sign in with the registered email account or contact support.`
            });
        }
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const otpDocId = `${req.user.uid}_${normUniqueId}`;
        await firebase_1.db.collection('life_member_otps').doc(otpDocId).set({
            userId: req.user.uid,
            email: email,
            uniqueId: normUniqueId,
            otp,
            expiresAt,
            verified: false,
            createdAt: new Date()
        });
        const memberName = memberData.name || req.user.name || 'Life Member';
        await (0, notificationService_1.sendLifeMemberOtpEmail)(email, memberName, normUniqueId, otp);
        res.json({
            success: true,
            message: `A 6-digit confirmation code has been sent to your registered email (${maskEmail(email)}).`,
            maskedEmail: maskEmail(email),
            uniqueId: normUniqueId
        });
    }
    catch (error) {
        console.error('Request Life Member OTP error:', error);
        res.status(500).json({ error: error.message || 'Failed to send verification OTP' });
    }
});
// POST /subscriptions/submit-proof - Submit Payment Proof for Manual Bank Transfer
// SERVER-SIDE PRICE AUTHORITY: Expected amount is computed strictly on backend.
router.post('/submit-proof', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, uploadMiddleware_1.proofUpload.single('proof'), async (req, res) => {
    try {
        const { uid, email, name } = req.user;
        const { paymentDate, transactionRef, remarks, uniqueId, otp } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'Please select and upload a payment proof receipt file (JPG, PNG, or PDF up to 5MB).' });
        }
        if (!transactionRef || typeof transactionRef !== 'string' || !transactionRef.trim()) {
            return res.status(400).json({ error: 'Please enter the Transaction / UTR / Reference Number.' });
        }
        if (!paymentDate || typeof paymentDate !== 'string' || !paymentDate.trim()) {
            return res.status(400).json({ error: 'Please enter the date payment was transferred.' });
        }
        const cleanTxRef = transactionRef.trim().toUpperCase();
        // Check if user already has an active subscription
        const existingActiveSub = await firebase_1.db.collection('subscriptions')
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
        const pendingSubmission = await firebase_1.db.collection('paymentAttempts')
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
        let verifiedUniqueId = null;
        // 1. Check user profile for verified Life Member status
        const userDoc = await firebase_1.db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        if (userData?.isLifeMember === true || userData?.lifeMember === true) {
            expectedAmount = 1000;
            isLifeMemberConcession = true;
            verifiedUniqueId = userData.membershipNumber || null;
        }
        else if (uniqueId && otp) {
            // 2. Check existing OTP verification record
            const normUniqueId = String(uniqueId).trim().toUpperCase();
            const otpDocId = `${uid}_${normUniqueId}`;
            const otpDoc = await firebase_1.db.collection('life_member_otps').doc(otpDocId).get();
            if (otpDoc.exists) {
                const otpData = otpDoc.data();
                const expiryTime = otpData.expiresAt?.toDate ? otpData.expiresAt.toDate().getTime() : new Date(otpData.expiresAt).getTime();
                if (Date.now() <= expiryTime && otpData.otp === String(otp).trim()) {
                    expectedAmount = 1000;
                    isLifeMemberConcession = true;
                    verifiedUniqueId = normUniqueId;
                    await otpDoc.ref.update({ verified: true, usedAt: new Date() });
                }
            }
        }
        const membershipType = isLifeMemberConcession ? 'lifetime' : 'annual';
        // Upload file to Cloudflare R2
        const objectKey = await (0, storageService_1.uploadPaymentProofToR2)(req.file.buffer, req.file.originalname, uid, req.file.mimetype);
        // Create paymentAttempt document with PENDING_VERIFICATION status
        const attemptRef = firebase_1.db.collection('paymentAttempts').doc();
        const now = new Date();
        const paymentRecord = {
            attemptId: attemptRef.id,
            userId: uid,
            userEmail: email || '',
            userName: name || userData?.name || 'Member',
            membershipType: membershipType,
            plan: membershipType,
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
            (0, notificationService_1.sendPaymentProofSubmittedNotification)({
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
    }
    catch (error) {
        console.error('Submit payment proof error:', error);
        res.status(500).json({ error: error.message || 'Failed to submit payment proof' });
    }
});
// GET /subscriptions/proof-url - Get signed R2 URL for viewing payment proof
router.get('/proof-url', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const proofKey = (req.query.proofKey || req.query.key);
        const { uid, role } = req.user;
        if (!proofKey) {
            return res.status(400).json({ error: 'Storage object key is required' });
        }
        // RBAC Security Check: Authorized Admin or Owner of the payment proof
        if (role !== 'admin') {
            const attemptsSnapshot = await firebase_1.db.collection('paymentAttempts')
                .where('proofStorageKey', '==', proofKey)
                .where('userId', '==', uid)
                .limit(1)
                .get();
            if (attemptsSnapshot.empty) {
                return res.status(403).json({ error: 'Access denied. You can only view your own payment proofs.' });
            }
        }
        const signedUrl = await (0, storageService_1.getSignedPaymentProofUrl)(proofKey);
        res.json({
            success: true,
            signedUrl
        });
    }
    catch (error) {
        console.error('Get proof URL error:', error);
        res.status(500).json({ error: 'Failed to generate payment proof preview link' });
    }
});
// ============================================================================
// ADMIN PAYMENT VERIFICATION ENDPOINTS
// ============================================================================
// GET /subscriptions/admin/pending - List payment submissions for Admin Verification
router.get('/admin/pending', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        const attemptsSnapshot = await firebase_1.db.collection('paymentAttempts').get();
        const submissions = await Promise.all(attemptsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const submittedAtDate = data.submittedAt?.toDate ? data.submittedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
            let proofUrl = null;
            if (data.proofStorageKey) {
                try {
                    proofUrl = await (0, storageService_1.getSignedPaymentProofUrl)(data.proofStorageKey, data.proofFileName);
                }
                catch (e) {
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
                expectedAmount: data.expectedAmount || data.amount || 2000,
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
    }
    catch (error) {
        console.error('List admin pending payments error:', error);
        res.status(500).json({ error: 'Failed to retrieve payment submissions' });
    }
});
// POST /subscriptions/admin/approve/:paymentId - Admin Approve Payment
router.post('/admin/approve/:paymentId', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const adminUid = req.user.uid;
        const adminName = req.user.name || 'Administrator';
        const result = await (0, subscriptionFulfillment_1.fulfillManualSubscriptionPayment)(paymentId, adminUid, adminName);
        if (!result.success) {
            return res.status(400).json({ error: result.error || 'Failed to approve payment' });
        }
        res.json({
            success: true,
            message: result.message || 'Payment verified and subscription activated successfully',
            alreadyApproved: result.alreadyFulfilled,
            paymentId: paymentId
        });
    }
    catch (error) {
        console.error('Admin approve payment error:', error);
        res.status(500).json({ error: error.message || 'Failed to approve payment' });
    }
});
// POST /subscriptions/admin/reject/:paymentId - Admin Reject Payment (Mandatory rejection reason)
router.post('/admin/reject/:paymentId', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { rejectionReason } = req.body;
        const adminUid = req.user.uid;
        const adminName = req.user.name || 'Administrator';
        if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
            return res.status(400).json({ error: 'A mandatory rejection reason is required to reject a payment submission.' });
        }
        const attemptRef = firebase_1.db.collection('paymentAttempts').doc(paymentId);
        const attemptDoc = await attemptRef.get();
        if (!attemptDoc.exists) {
            return res.status(404).json({ error: 'Payment submission record not found' });
        }
        const attemptData = attemptDoc.data();
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
        const userDoc = await firebase_1.db.collection('users').doc(attemptData.userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        const userEmail = userData?.email || attemptData.userEmail;
        const userName = userData?.name || attemptData.userName || 'Member';
        if (userEmail) {
            (0, notificationService_1.sendPaymentRejectedNotification)({
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
    }
    catch (error) {
        console.error('Admin reject payment error:', error);
        res.status(500).json({ error: error.message || 'Failed to reject payment' });
    }
});
exports.default = router;
