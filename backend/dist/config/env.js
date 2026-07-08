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
        logoUrl: process.env.BREVO_LOGO_URL || 'https://lh3.googleusercontent.com/aida/AP1WRLuohAN-o-4GGrtN-jXbH2E1fj-W6KhItttB6ISY86rVlu1wIVm9A4o5ovTIe5cNkCi7nSGUnq_txwB3ypWZ-GDiOnP9at4JwBHp_GgbKaUgn7MVeGPoG1sSku1henkE6xYRjH5KS9TPV0kl3-wqa_7KiUc_2XaXmwu1wWrhc5WVWDmgjisRqXgZjweajwugNdjWyV7D1dZ84yVnLhBugrAmIk6OeUuS-tTwv8UdcB_vG5QE_eqcYw4C',
        loginUrl: process.env.PORTAL_LOGIN_URL || process.env.LOGIN_URL || 'http://localhost:5173/auth',
    },
    payments: {
        razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID || '',
            keySecret: process.env.RAZORPAY_KEY_SECRET || '',
            webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
        }
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    }
};
