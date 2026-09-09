"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateIssuesCache = void 0;
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Create Issue (Admin only)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { title, volume, issueNumber, articleIds } = req.body;
        const issueRef = firebase_1.db.collection('issues').doc();
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
        await firebase_1.db.runTransaction(async (transaction) => {
            transaction.set(issueRef, newIssue);
            for (const articleId of articleIds || []) {
                const articleRef = firebase_1.db.collection('articles').doc(articleId);
                transaction.update(articleRef, { issueId: issueRef.id, updatedAt: new Date() });
            }
        });
        (0, exports.invalidateIssuesCache)();
        res.json({ success: true, issue: newIssue });
    }
    catch (error) {
        console.error('Create issue error:', error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});
let cachedIssues = null;
const ISSUES_CACHE_TTL_MS = 60 * 1000;
const invalidateIssuesCache = () => {
    cachedIssues = null;
};
exports.invalidateIssuesCache = invalidateIssuesCache;
// List Issues (Public endpoint with in-memory TTL caching and safe public cache headers)
router.get('/', async (_req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        if (cachedIssues && (Date.now() - cachedIssues.timestamp < ISSUES_CACHE_TTL_MS)) {
            return res.json({ success: true, issues: cachedIssues.data });
        }
        const snapshot = await firebase_1.db.collection('issues').orderBy('publishedAt', 'desc').get();
        const issues = snapshot.docs.map(doc => doc.data());
        cachedIssues = {
            data: issues,
            timestamp: Date.now()
        };
        res.json({ success: true, issues });
    }
    catch (error) {
        console.error('List issues error:', error);
        res.status(500).json({ error: 'Failed to list issues' });
    }
});
// Get Issue with populated articles
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const issueDoc = await firebase_1.db.collection('issues').doc(id).get();
        if (!issueDoc.exists) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        const issue = issueDoc.data();
        // Fetch related articles
        let articles = [];
        if (issue.articleIds && issue.articleIds.length > 0) {
            // Note: Firestore 'in' query supports max 10 items.
            // For more, you might need to query where('issueId', '==', id)
            const articlesSnapshot = await firebase_1.db.collection('articles').where('issueId', '==', id).get();
            articles = articlesSnapshot.docs.map(doc => doc.data());
        }
        res.json({ success: true, issue: { ...issue, articles } });
    }
    catch (error) {
        console.error('Get issue error:', error);
        res.status(500).json({ error: 'Failed to get issue' });
    }
});
exports.default = router;
