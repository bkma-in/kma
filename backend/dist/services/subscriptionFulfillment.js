"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fulfillSuccessfulSubscriptionPayment = void 0;
const firebase_1 = require("../config/firebase");
const notificationService_1 = require("./notificationService");
/**
 * Shared idempotent fulfillment helper for successful Razorpay subscription payments.
 * Executed by:
 * - POST /subscriptions/verify-payment
 * - payment.captured webhook
 * - order.paid webhook
 */
const fulfillSuccessfulSubscriptionPayment = async (razorpayOrderId, razorpayPaymentId, paymentMethod = 'online', expectedUserId) => {
    try {
        if (!razorpayOrderId || !razorpayPaymentId) {
            return { success: false, alreadyFulfilled: false, error: 'Razorpay order ID and payment ID are required' };
        }
        console.log(`[SUBSCRIPTION-FULFILLMENT] Initiating fulfillment check for Razorpay Order: ${razorpayOrderId}, Payment: ${razorpayPaymentId}`);
        // Step 1: Find internal subscription record by razorpayOrderId or paymentId
        const subSnapshot = await firebase_1.db.collection('subscriptions')
            .where('razorpayOrderId', '==', razorpayOrderId)
            .limit(1)
            .get();
        let subDoc = subSnapshot.empty ? null : subSnapshot.docs[0];
        // Fallback: check legacy paymentId field if razorpayOrderId search returned nothing
        if (!subDoc) {
            const fallbackSnapshot = await firebase_1.db.collection('subscriptions')
                .where('paymentId', '==', razorpayOrderId)
                .limit(1)
                .get();
            if (!fallbackSnapshot.empty) {
                subDoc = fallbackSnapshot.docs[0];
            }
        }
        if (!subDoc) {
            console.warn(`[SUBSCRIPTION-FULFILLMENT] No subscription order found for Razorpay Order ID: ${razorpayOrderId}`);
            return { success: false, alreadyFulfilled: false, error: 'Subscription order record not found' };
        }
        const subData = subDoc.data();
        // Verify ownership if expectedUserId is provided
        if (expectedUserId && subData.userId !== expectedUserId) {
            console.error(`[SUBSCRIPTION-FULFILLMENT] Security mismatch: Order ${razorpayOrderId} belongs to user ${subData.userId}, expected ${expectedUserId}`);
            return { success: false, alreadyFulfilled: false, error: 'Subscription order does not belong to authenticated user' };
        }
        const userId = subData.userId;
        const plan = subData.type || subData.plan || 'annual';
        const amount = subData.amount || (plan === 'lifetime' ? 1000 : 2000);
        const amountInPaise = amount * 100;
        const internalOrderId = subDoc.id;
        // Step 2: Atomic Firestore Transaction for State Transition
        let attemptDocIdToReturn;
        const transactionResult = await firebase_1.db.runTransaction(async (transaction) => {
            const freshSubDoc = await transaction.get(subDoc.ref);
            if (!freshSubDoc.exists) {
                throw new Error('Subscription document no longer exists');
            }
            const currentData = freshSubDoc.data();
            // Check if already fulfilled
            if (currentData.fulfillmentStatus === 'fulfilled' || currentData.razorpayPaymentId === razorpayPaymentId) {
                console.log(`[SUBSCRIPTION-FULFILLMENT] Order ${razorpayOrderId} already fulfilled. Skipping duplicate state transition.`);
                return { alreadyFulfilled: true, subscriptionId: freshSubDoc.id };
            }
            const now = new Date();
            let expiresAt = null;
            if (plan === 'annual' || plan === 'online_print') {
                expiresAt = new Date(now);
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            }
            // Update Subscription document
            transaction.update(freshSubDoc.ref, {
                status: 'active',
                paymentStatus: 'paid',
                fulfillmentStatus: 'fulfilled',
                razorpayPaymentId: razorpayPaymentId,
                razorpayOrderId: razorpayOrderId,
                paymentMethod: paymentMethod,
                startedAt: now,
                expiresAt: expiresAt,
                verifiedAt: now,
                fulfilledAt: now,
                updatedAt: now
            });
            // Find or create corresponding paymentAttempts document using razorpayPaymentId as primary key
            const attemptSnapshot = await firebase_1.db.collection('paymentAttempts')
                .where('razorpayPaymentId', '==', razorpayPaymentId)
                .limit(1)
                .get();
            let attemptRef;
            if (!attemptSnapshot.empty) {
                attemptRef = attemptSnapshot.docs[0].ref;
            }
            else {
                // Find pending attempt for this order ID if payment ID was not attached earlier
                const pendingAttemptSnapshot = await firebase_1.db.collection('paymentAttempts')
                    .where('internalOrderId', '==', internalOrderId)
                    .where('status', '==', 'pending')
                    .limit(1)
                    .get();
                if (!pendingAttemptSnapshot.empty) {
                    attemptRef = pendingAttemptSnapshot.docs[0].ref;
                }
                else {
                    attemptRef = firebase_1.db.collection('paymentAttempts').doc();
                }
            }
            attemptDocIdToReturn = attemptRef.id;
            transaction.set(attemptRef, {
                attemptId: attemptRef.id,
                userId: userId,
                internalOrderId: internalOrderId,
                razorpayOrderId: razorpayOrderId,
                razorpayPaymentId: razorpayPaymentId,
                plan: plan,
                amount: amount,
                amountInPaise: amountInPaise,
                currency: 'INR',
                provider: 'razorpay',
                environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
                status: 'fulfilled',
                paymentMethod: paymentMethod,
                verifiedAt: now,
                fulfilledAt: now,
                createdAt: now,
                updatedAt: now
            }, { merge: true });
            return { alreadyFulfilled: false, subscriptionId: freshSubDoc.id, attemptId: attemptRef.id };
        });
        if (transactionResult.alreadyFulfilled) {
            return {
                success: true,
                alreadyFulfilled: true,
                subscriptionId: transactionResult.subscriptionId,
                message: 'Subscription was already active and fulfilled'
            };
        }
        // Step 2.5: Synchronize user profile and life member record
        try {
            const userUpdatePayload = {
                isSubscribed: true,
                updatedAt: new Date()
            };
            if (subData.concessionApplied === true && subData.membershipId) {
                userUpdatePayload.isLifeMember = true;
                userUpdatePayload.lifeMember = true;
                userUpdatePayload.membershipNumber = subData.membershipId;
                // Update life_members doc
                const lifeMemberRef = firebase_1.db.collection('life_members').doc(subData.membershipId);
                lifeMemberRef.set({
                    hasActiveSubscription: true,
                    subscriptionId: transactionResult.subscriptionId,
                    lastSubscribedAt: new Date(),
                    updatedAt: new Date()
                }, { merge: true }).catch(err => {
                    console.warn('[SUBSCRIPTION-FULFILLMENT] Could not update life_members doc:', err);
                });
            }
            await firebase_1.db.collection('users').doc(userId).set(userUpdatePayload, { merge: true });
        }
        catch (syncErr) {
            console.warn('[SUBSCRIPTION-FULFILLMENT] Non-critical user sync warning:', syncErr);
        }
        // Step 3: Post-Transaction Deterministic Email Dispatch
        // Uses a deterministic notification ID `receipt_notif_<internalOrderId>` to prevent duplicate emails
        const deterministicNotifId = `receipt_notif_${internalOrderId}`;
        const notifRef = firebase_1.db.collection('notifications').doc(deterministicNotifId);
        try {
            let shouldSendEmail = false;
            await firebase_1.db.runTransaction(async (notifTransaction) => {
                const notifDoc = await notifTransaction.get(notifRef);
                if (!notifDoc.exists || notifDoc.data()?.status !== 'sent') {
                    notifTransaction.set(notifRef, {
                        notificationId: deterministicNotifId,
                        userId: userId,
                        internalOrderId: internalOrderId,
                        razorpayOrderId: razorpayOrderId,
                        razorpayPaymentId: razorpayPaymentId,
                        type: 'PAYMENT_SUCCESS_EMAIL',
                        status: 'sending',
                        attempts: (notifDoc.data()?.attempts || 0) + 1,
                        createdAt: notifDoc.exists ? notifDoc.data()?.createdAt : new Date(),
                        updatedAt: new Date()
                    }, { merge: true });
                    shouldSendEmail = true;
                }
                else {
                    console.log(`[SUBSCRIPTION-FULFILLMENT] Confirmation email already sent for order ${internalOrderId}. Skipping.`);
                }
            });
            if (shouldSendEmail) {
                // Fetch user email details
                const userDoc = await firebase_1.db.collection('users').doc(userId).get();
                const userData = userDoc.exists ? userDoc.data() : null;
                const userEmail = userData?.email || subData.email;
                const userName = userData?.name || 'Member';
                if (userEmail) {
                    (0, notificationService_1.sendSubscriptionPaymentSuccessNotification)({
                        email: userEmail,
                        name: userName,
                        plan: plan,
                        amount: amount,
                        razorpayOrderId: razorpayOrderId,
                        razorpayPaymentId: razorpayPaymentId,
                        date: new Date(),
                        paymentMethod: paymentMethod,
                        internalOrderId: internalOrderId
                    }).then(() => {
                        notifRef.update({ status: 'sent', sentAt: new Date(), updatedAt: new Date() }).catch(err => {
                            console.error('[SUBSCRIPTION-FULFILLMENT] Failed to mark email status sent:', err);
                        });
                    }).catch(err => {
                        console.error('[SUBSCRIPTION-FULFILLMENT] Email sending failed:', err);
                        notifRef.update({ status: 'failed', lastError: err.message || String(err), updatedAt: new Date() }).catch(() => { });
                    });
                }
            }
        }
        catch (emailErr) {
            console.error('[SUBSCRIPTION-FULFILLMENT] Deterministic notification tracking error:', emailErr);
            // Non-blocking: email failures must not roll back fulfillment
        }
        console.log(`[SUBSCRIPTION-FULFILLMENT] Order ${razorpayOrderId} successfully fulfilled for user ${userId}`);
        return {
            success: true,
            alreadyFulfilled: false,
            subscriptionId: transactionResult.subscriptionId,
            attemptId: transactionResult.attemptId || attemptDocIdToReturn,
            message: 'Payment verified and subscription activated successfully'
        };
    }
    catch (error) {
        console.error('[SUBSCRIPTION-FULFILLMENT] Error fulfilling subscription payment:', error);
        return {
            success: false,
            alreadyFulfilled: false,
            error: error.message || 'Failed to fulfill subscription payment'
        };
    }
};
exports.fulfillSuccessfulSubscriptionPayment = fulfillSuccessfulSubscriptionPayment;
