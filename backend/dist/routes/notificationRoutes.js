"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid, role } = req.user;
        const { limit = '50' } = req.query;
        const limitNum = parseInt(limit) || 50;
        const snapshot = await firebase_1.db.collection('notifications')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limitNum)
            .get();
        let notifications = snapshot.docs.map(doc => doc.data());
        if (notifications.length === 0) {
            // Create a welcome notification dynamically for new users
            const welcomeRef = firebase_1.db.collection('notifications').doc();
            let welcomeTitle = 'Welcome to KMA!';
            let welcomeMessage = 'Welcome to the Kerala Mathematical Association platform.';
            let welcomeType = 'WELCOME';
            if (role === 'author') {
                welcomeTitle = 'Welcome to the Author Portal!';
                welcomeMessage = 'You can now submit your research papers, track their peer-review status, and manage revisions from your dashboard.';
                welcomeType = 'WELCOME_AUTHOR';
            }
            else if (role === 'reviewer') {
                welcomeTitle = 'Welcome to the Reviewer Portal!';
                welcomeMessage = 'Thank you for joining KMA as a peer reviewer. You will find assigned manuscripts in your dashboard. Thank you for your academic contribution.';
                welcomeType = 'WELCOME_REVIEWER';
            }
            else if (role === 'reader') {
                welcomeTitle = 'Welcome to the Reader Portal!';
                welcomeMessage = 'Welcome to BKMA! You now have access to our digital archive. Explore our latest mathematical publications and subscribe for unlimited access.';
                welcomeType = 'WELCOME_READER';
            }
            const welcomeNotification = {
                notificationId: welcomeRef.id,
                userId: uid,
                type: welcomeType,
                title: welcomeTitle,
                message: welcomeMessage,
                metadata: {},
                read: false,
                createdAt: new Date()
            };
            await welcomeRef.set(welcomeNotification);
            notifications = [welcomeNotification];
        }
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
// Mark All Notifications as Read for Current User (Firestore Batch Update)
router.post('/read-all', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        // Query all unread notifications for this user
        const snapshot = await firebase_1.db.collection('notifications')
            .where('userId', '==', uid)
            .where('read', '==', false)
            .get();
        if (snapshot.empty) {
            return res.json({ success: true, count: 0 });
        }
        const batch = firebase_1.db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true, updatedAt: new Date() });
        });
        await batch.commit();
        res.json({ success: true, count: snapshot.docs.length });
    }
    catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: error.message || 'Failed to mark all notifications as read' });
    }
});
// Delete a specific notification
router.delete('/:id', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { uid } = req.user;
        const notifRef = firebase_1.db.collection('notifications').doc(id);
        const doc = await notifRef.get();
        if (!doc.exists)
            return res.status(404).json({ error: 'Notification not found' });
        if (doc.data().userId !== uid)
            return res.status(403).json({ error: 'Unauthorized' });
        await notifRef.delete();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
// Clear All Notifications for Current User
router.delete('/', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await firebase_1.db.collection('notifications').where('userId', '==', uid).get();
        const batch = firebase_1.db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});
exports.default = router;
