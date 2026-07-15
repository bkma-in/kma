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
exports.default = router;
