const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT not found in .env');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson.trim().replace(/^'|'$/g, ''));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

async function clearCollections() {
  const collections = ['notifications', 'articles'];
  
  for (const collectionPath of collections) {
    console.log(`Clearing ${collectionPath}...`);
    const snapshot = await db.collection(collectionPath).get();
    
    if (snapshot.empty) {
      console.log(`No documents in ${collectionPath}.`);
      continue;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} documents from ${collectionPath}.`);
  }
}

clearCollections().then(() => {
  console.log('Database cleanup complete.');
  process.exit(0);
}).catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
