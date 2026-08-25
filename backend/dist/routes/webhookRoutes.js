"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const subscriptionFulfillment_1 = require("../services/subscriptionFulfillment");
const router = (0, express_1.Router)();
router.post('/razorpay', async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const webhookSecret = env_1.config.payments.razorpay.webhookSecret;
        if (!signature) {
            console.error('[WEBHOOK] Razorpay Verification Failed: Signature header missing');
            return res.status(400).send('Webhook verification failed: Missing signature header');
        }
        if (!webhookSecret) {
            console.error('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not configured on backend');
            return res.status(500).send('Webhook configuration error');
        }
        // Verify signature over raw req.body Buffer
        const expectedSignature = crypto_1.default
            .createHmac('sha256', webhookSecret)
            .update(req.body)
            .digest('hex');
        const signatureBuffer = Buffer.from(signature, 'utf8');
        const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');
        if (signatureBuffer.length !== expectedSignatureBuffer.length ||
            !crypto_1.default.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
            console.error('[WEBHOOK] Razorpay Verification Failed: Signature mismatch');
            return res.status(400).send('Webhook verification failed: Invalid signature');
        }
        // Parse JSON payload only after successful signature verification
        const payload = JSON.parse(req.body.toString());
        const event = payload.event;
        console.log(`[WEBHOOK] Verified Razorpay Webhook Event Received: ${event}`);
        if (event === 'order.paid' || event === 'payment.captured') {
            const orderId = payload.payload.order?.entity?.id || payload.payload.payment?.entity?.order_id;
            const paymentId = payload.payload.payment?.entity?.id || payload.payload.order?.entity?.id;
            const paymentMethod = payload.payload.payment?.entity?.method || 'online';
            if (!orderId || !paymentId) {
                console.warn('[WEBHOOK] Received payment success event missing orderId or paymentId');
                return res.status(200).send('OK');
            }
            console.log(`[WEBHOOK] Processing success event ${event} for Order: ${orderId}, Payment: ${paymentId}`);
            const fulfillmentRes = await (0, subscriptionFulfillment_1.fulfillSuccessfulSubscriptionPayment)(orderId, paymentId, paymentMethod);
            console.log(`[WEBHOOK] Fulfillment result for ${orderId}:`, fulfillmentRes.message);
            return res.status(200).send('OK');
        }
        else if (event === 'payment.failed') {
            const paymentEntity = payload.payload.payment?.entity;
            const orderId = paymentEntity?.order_id;
            const paymentId = paymentEntity?.id;
            const failureReason = paymentEntity?.error_description || paymentEntity?.error_reason || 'Payment failed';
            const errorCode = paymentEntity?.error_code || 'BAD_REQUEST_ERROR';
            const paymentMethod = paymentEntity?.method || 'online';
            console.log(`[WEBHOOK] Processing payment.failed event for Order: ${orderId}, Payment: ${paymentId}`);
            if (orderId) {
                // Find subscription order to get internal details
                const subSnapshot = await firebase_1.db.collection('subscriptions')
                    .where('razorpayOrderId', '==', orderId)
                    .limit(1)
                    .get();
                const subDoc = subSnapshot.empty ? null : subSnapshot.docs[0];
                if (subDoc) {
                    const subData = subDoc.data();
                    const userId = subData.userId;
                    const plan = subData.type || subData.plan || 'annual';
                    const amount = subData.amount || 2000;
                    const internalOrderId = subDoc.id;
                    // Locate or create corresponding paymentAttempt record for this payment attempt
                    let attemptDocRef;
                    if (paymentId) {
                        const attemptSnapshot = await firebase_1.db.collection('paymentAttempts')
                            .where('razorpayPaymentId', '==', paymentId)
                            .limit(1)
                            .get();
                        if (!attemptSnapshot.empty) {
                            attemptDocRef = attemptSnapshot.docs[0].ref;
                        }
                    }
                    if (!attemptDocRef) {
                        // Find pending attempt for this order if payment ID was not matched
                        const pendingSnapshot = await firebase_1.db.collection('paymentAttempts')
                            .where('internalOrderId', '==', internalOrderId)
                            .where('status', '==', 'pending')
                            .limit(1)
                            .get();
                        if (!pendingSnapshot.empty) {
                            attemptDocRef = pendingSnapshot.docs[0].ref;
                        }
                        else {
                            attemptDocRef = firebase_1.db.collection('paymentAttempts').doc();
                        }
                    }
                    await attemptDocRef.set({
                        attemptId: attemptDocRef.id,
                        userId: userId,
                        internalOrderId: internalOrderId,
                        razorpayOrderId: orderId,
                        razorpayPaymentId: paymentId || null,
                        plan: plan,
                        amount: amount,
                        amountInPaise: amount * 100,
                        currency: 'INR',
                        provider: 'razorpay',
                        environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
                        status: 'failed',
                        failureReason: failureReason,
                        errorCode: errorCode,
                        paymentMethod: paymentMethod,
                        updatedAt: new Date()
                    }, { merge: true });
                    console.log(`[WEBHOOK] Logged failed payment attempt ${attemptDocRef.id} for order ${orderId}`);
                }
            }
            return res.status(200).send('OK');
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('[WEBHOOK] Razorpay Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
});
exports.default = router;
