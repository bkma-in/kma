import { auth, db } from '../src/config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = 'KMA Administrator';
  const role = 'admin';

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  try {
    console.log(`Attempting to create admin user: ${email}...`);

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      console.log('Successfully created new user in Firebase Auth:', userRecord.uid);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(email);
        console.log('User already exists in Firebase Auth, using existing UID:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Create/Update Firestore document
    const userRef = db.collection('users').doc(userRecord.uid);
    const doc = await userRef.get();
    
    const payload: any = {
      uid: userRecord.uid,
      email,
      name,
      role,
      status: 'approved',
      updatedAt: new Date(),
    };

    if (!doc.exists) {
      payload.createdAt = new Date();
    }

    await userRef.set(payload, { merge: true });

    console.log(`Successfully configured ${role} profile in Firestore for UID: ${userRecord.uid}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
