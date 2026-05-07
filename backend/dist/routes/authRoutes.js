"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Endpoint for frontend to send token and get their role/profile back
router.post('/verify', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid, email, role } = req.user;
        res.json({ success: true, user: { uid, email, role } });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Endpoint to handle new user registration profile creation in Firestore
router.post('/register', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { name, role } = req.body; // e.g., "author" or "reader"
        const allowedRoles = ['author', 'reader']; // Admins & Reviewers assigned manually
        const userRole = allowedRoles.includes(role) ? role : 'reader';
        const { uid, email } = req.user;
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
            role: userRole,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await userRef.set(userData);
        res.json({ success: true, user: userData });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
exports.default = router;
