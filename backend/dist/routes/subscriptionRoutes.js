"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const cashfree_pg_1 = require("cashfree-pg");
const env_1 = require("../config/env");
const cashfree = new cashfree_pg_1.Cashfree(env_1.config.payments.cashfree.environment === 'PRODUCTION' ? cashfree_pg_1.Cashfree.PRODUCTION : cashfree_pg_1.Cashfree.SANDBOX, env_1.config.payments.cashfree.appId, env_1.config.payments.cashfree.secretKey);
const router = (0, express_1.Router)();
// List user's subscriptions
router.get('/my-subscriptions', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await firebase_1.db.collection('subscriptions')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
        const subscriptions = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, subscriptions });
    }
    catch (error) {
        console.error('List subscriptions error:', error);
        res.status(500).json({ error: 'Failed to list subscriptions' });
    }
});
// Create Cashfree Order
router.post('/create-order', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { issueId, type } = req.body; // type: "online" or "online_print"
        // Amount logic (mocked)
        const orderAmount = type === 'online_print' ? 500 : 200;
        const orderId = `order_${Date.now()}_${uid.substring(0, 5)}`;
        const request = {
            order_amount: orderAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: uid,
                customer_email: email,
                customer_phone: "9999999999" // Add proper phone requirement if needed
            },
            order_meta: {
                return_url: `http://localhost:5173/payment-success?order_id={order_id}`
            },
            order_id: orderId
        };
        const response = await cashfree.PGCreateOrder(request);
        // Save pending subscription in Firestore
        const subRef = firebase_1.db.collection('subscriptions').doc();
        await subRef.set({
            subscriptionId: subRef.id,
            userId: uid,
            issueId,
            type,
            status: 'pending',
            paymentId: orderId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        res.json({
            success: true,
            paymentSessionId: response.data.payment_session_id,
            orderId
        });
    }
    catch (error) {
        console.error('Create order error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});
exports.default = router;
