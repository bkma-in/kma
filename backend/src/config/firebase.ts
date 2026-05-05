import * as admin from 'firebase-admin';
import { config } from './env';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(config.firebase.serviceAccount);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebase.projectId
    });
  } catch (error) {
    console.warn('Firebase init failed, fallback to default auth logic', error);
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
