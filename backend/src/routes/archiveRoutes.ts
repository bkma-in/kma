import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { archiveUpload } from '../services/archive/uploadService';
import { uploadOriginalJournal } from '../services/archive/storageService';
import { createJob, updateJobStatus, publishArchiveArticles } from '../services/archive/firestoreService';
import { queueService, SegmentRange } from '../services/archive/queueService';

const router = Router();

/**
 * POST /api/archive/upload
 * Starts an archive ingestion job (Non-blocking, background processed).
 */
router.post(
  '/upload',
  requireAuth,
  requireRole(['admin']),
  archiveUpload.fields([
    { name: 'journal', maxCount: 1 },
    { name: 'segment_images' }
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { volumeNo, issueNumber, monthYear, issn, rangesJson } = req.body;
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
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

      let ranges: SegmentRange[] = [];
      try {
        ranges = JSON.parse(rangesJson);
      } catch {
        return res.status(400).json({ error: 'Invalid page ranges JSON structure.' });
      }

      if (ranges.length === 0) {
        return res.status(400).json({ error: 'At least one page segment is required.' });
      }

      const jobId = db.collection('archive_jobs').doc().id;

      // 1. Upload original journal to Cloudflare R2 immediately (to keep it archived)
      const originalName = journalFile.originalname;
      const originalKey = await uploadOriginalJournal(
        journalFile.buffer,
        originalName,
        volumeNo,
        issueNumber
      );

      // 2. Initialize the background job document in Firestore
      await createJob({
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
      
      queueService.enqueueJob(
        jobId,
        journalFile.buffer,
        originalName,
        journalFile.mimetype,
        ranges,
        segmentImgBuffers,
        volumeNo,
        issueNumber,
        monthYear,
        issn
      ).catch(err => {
        console.error(`[ARCHIVE-ROUTES] Background job ${jobId} failed to launch:`, err);
      });

      res.status(202).json({
        success: true,
        jobId,
        message: 'Digitization upload completed. Background processing started.'
      });

    } catch (error: any) {
      console.error('[ARCHIVE-ROUTES] Upload failed:', error);
      res.status(500).json({ error: `Upload failed: ${error.message || error}` });
    }
  }
);

/**
 * GET /api/archive/jobs
 * Lists history of all archive ingestion jobs.
 */
router.get('/jobs', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db.collection('archive_jobs')
      .orderBy('startedAt', 'desc')
      .limit(100)
      .get();

    const jobs = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, jobs });
  } catch (error: any) {
    console.error('[ARCHIVE-ROUTES] Get jobs failed:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs history.' });
  }
});

/**
 * GET /api/archive/jobs/:id
 * Fetches details of a specific archive job.
 */
router.get('/jobs/:id', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const jobDoc = await db.collection('archive_jobs').doc(req.params.id).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Archive job not found.' });
    }

    res.json({ success: true, job: jobDoc.data() });
  } catch (error: any) {
    console.error('[ARCHIVE-ROUTES] Get job details failed:', error);
    res.status(500).json({ error: 'Failed to fetch job details.' });
  }
});

/**
 * POST /api/archive/jobs/:id/publish
 * Commits the verified articles to the main accepted queue database.
 */
router.post('/jobs/:id/publish', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.id;
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Verified articles list is required.' });
    }

    const jobDoc = await db.collection('archive_jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Archive job not found.' });
    }

    const jobData = jobDoc.data()!;
    if (jobData.status === 'completed') {
      return res.status(400).json({ error: 'This job has already been published.' });
    }

    // Publish to main collection and set job status to completed
    await publishArchiveArticles(
      jobId,
      articles,
      jobData.volumeNo,
      jobData.issueNumber
    );

    res.json({
      success: true,
      message: 'Archive articles approved and published to Ready-to-Publish list successfully.'
    });

  } catch (error: any) {
    console.error('[ARCHIVE-ROUTES] Publish job articles failed:', error);
    res.status(500).json({ error: `Publish failed: ${error.message || error}` });
  }
});

export default router;
