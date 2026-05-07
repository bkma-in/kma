import * as admin from 'firebase-admin';
import { config } from './env';

if (!admin.apps.length) {
  try {
    if (!config.firebase.serviceAccount || config.firebase.serviceAccount === '{}') {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in .env');
    }

    // Fix: Strip potential single quotes that can cause JSON.parse to fail
    const rawJson = config.firebase.serviceAccount.trim().replace(/^'|'$/g, '');
    const serviceAccount = JSON.parse(rawJson);

    // Debug: Check if project IDs match
    console.log('Backend Config Project ID:', config.firebase.projectId);
    console.log('Service Account Project ID:', serviceAccount.project_id);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebase.projectId
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error: any) {
    console.error('Firebase init failed:', error.message);
    // Fallback initialization
    admin.initializeApp({
      projectId: config.firebase.projectId
    });
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
