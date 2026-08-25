import { Router, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import Razorpay from 'razorpay';
import { config } from '../config/env';
import { paymentRateLimiter } from '../middleware/rateLimiter';
import { fulfillSuccessfulSubscriptionPayment } from '../services/subscriptionFulfillment';

const razorpay = new Razorpay({
  key_id: config.payments.razorpay.keyId,
  key_secret: config.payments.razorpay.keySecret,
});

async function createRazorpayOrderHelper(options: { amount: number; currency: string; receipt: string; notes?: any }) {
  try {
    return await razorpay.orders.create(options);
  } catch (sdkErr: any) {
    console.warn('[RAZORPAY-SDK-WARN] SDK create order failed, using direct REST fallback:', sdkErr.message || sdkErr);
    const keyId = config.payments.razorpay.keyId;
    const keySecret = config.payments.razorpay.keySecret;
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    try {
      const response = await axios.post('https://api.razorpay.com/v1/orders', options, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (axiosErr: any) {
      if (axiosErr.response) {
        const errorDesc = axiosErr.response.data?.error?.description || 'Razorpay API rejected request';
        const code = axiosErr.response.status;
        throw new Error(`Razorpay API Error (${code}): ${errorDesc}`);
      }
      throw new Error(`Razorpay connection error: ${axiosErr.message}`);
    }
  }
}

const router = Router();

// GET /subscriptions/payment-history - List user's payment attempt history (All attempts: pending, failed, fulfilled)
router.get('/payment-history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;

    // Query paymentAttempts collection for the authenticated user
    const attemptsSnapshot = await db.collection('paymentAttempts')
      .where('userId', '==', uid)
      .get();

    const attempts = attemptsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
      const dateStr = createdAtDate.toISOString().split('T')[0];

      return {
        attemptId: data.attemptId || doc.id,
        id: data.attemptId || doc.id,
        internalOrderId: data.internalOrderId,
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId || null,
        plan: data.plan || 'annual',
        article: data.plan === 'lifetime' ? 'BKMA Life Membership Subscription' : 'BKMA Annual Pass Subscription',
        amount: data.amount ? `₹${data.amount}` : '₹2000',
        amountRaw: data.amount || 2000,
        currency: data.currency || 'INR',
        date: dateStr,
        createdAt: createdAtDate.toISOString(),
        status: data.status === 'fulfilled' || data.status === 'paid' ? 'Paid' : 
                data.status === 'failed' ? 'Failed' : 
                data.status === 'cancelled' ? 'Cancelled' : 'Pending',
        rawStatus: data.status,
        paymentMethod: data.paymentMethod || 'online',
        failureReason: data.failureReason || null,
        errorCode: data.errorCode || null,
        verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : data.verifiedAt || null,
        fulfilledAt: data.fulfilledAt?.toDate ? data.fulfilledAt.toDate().toISOString() : data.fulfilledAt || null,
        receiptAvailable: data.status === 'fulfilled' || data.status === 'paid'
      };
    });

    // Sort newest first
    attempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      attempts
    });
  } catch (error: any) {
    console.error('List payment history error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment history' });
  }
});

// GET /subscriptions/my-subscriptions - List user's subscriptions
router.get('/my-subscriptions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    
    // Fetch subscriptions
    const subSnapshot = await db.collection('subscriptions')
      .where('userId', '==', uid)
      .get();

    const subscriptions = subSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: data.subscriptionId || doc.id,
        type: 'subscription',
        planType: data.type || data.plan || 'annual',
        amount: data.amount ? `₹${data.amount}` : (data.type === 'lifetime' ? '₹1000' : '₹2000'),
        date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: data.status === 'active' ? 'Paid' : data.status === 'pending' ? 'Pending' : 'Failed',
        rawStatus: data.status,
        article: data.type === 'lifetime' || data.plan === 'lifetime' ? 'BKMA Life Membership Subscription' : 'BKMA Annual Pass Subscription',
        paymentId: data.razorpayPaymentId || data.razorpayOrderId || data.paymentId
      };
    });

    const hasActiveSubscription = subscriptions.some(s => s.rawStatus === 'active');

    res.json({ 
      success: true, 
      isSubscribed: hasActiveSubscription,
      subscriptions: subscriptions,
      activeSubscriptions: subscriptions.filter(s => s.rawStatus === 'active')
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

// POST /subscriptions/create-order - Create Razorpay Order for Subscription (Annual: ₹2,000, Lifetime: ₹1,000)
router.post('/create-order', requireAuth, paymentRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email } = req.user!;
    const { type, plan } = req.body;
    
    const requestedPlan = (type || plan || 'annual').toLowerCase().trim();

    // SERVER-SIDE PRICE SECURITY: Strictly resolve prices on backend
    let orderAmount = 2000;
    if (requestedPlan === 'lifetime') {
      orderAmount = 1000;
    } else if (requestedPlan === 'annual') {
      orderAmount = 2000;
    } else {
      return res.status(400).json({ error: 'Invalid subscription plan requested. Allowed plans: annual, lifetime.' });
    }

    // Check if user already has an active subscription
    const existingActiveSub = await db.collection('subscriptions')
      .where('userId', '==', uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!existingActiveSub.empty) {
      return res.status(400).json({ 
        error: 'You already have an active BKMA subscription pass.' 
      });
    }

    const options = {
      amount: orderAmount * 100, // amount in paise (INR)
      currency: "INR",
      receipt: `sub_${Date.now()}_${uid.substring(0, 5)}`,
      notes: {
        userId: uid,
        email: email || '',
        plan: requestedPlan
      }
    };

    const order = await createRazorpayOrderHelper(options);

    // Save pending subscription document in Firestore
    const subRef = db.collection('subscriptions').doc();
    await subRef.set({
      subscriptionId: subRef.id,
      userId: uid,
      type: requestedPlan,
      plan: requestedPlan,
      amount: orderAmount,
      amountInPaise: orderAmount * 100,
      currency: 'INR',
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      razorpayOrderId: order.id,
      paymentId: order.id,
      provider: 'razorpay',
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create NEW pending paymentAttempt document (Append-Only log)
    const attemptRef = db.collection('paymentAttempts').doc();
    await attemptRef.set({
      attemptId: attemptRef.id,
      userId: uid,
      internalOrderId: subRef.id,
      razorpayOrderId: order.id,
      razorpayPaymentId: null,
      plan: requestedPlan,
      amount: orderAmount,
      amountInPaise: orderAmount * 100,
      currency: 'INR',
      provider: 'razorpay',
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ 
      success: true, 
      orderId: order.id,
      attemptId: attemptRef.id,
      paymentSessionId: order.id,
      amount: orderAmount,
      keyId: config.payments.razorpay.keyId
    });

  } catch (error: any) {
    console.error('Create subscription order error:', error);
    const status = error.message?.includes('Razorpay API Error') || error.message?.includes('Invalid') ? 400 : 500;
    res.status(status).json({ error: error.message || 'Failed to create payment order' });
  }
});

// POST /subscriptions/verify-payment - Verify Razorpay Payment Signature
router.post('/verify-payment', requireAuth, paymentRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature are required)' });
    }

    const secret = config.payments.razorpay.keySecret;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch in verify-payment:', { expectedSignature, razorpay_signature });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Fetch payment details from Razorpay SDK to get method info
    let paymentMethod = 'online';
    try {
      const razorpayPaymentObj = await razorpay.payments.fetch(razorpay_payment_id);
      if (razorpayPaymentObj && razorpayPaymentObj.method) {
        paymentMethod = razorpayPaymentObj.method;
      }
    } catch (rzpErr) {
      console.warn('[VERIFY-PAYMENT] Failed to fetch payment details from Razorpay SDK:', rzpErr);
    }

    // Execute shared idempotent fulfillment
    const result = await fulfillSuccessfulSubscriptionPayment(
      razorpay_order_id,
      razorpay_payment_id,
      paymentMethod,
      uid
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Payment verification failed' });
    }

    return res.json({
      success: true,
      message: result.message || 'Payment verified and subscription activated',
      alreadyFulfilled: result.alreadyFulfilled,
      subscriptionId: result.subscriptionId,
      attemptId: result.attemptId
    });

  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Single-Article Payment creation endpoint (Disabled - Subscriptions only scope)
router.post('/create-article-order', requireAuth, async (_req: AuthRequest, res: Response) => {
  return res.status(400).json({ 
    error: 'Single article purchase is disabled. Platform access is available strictly via Annual Pass or Lifetime Pass subscriptions.' 
  });
});

export default router;
