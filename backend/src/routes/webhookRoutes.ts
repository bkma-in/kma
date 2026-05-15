import { Router } from 'express';
import { db } from '../config/firebase';
import crypto from 'crypto';
import { config } from '../config/env';

const router = Router();

router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = config.payments.razorpay.webhookSecret;

    // Verify signature
    const expectedSignature = crypto
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
        !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
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
        const snapshot = await db.collection('subscriptions').where('paymentId', '==', orderId).limit(1).get();
        
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          await docRef.update({
            status: 'active',
            updatedAt: new Date()
          });
          console.log(`Subscription updated to active for order ${orderId}`);
        } else {
          console.warn(`No subscription found for order ${orderId}`);
        }
      }
    } else if (event === 'subscription.active') {
      const subscriptionId = payload.payload.subscription.entity.id;
      // Handle subscription-specific logic if needed
      console.log(`Subscription ${subscriptionId} is now active`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
