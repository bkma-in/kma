import { Router } from 'express';
import { db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import Razorpay from 'razorpay';
import { config } from '../config/env';

const razorpay = new Razorpay({
  key_id: config.payments.razorpay.keyId,
  key_secret: config.payments.razorpay.keySecret,
});

const router = Router();

// List user's subscriptions
router.get('/my-subscriptions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const snapshot = await db.collection('subscriptions')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
      
    const subscriptions = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('List subscriptions error:', error);
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

// Create Razorpay Order
router.post('/create-order', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email } = req.user!;
    const { issueId, type } = req.body; // type: "online" or "online_print"
    
    // Amount logic (mocked)
    const orderAmount = type === 'online_print' ? 500 : 200;

    const options = {
      amount: orderAmount * 100, // amount in the smallest currency unit (paise for INR)
      currency: "INR",
      receipt: `receipt_${Date.now()}_${uid.substring(0,5)}`,
      notes: {
        userId: uid,
        email: email,
        issueId: issueId,
        type: type
      }
    };

    const order = await razorpay.orders.create(options);

    // Save pending subscription in Firestore
    const subRef = db.collection('subscriptions').doc();
    await subRef.set({
      subscriptionId: subRef.id,
      userId: uid,
      issueId,
      type,
      status: 'pending',
      paymentId: order.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ 
      success: true, 
      orderId: order.id,
      paymentSessionId: order.id, // for backward compatibility
      keyId: config.payments.razorpay.keyId
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

export default router;
