import { db } from '../src/config/firebase';

async function checkJobs() {
  const snapshot = await db.collection('archive_jobs').get();
  console.log(`Total jobs in archive_jobs: ${snapshot.size}`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Job ID: ${doc.id}`);
    console.log(`  filename: ${data.filename}`);
    console.log(`  status: ${data.status}`);
    console.log(`  fileKey: ${data.fileKey}`);
    console.log(`  articles count: ${data.articles ? data.articles.length : 0}`);
  });
}

checkJobs();
