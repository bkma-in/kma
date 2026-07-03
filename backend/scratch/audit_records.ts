import { db } from '../src/config/firebase';

async function audit() {
  console.log('=== DETAILED FIRESTORE ARTICLES AUDIT ===');
  const snapshot = await db.collection('articles').get();
  console.log(`Total Articles: ${snapshot.size}`);

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`\n--------------------------------------------`);
    console.log(`Document ID: ${doc.id}`);
    console.log(`Title: "${data.title}"`);
    console.log(`Status: "${data.status}"`);
    console.log(`Author ID: "${data.authorId}"`);
    console.log(`PDF Key (pdfUrl): "${data.pdfUrl}"`);
    console.log(`PDF Name (pdfName): "${data.pdfName}"`);
    console.log(`Thumbnail URL: "${data.thumbnail}"`);
    console.log(`Thumbnail Public ID: "${data.thumbnailPublicId}"`);
    console.log(`Created At:`, data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt);
    console.log(`Updated At:`, data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt);
    if (data.revisionHistory) {
      console.log(`Revision History:`, JSON.stringify(data.revisionHistory, null, 2));
    }
  });
  console.log('\n=== AUDIT COMPLETED ===');
}

audit().catch(console.error);
