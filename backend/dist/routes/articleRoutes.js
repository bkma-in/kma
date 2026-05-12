"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const storageService_1 = require("../services/storageService");
const router = (0, express_1.Router)();
// Submit Article or Save Draft (Author only)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['author']), uploadMiddleware_1.upload.single('pdf'), async (req, res) => {
    try {
        const { title, abstract, status = 'submitted' } = req.body;
        const authorId = req.user.uid;
        let objectKey = null;
        let pdfName = null;
        if (req.file) {
            objectKey = await (0, storageService_1.uploadPdfToR2)(req.file.buffer, req.file.originalname, authorId);
            pdfName = req.file.originalname;
        }
        else if (status !== 'draft') {
            return res.status(400).json({ error: 'PDF file is required for final submission' });
        }
        const articleRef = firebase_1.db.collection('articles').doc();
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
    }
    catch (error) {
        console.error('Save article error:', error);
        res.status(500).json({ error: 'Failed to save article' });
    }
});
// List Articles
router.get('/', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { role, uid } = req.user;
        let query = firebase_1.db.collection('articles');
        if (role === 'author') {
            query = query.where('authorId', '==', uid);
        }
        else if (role === 'reviewer') {
            query = query.where('reviewerId', '==', uid);
        }
        if (role === 'reader') {
            query = query.where('status', '==', 'accepted');
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const articles = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, articles });
    }
    catch (error) {
        console.error('List articles error:', error);
        res.status(500).json({ error: 'Failed to list articles' });
    }
});
// Delete Article (Author only, and only if draft or submitted)
router.delete('/:id', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { uid, role } = req.user;
        const articleRef = firebase_1.db.collection('articles').doc(id);
        const doc = await articleRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const article = doc.data();
        // Security check: Only author can delete, and only if not yet under review/accepted
        if (role !== 'admin' && article.authorId !== uid) {
            return res.status(403).json({ error: 'Unauthorized to delete this article' });
        }
        if (role !== 'admin' && !['draft', 'submitted'].includes(article.status)) {
            return res.status(400).json({ error: 'Cannot delete article that is already under review or published' });
        }
        await articleRef.delete();
        res.json({ success: true, message: 'Article deleted successfully' });
    }
    catch (error) {
        console.error('Delete article error:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});
// Get Signed PDF URL (requires active subscription for reader)
router.get('/:id/pdf', authMiddleware_1.requireAuth, async (req, res) => {
    // ... (rest of the file remains the same)
    try {
        const id = req.params.id;
        const { role, uid } = req.user;
        const articleDoc = await firebase_1.db.collection('articles').doc(id).get();
        if (!articleDoc.exists) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const article = articleDoc.data();
        // Access control check
        let hasAccess = false;
        if (['admin', 'reviewer'].includes(role))
            hasAccess = true;
        if (role === 'author' && article.authorId === uid)
            hasAccess = true;
        if (role === 'reader') {
            if (article.status !== 'accepted' || !article.issueId) {
                return res.status(403).json({ error: 'Article not published yet' });
            }
            // Check subscription
            const subQuery = await firebase_1.db.collection('subscriptions')
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
        const signedUrl = await (0, storageService_1.getSignedPdfUrl)(article.pdfUrl);
        res.json({ success: true, url: signedUrl });
    }
    catch (error) {
        console.error('Get PDF URL error:', error);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
});
// Update Article (Author only)
router.put('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['author']), uploadMiddleware_1.upload.single('pdf'), async (req, res) => {
    try {
        const id = req.params.id;
        const { title, abstract, status = 'draft' } = req.body;
        const authorId = req.user.uid;
        const articleRef = firebase_1.db.collection('articles').doc(id);
        const doc = await articleRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const article = doc.data();
        if (article.authorId !== authorId) {
            return res.status(403).json({ error: 'Unauthorized to update this article' });
        }
        const updateData = {
            title,
            abstract,
            status,
            updatedAt: new Date()
        };
        if (req.file) {
            const objectKey = await (0, storageService_1.uploadPdfToR2)(req.file.buffer, req.file.originalname, authorId);
            updateData.pdfUrl = objectKey;
            updateData.pdfName = req.file.originalname;
        }
        await articleRef.update(updateData);
        res.json({ success: true, message: 'Article updated successfully' });
    }
    catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});
// Admin Assign Reviewer
router.patch('/:id/assign', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const id = req.params.id;
        const { reviewerId } = req.body;
        // Use transaction for atomic update
        await firebase_1.db.runTransaction(async (transaction) => {
            const articleRef = firebase_1.db.collection('articles').doc(id);
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
    }
    catch (error) {
        console.error('Assign reviewer error:', error);
        res.status(500).json({ error: error.message || 'Failed to assign reviewer' });
    }
});
// Reviewer/Admin Update Status
router.patch('/:id/status', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin', 'reviewer']), async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body; // e.g. "accepted", "rejected", "revision_requested"
        const articleRef = firebase_1.db.collection('articles').doc(id);
        await articleRef.update({
            status,
            updatedAt: new Date()
        });
        // Optional: Trigger email to author about decision
        res.json({ success: true, message: 'Status updated successfully' });
    }
    catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});
exports.default = router;
