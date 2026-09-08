import { db } from '../config/firebase';
import { sendPaymentApprovedNotification } from './notificationService';

export interface ManualFulfillmentResult {
  success: boolean;
  alreadyFulfilled: boolean;
  subscriptionId?: string;
  attemptId?: string;
  message?: string;
  error?: string;
}

/**
 * Shared atomic fulfillment helper for approved manual bank transfer payments.
 * Executed by Admin Approval endpoint: POST /subscriptions/admin/approve/:paymentId
 */
export const fulfillManualSubscriptionPayment = async (
  paymentAttemptId: string,
  adminUserId: string,
  adminName: string = 'Administrator'
): Promise<ManualFulfillmentResult> => {
  try {
    if (!paymentAttemptId) {
      return { success: false, alreadyFulfilled: false, error: 'Payment attempt ID is required' };
    }

    console.log(`[MANUAL-FULFILLMENT] Initiating approval transaction for Payment Attempt: ${paymentAttemptId} by Admin: ${adminUserId}`);

    // Step 1: Find payment attempt document
    const attemptRef = db.collection('paymentAttempts').doc(paymentAttemptId);
    const attemptDoc = await attemptRef.get();

    if (!attemptDoc.exists) {
      return { success: false, alreadyFulfilled: false, error: 'Payment record not found' };
    }

    const attemptData = attemptDoc.data()!;

    // Idempotency Check: Verify status is PENDING_VERIFICATION
    if (attemptData.status === 'APPROVED' || attemptData.status === 'fulfilled') {
      return {
        success: true,
        alreadyFulfilled: true,
        attemptId: paymentAttemptId,
        message: 'Payment has already been approved and subscription activated.'
      };
    }

    if (attemptData.status === 'REJECTED') {
      return {
        success: false,
        alreadyFulfilled: false,
        error: 'Cannot approve a payment that was previously rejected.'
      };
    }

    const userId = attemptData.userId;
    const internalOrderId = attemptData.internalOrderId;
    const plan = attemptData.plan || 'annual';
    const expectedAmount = attemptData.expectedAmount !== undefined && attemptData.expectedAmount !== null
      ? attemptData.expectedAmount
      : (attemptData.amount !== undefined && attemptData.amount !== null ? attemptData.amount : (plan === 'lifetime' ? 1000 : 2000));
    const transactionRef = attemptData.transactionReference || attemptData.transactionRef || 'N/A';

    // Step 2: Atomic Firestore Transaction for State Transition
    const transactionResult = await db.runTransaction(async (transaction) => {
      const freshAttempt = await transaction.get(attemptRef);
      if (!freshAttempt.exists) {
        throw new Error('Payment record no longer exists');
      }

      const freshAttemptData = freshAttempt.data()!;
      if (freshAttemptData.status === 'APPROVED') {
        return { alreadyFulfilled: true };
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Generate official receipt number (e.g. BKMA26-001) exclusively for approved payments
      let receiptNo = freshAttemptData.receiptNo;
      if (!receiptNo) {
        const yy = now.getFullYear().toString().slice(-2);
        const approvedQuery = await db.collection('paymentAttempts')
          .where('status', '==', 'APPROVED')
          .get();
        const seq = (approvedQuery.size + 1).toString().padStart(3, '0');
        receiptNo = `BKMA${yy}-${seq}`;
      }

      // Update paymentAttempt document
      transaction.update(attemptRef, {
        status: 'APPROVED',
        paymentStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        receiptNo: receiptNo,
        verifiedAt: now,
        verifiedBy: adminUserId,
        verifiedByName: adminName,
        approvedAt: now,
        updatedAt: now
      });

      // Update or Create Subscription document
      let subRef;
      if (internalOrderId) {
        subRef = db.collection('subscriptions').doc(internalOrderId);
      } else {
        subRef = db.collection('subscriptions').doc();
      }

      transaction.set(subRef, {
        subscriptionId: subRef.id,
        receiptNo: receiptNo,
        userId: userId,
        type: plan,
        plan: plan,
        amount: expectedAmount,
        currency: 'INR',
        status: 'active',
        paymentStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        paymentMethod: 'MANUAL_BANK_TRANSFER',
        provider: 'manual_bank_transfer',
        startedAt: now,
        expiresAt: expiresAt,
        verifiedAt: now,
        verifiedBy: adminUserId,
        verifiedByName: adminName,
        transactionReference: transactionRef,
        updatedAt: now
      }, { merge: true });

      // Synchronize User profile & Life Member status
      const userRef = db.collection('users').doc(userId);
      const userUpdateData: any = {
        isSubscribed: true,
        subscriptionStatus: 'active',
        updatedAt: now
      };

      const verifiedUniqueId = attemptData.verifiedUniqueId || attemptData.membershipNumber;
      if (verifiedUniqueId || plan === 'lifetime') {
        userUpdateData.isLifeMember = true;
        userUpdateData.lifeMember = true;
        if (verifiedUniqueId) {
          userUpdateData.membershipNumber = String(verifiedUniqueId).trim().toUpperCase();
        }
      }

      transaction.set(userRef, userUpdateData, { merge: true });

      // Mark Life Member registry doc as claimed
      if (verifiedUniqueId) {
        const normId = String(verifiedUniqueId).trim().toUpperCase();
        const lifeMemberRef = db.collection('life_members').doc(normId);
        transaction.set(lifeMemberRef, {
          isClaimed: true,
          claimedByUserId: userId,
          claimedAt: now
        }, { merge: true });
      }

      return { alreadyFulfilled: false, subscriptionId: subRef.id };
    });

    if (transactionResult.alreadyFulfilled) {
      return {
        success: true,
        alreadyFulfilled: true,
        message: 'Payment was already approved'
      };
    }

    // Step 3: Send Approval Email Notification
    const notifLockId = `manual_appr_notif_${paymentAttemptId}`;
    const notifRef = db.collection('notifications').doc(notifLockId);

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const userEmail = userData?.email || attemptData.userEmail;
      const userName = userData?.name || attemptData.userName || 'Member';

      if (userEmail) {
        sendPaymentApprovedNotification({
          email: userEmail,
          name: userName,
          plan: plan,
          amount: expectedAmount,
          transactionRef: transactionRef,
          date: new Date(),
          verifiedByName: adminName
        }).catch(err => {
          console.error('[MANUAL-FULFILLMENT] Notification dispatch failed:', err);
        });
      }
    } catch (emailErr) {
      console.error('[MANUAL-FULFILLMENT] Non-critical notification error:', emailErr);
    }

    console.log(`[MANUAL-FULFILLMENT] Payment ${paymentAttemptId} approved successfully by Admin ${adminName}`);

    return {
      success: true,
      alreadyFulfilled: false,
      subscriptionId: transactionResult.subscriptionId,
      attemptId: paymentAttemptId,
      message: 'Payment verified and subscription activated successfully.'
    };

  } catch (error: any) {
    console.error('[MANUAL-FULFILLMENT] Error approving manual payment:', error);
    return {
      success: false,
      alreadyFulfilled: false,
      error: error.message || 'Failed to approve payment'
    };
  }
};
