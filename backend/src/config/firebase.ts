import * as admin from 'firebase-admin';
import { config } from './env';

if (!admin.apps.length) {
  try {
    if (!config.firebase.serviceAccount || config.firebase.serviceAccount === '{}') {
       throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in .env');
    }
    const serviceAccount = JSON.parse(config.firebase.serviceAccount);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebase.projectId
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error: any) {
    console.error('Firebase init failed:', error.message);
    // If it fails, we still initialize with default credentials (if available in environment)
    // or just let it fail later when DB is accessed.
    admin.initializeApp({
       projectId: config.firebase.projectId
    });
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
