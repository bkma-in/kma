"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const cloudinaryService_1 = require("../services/cloudinaryService");
const router = (0, express_1.Router)();
// Get Current User Profile
router.get('/profile', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await firebase_1.db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({ success: true, profile: userDoc.data() });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Update Profile (including optional image)
router.put('/profile', authMiddleware_1.requireAuth, uploadMiddleware_1.upload.single('profileImage'), async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, phone, designation } = req.body;
        const userRef = firebase_1.db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        const userData = userDoc.data();
        const updateData = {
            updatedAt: new Date(),
        };
        if (name)
            updateData.name = name;
        if (phone !== undefined)
            updateData.phone = phone;
        if (designation !== undefined)
            updateData.designation = designation;
        // Handle Image Upload
        if (req.file) {
            // 1. Upload new image to Cloudinary
            const uploadResult = await (0, cloudinaryService_1.uploadImage)(req.file.buffer, 'profiles');
            // 2. Delete old image from Cloudinary if it exists
            if (userData.profileImagePublicId) {
                await (0, cloudinaryService_1.deleteImage)(userData.profileImagePublicId);
            }
            // 3. Update database with new URLs
            updateData.profileImage = uploadResult.secure_url;
            updateData.profileImagePublicId = uploadResult.public_id;
        }
        else if (req.body.profileImage === null || req.body.profileImage === 'null') {
            // Explicitly removed profile image
            if (userData.profileImagePublicId) {
                await (0, cloudinaryService_1.deleteImage)(userData.profileImagePublicId);
            }
            updateData.profileImage = null;
            updateData.profileImagePublicId = null;
        }
        await userRef.update(updateData);
        const updatedDoc = await userRef.get();
        res.json({ success: true, profile: updatedDoc.data() });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
});
// Report an Issue (Bug/UI)
router.post('/report-issue', authMiddleware_1.requireAuth, uploadMiddleware_1.upload.single('screenshot'), async (req, res) => {
    try {
        const { uid } = req.user;
        const { type, description, metadata } = req.body;
        let screenshotUrl = null;
        let screenshotPublicId = null;
        if (req.file) {
            const uploadResult = await (0, cloudinaryService_1.uploadImage)(req.file.buffer, 'issues');
            screenshotUrl = uploadResult.secure_url;
            screenshotPublicId = uploadResult.public_id;
        }
        const issueRef = firebase_1.db.collection('reported_issues').doc();
        const newIssue = {
            issueId: issueRef.id,
            userId: uid,
            type,
            description,
            metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
            screenshot: screenshotUrl,
            screenshotPublicId,
            status: 'Open',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await issueRef.set(newIssue);
        res.json({ success: true, issue: newIssue });
    }
    catch (error) {
        console.error('Report issue error:', error);
        res.status(500).json({ error: 'Failed to report issue' });
    }
});
// Search Users (Registered users only)
router.get('/', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { search = '', limit = '20' } = req.query;
        const searchTerm = search.toLowerCase();
        const limitNum = parseInt(limit) || 20;
        if (!searchTerm) {
            return res.json({ success: true, users: [] });
        }
        // Firestore doesn't support case-insensitive search well.
        // We'll fetch all users (up to a reasonable limit) and filter in memory for now,
        // or use prefix matching if we had a normalized search field.
        // Given the task, we'll implement a basic search.
        // Note: In a production app with many users, we'd use Algolia or normalized fields.
        const snapshot = await firebase_1.db.collection('users').limit(100).get();
        const users = snapshot.docs
            .map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                affiliation: data.affiliation || ''
            };
        })
            .filter(user => user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm))
            .slice(0, limitNum);
        res.json({ success: true, users });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});
exports.default = router;
