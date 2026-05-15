import { Router } from 'express';
import { auth, db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Endpoint for frontend to send token and get their role/profile back
router.post('/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email, role, name } = req.user!;
    res.json({ success: true, user: { uid, email, role, name } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint to handle new user registration profile creation in Firestore
router.post('/register', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, role } = req.body; // e.g., "author", "reader", or "reviewer"
    const allowedRoles = ['author', 'reader', 'reviewer']; // Admin & Dev assigned manually
    const userRole = allowedRoles.includes(role) ? role : 'reader';

    const { uid, email } = req.user!;
    
    // Check if user already exists
    const userRef = db.collection('users').doc(uid);
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

export default router;
