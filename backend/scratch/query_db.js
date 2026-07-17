const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../dist/config/firebase');

async function run() {
  try {
    const issueId = 'vol_19_issue_1_june_2025';
    console.log(`Checking issue: ${issueId}`);
    const issueSnap = await db.collection('issues').doc(issueId).get();
    if (issueSnap.exists) {
      console.log('Issue exists:', issueSnap.data());
    } else {
      console.log('Issue does not exist.');
    }

    const articlesSnap = await db.collection('articles').where('issueId', '==', issueId).get();
    console.log(`Found ${articlesSnap.size} articles for this issue.`);
    articlesSnap.docs.forEach(doc => {
      console.log(`Article: ${doc.id} - Title: ${doc.data().title} - Status: ${doc.data().status}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run();
