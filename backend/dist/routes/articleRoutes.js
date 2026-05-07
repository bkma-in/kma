"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const storageService_1 = require("../services/storageService");
const router = (0, express_1.Router)();
// Submit Article (Author only)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['author']), uploadMiddleware_1.upload.single('pdf'), async (req, res) => {
    try {
        const { title, abstract } = req.body;
        const authorId = req.user.uid;
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }
        const objectKey = await (0, storageService_1.uploadPdfToR2)(req.file.buffer, req.file.originalname, authorId);
        const articleRef = firebase_1.db.collection('articles').doc();
        const newArticle = {
            articleId: articleRef.id,
            title,
            abstract,
            authorId,
            reviewerId: null,
            status: 'submitted',
            pdfUrl: objectKey, // Storing object key, not full URL
            issueId: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await articleRef.set(newArticle);
        // Optional: trigger email to author
        res.json({ success: true, article: newArticle });
    }
    catch (error) {
        console.error('Submit article error:', error);
        res.status(500).json({ error: 'Failed to submit article' });
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
        // admin sees all, reader shouldn't access this (or maybe only accepted ones via issues)
        if (role === 'reader') {
            // Reader might only need to see accepted articles that are published, but usually they view via issues
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
// Get Signed PDF URL (requires active subscription for reader)
router.get('/:id/pdf', authMiddleware_1.requireAuth, async (req, res) => {
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
