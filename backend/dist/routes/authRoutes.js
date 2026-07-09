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
const router = (0, express_1.Router)();
// Endpoint for frontend to send token and get their role/profile back
router.post('/verify', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid, email, role, name } = req.user;
        let mustChangePassword = false;
        // Check approval status for reviewers
        if (role === 'reviewer') {
            const userDoc = await firebase_1.db.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
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
        else {
            // Check other users
            const userDoc = await firebase_1.db.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            mustChangePassword = userData?.mustChangePassword === true;
        }
        res.json({ success: true, user: { uid, email, role, name, mustChangePassword } });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Endpoint to handle new user registration profile creation in Firestore
router.post('/register', authMiddleware_1.requireAuth, async (req, res) => {
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
            // Set Firebase Auth custom claims for role-based authentication bypass
            await firebase_1.auth.setCustomUserClaims(uid, { role: userRole, name });
        }
        catch (claimError) {
            // Rollback database profile if custom claims assignment fails
            await userRef.delete().catch(delErr => console.error('Failed to rollback user profile:', delErr));
            throw claimError;
        }
        res.json({ success: true, user: userData });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
// Endpoint to change password securely and clear mustChangePassword status
router.post('/change-password', authMiddleware_1.requireAuth, async (req, res) => {
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
// ─── Forgot Password Routes ──────────────────────────────────────────
// 1. Send OTP Route
router.post('/forgot-password/send-otp', async (req, res) => {
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
        const emailHtml = (0, notificationService_1.buildHtmlEmail)(userName, 'Reset Your Password', 'You have requested to reset your password for the Bulletin of Kerala Mathematical Association portal. Use the following 6-digit One-Time Password (OTP) to verify your identity. This OTP is valid for 5 minutes.', 'Verification Code', [
            { label: 'OTP CODE', value: `<span style="font-family: monospace; font-size: 16px; font-weight: 800; letter-spacing: 0.15em; color: #000000;">${otp}</span>` },
            { label: 'EXPIRES IN', value: '5 Minutes' }
        ], loginUrl, 'Login', 'Security Notice', 'If you did not request a password reset, please ignore this email or contact support. Keep this verification code confidential.', '🔒', 'Do not share this code', '⏳', 'Expires in 5 minutes');
        await (0, emailService_1.sendTransactionalEmail)(normEmail, userName, 'KMA Portal Password Reset OTP', emailHtml);
        res.json({ success: true, message: 'Verification OTP has been sent to your email.' });
    }
    catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: error.message || 'Failed to send verification OTP.' });
    }
});
// 2. Verify OTP Route
router.post('/forgot-password/verify-otp', async (req, res) => {
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
router.post('/forgot-password/reset', async (req, res) => {
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
