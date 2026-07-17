"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("../config/env");
const razorpay = new razorpay_1.default({
    key_id: env_1.config.payments.razorpay.keyId,
    key_secret: env_1.config.payments.razorpay.keySecret,
});
const router = (0, express_1.Router)();
// List user's subscriptions
router.get('/my-subscriptions', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await firebase_1.db.collection('subscriptions')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
        const subscriptions = snapshot.docs.map((doc) => doc.data());
        res.json({ success: true, subscriptions });
    }
    catch (error) {
        console.error('List subscriptions error:', error);
        res.status(500).json({ error: 'Failed to list subscriptions' });
    }
});
// Create Razorpay Order
router.post('/create-order', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { issueId, type } = req.body; // type: "online" or "online_print"
        // Amount logic (mocked)
        const orderAmount = type === 'online_print' ? 500 : 200;
        const options = {
            amount: orderAmount * 100, // amount in the smallest currency unit (paise for INR)
            currency: "INR",
            receipt: `receipt_${Date.now()}_${uid.substring(0, 5)}`,
            notes: {
                userId: uid,
                email: email,
                issueId: issueId,
                type: type
            }
        };
        const order = await razorpay.orders.create(options);
        // Save pending subscription in Firestore
        const subRef = firebase_1.db.collection('subscriptions').doc();
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
            keyId: env_1.config.payments.razorpay.keyId
        });
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});
// Create Razorpay Order for Single Article Purchase
router.post('/create-article-order', authMiddleware_1.requireAuth, async (req, res) => {
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
            receipt: `art_receipt_${Date.now()}_${uid.substring(0, 5)}`,
            notes: {
                userId: uid,
                email: email,
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
            keyId: env_1.config.payments.razorpay.keyId
        });
    }
    catch (error) {
        console.error('Create article order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
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
