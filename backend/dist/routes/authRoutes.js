"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const auditService_1 = require("../services/auditService");
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
exports.default = router;
