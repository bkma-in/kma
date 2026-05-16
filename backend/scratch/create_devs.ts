import { auth, db } from '../src/config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const usersToAdd = [
  {
    email: 'fullstackproject18@gmail.com',
    password: 'Nandi@123',
    name: 'Dev Team Member 1',
    role: 'dev'
  },
  {
    email: 'shivunaganur2001@gmail.com',
    password: 'Shivu@788197',
    name: 'Dev Team Member 2',
    role: 'dev'
  }
];

const createUsers = async () => {
  for (const userData of usersToAdd) {
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
      await userRef.set({
        uid: userRecord.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      console.log(`Successfully configured ${userData.role} profile in Firestore for UID: ${userRecord.uid}`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
  process.exit(0);
};

createUsers();
