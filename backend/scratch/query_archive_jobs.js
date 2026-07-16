const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../dist/config/firebase');

async function run() {
  try {
    const jobsSnap = await db.collection('archiveJobs').get();
    console.log(`Total archive jobs: ${jobsSnap.size}`);
    jobsSnap.docs.forEach(doc => {
      console.log(`Job ID: ${doc.id} - Data:`, doc.data());
    });
  } catch (err) {
    console.error(err);
  }
}

run();
