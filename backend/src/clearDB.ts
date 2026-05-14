import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteQueryBatch(query: any, resolve: any) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    // delete invitations subcollection if it exists
    const invites = await doc.ref.collection('invitations').get();
    for (const invite of invites.docs) {
        batch.delete(invite.ref);
    }
    batch.delete(doc.ref);
  }
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function clearCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(50);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function run() {
  console.log('Clearing articles...');
  await clearCollection('articles');
  console.log('Clearing notifications...');
  await clearCollection('notifications');
  console.log('Database cleared successfully!');
  process.exit(0);
}

run().catch(console.error);
