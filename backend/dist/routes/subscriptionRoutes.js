"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("../config/env");
const rateLimiter_1 = require("../middleware/rateLimiter");
const razorpay = new razorpay_1.default({
    key_id: env_1.config.payments.razorpay.keyId,
    key_secret: env_1.config.payments.razorpay.keySecret,
});
const router = (0, express_1.Router)();
// List user's subscriptions and purchases
router.get('/my-subscriptions', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        // Fetch subscriptions
        const subSnapshot = await firebase_1.db.collection('subscriptions')
            .where('userId', '==', uid)
            .get();
        // Fetch purchases
        const purchaseSnapshot = await firebase_1.db.collection('purchases')
            .where('userId', '==', uid)
            .get();
        const subscriptions = subSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: data.subscriptionId || doc.id,
                type: 'subscription',
                planType: data.type || 'annual',
                amount: data.amount ? `₹${data.amount}` : (data.type === 'lifetime' ? '₹1000' : '₹2000'),
                date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: data.status === 'active' ? 'Paid' : data.status === 'pending' ? 'Pending' : 'Failed',
                rawStatus: data.status,
                article: data.type === 'lifetime' ? 'BKMA Life Membership Subscription' : 'BKMA Annual Pass Subscription',
                paymentId: data.paymentId
            };
        });
        const purchases = purchaseSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: data.purchaseId || doc.id,
                type: 'purchase',
                amount: `₹${data.amount || 499}`,
                date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: data.status === 'completed' ? 'Paid' : data.status === 'pending' ? 'Pending' : 'Failed',
                rawStatus: data.status,
                article: `Article Purchase (ID: ${data.articleId})`,
                articleId: data.articleId,
                paymentId: data.paymentId
            };
        });
        const combined = [...subscriptions, ...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const hasActiveSubscription = subscriptions.some(s => s.rawStatus === 'active');
        res.json({
            success: true,
            isSubscribed: hasActiveSubscription,
            subscriptions: combined,
            activeSubscriptions: subscriptions.filter(s => s.rawStatus === 'active'),
            completedPurchases: purchases.filter(p => p.rawStatus === 'completed')
        });
    }
    catch (error) {
        console.error('List subscriptions error:', error);
        res.status(500).json({ error: 'Failed to list subscriptions' });
    }
});
// Create Razorpay Order for Subscription
router.post('/create-order', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { issueId, type = 'annual' } = req.body; // type: "annual" (2000) or "lifetime" (1000)
        let orderAmount = 2000;
        if (type === 'lifetime' || type === 'online') {
            orderAmount = 1000;
        }
        else if (type === 'annual' || type === 'online_print') {
            orderAmount = 2000;
        }
        const options = {
            amount: orderAmount * 100, // amount in paise (INR)
            currency: "INR",
            receipt: `sub_${Date.now()}_${uid.substring(0, 5)}`,
            notes: {
                userId: uid,
                email: email || '',
                issueId: issueId || 'all',
                type: type
            }
        };
        const order = await razorpay.orders.create(options);
        // Save pending subscription in Firestore
        const subRef = firebase_1.db.collection('subscriptions').doc();
        await subRef.set({
            subscriptionId: subRef.id,
            userId: uid,
            issueId: issueId || null,
            type,
            amount: orderAmount,
            status: 'pending',
            paymentId: order.id,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        res.json({
            success: true,
            orderId: order.id,
            paymentSessionId: order.id,
            amount: orderAmount,
            keyId: env_1.config.payments.razorpay.keyId
        });
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});
// Create Razorpay Order for Single Article Purchase
router.post('/create-article-order', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { articleId } = req.body;
        if (!articleId) {
            return res.status(400).json({ error: 'Article ID is required' });
        }
        const articleDoc = await firebase_1.db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const orderAmount = 499;
        const options = {
            amount: orderAmount * 100, // paise
            currency: "INR",
            receipt: `art_${Date.now()}_${uid.substring(0, 5)}`,
            notes: {
                userId: uid,
                email: email || '',
                articleId: articleId,
                type: 'article_purchase'
            }
        };
        const order = await razorpay.orders.create(options);
        // Save pending purchase in Firestore
        const purchaseRef = firebase_1.db.collection('purchases').doc();
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
            amount: orderAmount,
            keyId: env_1.config.payments.razorpay.keyId
        });
    }
    catch (error) {
        console.error('Create article order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});
// Verify Razorpay Payment Signature
router.post('/verify-payment', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification parameters' });
        }
        const secret = env_1.config.payments.razorpay.keySecret;
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            console.error('Signature mismatch in verify-payment:', { expectedSignature, razorpay_signature });
            return res.status(400).json({ error: 'Invalid payment signature' });
        }
        // Check subscriptions collection first
        const subSnapshot = await firebase_1.db.collection('subscriptions')
            .where('paymentId', '==', razorpay_order_id)
            .limit(1)
            .get();
        if (!subSnapshot.empty) {
            const docRef = subSnapshot.docs[0].ref;
            await docRef.update({
                status: 'active',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                updatedAt: new Date()
            });
            console.log(`[VERIFY-PAYMENT] Subscription ${docRef.id} activated for order ${razorpay_order_id}`);
            return res.json({ success: true, message: 'Payment verified and subscription activated', type: 'subscription' });
        }
        // Check purchases collection
        const purchaseSnapshot = await firebase_1.db.collection('purchases')
            .where('paymentId', '==', razorpay_order_id)
            .limit(1)
            .get();
        if (!purchaseSnapshot.empty) {
            const docRef = purchaseSnapshot.docs[0].ref;
            await docRef.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                updatedAt: new Date()
            });
            console.log(`[VERIFY-PAYMENT] Purchase ${docRef.id} completed for order ${razorpay_order_id}`);
            return res.json({ success: true, message: 'Payment verified and article purchase completed', type: 'purchase' });
        }
        return res.status(404).json({ error: 'Order record not found in system' });
    }
    catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});
// Dev-only: Simulate individual article payment completion in Firestore
router.post('/simulate-article-payment', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const { articleId } = req.body;
        if (!articleId) {
            return res.status(400).json({ error: 'Article ID is required' });
        }
        // Check if there is a pending purchase
        const snapshot = await firebase_1.db.collection('purchases')
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
        const purchaseRef = firebase_1.db.collection('purchases').doc();
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
    }
    catch (error) {
        console.error('Simulate article payment error:', error);
        res.status(500).json({ error: 'Failed to simulate payment' });
    }
});
exports.default = router;
