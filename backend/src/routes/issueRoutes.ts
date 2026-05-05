import { Router } from 'express';
import { db } from '../config/firebase';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Create Issue (Admin only)
router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { title, volume, issueNumber, articleIds } = req.body;
    
    const issueRef = db.collection('issues').doc();
    const newIssue = {
      issueId: issueRef.id,
      title,
      volume,
      issueNumber,
      articleIds: articleIds || [],
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update articles to link to this issue
    await db.runTransaction(async (transaction) => {
      transaction.set(issueRef, newIssue);
      
      for (const articleId of articleIds || []) {
        const articleRef = db.collection('articles').doc(articleId);
        transaction.update(articleRef, { issueId: issueRef.id, updatedAt: new Date() });
      }
    });

    res.json({ success: true, issue: newIssue });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// List Issues
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('issues').orderBy('publishedAt', 'desc').get();
    const issues = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, issues });
  } catch (error) {
    console.error('List issues error:', error);
    res.status(500).json({ error: 'Failed to list issues' });
  }
});

// Get Issue with populated articles
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const issueDoc = await db.collection('issues').doc(id).get();
    if (!issueDoc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const issue = issueDoc.data()!;

    // Fetch related articles
    let articles: any[] = [];
    if (issue.articleIds && issue.articleIds.length > 0) {
      // Note: Firestore 'in' query supports max 10 items.
      // For more, you might need to query where('issueId', '==', id)
      const articlesSnapshot = await db.collection('articles').where('issueId', '==', id).get();
      articles = articlesSnapshot.docs.map(doc => doc.data());
    }

    res.json({ success: true, issue: { ...issue, articles } });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: 'Failed to get issue' });
  }
});

export default router;
