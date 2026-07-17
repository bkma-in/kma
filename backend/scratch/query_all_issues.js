const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../dist/config/firebase');

async function run() {
  try {
    const issuesSnap = await db.collection('issues').get();
    console.log(`Total issues: ${issuesSnap.size}`);
    issuesSnap.docs.forEach(doc => {
      console.log(`Issue ID: ${doc.id} - Title: ${doc.data().title}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run();
