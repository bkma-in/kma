import { auth, db } from '../src/config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

import * as crypto from 'crypto';

const createAdmin = async () => {
  try {
    console.log('Querying Firestore for admin users...');
    const adminSnapshot = await db.collection('users').where('role', '==', 'admin').get();

    if (adminSnapshot.empty) {
      console.log('No admin users found in Firestore. Please add an admin user to the "users" collection manually first.');
      process.exit(0);
    }

    for (const doc of adminSnapshot.docs) {
      const userData = doc.data();
      const email = userData.email;
      const name = userData.name || 'KMA Administrator';
      const uid = doc.id;

      if (!email) {
        console.warn(`User document ${uid} is missing an email field. Skipping.`);
        continue;
      }

      console.log(`Synchronizing admin: ${email}...`);

      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        console.log('User already exists in Firebase Auth:', userRecord.uid);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          const tempPassword = crypto.randomBytes(16).toString('hex');
          userRecord = await auth.createUser({
            email,
            password: tempPassword,
            displayName: name,
          });
          console.log(`Successfully created new admin in Firebase Auth with UID: ${userRecord.uid}`);
          console.log(`IMPORTANT: The user must use "Forgot Password" to set their password for ${email}`);
        } else {
          throw error;
        }
      }

      // Update Firestore document to ensure it's linked correctly and approved
      const userRef = db.collection('users').doc(userRecord.uid);
      
      const payload: any = {
        uid: userRecord.uid,
        email,
        name,
        role: 'admin',
        status: 'approved',
        updatedAt: new Date(),
      };

      // If the UID from Auth is different from the doc ID in Firestore (rare),
      // we might want to handle it, but for now we'll just set the record.
      await userRef.set(payload, { merge: true });
      
      console.log(`Successfully verified admin profile in Firestore for UID: ${userRecord.uid}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
