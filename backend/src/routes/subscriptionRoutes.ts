import { Router, Response } from 'express';
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
router.get('/my-subscriptions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const snapshot = await db.collection('subscriptions')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
      
    const subscriptions = snapshot.docs.map((doc: any) => doc.data());
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('List subscriptions error:', error);
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

// Create Razorpay Order
router.post('/create-order', requireAuth, async (req: AuthRequest, res: Response) => {
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

// Create Razorpay Order for Single Article Purchase
router.post('/create-article-order', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email } = req.user!;
    const { articleId } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    const articleDoc = await db.collection('articles').doc(articleId).get();
    if (!articleDoc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const orderAmount = 499;

    const options = {
      amount: orderAmount * 100, // paise
      currency: "INR",
      receipt: `art_receipt_${Date.now()}_${uid.substring(0,5)}`,
      notes: {
        userId: uid,
        email: email,
        articleId: articleId,
        type: 'article_purchase'
      }
    };

    const order = await razorpay.orders.create(options);

    // Save pending purchase in Firestore
    const purchaseRef = db.collection('purchases').doc();
    await purchaseRef.set({
      purchaseId: purchaseRef.id,
      userId: uid,
      articleId,
      amount: orderAmount,
      currency: "INR",
      status: 'pending',
      paymentId: order.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ 
      success: true, 
      orderId: order.id,
      paymentSessionId: order.id,
      keyId: config.payments.razorpay.keyId
    });

  } catch (error: any) {
    console.error('Create article order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Dev-only: Simulate individual article payment completion in Firestore
router.post('/simulate-article-payment', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    // Check if there is a pending purchase
    const snapshot = await db.collection('purchases')
      .where('userId', '==', uid)
      .where('articleId', '==', articleId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        status: 'completed',
        updatedAt: new Date()
      });
      return res.json({ success: true, message: 'Simulated payment completed successfully' });
    }

    // If no pending purchase, create a completed one directly
    const purchaseRef = db.collection('purchases').doc();
    await purchaseRef.set({
      purchaseId: purchaseRef.id,
      userId: uid,
      articleId,
      amount: 499,
      currency: "INR",
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, message: 'Simulated purchase created directly' });
  } catch (error: any) {
    console.error('Simulate article payment error:', error);
    res.status(500).json({ error: 'Failed to simulate payment' });
  }
});

export default router;
