import { db } from '../src/config/firebase';

async function runCleanup() {
  console.log('[CLEANUP] Starting cleanup of empty/mistakenly published articles...');

  try {
    // 1. Fetch all articles matching 'admin_ingested'
    const snapshot = await db.collection('articles')
      .where('authorId', '==', 'admin_ingested')
      .get();

    if (snapshot.empty) {
      console.log('[CLEANUP] No articles found for authorId "admin_ingested".');
      return;
    }

    console.log(`[CLEANUP] Found ${snapshot.size} total ingested articles. Filtering for empty ones...`);

    const deletedArticleIds: string[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const title = (data.title || '').trim();
      const abstract = (data.abstract || '').trim();

      // Check if it is empty/blank
      const isEmpty = !title || !abstract || title.toLowerCase() === 'untitled article' || title.toLowerCase() === 'untitled';

      if (isEmpty) {
        console.log(`[CLEANUP] Deleting empty article: ID: ${doc.id}, Title: "${title || '(empty)'}"`);
        
        // Delete the article doc
        await doc.ref.delete();
        deletedArticleIds.push(doc.id);
      }
    }

    console.log(`[CLEANUP] Deleted ${deletedArticleIds.length} empty articles.`);

    if (deletedArticleIds.length === 0) {
      console.log('[CLEANUP] No empty articles were found to delete.');
      return;
    }

    // 2. Clean up corresponding issues
    const issuesSnapshot = await db.collection('issues').get();
    for (const issueDoc of issuesSnapshot.docs) {
      const issueData = issueDoc.data();
      const articleIds: string[] = issueData.articleIds || [];

      // Filter out deleted article IDs
      const remainingArticleIds = articleIds.filter(id => !deletedArticleIds.includes(id));

      if (remainingArticleIds.length !== articleIds.length) {
        if (remainingArticleIds.length === 0) {
          console.log(`[CLEANUP] Deleting empty issue: ${issueDoc.id} (${issueData.title})`);
          await issueDoc.ref.delete();
        } else {
          console.log(`[CLEANUP] Updating issue: ${issueDoc.id} (${issueData.title}) - Removing deleted articles`);
          await issueDoc.ref.update({
            articleIds: remainingArticleIds
          });
        }
      }
    }

    console.log('[CLEANUP] Database cleanup completed successfully!');
  } catch (error) {
    console.error('[CLEANUP] Cleanup failed with error:', error);
  }
}

runCleanup();
