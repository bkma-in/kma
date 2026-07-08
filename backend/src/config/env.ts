import dotenv from 'dotenv';
dotenv.config();

export const config = {
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
    loginUrl: process.env.PORTAL_LOGIN_URL || process.env.LOGIN_URL || 'http://localhost:5173/auth',
    privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || 'http://localhost:5173/privacy-policy',
    reviewerGuidelinesUrl: process.env.REVIEWER_GUIDELINES_URL || 'http://localhost:5173/reviewer-guidelines',
    supportUrl: process.env.SUPPORT_URL || 'http://localhost:5173/support',
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
