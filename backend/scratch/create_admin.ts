import { auth, db } from '../src/config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  const email = 'keralamathsasso@gmail.com';
  const password = 'Kma@123';
  const name = 'KMA Administrator';
  const role = 'admin';

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
    await userRef.set({
      uid: userRecord.uid,
      email,
      name,
      role,
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    console.log(`Successfully configured ${role} profile in Firestore for UID: ${userRecord.uid}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
