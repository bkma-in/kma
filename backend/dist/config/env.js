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
    },
    brevo: {
        apiKey: process.env.BREVO_API_KEY || '',
    },
    payments: {
        cashfree: {
            appId: process.env.CASHFREE_APP_ID || '',
            secretKey: process.env.CASHFREE_SECRET_KEY || '',
            environment: process.env.CASHFREE_ENVIRONMENT || 'SANDBOX',
        },
        razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID || '',
            keySecret: process.env.RAZORPAY_KEY_SECRET || '',
        }
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    }
};
