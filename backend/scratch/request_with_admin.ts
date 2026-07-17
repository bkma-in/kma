import axios from 'axios';
import * as admin from 'firebase-admin';
import { db } from '../src/config/firebase';

const FIREBASE_API_KEY = 'AIzaSyBcsNLnl1giyW71A-JNd2B2IZgPouh7AyA';

async function runTest() {
  try {
    const usersSnap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
    if (usersSnap.empty) {
      console.log('No admin user found.');
      return;
    }
    const adminUid = usersSnap.docs[0].id;
    const customToken = await admin.auth().createCustomToken(adminUid);
    const exchangeRes = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`, {
      token: customToken,
      returnSecureToken: true
    });
    const idToken = exchangeRes.data.idToken;

    const key = 'issues/volume_19/issue_1/2025 June Issue.pdf';
    console.log(`Requesting GET http://localhost:3000/api/articles/staged/pdf?key=${key} as JSON ...`);
    const res = await axios.get(`http://localhost:3000/api/articles/staged/pdf?key=${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    console.log('SUCCESS!');
    console.log('Status:', res.status);
    console.log('Response Content-Type:', res.headers['content-type']);
    console.log('Data:', res.data);
  } catch (err: any) {
    console.log('ERROR:');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', err.response.data);
    } else {
      console.error(err);
    }
  }
}

runTest();
