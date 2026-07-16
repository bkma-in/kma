"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.post('/razorpay', async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const webhookSecret = env_1.config.payments.razorpay.webhookSecret;
        // Verify signature
        const expectedSignature = crypto_1.default
            .createHmac('sha256', webhookSecret)
            .update(req.body) // req.body is a Buffer due to express.raw in main.ts
            .digest('hex');
        if (!signature) {
            console.error('Razorpay Webhook Verification Failed: Signature header missing');
            return res.status(400).send('Webhook verification failed');
        }
        const signatureBuffer = Buffer.from(signature, 'utf8');
        const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');
        if (signatureBuffer.length !== expectedSignatureBuffer.length ||
            !crypto_1.default.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
            console.error('Razorpay Webhook Verification Failed: Signature mismatch');
            return res.status(400).send('Webhook verification failed');
        }
        // Parse body after verifying signature
        const payload = JSON.parse(req.body.toString());
        const event = payload.event;
        console.log(`Razorpay Webhook Received: ${event}`);
        // Handle order.paid or payment.captured
        if (event === 'order.paid' || event === 'payment.captured') {
            const orderId = payload.payload.order?.entity?.id || payload.payload.payment?.entity?.order_id;
            if (orderId) {
                // Find subscription by orderId (stored as paymentId in our DB)
                const subSnapshot = await firebase_1.db.collection('subscriptions').where('paymentId', '==', orderId).limit(1).get();
                if (!subSnapshot.empty) {
                    const docRef = subSnapshot.docs[0].ref;
                    await docRef.update({
                        status: 'active',
                        updatedAt: new Date()
                    });
                    console.log(`Subscription updated to active for order ${orderId}`);
                }
                else {
                    // If not in subscriptions, check purchases
                    const purchaseSnapshot = await firebase_1.db.collection('purchases').where('paymentId', '==', orderId).limit(1).get();
                    if (!purchaseSnapshot.empty) {
                        const docRef = purchaseSnapshot.docs[0].ref;
                        await docRef.update({
                            status: 'completed',
                            updatedAt: new Date()
                        });
                        console.log(`Purchase updated to completed for order ${orderId}`);
                    }
                    else {
                        console.warn(`No subscription or purchase found for order ${orderId}`);
                    }
                }
            }
        }
        else if (event === 'subscription.active') {
            const subscriptionId = payload.payload.subscription.entity.id;
            // Handle subscription-specific logic if needed
            console.log(`Subscription ${subscriptionId} is now active`);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Razorpay Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
});
exports.default = router;
