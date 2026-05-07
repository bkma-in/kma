import { Router } from 'express';
import { db } from '../config/firebase';
import { Cashfree } from 'cashfree-pg';
import { config } from '../config/env';

const router = Router();

router.post('/cashfree', async (req, res) => {
  try {
    const cashfree = new Cashfree(
      config.payments.cashfree.environment === 'PRODUCTION' ? (Cashfree as any).PRODUCTION : (Cashfree as any).SANDBOX,
      config.payments.cashfree.appId,
      config.payments.cashfree.secretKey
    );

    cashfree.PGVerifyWebhookSignature(req.headers["x-webhook-signature"] as string, req.body.toString(), req.headers["x-webhook-timestamp"] as string);
    
    // Parse body after verifying signature
    const payload = JSON.parse(req.body.toString());
    const { order, payment } = payload.data;

    if (payment.payment_status === 'SUCCESS') {
      const orderId = order.order_id;

      // Find subscription
      const snapshot = await db.collection('subscriptions').where('paymentId', '==', orderId).limit(1).get();
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
  } catch (error) {
    console.error('Cashfree Webhook Verification Failed:', error);
    res.status(400).send('Webhook verification failed');
  }
});

export default router;
