"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get Notifications for Current User
router.get('/', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const { limit = '50' } = req.query;
        const limitNum = parseInt(limit) || 50;
        const snapshot = await firebase_1.db.collection('notifications')
            .where('userId', '==', uid)
            .limit(limitNum)
            .get();
        let notifications = snapshot.docs.map(doc => doc.data());
        // In-memory sort
        notifications.sort((a, b) => {
            const timeA = a.createdAt?._seconds || 0;
            const timeB = b.createdAt?._seconds || 0;
            return timeB - timeA;
        });
        res.json({ success: true, notifications });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// Mark Notification as Read
router.patch('/:id/read', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { uid } = req.user;
        const notifRef = firebase_1.db.collection('notifications').doc(id);
        const doc = await notifRef.get();
        if (!doc.exists)
            return res.status(404).json({ error: 'Notification not found' });
        if (doc.data().userId !== uid)
            return res.status(403).json({ error: 'Unauthorized' });
        await notifRef.update({ read: true });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});
exports.default = router;
