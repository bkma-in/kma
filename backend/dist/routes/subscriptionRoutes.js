"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("../config/env");
const rateLimiter_1 = require("../middleware/rateLimiter");
const subscriptionFulfillment_1 = require("../services/subscriptionFulfillment");
const notificationService_1 = require("../services/notificationService");
const razorpay = new razorpay_1.default({
    key_id: env_1.config.payments.razorpay.keyId,
    key_secret: env_1.config.payments.razorpay.keySecret,
});
async function createRazorpayOrderHelper(options) {
    try {
        return await razorpay.orders.create(options);
    }
    catch (sdkErr) {
        console.warn('[RAZORPAY-SDK-WARN] SDK create order failed, using direct REST fallback:', sdkErr.message || sdkErr);
        const keyId = env_1.config.payments.razorpay.keyId;
        const keySecret = env_1.config.payments.razorpay.keySecret;
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        try {
            const response = await axios_1.default.post('https://api.razorpay.com/v1/orders', options, {
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (axiosErr) {
            if (axiosErr.response) {
                const errorDesc = axiosErr.response.data?.error?.description || 'Razorpay API rejected request';
                const code = axiosErr.response.status;
                throw new Error(`Razorpay API Error (${code}): ${errorDesc}`);
            }
            throw new Error(`Razorpay connection error: ${axiosErr.message}`);
        }
    }
}
const router = (0, express_1.Router)();
// GET /subscriptions/payment-history - List user's payment attempt history (All attempts: pending, failed, fulfilled)
router.get('/payment-history', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        // Query paymentAttempts collection for the authenticated user
        const attemptsSnapshot = await firebase_1.db.collection('paymentAttempts')
            .where('userId', '==', uid)
            .get();
        const attempts = attemptsSnapshot.docs.map((doc) => {
            const data = doc.data();
            const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
            const dateStr = createdAtDate.toISOString().split('T')[0];
            return {
                attemptId: data.attemptId || doc.id,
                id: data.attemptId || doc.id,
                internalOrderId: data.internalOrderId,
                razorpayOrderId: data.razorpayOrderId,
                razorpayPaymentId: data.razorpayPaymentId || null,
                plan: data.plan || 'annual',
                article: data.plan === 'lifetime' ? 'BKMA Life Membership Subscription' : 'BKMA Annual Pass Subscription',
                amount: data.amount ? `₹${data.amount}` : '₹2000',
                amountRaw: data.amount || 2000,
                currency: data.currency || 'INR',
                date: dateStr,
                createdAt: createdAtDate.toISOString(),
                status: data.status === 'fulfilled' || data.status === 'paid' ? 'Paid' :
                    data.status === 'failed' ? 'Failed' :
                        data.status === 'cancelled' ? 'Cancelled' : 'Pending',
                rawStatus: data.status,
                paymentMethod: data.paymentMethod || 'online',
                failureReason: data.failureReason || null,
                errorCode: data.errorCode || null,
                verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : data.verifiedAt || null,
                fulfilledAt: data.fulfilledAt?.toDate ? data.fulfilledAt.toDate().toISOString() : data.fulfilledAt || null,
                receiptAvailable: data.status === 'fulfilled' || data.status === 'paid'
            };
        });
        // Sort newest first
        attempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json({
            success: true,
            attempts
        });
    }
    catch (error) {
        console.error('List payment history error:', error);
        res.status(500).json({ error: 'Failed to retrieve payment history' });
    }
});
// GET /subscriptions/my-subscriptions - List user's subscriptions
router.get('/my-subscriptions', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        // Fetch subscriptions
        const subSnapshot = await firebase_1.db.collection('subscriptions')
            .where('userId', '==', uid)
            .get();
        const subscriptions = subSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: data.subscriptionId || doc.id,
                type: 'subscription',
                planType: data.type || data.plan || 'annual',
                amount: data.amount ? `₹${data.amount}` : (data.type === 'lifetime' ? '₹1000' : '₹2000'),
                date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: data.status === 'active' ? 'Paid' : data.status === 'pending' ? 'Pending' : 'Failed',
                rawStatus: data.status,
                article: data.type === 'lifetime' || data.plan === 'lifetime' ? 'BKMA Life Membership Subscription' : 'BKMA Annual Pass Subscription',
                paymentId: data.razorpayPaymentId || data.razorpayOrderId || data.paymentId
            };
        });
        const hasActiveSubscription = subscriptions.some(s => s.rawStatus === 'active');
        res.json({
            success: true,
            isSubscribed: hasActiveSubscription,
            subscriptions: subscriptions,
            activeSubscriptions: subscriptions.filter(s => s.rawStatus === 'active')
        });
    }
    catch (error) {
        console.error('List subscriptions error:', error);
        res.status(500).json({ error: 'Failed to list subscriptions' });
    }
});
// Helper to mask email address: e.g. j***e@domain.com
const maskEmail = (email) => {
    if (!email)
        return '***';
    const parts = email.split('@');
    if (parts.length !== 2)
        return '***';
    const user = parts[0];
    const domain = parts[1];
    if (user.length <= 2)
        return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
};
// POST /subscriptions/request-life-member-otp - Verify membership and send 6-digit OTP
router.post('/request-life-member-otp', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, async (req, res) => {
    try {
        const { email } = req.user;
        const { uniqueId } = req.body;
        if (!uniqueId || typeof uniqueId !== 'string' || !uniqueId.trim()) {
            return res.status(400).json({ error: 'Please provide your Unique Life Member ID.' });
        }
        const normUniqueId = uniqueId.trim().toUpperCase();
        const userEmailLower = (email || '').toLowerCase().trim();
        // 1. Look up Life Member record by Unique ID
        let memberData = null;
        const memberDoc = await firebase_1.db.collection('life_members').doc(normUniqueId).get();
        if (memberDoc.exists) {
            memberData = memberDoc.data();
        }
        else {
            // Fallback: search by uniqueId field
            const querySnap = await firebase_1.db.collection('life_members').where('uniqueId', '==', normUniqueId).limit(1).get();
            if (!querySnap.empty) {
                memberData = querySnap.docs[0].data();
            }
            else {
                // Fallback: search in users collection for isLifeMember and membershipNumber
                const userQuery = await firebase_1.db.collection('users')
                    .where('isLifeMember', '==', true)
                    .where('membershipNumber', '==', normUniqueId)
                    .limit(1)
                    .get();
                if (!userQuery.empty) {
                    memberData = userQuery.docs[0].data();
                }
            }
        }
        if (!memberData) {
            return res.status(404).json({
                error: `Unique Member ID "${normUniqueId}" was not found in the official KMA Life Members registry. Please check your ID or contact administration.`
            });
        }
        // 2. Validate email matching
        const memberEmailLower = (memberData.emailLower || memberData.email || '').toLowerCase().trim();
        if (memberEmailLower !== userEmailLower) {
            return res.status(403).json({
                error: `Member ID "${normUniqueId}" is registered to a different email address. Please sign in with the registered email account (${maskEmail(memberEmailLower)}) or contact support.`
            });
        }
        // 3. Check if an active subscription is already linked to this Unique ID
        const activeSubSnap = await firebase_1.db.collection('subscriptions')
            .where('membershipId', '==', normUniqueId)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (!activeSubSnap.empty) {
            return res.status(400).json({
                error: `An active subscription pass is already active for Life Member ID "${normUniqueId}".`
            });
        }
        // 4. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // 5. Store in life_member_otps collection
        const otpDocId = `${req.user.uid}_${normUniqueId}`;
        await firebase_1.db.collection('life_member_otps').doc(otpDocId).set({
            userId: req.user.uid,
            email: email,
            uniqueId: normUniqueId,
            otp,
            expiresAt,
            verified: false,
            createdAt: new Date()
        });
        // 6. Send OTP Email using Brevo transactional email
        const memberName = memberData.name || req.user.name || 'Life Member';
        await (0, notificationService_1.sendLifeMemberOtpEmail)(email, memberName, normUniqueId, otp);
        res.json({
            success: true,
            message: `A 6-digit confirmation code has been sent to your registered email (${maskEmail(email)}).`,
            maskedEmail: maskEmail(email),
            uniqueId: normUniqueId
        });
    }
    catch (error) {
        console.error('Request Life Member OTP error:', error);
        res.status(500).json({ error: error.message || 'Failed to send verification OTP' });
    }
});
// POST /subscriptions/create-order - Create Razorpay Order for Annual Subscription
// Standard: ₹2,000 / year | KMA Life Member: ₹1,000 / year (50% Concession with verified OTP)
router.post('/create-order', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { applyLifeMemberDiscount, uniqueId, otp } = req.body;
        // Check if user already has an active subscription
        const existingActiveSub = await firebase_1.db.collection('subscriptions')
            .where('userId', '==', uid)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (!existingActiveSub.empty) {
            return res.status(400).json({
                error: 'You already have an active BKMA subscription pass.'
            });
        }
        let orderAmount = 2000;
        let concessionApplied = false;
        let verifiedUniqueId = null;
        if (applyLifeMemberDiscount === true) {
            if (!uniqueId || !otp) {
                return res.status(400).json({
                    error: 'Unique Membership ID and email verification OTP are required for the 50% concession rate.'
                });
            }
            const normUniqueId = uniqueId.trim().toUpperCase();
            const otpDocId = `${uid}_${normUniqueId}`;
            const otpDoc = await firebase_1.db.collection('life_member_otps').doc(otpDocId).get();
            if (!otpDoc.exists) {
                return res.status(400).json({
                    error: 'No active OTP verification found. Please request a verification code.'
                });
            }
            const otpData = otpDoc.data();
            const expiryTime = otpData.expiresAt?.toDate ? otpData.expiresAt.toDate().getTime() : new Date(otpData.expiresAt).getTime();
            if (Date.now() > expiryTime) {
                return res.status(400).json({
                    error: 'Verification code has expired. Please request a new OTP code.'
                });
            }
            if (otpData.otp !== String(otp).trim()) {
                return res.status(400).json({
                    error: 'Invalid verification OTP code. Please check your email and try again.'
                });
            }
            // Mark OTP as verified/used
            await otpDoc.ref.update({ verified: true, usedAt: new Date() });
            orderAmount = 1000;
            concessionApplied = true;
            verifiedUniqueId = normUniqueId;
        }
        const options = {
            amount: orderAmount * 100, // amount in paise (INR)
            currency: "INR",
            receipt: `sub_${Date.now()}_${uid.substring(0, 5)}`,
            notes: {
                userId: uid,
                email: email || '',
                plan: 'annual',
                concessionApplied: String(concessionApplied),
                membershipId: verifiedUniqueId || ''
            }
        };
        const order = await createRazorpayOrderHelper(options);
        // Save pending subscription document in Firestore
        const subRef = firebase_1.db.collection('subscriptions').doc();
        await subRef.set({
            subscriptionId: subRef.id,
            userId: uid,
            email: email || '',
            type: 'annual',
            plan: 'annual',
            amount: orderAmount,
            amountInPaise: orderAmount * 100,
            concessionApplied: concessionApplied,
            membershipId: verifiedUniqueId,
            currency: 'INR',
            status: 'pending',
            paymentStatus: 'pending',
            fulfillmentStatus: 'pending',
            razorpayOrderId: order.id,
            paymentId: order.id,
            provider: 'razorpay',
            environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Create pending paymentAttempt document
        const attemptRef = firebase_1.db.collection('paymentAttempts').doc();
        await attemptRef.set({
            attemptId: attemptRef.id,
            userId: uid,
            internalOrderId: subRef.id,
            razorpayOrderId: order.id,
            razorpayPaymentId: null,
            plan: 'annual',
            concessionApplied: concessionApplied,
            membershipId: verifiedUniqueId,
            amount: orderAmount,
            amountInPaise: orderAmount * 100,
            currency: 'INR',
            provider: 'razorpay',
            environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        res.json({
            success: true,
            orderId: order.id,
            attemptId: attemptRef.id,
            paymentSessionId: order.id,
            amount: orderAmount,
            concessionApplied,
            keyId: env_1.config.payments.razorpay.keyId
        });
    }
    catch (error) {
        console.error('Create subscription order error:', error);
        const status = error.message?.includes('Razorpay API Error') || error.message?.includes('Invalid') ? 400 : 500;
        res.status(status).json({ error: error.message || 'Failed to create payment order' });
    }
});
// POST /subscriptions/verify-payment - Verify Razorpay Payment Signature
router.post('/verify-payment', authMiddleware_1.requireAuth, rateLimiter_1.paymentRateLimiter, async (req, res) => {
    try {
        const { uid } = req.user;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature are required)' });
        }
        const secret = env_1.config.payments.razorpay.keySecret;
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            console.error('Signature mismatch in verify-payment:', { expectedSignature, razorpay_signature });
            return res.status(400).json({ error: 'Invalid payment signature' });
        }
        // Fetch payment details from Razorpay SDK to get method info
        let paymentMethod = 'online';
        try {
            const razorpayPaymentObj = await razorpay.payments.fetch(razorpay_payment_id);
            if (razorpayPaymentObj && razorpayPaymentObj.method) {
                paymentMethod = razorpayPaymentObj.method;
            }
        }
        catch (rzpErr) {
            console.warn('[VERIFY-PAYMENT] Failed to fetch payment details from Razorpay SDK:', rzpErr);
        }
        // Execute shared idempotent fulfillment
        const result = await (0, subscriptionFulfillment_1.fulfillSuccessfulSubscriptionPayment)(razorpay_order_id, razorpay_payment_id, paymentMethod, uid);
        if (!result.success) {
            return res.status(400).json({ error: result.error || 'Payment verification failed' });
        }
        return res.json({
            success: true,
            message: result.message || 'Payment verified and subscription activated',
            alreadyFulfilled: result.alreadyFulfilled,
            subscriptionId: result.subscriptionId,
            attemptId: result.attemptId
        });
    }
    catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});
// Single-Article Payment creation endpoint (Disabled - Subscriptions only scope)
router.post('/create-article-order', authMiddleware_1.requireAuth, async (_req, res) => {
    return res.status(400).json({
        error: 'Single article purchase is disabled. Platform access is available strictly via Annual Pass or Lifetime Pass subscriptions.'
    });
});
exports.default = router;
