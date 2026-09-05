import { db } from '../config/firebase';

export const runMigrations = async () => {
  console.log('Checking Firestore database migrations status...');
  try {
    const migrationRef = db.collection('system_config').doc('migrations');
    const migrationDoc = await migrationRef.get();
    const completedMigrations = migrationDoc.exists ? migrationDoc.data() || {} : {};

    if (completedMigrations.users_lowercase_v1 === true) {
      console.log('[MIGRATION] users_lowercase_v1 already applied. Skipping users collection scan.');
      return;
    }

    console.log('[MIGRATION] Running users_lowercase_v1 migration...');
    const snapshot = await db.collection('users').get();
    let batch = db.batch();
    let count = 0;
    let opsInBatch = 0;
    
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
        opsInBatch++;
        
        if (opsInBatch === 500) {
          await batch.commit();
          batch = db.batch();
          opsInBatch = 0;
        }
      }
    }
    
    if (opsInBatch > 0) {
      await batch.commit();
    }

    // Mark migration as completed in system_config/migrations
    await migrationRef.set({
      users_lowercase_v1: true,
      appliedAt: new Date()
    }, { merge: true });
    
    if (count > 0) {
      console.log(`Successfully migrated ${count} users with lowercased search fields.`);
    } else {
      console.log('All users are already migrated. Migration marked complete.');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};
