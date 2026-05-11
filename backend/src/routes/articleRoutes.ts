import { Router } from 'express';
import { db } from '../config/firebase';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { uploadPdfToR2, getSignedPdfUrl } from '../services/storageService';

const router = Router();

// Submit Article or Save Draft (Author only)
router.post('/', requireAuth, requireRole(['author']), upload.single('pdf'), async (req: AuthRequest, res) => {
  try {
    const { title, abstract, status = 'submitted' } = req.body;
    const authorId = req.user!.uid;

    let objectKey = null;
    let pdfName = null;
    if (req.file) {
      objectKey = await uploadPdfToR2(req.file.buffer, req.file.originalname, authorId);
      pdfName = req.file.originalname;
    } else if (status !== 'draft') {
      return res.status(400).json({ error: 'PDF file is required for final submission' });
    }

    const articleRef = db.collection('articles').doc();
    const newArticle = {
      articleId: articleRef.id,
      title,
      abstract,
      authorId,
      reviewerId: null,
      status, // 'draft' or 'submitted'
      pdfUrl: objectKey, 
      pdfName,
      issueId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await articleRef.set(newArticle);

    res.json({ success: true, article: newArticle });
  } catch (error) {
    console.error('Save article error:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// List Articles
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { role, uid } = req.user!;
    let query = db.collection('articles') as FirebaseFirestore.Query;

    if (role === 'author') {
      query = query.where('authorId', '==', uid);
    } else if (role === 'reviewer') {
      query = query.where('reviewerId', '==', uid);
    }
    
    if (role === 'reader') {
      query = query.where('status', '==', 'accepted');
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const articles = snapshot.docs.map(doc => doc.data());

    res.json({ success: true, articles });
  } catch (error) {
    console.error('List articles error:', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

// Delete Article (Author only, and only if draft or submitted)
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { uid, role } = req.user!;

    const articleRef = db.collection('articles').doc(id);
    const doc = await articleRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = doc.data()!;

    // Security check: Only author can delete, and only if not yet under review/accepted
    if (role !== 'admin' && article.authorId !== uid) {
      return res.status(403).json({ error: 'Unauthorized to delete this article' });
    }

    if (role !== 'admin' && !['draft', 'submitted'].includes(article.status)) {
       return res.status(400).json({ error: 'Cannot delete article that is already under review or published' });
    }

    await articleRef.delete();
    res.json({ success: true, message: 'Article deleted successfully' });

  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Get Signed PDF URL (requires active subscription for reader)
router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res) => {
// ... (rest of the file remains the same)
  try {
    const id = req.params.id as string;
    const { role, uid } = req.user!;

    const articleDoc = await db.collection('articles').doc(id).get();
    if (!articleDoc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = articleDoc.data()!;

    // Access control check
    let hasAccess = false;
    if (['admin', 'reviewer'].includes(role)) hasAccess = true;
    if (role === 'author' && article.authorId === uid) hasAccess = true;

    if (role === 'reader') {
      if (article.status !== 'accepted' || !article.issueId) {
         return res.status(403).json({ error: 'Article not published yet' });
      }

      // Check subscription
      const subQuery = await db.collection('subscriptions')
        .where('userId', '==', uid)
        .where('issueId', '==', article.issueId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!subQuery.empty) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Requires active subscription for this issue' });
    }

    const signedUrl = await getSignedPdfUrl(article.pdfUrl);
    res.json({ success: true, url: signedUrl });

  } catch (error) {
    console.error('Get PDF URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Update Article (Author only)
router.put('/:id', requireAuth, requireRole(['author']), upload.single('pdf'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { title, abstract, status = 'draft' } = req.body;
    const authorId = req.user!.uid;

    const articleRef = db.collection('articles').doc(id);
    const doc = await articleRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = doc.data()!;
    if (article.authorId !== authorId) {
      return res.status(403).json({ error: 'Unauthorized to update this article' });
    }

    const updateData: any = {
      title,
      abstract,
      status,
      updatedAt: new Date()
    };

    if (req.file) {
      const objectKey = await uploadPdfToR2(req.file.buffer, req.file.originalname, authorId);
      updateData.pdfUrl = objectKey;
      updateData.pdfName = req.file.originalname;
    }

    await articleRef.update(updateData);

    res.json({ success: true, message: 'Article updated successfully' });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Admin Assign Reviewer
router.patch('/:id/assign', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { reviewerId } = req.body;

    // Use transaction for atomic update
    await db.runTransaction(async (transaction) => {
      const articleRef = db.collection('articles').doc(id);
      const articleDoc = await transaction.get(articleRef);

      if (!articleDoc.exists) {
        throw new Error('Article not found');
      }

      transaction.update(articleRef, {
        reviewerId,
        status: 'under_review',
        updatedAt: new Date()
      });
    });

    // Optional: Email reviewer about assignment

    res.json({ success: true, message: 'Reviewer assigned successfully' });
  } catch (error: any) {
    console.error('Assign reviewer error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign reviewer' });
  }
});

// Reviewer/Admin Update Status
router.patch('/:id/status', requireAuth, requireRole(['admin', 'reviewer']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // e.g. "accepted", "rejected", "revision_requested"

    const articleRef = db.collection('articles').doc(id);
    await articleRef.update({
      status,
      updatedAt: new Date()
    });

    // Optional: Trigger email to author about decision

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
