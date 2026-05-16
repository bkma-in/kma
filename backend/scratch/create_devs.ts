import { auth, db } from '../src/config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });


const createUsers = async () => {
  let hadError = false;

  try {
    console.log('Querying Firestore for developer users...');
    const devSnapshot = await db.collection('users').where('role', '==', 'dev').get();

    if (devSnapshot.empty) {
      console.log('No developer users found in Firestore. Please add developer users to the "users" collection manually first.');
      process.exit(0);
    }

    for (const doc of devSnapshot.docs) {
      const userData = doc.data();
      const email = userData.email;
      const name = userData.name || 'Dev Team Member';
      const uid = doc.id;

      if (!email) {
        console.warn(`User document ${uid} is missing an email field. Skipping.`);
        continue;
      }

      try {
        console.log(`Synchronizing developer: ${email}...`);

        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(email);
          console.log(`User ${email} already exists in Firebase Auth:`, userRecord.uid);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            const tempPassword = crypto.randomBytes(16).toString('hex');
            userRecord = await auth.createUser({
              email,
              password: tempPassword,
              displayName: name,
            });
            console.log(`Successfully created new developer ${email} in Firebase Auth with UID: ${userRecord.uid}`);
            console.log(`IMPORTANT: The user must use "Forgot Password" to set their password for ${email}`);
          } else {
            throw error;
          }
        }

        // Update Firestore document
        const userRef = db.collection('users').doc(userRecord.uid);
        
        const payload: any = {
          uid: userRecord.uid,
          email,
          name,
          role: 'dev',
          status: 'approved',
          updatedAt: new Date(),
        };

        await userRef.set(payload, { merge: true });

        console.log(`Successfully verified ${userData.role} profile in Firestore for UID: ${userRecord.uid}`);
      } catch (error) {
        console.error(`Error synchronizing user ${email}:`, error);
        hadError = true;
      }
    }
  } catch (error) {
    console.error('Fatal error during synchronization:', error);
    hadError = true;
  }

  if (hadError) {
    console.error('Seeding completed with errors.');
    process.exit(1);
  } else {
    console.log('Seeding completed successfully.');
    process.exit(0);
  }
};

createUsers();
