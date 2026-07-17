"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadService_1 = require("../services/archive/uploadService");
const storageService_1 = require("../services/archive/storageService");
const firestoreService_1 = require("../services/archive/firestoreService");
const queueService_1 = require("../services/archive/queueService");
const router = (0, express_1.Router)();
/**
 * POST /api/archive/upload
 * Starts an archive ingestion job (Non-blocking, background processed).
 */
router.post('/upload', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), uploadService_1.archiveUpload.fields([
    { name: 'journal', maxCount: 1 },
    { name: 'segment_images' }
]), async (req, res) => {
    try {
        const { volumeNo, issueNumber, monthYear, issn, rangesJson } = req.body;
        const files = req.files;
        const journalFile = files?.journal?.[0];
        const segmentImages = files?.segment_images || [];
        if (!journalFile) {
            return res.status(400).json({ error: 'Original journal file (PDF/ZIP) is required.' });
        }
        if (!volumeNo || !issueNumber || !monthYear) {
            return res.status(400).json({ error: 'Volume, Issue, and Month/Year are required.' });
        }
        if (!rangesJson) {
            return res.status(400).json({ error: 'Page range segments list is required.' });
        }
        let ranges = [];
        try {
            ranges = JSON.parse(rangesJson);
        }
        catch {
            return res.status(400).json({ error: 'Invalid page ranges JSON structure.' });
        }
        if (ranges.length === 0) {
            return res.status(400).json({ error: 'At least one page segment is required.' });
        }
        const jobId = firebase_1.db.collection('archive_jobs').doc().id;
        // 1. Upload original journal to Cloudflare R2 immediately (to keep it archived)
        const originalName = journalFile.originalname;
        const originalKey = await (0, storageService_1.uploadOriginalJournal)(journalFile.buffer, originalName, volumeNo, issueNumber);
        // 2. Initialize the background job document in Firestore
        await (0, firestoreService_1.createJob)({
            jobId,
            filename: originalName,
            fileKey: originalKey,
            volumeNo,
            issueNumber,
            monthYear,
            issn: issn || '0973-2721',
            status: 'queued'
        });
        // 3. Dispatch processing asynchronously in the background
        const segmentImgBuffers = segmentImages.map(f => f.buffer);
        queueService_1.queueService.enqueueJob(jobId, journalFile.buffer, originalName, journalFile.mimetype, ranges, segmentImgBuffers, volumeNo, issueNumber, monthYear, issn).catch(err => {
            console.error(`[ARCHIVE-ROUTES] Background job ${jobId} failed to launch:`, err);
        });
        res.status(202).json({
            success: true,
            jobId,
            message: 'Digitization upload completed. Background processing started.'
        });
    }
    catch (error) {
        console.error('[ARCHIVE-ROUTES] Upload failed:', error);
        res.status(500).json({ error: `Upload failed: ${error.message || error}` });
    }
});
/**
 * GET /api/archive/jobs
 * Lists history of all archive ingestion jobs.
 */
router.get('/jobs', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('archive_jobs')
            .orderBy('startedAt', 'desc')
            .limit(100)
            .get();
        const jobs = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, jobs });
    }
    catch (error) {
        console.error('[ARCHIVE-ROUTES] Get jobs failed:', error);
        res.status(500).json({ error: 'Failed to retrieve jobs history.' });
    }
});
/**
 * GET /api/archive/jobs/:id
 * Fetches details of a specific archive job.
 */
router.get('/jobs/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const jobDoc = await firebase_1.db.collection('archive_jobs').doc(req.params.id).get();
        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Archive job not found.' });
        }
        res.json({ success: true, job: jobDoc.data() });
    }
    catch (error) {
        console.error('[ARCHIVE-ROUTES] Get job details failed:', error);
        res.status(500).json({ error: 'Failed to fetch job details.' });
    }
});
/**
 * POST /api/archive/jobs/:id/publish
 * Commits the verified articles to the main accepted queue database.
 */
router.post('/jobs/:id/publish', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const jobId = req.params.id;
        const { articles } = req.body;
        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({ error: 'Verified articles list is required.' });
        }
        const jobDoc = await firebase_1.db.collection('archive_jobs').doc(jobId).get();
        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Archive job not found.' });
        }
        const jobData = jobDoc.data();
        if (jobData.status === 'completed') {
            return res.status(400).json({ error: 'This job has already been published.' });
        }
        // Publish to main collection and set job status to completed
        await (0, firestoreService_1.publishArchiveArticles)(jobId, articles, jobData.volumeNo, jobData.issueNumber);
        res.json({
            success: true,
            message: 'Archive articles approved and published to Ready-to-Publish list successfully.'
        });
    }
    catch (error) {
        console.error('[ARCHIVE-ROUTES] Publish job articles failed:', error);
        res.status(500).json({ error: `Publish failed: ${error.message || error}` });
    }
});
exports.default = router;
