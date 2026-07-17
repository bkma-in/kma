const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../dist/config/firebase');

async function run() {
  try {
    const articlesSnap = await db.collection('articles').get();
    console.log(`Total articles: ${articlesSnap.size}`);
    articlesSnap.docs.forEach(doc => {
      console.log(`Article ID: ${doc.id} - Title: ${doc.data().title} - Status: ${doc.data().status}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run();
