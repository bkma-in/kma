"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const auditService_1 = require("../services/auditService");
const env_1 = require("../config/env");
const emailService_1 = require("../services/emailService");
const notificationService_1 = require("../services/notificationService");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Helper function to hash verification OTP codes securely using SHA-256
function hashVerificationCode(code) {
    return crypto_1.default.createHash('sha256').update(code.trim()).digest('hex');
}
// Helper function to generate and dispatch email verification OTP via Brevo
async function generateAndSendVerificationOTP(docId, email, name) {
    const normEmail = email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashVerificationCode(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity
    const now = new Date();
    // Save to emailVerifications collection doc keyed by docId (UID or email)
    const verificationRef = firebase_1.db.collection('emailVerifications').doc(docId);
    await verificationRef.set({
        uid: docId.includes('@') ? '' : docId,
        email: normEmail,
        codeHash,
        otp,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        verified: false,
        used: false,
        updatedAt: now,
        createdAt: now
    });
    // Also update registrationOTPs for backward compatibility
    const regOtpRef = firebase_1.db.collection('registrationOTPs').doc(docId);
    await regOtpRef.set({
        id: docId,
        email: normEmail,
        codeHash,
        otp,
        expiresAt,
        verified: false,
        used: false,
        attempts: 0,
        createdAt: now
    }).catch(() => { });
    const emailHtml = (0, notificationService_1.buildHtmlEmail)(name || 'User', 'Verify Your Email Address', 'Thank you for registering with the Bulletin of Kerala Mathematical Association. Please enter the following 6-digit verification code to complete your registration and verify your email address. This code will expire in 10 minutes.', 'Verification Code', [
        { label: 'VERIFICATION CODE', value: `<span style="font-family: monospace; font-size: 18px; font-weight: 800; letter-spacing: 0.2em; color: #000000;">${otp}</span>` },
        { label: 'VALIDITY', value: '10 Minutes' }
    ], '', '', 'Security Notice', 'If you did not create an account with KMA, you can safely ignore this email. Never share your verification code with anyone.', '🔒', 'Keep your code secure', '⏳', 'Expires in 10 minutes');
    await (0, emailService_1.sendTransactionalEmail)(normEmail, name || 'User', 'KMA Platform - Verify Your Email Address', emailHtml);
    console.log(`[AUTH-VERIFICATION] Verification OTP sent successfully to ${normEmail} (DocID: ${docId})`);
    return { success: true };
}
// Endpoint for frontend to send token and get their role/profile back
router.post('/verify', authMiddleware_1.requireAuth, rateLimiter_1.authRateLimiter, async (req, res) => {
    try {
        const { uid, email, role, name } = req.user;
        let mustChangePassword = false;
        // Check user document for email verification status
        const userDoc = await firebase_1.db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        // Verify email verification state for non-admin/dev users
        if (role !== 'admin' && role !== 'dev') {
            const firebaseUser = await firebase_1.auth.getUser(uid).catch(() => null);
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
                await firebase_1.db.collection('users').doc(uid).update({ firstLoginLogged: true });
                await (0, auditService_1.logAuditEvent)('Reviewer First Login', uid);
            }
        }
        else if (role === 'admin' || role === 'dev') {
            mustChangePassword = userData?.mustChangePassword === true;
        }
        res.json({ success: true, user: { uid, email, role, name, mustChangePassword } });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Endpoint to handle new user registration profile creation in Firestore
router.post('/register', authMiddleware_1.requireAuth, rateLimiter_1.authRateLimiter, async (req, res) => {
    try {
        const { name, role, qualification, experience } = req.body;
        const allowedRoles = ['author', 'reader', 'reviewer'];
        if (!role || !allowedRoles.includes(role)) {
            console.error(`[AUTH-DIAGNOSTIC] Registration failed: Invalid or missing role "${role}"`);
            return res.status(400).json({ error: 'Invalid or missing role. Allowed roles are: author, reader, reviewer.' });
        }
        const userRole = role;
        const { uid, email } = req.user;
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Invalid name' });
        }
        if (typeof email !== 'string' || email.trim() === '') {
            return res.status(400).json({ error: 'Invalid email' });
        }
        const normEmail = email.toLowerCase().trim();
        // Verify that the email was verified in registrationOTPs
        const otpVerificationSnapshot = await firebase_1.db.collection('registrationOTPs')
            .where('email', '==', normEmail)
            .where('verified', '==', true)
            .where('used', '==', false)
            .get();
        if (otpVerificationSnapshot.empty) {
            return res.status(400).json({ error: 'Email verification is required before registration.' });
        }
        // Check if user already exists
        const userRef = firebase_1.db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (doc.exists) {
            return res.status(400).json({ error: 'User already registered' });
        }
        const userData = {
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
            await firebase_1.auth.setCustomUserClaims(uid, { role: userRole, name });
        }
        catch (claimError) {
            // Rollback database profile if custom claims assignment fails
            await userRef.delete().catch(delErr => console.error('Failed to rollback user profile:', delErr));
            throw claimError;
        }
        // Send initial verification OTP email
        try {
            await generateAndSendVerificationOTP(uid, email, name);
        }
        catch (emailErr) {
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
        const updateBatch = firebase_1.db.batch();
        verificationDocs.forEach(d => {
            updateBatch.update(d.ref, { used: true });
        });
        await updateBatch.commit();
        res.json({ success: true, user: userData });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
// Dedicated endpoint to request / resend email verification code
router.post('/send-verification-code', rateLimiter_1.sendVerificationRateLimiter, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let uid = '';
        let email = '';
        let name = 'User';
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decoded = await firebase_1.auth.verifyIdToken(token);
                uid = decoded.uid;
                email = decoded.email || '';
                name = decoded.name || 'User';
            }
            catch (err) {
                // Token verification fallback
            }
        }
        if (!email && req.body.email) {
            email = req.body.email.toLowerCase().trim();
            name = req.body.name || name;
        }
        if (!email) {
            return res.status(400).json({ error: 'A valid email address is required.' });
        }
        const normEmail = email.toLowerCase().trim();
        // Determine target document ID: use UID if available or user exists in DB, else email address
        let targetDocId = uid;
        if (!targetDocId) {
            const usersSnap = await firebase_1.db.collection('users').where('emailLower', '==', normEmail).limit(1).get();
            if (!usersSnap.empty) {
                const uDoc = usersSnap.docs[0];
                targetDocId = uDoc.id;
                name = uDoc.data().name || name;
            }
            else {
                targetDocId = normEmail;
            }
        }
        // Enforce 60-second resend cooldown
        const verDocRef = firebase_1.db.collection('emailVerifications').doc(targetDocId);
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
        await generateAndSendVerificationOTP(targetDocId, normEmail, name);
        res.json({
            success: true,
            message: 'A 6-digit verification code has been sent to your email address.'
        });
    }
    catch (error) {
        console.error('Send verification code error:', error);
        res.status(500).json({ error: error.message || 'Failed to send verification code.' });
    }
});
// Alias /registration/send-otp to send verification code
router.post('/registration/send-otp', rateLimiter_1.sendVerificationRateLimiter, async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email || typeof email !== 'string' || email.trim() === '') {
            return res.status(400).json({ error: 'A valid email address is required.' });
        }
        const normEmail = email.toLowerCase().trim();
        await generateAndSendVerificationOTP(normEmail, normEmail, name || 'User');
        res.json({ success: true, message: 'A 6-digit verification code has been sent to your email address.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to send verification code.' });
    }
});
// Dedicated endpoint to verify 6-digit email OTP
router.post('/verify-email-code', rateLimiter_1.verifyCodeRateLimiter, async (req, res) => {
    try {
        const { code } = req.body;
        let email = req.body.email;
        let uid = '';
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decoded = await firebase_1.auth.verifyIdToken(token);
                uid = decoded.uid;
                email = decoded.email || email;
            }
            catch (err) {
                // Token fallback
            }
        }
        if (!code || typeof code !== 'string' || code.trim().length !== 6) {
            return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
        }
        if (!email && !uid) {
            return res.status(400).json({ error: 'Email address or valid session is required.' });
        }
        const normEmail = (email || '').toLowerCase().trim();
        let targetDocId = uid;
        if (!targetDocId && normEmail) {
            const usersSnap = await firebase_1.db.collection('users').where('emailLower', '==', normEmail).limit(1).get();
            if (!usersSnap.empty) {
                targetDocId = usersSnap.docs[0].id;
            }
            else {
                targetDocId = normEmail;
            }
        }
        let verRef = firebase_1.db.collection('emailVerifications').doc(targetDocId);
        let verDoc = await verRef.get();
        // Fallback to checking by email if doc by UID wasn't found
        if (!verDoc.exists && normEmail) {
            verRef = firebase_1.db.collection('emailVerifications').doc(normEmail);
            verDoc = await verRef.get();
        }
        if (!verDoc.exists) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }
        const vData = verDoc.data();
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
        const cleanCode = code.trim();
        const submittedHash = hashVerificationCode(cleanCode);
        const isMatch = (vData.codeHash && submittedHash === vData.codeHash) || (vData.otp && vData.otp === cleanCode);
        if (!isMatch) {
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
        // Also update registrationOTPs doc for backward compatibility
        await firebase_1.db.collection('registrationOTPs').doc(targetDocId).update({
            verified: true,
            codeHash: null,
            updatedAt: now
        }).catch(() => { });
        if (normEmail) {
            const snap = await firebase_1.db.collection('registrationOTPs').where('email', '==', normEmail).get();
            const batch = firebase_1.db.batch();
            snap.docs.forEach(d => batch.update(d.ref, { verified: true }));
            await batch.commit().catch(() => { });
        }
        // If user document already exists in Firestore, update it
        let realUid = uid || (targetDocId.includes('@') ? '' : targetDocId);
        if (!realUid && normEmail) {
            const uSnap = await firebase_1.db.collection('users').where('emailLower', '==', normEmail).limit(1).get();
            if (!uSnap.empty) {
                realUid = uSnap.docs[0].id;
            }
        }
        if (realUid) {
            await firebase_1.db.collection('users').doc(realUid).update({
                emailVerified: true,
                updatedAt: now
            }).catch(() => { });
            await firebase_1.auth.updateUser(realUid, { emailVerified: true }).catch(fbErr => {
                console.warn('[AUTH-VERIFICATION] Firebase Auth emailVerified update warning:', fbErr);
            });
            await (0, auditService_1.logAuditEvent)('Email Verified', realUid).catch(() => { });
        }
        console.log(`[AUTH-VERIFICATION] Successfully verified email for: ${normEmail || targetDocId}`);
        res.json({
            success: true,
            verified: true,
            message: 'Your email address has been verified successfully!'
        });
    }
    catch (error) {
        console.error('Verify email code error:', error);
        res.status(500).json({ error: error.message || 'Failed to verify code.' });
    }
});
// Alias /registration/verify-otp to /verify-email-code
router.post('/registration/verify-otp', rateLimiter_1.verifyCodeRateLimiter, async (req, res) => {
    try {
        const code = req.body.otp || req.body.code;
        const email = req.body.email;
        if (!code || typeof code !== 'string' || code.trim().length !== 6) {
            return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
        }
        if (!email) {
            return res.status(400).json({ error: 'A valid email address is required.' });
        }
        const normEmail = email.toLowerCase().trim();
        let verRef = firebase_1.db.collection('emailVerifications').doc(normEmail);
        let verDoc = await verRef.get();
        if (!verDoc.exists) {
            verRef = firebase_1.db.collection('registrationOTPs').doc(normEmail);
            verDoc = await verRef.get();
        }
        if (!verDoc.exists) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }
        const vData = verDoc.data();
        const cleanCode = code.trim();
        const submittedHash = hashVerificationCode(cleanCode);
        const isMatch = (vData.codeHash && submittedHash === vData.codeHash) || (vData.otp && vData.otp === cleanCode);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
        }
        const now = new Date();
        await verRef.update({ verified: true, verifiedAt: now, updatedAt: now });
        res.json({ success: true, verified: true, message: 'Your email address has been verified successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to verify code.' });
    }
});
// Endpoint to change password securely and clear mustChangePassword status
router.post('/change-password', authMiddleware_1.requireAuth, rateLimiter_1.authRateLimiter, async (req, res) => {
    try {
        const { uid } = req.user;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }
        // 1. Update password securely in Firebase Authentication
        await firebase_1.auth.updateUser(uid, { password: newPassword });
        // 2. Update Firestore user document
        await firebase_1.db.collection('users').doc(uid).update({
            mustChangePassword: false,
            updatedAt: new Date()
        });
        // 3. Record Password Changed event in audit log
        await (0, auditService_1.logAuditEvent)('Password Changed', uid);
        res.json({ success: true, message: 'Password changed successfully.' });
    }
    catch (error) {
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
        const recentSnapshot = await firebase_1.db.collection('registrationOTPs')
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
        const activeSnapshot = await firebase_1.db.collection('registrationOTPs')
            .where('email', '==', normEmail)
            .where('used', '==', false)
            .where('verified', '==', false)
            .get();
        const batch = firebase_1.db.batch();
        activeSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { used: true, expiresAt: new Date(0) });
        });
        await batch.commit();
        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes validity
        const otpRef = firebase_1.db.collection('registrationOTPs').doc();
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
        const supportUrl = env_1.config.brevo.supportUrl;
        const emailHtml = (0, notificationService_1.buildHtmlEmail)('New User', 'Verify Your Email Address', 'Thank you for registering. Use the following 6-digit One-Time Password (OTP) to verify your email address and complete your registration. This OTP is valid for 5 minutes.', 'Verification Code', [
            { label: 'OTP CODE', value: `<span style="font-family: monospace; font-size: 16px; font-weight: 800; letter-spacing: 0.15em; color: #000000;">${otp}</span>` }
        ], '', '', 'Security Notice', `If you did not request this code, please ignore this email or contact <a href="${supportUrl}" style="color: #000000; text-decoration: underline;"><strong>support</strong></a>. Keep this verification code confidential.`, '🔒', 'Do not share this code', '⏳', 'Expires in 5 minutes');
        await (0, emailService_1.sendTransactionalEmail)(normEmail, 'New User', 'KMA Portal Registration Verification OTP', emailHtml);
        res.json({ success: true, message: 'Verification OTP has been sent to your email.' });
    }
    catch (error) {
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
        const snapshot = await firebase_1.db.collection('registrationOTPs')
            .where('email', '==', normEmail)
            .where('used', '==', false)
            .where('verified', '==', false)
            .get();
        if (snapshot.empty) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), ref: doc.ref }));
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
    }
    catch (error) {
        console.error('Registration Verify OTP error:', error);
        res.status(500).json({ error: error.message || 'Failed to verify OTP.' });
    }
});
// ─── Forgot Password Routes ──────────────────────────────────────────
// 1. Send OTP Route
router.post('/forgot-password/send-otp', rateLimiter_1.authRateLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string' || email.trim() === '') {
            return res.status(400).json({ error: 'A valid email address is required.' });
        }
        const normEmail = email.toLowerCase().trim();
        // Verify user exists in Firestore
        const usersSnapshot = await firebase_1.db.collection('users').where('email', '==', normEmail).limit(1).get();
        if (usersSnapshot.empty) {
            return res.status(404).json({ error: 'No account found with this email address.' });
        }
        const userData = usersSnapshot.docs[0].data();
        const userName = userData.name || 'User';
        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
        // Save to Firestore passwordResetOTPs
        const otpRef = firebase_1.db.collection('passwordResetOTPs').doc();
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
        const logoUrl = env_1.config.brevo.logoUrl;
        const loginUrl = env_1.config.brevo.loginUrl;
        const supportUrl = env_1.config.brevo.supportUrl;
        const emailHtml = (0, notificationService_1.buildHtmlEmail)(userName, 'Reset Your Password', 'You have requested to reset your password for the Bulletin of Kerala Mathematical Association portal. Use the following 6-digit One-Time Password (OTP) to verify your identity. This OTP is valid for 5 minutes.', 'Verification Code', [
            { label: 'OTP CODE', value: `<span style="font-family: monospace; font-size: 16px; font-weight: 800; letter-spacing: 0.15em; color: #000000;">${otp}</span>` }
        ], '', '', 'Security Notice', `If you did not request a password reset, please ignore this email or contact <a href="${supportUrl}" style="color: #000000; text-decoration: underline;"><strong>support</strong></a>. Keep this verification code confidential.`, '🔒', 'Do not share this code', '⏳', 'Expires in 5 minutes');
        await (0, emailService_1.sendTransactionalEmail)(normEmail, userName, 'KMA Portal Password Reset OTP', emailHtml);
        res.json({ success: true, message: 'Verification OTP has been sent to your email.' });
    }
    catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: error.message || 'Failed to send verification OTP.' });
    }
});
// 2. Verify OTP Route
router.post('/forgot-password/verify-otp', rateLimiter_1.authRateLimiter, async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP code are required.' });
        }
        const normEmail = email.toLowerCase().trim();
        const cleanOtp = otp.trim();
        // Query unverified and unused OTPs for this email (in-memory sort to avoid Firestore composite index requirement)
        const snapshot = await firebase_1.db.collection('passwordResetOTPs')
            .where('email', '==', normEmail)
            .where('otp', '==', cleanOtp)
            .where('used', '==', false)
            .where('verified', '==', false)
            .get();
        if (snapshot.empty) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        docs.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        const activeOtp = docs[0];
        const expiresAt = activeOtp.expiresAt.toDate ? activeOtp.expiresAt.toDate() : new Date(activeOtp.expiresAt);
        if (expiresAt < new Date()) {
            return res.status(400).json({ error: 'Verification code has expired (5-minute limit).' });
        }
        // Generate secure short-lived reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes reset window
        await firebase_1.db.collection('passwordResetOTPs').doc(activeOtp.id).update({
            verified: true,
            resetToken,
            tokenExpiresAt
        });
        res.json({ success: true, resetToken });
    }
    catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: error.message || 'Failed to verify OTP.' });
    }
});
// 3. Reset Password Route
router.post('/forgot-password/reset', rateLimiter_1.authRateLimiter, async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
        }
        const normEmail = email.toLowerCase().trim();
        // Verify token exists and is valid
        const snapshot = await firebase_1.db.collection('passwordResetOTPs')
            .where('email', '==', normEmail)
            .where('resetToken', '==', resetToken)
            .where('verified', '==', true)
            .where('used', '==', false)
            .get();
        if (snapshot.empty) {
            return res.status(400).json({ error: 'Invalid or expired password reset session.' });
        }
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const userRecord = await firebase_1.auth.getUserByEmail(normEmail);
        // Update password securely in Firebase Auth
        await firebase_1.auth.updateUser(userRecord.uid, { password: newPassword });
        // Update user doc in Firestore (e.g. clear mustChangePassword flag)
        await firebase_1.db.collection('users').doc(userRecord.uid).update({
            mustChangePassword: false,
            updatedAt: new Date()
        });
        // Mark reset OTP document as used
        await firebase_1.db.collection('passwordResetOTPs').doc(activeOtp.id).update({
            used: true
        });
        // Log security audit event
        await (0, auditService_1.logAuditEvent)('Password Changed', userRecord.uid);
        res.json({ success: true, message: 'Password has been reset successfully.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message || 'Failed to reset password.' });
    }
});
exports.default = router;
