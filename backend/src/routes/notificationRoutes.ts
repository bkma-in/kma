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

    // Fetch all user notifications to allow correct ordering before limiting
    const snapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .get();

    let notifications = snapshot.docs.map(doc => doc.data());
    
    // In-memory sort by createdAt descending
    notifications.sort((a, b) => {
      const timeA = a.createdAt?._seconds || 0;
      const timeB = b.createdAt?._seconds || 0;
      return timeB - timeA;
    });

    // Slice to limit after sorting to guarantee showing the newest notifications
    notifications = notifications.slice(0, limitNum);

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

export default router;
