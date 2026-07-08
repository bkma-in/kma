import { Router } from 'express';
import { db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Get Notifications for Current User
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const { limit = '50' } = req.query;
    const limitNum = parseInt(limit as string) || 50;

    const snapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .get();

    const notifications = snapshot.docs.map(doc => doc.data());

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Notification as Read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { uid } = req.user!;

    const notifRef = db.collection('notifications').doc(id);
    const doc = await notifRef.get();

    if (!doc.exists) return res.status(404).json({ error: 'Notification not found' });
    if (doc.data()!.userId !== uid) return res.status(403).json({ error: 'Unauthorized' });

    await notifRef.update({ read: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark All Notifications as Read for Current User (Firestore Batch Update)
router.post('/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;

    // Query all unread notifications for this user
    const snapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .where('read', '==', false)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, count: 0 });
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true, updatedAt: new Date() });
    });
    await batch.commit();

    res.json({ success: true, count: snapshot.docs.length });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark all notifications as read' });
  }
});

export default router;
