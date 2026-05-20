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
// Update Profile (Optimized: 1 Read, 1 Write, Non-blocking Cleanup)
router.put('/profile', authMiddleware_1.requireAuth, uploadMiddleware_1.upload.single('profileImage'), async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, phone, designation, bio } = req.body;
        // 1. Lightweight Validation & Sanitization
        const sanitizedBio = bio?.trim().slice(0, 500) || '';
        const sanitizedName = name?.trim();
        const sanitizedPhone = phone?.trim();
        const userRef = firebase_1.db.collection('users').doc(uid);
        // Performance: Only one read to get current state (required for old image ID)
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        const userData = userDoc.data();
        const updateData = {
            updatedAt: new Date(),
        };
        // Only add to update payload if provided to avoid overwriting with undefined
        if (sanitizedName)
            updateData.name = sanitizedName;
        if (sanitizedPhone !== undefined)
            updateData.phone = sanitizedPhone;
        if (designation !== undefined)
            updateData.designation = designation.trim();
        if (bio !== undefined)
            updateData.bio = sanitizedBio;
        // 2. Handle Image Operations
        if (req.file) {
            // Must await upload to get the new URL for the database
            const uploadResult = await (0, cloudinaryService_1.uploadImage)(req.file.buffer, 'profiles');
            // Performance: Fire-and-forget deletion of old image (don't block the response)
            if (userData.profileImagePublicId) {
                (0, cloudinaryService_1.deleteImage)(userData.profileImagePublicId).catch(err => console.error('Background cleanup error (old image):', err));
            }
            updateData.profileImage = uploadResult.secure_url;
            updateData.profileImagePublicId = uploadResult.public_id;
        }
        else if (req.body.profileImage === null || req.body.profileImage === 'null') {
            // Explicitly removed profile image
            if (userData.profileImagePublicId) {
                (0, cloudinaryService_1.deleteImage)(userData.profileImagePublicId).catch(err => console.error('Background cleanup error (removed image):', err));
            }
            updateData.profileImage = null;
            updateData.profileImagePublicId = null;
        }
        // 3. Database Update (Single Write)
        await userRef.update(updateData);
        // Performance: Avoid second read by merging locally
        const mergedProfile = {
            ...userData,
            ...updateData,
            // Ensure complex objects like Date/Timestamp are handled consistently
            updatedAt: updateData.updatedAt
        };
        res.json({
            success: true,
            profile: mergedProfile
        });
    }
    catch (error) {
        console.error('Senior Audit - Update profile error:', error);
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
// Get All Reported Issues (for Developer Dashboard)
router.get('/reported-issues', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin', 'dev', 'developer']), async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('reported_issues').orderBy('createdAt', 'desc').get();
        const issues = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Normalize Firestore Timestamps to ISO strings for the frontend
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
        });
        res.json({ success: true, issues });
    }
    catch (error) {
        console.error('Get reported issues error:', error);
        res.status(500).json({ error: 'Failed to fetch reported issues' });
    }
});
// Update Reported Issue Status (for Developer Dashboard)
router.patch('/reported-issues/:id/status', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin', 'dev', 'developer']), async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['Open', 'In Progress', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        const issueRef = firebase_1.db.collection('reported_issues').doc(id);
        const issueDoc = await issueRef.get();
        if (!issueDoc.exists) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        await issueRef.update({ status, updatedAt: new Date() });
        const updated = { ...issueDoc.data(), status, updatedAt: new Date().toISOString() };
        res.json({ success: true, issue: updated });
    }
    catch (error) {
        console.error('Update issue status error:', error);
        res.status(500).json({ error: 'Failed to update issue status' });
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
