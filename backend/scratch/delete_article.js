const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../dist/config/firebase');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME;

async function deleteFromR2(key) {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`  ✅ Deleted from R2: ${key}`);
  } catch (err) {
    console.warn(`  ⚠️  Could not delete from R2 (${key}): ${err.message}`);
  }
}

async function run() {
  const ARTICLE_ID = 'dsmfEqmRD51cHCbUNDta';
  console.log(`\n🔎 Looking up article: ${ARTICLE_ID}`);

  const articleRef = db.collection('articles').doc(ARTICLE_ID);
  const snap = await articleRef.get();

  if (!snap.exists) {
    console.log('❌ Article not found in Firestore.');
    process.exit(1);
  }

  const data = snap.data();
  console.log(`  Title  : ${data.title}`);
  console.log(`  Status : ${data.status}`);
  console.log(`  PDF    : ${data.pdfUrl || 'none'}`);

  // 1. Delete main PDF from R2
  if (data.pdfUrl) {
    await deleteFromR2(data.pdfUrl);
  }

  // 2. Delete revision PDFs from R2
  if (Array.isArray(data.revisionHistory)) {
    for (const rev of data.revisionHistory) {
      if (rev.pdfUrl) await deleteFromR2(rev.pdfUrl);
    }
  }

  // 3. Delete invitations subcollection
  const invSnap = await articleRef.collection('invitations').get();
  if (!invSnap.empty) {
    const batch = db.batch();
    invSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`  ✅ Deleted ${invSnap.size} invitation(s)`);
  }

  // 4. Delete related notifications
  const notifSnap = await db.collection('notifications')
    .where('metadata.articleId', '==', ARTICLE_ID)
    .get();
  if (!notifSnap.empty) {
    const batch = db.batch();
    notifSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`  ✅ Deleted ${notifSnap.size} notification(s)`);
  }

  // 5. Remove articleId from parent issue (if any)
  if (data.issueId) {
    const issueRef = db.collection('issues').doc(data.issueId);
    const issueSnap = await issueRef.get();
    if (issueSnap.exists) {
      const issueData = issueSnap.data();
      const updatedIds = (issueData.articleIds || []).filter(id => id !== ARTICLE_ID);
      await issueRef.update({ articleIds: updatedIds, updatedAt: new Date() });
      console.log(`  ✅ Removed from issue: ${data.issueId}`);
    }
  }

  // 6. Delete the article document
  await articleRef.delete();
  console.log(`\n✅ Article "${data.title}" (${ARTICLE_ID}) deleted completely from Firestore.\n`);
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
