import { db } from '../config/firebase';

export const runMigrations = async () => {
  console.log('Starting Firestore database migrations...');
  try {
    const snapshot = await db.collection('users').get();
    const batch = db.batch();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      let updated = false;
      const updateData: any = {};
      
      if (data.name && data.nameLower === undefined) {
        updateData.nameLower = data.name.toLowerCase();
        updated = true;
      }
      if (data.email && data.emailLower === undefined) {
        updateData.emailLower = data.email.toLowerCase();
        updated = true;
      }
      
      if (updated) {
        batch.update(doc.ref, updateData);
        count++;
      }
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${count} users with lowercased search fields.`);
    } else {
      console.log('All users are already migrated.');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};
