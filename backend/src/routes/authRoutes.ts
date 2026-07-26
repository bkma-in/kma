import { Router } from 'express';
import crypto from 'crypto';
import { auth, db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { logAuditEvent } from '../services/auditService';
import { config } from '../config/env';
import { sendTransactionalEmail } from '../services/emailService';
import { buildHtmlEmail } from '../services/notificationService';
import { authRateLimiter, sendVerificationRateLimiter, verifyCodeRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Helper function to hash verification OTP codes securely using SHA-256
function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

// Helper function to generate and dispatch email verification OTP via Brevo
async function generateAndSendVerificationOTP(uid: string, email: string, name: string) {
  const normEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = hashVerificationCode(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity
  const now = new Date();

  // Save to emailVerifications collection doc keyed by UID
  const verificationRef = db.collection('emailVerifications').doc(uid);
  await verificationRef.set({
    uid,
    email: normEmail,
    codeHash,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    verified: false,
    updatedAt: now
  });

  const emailHtml = buildHtmlEmail(
    name || 'User',
    'Verify Your Email Address',
    'Thank you for registering with the Bulletin of Kerala Mathematical Association. Please enter the following 6-digit verification code to complete your registration and verify your email address. This code will expire in 10 minutes.',
    'Verification Code',
    [
      { label: 'VERIFICATION CODE', value: `<span style="font-family: monospace; font-size: 18px; font-weight: 800; letter-spacing: 0.2em; color: #000000;">${otp}</span>` },
      { label: 'VALIDITY', value: '10 Minutes' }
    ],
    '',
    '',
    'Security Notice',
    'If you did not create an account with KMA, you can safely ignore this email. Never share your verification code with anyone.',
    '🔒',
    'Keep your code secure',
    '⏳',
    'Expires in 10 minutes'
  );

  await sendTransactionalEmail(normEmail, name || 'User', 'KMA Platform - Verify Your Email Address', emailHtml);
  console.log(`[AUTH-VERIFICATION] Verification OTP sent successfully to ${normEmail} (UID: ${uid})`);
  return { success: true };
}

// Endpoint for frontend to send token and get their role/profile back
router.post('/verify', requireAuth, authRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { uid, email, role, name } = req.user!;
    let mustChangePassword = false;
    
    // Check user document for email verification status
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Verify email verification state for non-admin/dev users
    if (role !== 'admin' && role !== 'dev') {
      const firebaseUser = await auth.getUser(uid).catch(() => null);
      const isEmailVerified = firebaseUser?.emailVerified === true || userData?.emailVerified === true;

      if (!isEmailVerified) {
        console.warn(`[AUTH-DIAGNOSTIC] Access Denied: User ${uid} (${email}) has unverified email.`);
        return res.status(403).json({
          error: 'Your email address is not verified. Please verify your email to access the portal.',
          emailVerified: false,
          email: email
        });
      }
    }
    
    // Check approval status for reviewers
    if (role === 'reviewer') {
      const status = userData?.status || 'Pending';
      if (status === 'Deactivated') {
        return res.status(403).json({ error: 'Your reviewer account has been deactivated. Please contact administration.' });
      }
      if (status !== 'Approved') {
        return res.status(403).json({ error: `Your reviewer application is ${status}. You can log in after approval.` });
      }

      mustChangePassword = userData?.mustChangePassword === true;

      // Log reviewer first login exactly once
      if (mustChangePassword && !userData?.firstLoginLogged) {
        await db.collection('users').doc(uid).update({ firstLoginLogged: true });
        await logAuditEvent('Reviewer First Login', uid);
      }
    } else if (role === 'admin' || role === 'dev') {
      mustChangePassword = userData?.mustChangePassword === true;
    }

    res.json({ success: true, user: { uid, email, role, name, mustChangePassword } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint to handle new user registration profile creation in Firestore
router.post('/register', requireAuth, authRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { name, role, qualification, experience } = req.body;
    const allowedRoles = ['author', 'reader', 'reviewer'];
    if (!role || !allowedRoles.includes(role)) {
      console.error(`[AUTH-DIAGNOSTIC] Registration failed: Invalid or missing role "${role}"`);
      return res.status(400).json({ error: 'Invalid or missing role. Allowed roles are: author, reader, reviewer.' });
    }
    const userRole = role;

    const { uid, email } = req.user!;
    
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Invalid name' });
    }
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const normEmail = email.toLowerCase().trim();

    // Verify that the email was verified in registrationOTPs
    const otpVerificationSnapshot = await db.collection('registrationOTPs')
      .where('email', '==', normEmail)
      .where('verified', '==', true)
      .where('used', '==', false)
      .get();

    if (otpVerificationSnapshot.empty) {
      return res.status(400).json({ error: 'Email verification is required before registration.' });
    }

    // Check if user already exists
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();
    
    if (doc.exists) {
      return res.status(400).json({ error: 'User already registered' });
    }

    const userData: any = {
      uid,
      name,
      email,
      nameLower: name.toLowerCase(),
      emailLower: email.toLowerCase(),
      role: userRole,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (userRole === 'reviewer') {
      userData.status = 'Pending';
      userData.qualification = qualification || '';
      userData.experience = experience || '';
    }

    await userRef.set(userData);

    try {
      // Set Firebase Auth custom claims for role-based authentication
      await auth.setCustomUserClaims(uid, { role: userRole, name });
    } catch (claimError) {
      // Rollback database profile if custom claims assignment fails
      await userRef.delete().catch(delErr => console.error('Failed to rollback user profile:', delErr));
      throw claimError;
    }

    // Send initial verification OTP email
    try {
      await generateAndSendVerificationOTP(uid, email, name);
    } catch (emailErr: any) {
      console.error('[AUTH-VERIFICATION] Failed to send initial verification email:', emailErr);
    }

    res.json({
      success: true,
      emailVerified: false,
      message: 'Registration successful! A 6-digit verification code has been sent to your email.',
      user: userData
    });
    // Mark the verified OTP document as used
    const verificationDocs = otpVerificationSnapshot.docs;
    const updateBatch = db.batch();
    verificationDocs.forEach(d => {
      updateBatch.update(d.ref, { used: true });
    });
    await updateBatch.commit();

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Dedicated endpoint to request / resend email verification code
router.post('/send-verification-code', sendVerificationRateLimiter, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    let uid = '';
    let email = '';
    let name = 'User';

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email || '';
        name = (decoded.name as string) || 'User';
      } catch (err) {
        // Token verification fallback
      }
    }

    if (!uid && req.body.email) {
      const normEmail = (req.body.email as string).toLowerCase().trim();
      const usersSnap = await db.collection('users').where('emailLower', '==', normEmail).limit(1).get();
      if (!usersSnap.empty) {
        const uDoc = usersSnap.docs[0];
        uid = uDoc.id;
        email = normEmail;
        name = uDoc.data().name || 'User';
      } else {
        // Prevent email enumeration: return generic response
        return res.json({
          success: true,
          message: 'If the registration request can be processed, a verification email has been sent.'
        });
      }
    }

    if (!uid || !email) {
      return res.status(400).json({ error: 'Valid authenticated session or email address is required.' });
    }

    // Enforce 60-second resend cooldown
    const verDocRef = db.collection('emailVerifications').doc(uid);
    const verDoc = await verDocRef.get();
    if (verDoc.exists) {
      const vData = verDoc.data();
      if (vData?.verified === true) {
        return res.json({ success: true, verified: true, message: 'Email address is already verified.' });
      }
      const lastSent = vData?.lastSentAt?.toDate ? vData.lastSentAt.toDate().getTime() : new Date(vData?.lastSentAt || 0).getTime();
      const timeElapsed = Date.now() - lastSent;
      if (timeElapsed < 60000) {
        const cooldownRemaining = Math.ceil((60000 - timeElapsed) / 1000);
        return res.status(429).json({
          error: `Please wait ${cooldownRemaining} seconds before requesting a new verification code.`,
          cooldownRemaining
        });
      }
    }

    await generateAndSendVerificationOTP(uid, email, name);
    res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email address.'
    });
  } catch (error: any) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification code.' });
  }
});

// Dedicated endpoint to verify 6-digit email OTP
router.post('/verify-email-code', verifyCodeRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    let email = req.body.email as string | undefined;
    let uid = '';

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email || email;
      } catch (err) {
        // Token fallback
      }
    }

    if (!uid && email) {
      const normEmail = email.toLowerCase().trim();
      const usersSnap = await db.collection('users').where('emailLower', '==', normEmail).limit(1).get();
      if (!usersSnap.empty) {
        uid = usersSnap.docs[0].id;
      }
    }

    if (!uid) {
      return res.status(400).json({ error: 'Valid session or email address is required.' });
    }

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
    }

    const verRef = db.collection('emailVerifications').doc(uid);
    const verDoc = await verRef.get();

    if (!verDoc.exists) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const vData = verDoc.data()!;

    if (vData.verified === true) {
      return res.json({ success: true, verified: true, message: 'Email address is already verified.' });
    }

    // Brute-force protection: check maximum failed attempts
    const attempts = vData.attempts || 0;
    if (attempts >= 5) {
      await verRef.update({ codeHash: null });
      return res.status(400).json({
        error: 'Too many incorrect attempts. This verification code has been invalidated. Please request a new code.'
      });
    }

    // Check expiration
    const expiresAt = vData.expiresAt?.toDate ? vData.expiresAt.toDate() : new Date(vData.expiresAt);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Hash user-submitted code and compare with stored codeHash
    const submittedHash = hashVerificationCode(code);
    if (!vData.codeHash || submittedHash !== vData.codeHash) {
      const newAttempts = attempts + 1;
      await verRef.update({ attempts: newAttempts });

      if (newAttempts >= 5) {
        await verRef.update({ codeHash: null });
        return res.status(400).json({
          error: 'Invalid code. Maximum attempts reached. Code has been invalidated; please request a new code.'
        });
      }

      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Verification Success!
    const now = new Date();
    await verRef.update({
      verified: true,
      codeHash: null,
      verifiedAt: now,
      updatedAt: now
    });

    // Update Firestore User Document
    await db.collection('users').doc(uid).update({
      emailVerified: true,
      updatedAt: now
    });

    // Update Firebase Authentication User Record
    await auth.updateUser(uid, { emailVerified: true }).catch(fbErr => {
      console.warn('[AUTH-VERIFICATION] Firebase Auth emailVerified update warning:', fbErr);
    });

    // Audit Log
    await logAuditEvent('Email Verified', uid);

    console.log(`[AUTH-VERIFICATION] Successfully verified email for UID: ${uid}`);

    res.json({
      success: true,
      verified: true,
      message: 'Your email address has been verified successfully!'
    });
  } catch (error: any) {
    console.error('Verify email code error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify code.' });
  }
});


// Endpoint to change password securely and clear mustChangePassword status
router.post('/change-password', requireAuth, authRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // 1. Update password securely in Firebase Authentication
    await auth.updateUser(uid, { password: newPassword });

    // 2. Update Firestore user document
    await db.collection('users').doc(uid).update({
      mustChangePassword: false,
      updatedAt: new Date()
    });

    // 3. Record Password Changed event in audit log
    await logAuditEvent('Password Changed', uid);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message || 'Failed to change password.' });
  }
});

// ─── Registration OTP Routes ──────────────────────────────────────────

// 1. Send Registration OTP
router.post('/registration/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normEmail = email.toLowerCase().trim();

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normEmail)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Rate Limit: Check if an OTP was sent in the last 60 seconds or if they exceeded 3 per day
    const recentSnapshot = await db.collection('registrationOTPs')
      .where('email', '==', normEmail)
      .get();
    
    const now = Date.now();
    let hasRecent = false;
    let dailyCount = 0;

    recentSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt.toDate ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
      
      // Check 60 seconds limit
      if ((now - createdAt) < 60000) {
        hasRecent = true;
      }
      // Check 24 hours limit
      if ((now - createdAt) < 24 * 60 * 60 * 1000) {
        dailyCount++;
      }
    });

    if (hasRecent) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting another verification code.' });
    }

    if (dailyCount >= 3) {
      return res.status(429).json({ error: 'You have reached the maximum limit of 3 verification codes per day.' });
    }

    // Invalidate previous active OTPs
    const activeSnapshot = await db.collection('registrationOTPs')
      .where('email', '==', normEmail)
      .where('used', '==', false)
      .where('verified', '==', false)
      .get();

    const batch = db.batch();
    activeSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { used: true, expiresAt: new Date(0) });
    });
    await batch.commit();

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes validity

    const otpRef = db.collection('registrationOTPs').doc();
    await otpRef.set({
      id: otpRef.id,
      email: normEmail,
      otp,
      expiresAt,
      verified: false,
      used: false,
      attempts: 0,
      createdAt: new Date()
    });

    // Send email using standard Brevo wrapper
    const supportUrl = config.brevo.supportUrl;
    const emailHtml = buildHtmlEmail(
      'New User',
      'Verify Your Email Address',
      'Thank you for registering. Use the following 6-digit One-Time Password (OTP) to verify your email address and complete your registration. This OTP is valid for 5 minutes.',
      'Verification Code',
      [
        { label: 'OTP CODE', value: `<span style="font-family: monospace; font-size: 16px; font-weight: 800; letter-spacing: 0.15em; color: #000000;">${otp}</span>` }
      ],
      '',
      '',
      'Security Notice',
      `If you did not request this code, please ignore this email or contact <a href="${supportUrl}" style="color: #000000; text-decoration: underline;"><strong>support</strong></a>. Keep this verification code confidential.`,
      '🔒',
      'Do not share this code',
      '⏳',
      'Expires in 5 minutes'
    );

    await sendTransactionalEmail(normEmail, 'New User', 'KMA Portal Registration Verification OTP', emailHtml);

    res.json({ success: true, message: 'Verification OTP has been sent to your email.' });
  } catch (error: any) {
    console.error('Registration Send OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification OTP.' });
  }
});

// 2. Verify Registration OTP
router.post('/registration/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const normEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    // Query active unverified OTPs
    const snapshot = await db.collection('registrationOTPs')
      .where('email', '==', normEmail)
      .where('used', '==', false)
      .where('verified', '==', false)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), ref: doc.ref } as any));
    docs.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    const activeDoc = docs[0];

    const attempts = (activeDoc.attempts || 0) + 1;
    if (attempts > 5) {
      await activeDoc.ref.update({ used: true, expiresAt: new Date(0) });
      return res.status(400).json({ error: 'Too many verification attempts. Please request a new OTP.' });
    }

    await activeDoc.ref.update({ attempts });

    const expiresAt = activeDoc.expiresAt.toDate ? activeDoc.expiresAt.toDate() : new Date(activeDoc.expiresAt);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
    }

    if (activeDoc.otp !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    await activeDoc.ref.update({ verified: true });
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error: any) {
    console.error('Registration Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP.' });
  }
});

// ─── Forgot Password Routes ──────────────────────────────────────────

// 1. Send OTP Route
router.post('/forgot-password/send-otp', authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normEmail = email.toLowerCase().trim();

    // Verify user exists in Firestore
    const usersSnapshot = await db.collection('users').where('email', '==', normEmail).limit(1).get();
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const userData = usersSnapshot.docs[0].data();
    const userName = userData.name || 'User';

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Save to Firestore passwordResetOTPs
    const otpRef = db.collection('passwordResetOTPs').doc();
    await otpRef.set({
      id: otpRef.id,
      email: normEmail,
      otp,
      expiresAt,
      verified: false,
      used: false,
      createdAt: new Date()
    });

    // Send email using standard Brevo wrapper and the standardized layout
    const logoUrl = config.brevo.logoUrl;
    const loginUrl = config.brevo.loginUrl;
    const supportUrl = config.brevo.supportUrl;
    const emailHtml = buildHtmlEmail(
      userName,
      'Reset Your Password',
      'You have requested to reset your password for the Bulletin of Kerala Mathematical Association portal. Use the following 6-digit One-Time Password (OTP) to verify your identity. This OTP is valid for 5 minutes.',
      'Verification Code',
      [
        { label: 'OTP CODE', value: `<span style="font-family: monospace; font-size: 16px; font-weight: 800; letter-spacing: 0.15em; color: #000000;">${otp}</span>` }
      ],
      '',
      '',
      'Security Notice',
      `If you did not request a password reset, please ignore this email or contact <a href="${supportUrl}" style="color: #000000; text-decoration: underline;"><strong>support</strong></a>. Keep this verification code confidential.`,
      '🔒',
      'Do not share this code',
      '⏳',
      'Expires in 5 minutes'
    );

    await sendTransactionalEmail(normEmail, userName, 'KMA Portal Password Reset OTP', emailHtml);

    res.json({ success: true, message: 'Verification OTP has been sent to your email.' });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification OTP.' });
  }
});

// 2. Verify OTP Route
router.post('/forgot-password/verify-otp', authRateLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const normEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    // Query unverified and unused OTPs for this email (in-memory sort to avoid Firestore composite index requirement)
    const snapshot = await db.collection('passwordResetOTPs')
      .where('email', '==', normEmail)
      .where('otp', '==', cleanOtp)
      .where('used', '==', false)
      .where('verified', '==', false)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    docs.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

    const activeOtp = docs[0];
    const expiresAt = activeOtp.expiresAt.toDate ? activeOtp.expiresAt.toDate() : new Date(activeOtp.expiresAt);

    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired (5-minute limit).' });
    }

    // Generate secure short-lived reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes reset window

    await db.collection('passwordResetOTPs').doc(activeOtp.id).update({
      verified: true,
      resetToken,
      tokenExpiresAt
    });

    res.json({ success: true, resetToken });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP.' });
  }
});

// 3. Reset Password Route
router.post('/forgot-password/reset', authRateLimiter, async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
    }

    const normEmail = email.toLowerCase().trim();

    // Verify token exists and is valid
    const snapshot = await db.collection('passwordResetOTPs')
      .where('email', '==', normEmail)
      .where('resetToken', '==', resetToken)
      .where('verified', '==', true)
      .where('used', '==', false)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: 'Invalid or expired password reset session.' });
    }

    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    docs.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

    const activeOtp = docs[0];
    const tokenExpires = activeOtp.tokenExpiresAt.toDate ? activeOtp.tokenExpiresAt.toDate() : new Date(activeOtp.tokenExpiresAt);

    if (tokenExpires < new Date()) {
      return res.status(400).json({ error: 'Reset session has expired. Please request a new OTP.' });
    }

    // Enforce Password Complexity Constraint:
    // 1 Uppercase (capital), 1 Lowercase (small), 1 Digit, 1 Special Char, Minimum 8 characters
    const complexityRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]).{8,}$/;
    if (!complexityRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password does not meet security requirements: Minimum 8 characters, with at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character.'
      });
    }

    // Find the user's Auth account to get the UID
    const userRecord = await auth.getUserByEmail(normEmail);

    // Update password securely in Firebase Auth
    await auth.updateUser(userRecord.uid, { password: newPassword });

    // Update user doc in Firestore (e.g. clear mustChangePassword flag)
    await db.collection('users').doc(userRecord.uid).update({
      mustChangePassword: false,
      updatedAt: new Date()
    });

    // Mark reset OTP document as used
    await db.collection('passwordResetOTPs').doc(activeOtp.id).update({
      used: true
    });

    // Log security audit event
    await logAuditEvent('Password Changed', userRecord.uid);

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password.' });
  }
});

export default router;
