"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 3000,
    firebase: {
        serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '{}',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
    },
    r2: {
        accountId: process.env.R2_ACCOUNT_ID || '',
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        bucketName: process.env.R2_BUCKET_NAME || '',
        endpoint: process.env.R2_ENDPOINT || '',
    },
    brevo: {
        apiKey: process.env.BREVO_API_KEY || '',
        senderEmail: process.env.BREVO_SENDER_EMAIL || 'keralamathsasso@gmail.com',
        logoUrl: process.env.BREVO_LOGO_URL || 'https://res.cloudinary.com/dalv5zyx3/image/upload/v1783493145/kma/assets/j647dvggnyhjhm57r6w4.jpg',
        loginUrl: process.env.PORTAL_LOGIN_URL || process.env.LOGIN_URL || 'https://bkma.in/auth',
        privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || 'https://bkma.in/privacy-policy',
        reviewerGuidelinesUrl: process.env.REVIEWER_GUIDELINES_URL || 'https://bkma.in/reviewer-guidelines',
        authorGuidelinesUrl: process.env.AUTHOR_GUIDELINES_URL || 'https://bkma.in/author-guidelines',
        supportUrl: process.env.SUPPORT_URL || 'https://bkma.in/support',
    },
    payments: {
        bankAccount: {
            accountName: process.env.BKMA_PAYMENT_ACCOUNT_NAME || '',
            bankName: process.env.BKMA_BANK_NAME || '',
            accountNumber: process.env.BKMA_ACCOUNT_NUMBER || '',
            ifsc: process.env.BKMA_IFSC || '',
            branch: process.env.BKMA_BRANCH || '',
            upiId: process.env.BKMA_UPI_ID || ''
        }
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    trustProxy: process.env.TRUST_PROXY || 2,
    rateLimit: {
        globalWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        globalMax: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        authMax: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
        pdfWindowMs: Number(process.env.PDF_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        pdfMax: Number(process.env.PDF_RATE_LIMIT_MAX_REQUESTS) || 5,
        uploadWindowMs: Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        uploadMax: Number(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS) || 5,
        signedUrlWindowMs: Number(process.env.SIGNED_URL_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        signedUrlMax: Number(process.env.SIGNED_URL_RATE_LIMIT_MAX_REQUESTS) || 15,
        downloadWindowMs: Number(process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        downloadMax: Number(process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS) || 30,
        paymentWindowMs: Number(process.env.PAYMENT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        paymentMax: Number(process.env.PAYMENT_RATE_LIMIT_MAX_REQUESTS) || 10,
        archiveWindowMs: Number(process.env.ARCHIVE_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        archiveMax: Number(process.env.ARCHIVE_RATE_LIMIT_MAX_REQUESTS) || 5,
        webhookWindowMs: Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
        webhookMax: Number(process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS) || 100,
        sendVerificationWindowMs: Number(process.env.SEND_VERIFICATION_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        sendVerificationMax: Number(process.env.SEND_VERIFICATION_RATE_LIMIT_MAX_REQUESTS) || 5,
        verifyCodeWindowMs: Number(process.env.VERIFY_CODE_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        verifyCodeMax: Number(process.env.VERIFY_CODE_RATE_LIMIT_MAX_REQUESTS) || 10,
    }
};
