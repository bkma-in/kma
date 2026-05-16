import { auth, db } from '../src/config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const usersToAdd = [
  {
    email: 'dev1@kma.example.com',
    password: process.env.DEV1_PASSWORD,
    name: 'Dev Team Member 1',
    role: 'dev'
  },
  {
    email: 'dev2@kma.example.com',
    password: process.env.DEV2_PASSWORD,
    name: 'Dev Team Member 2',
    role: 'dev'
  }
];

// Note: Rotate these credentials immediately if they were leaked.
// Ensure DEV1_PASSWORD and DEV2_PASSWORD are set in your environment.

const createUsers = async () => {
  let hadError = false;

  for (const userData of usersToAdd) {
    if (!userData.password) {
      console.error(`Error: Password for ${userData.email} is missing in environment variables.`);
      hadError = true;
      continue;
    }

    try {
      console.log(`Attempting to create user: ${userData.email}...`);

      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
        });
        console.log(`Successfully created new user ${userData.email} in Firebase Auth:`, userRecord.uid);
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          userRecord = await auth.getUserByEmail(userData.email);
          console.log(`User ${userData.email} already exists in Firebase Auth, using existing UID:`, userRecord.uid);
        } else {
          throw error;
        }
      }

      // Create/Update Firestore document
      const userRef = db.collection('users').doc(userRecord.uid);
      const doc = await userRef.get();

      const payload: any = {
        uid: userRecord.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: 'approved',
        updatedAt: new Date(),
      };

      if (!doc.exists) {
        payload.createdAt = new Date();
      }

      await userRef.set(payload, { merge: true });

      console.log(`Successfully configured ${userData.role} profile in Firestore for UID: ${userRecord.uid}`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
      hadError = true;
    }
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
