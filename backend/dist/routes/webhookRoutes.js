"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const cashfree_pg_1 = require("cashfree-pg");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.post('/cashfree', async (req, res) => {
    try {
        const cashfree = new cashfree_pg_1.Cashfree(env_1.config.payments.cashfree.environment === 'PRODUCTION' ? cashfree_pg_1.Cashfree.PRODUCTION : cashfree_pg_1.Cashfree.SANDBOX, env_1.config.payments.cashfree.appId, env_1.config.payments.cashfree.secretKey);
        cashfree.PGVerifyWebhookSignature(req.headers["x-webhook-signature"], req.body.toString(), req.headers["x-webhook-timestamp"]);
        // Parse body after verifying signature
        const payload = JSON.parse(req.body.toString());
        const { order, payment } = payload.data;
        if (payment.payment_status === 'SUCCESS') {
            const orderId = order.order_id;
            // Find subscription
            const snapshot = await firebase_1.db.collection('subscriptions').where('paymentId', '==', orderId).limit(1).get();
            if (!snapshot.empty) {
                const docRef = snapshot.docs[0].ref;
                await docRef.update({
                    status: 'active',
                    updatedAt: new Date()
                });
                console.log(`Subscription updated to active for order ${orderId}`);
            }
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Cashfree Webhook Verification Failed:', error);
        res.status(400).send('Webhook verification failed');
    }
});
exports.default = router;
