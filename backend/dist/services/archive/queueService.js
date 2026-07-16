"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
const firebase_1 = require("../../config/firebase");
const splitterService_1 = require("./splitterService");
const textExtractor_1 = require("./textExtractor");
const ocrService_1 = require("./ocrService");
const metadataParser_1 = require("./metadataParser");
const validationService_1 = require("./validationService");
const duplicateChecker_1 = require("./duplicateChecker");
const storageService_1 = require("./storageService");
const firestoreService_1 = require("./firestoreService");
/**
 * Main queue service that processes archive digitization jobs in the background.
 */
class QueueService {
    activeJobs = new Set();
    /**
     * Enqueues a job for processing.
     */
    async enqueueJob(jobId, fileBuffer, filename, mimeType, ranges, segmentImages, volumeNo, issueNumber, monthYear, issn) {
        console.log(`[QUEUE-SERVICE] Enqueuing job ${jobId}...`);
        // 1. Stage the files in Cloudflare R2 immediately to make the job resumable
        try {
            await (0, storageService_1.uploadStagedFile)(fileBuffer, jobId, mimeType);
            for (let i = 0; i < segmentImages.length; i++) {
                await (0, storageService_1.uploadStagedFile)(segmentImages[i], `${jobId}/segment_${i}`, 'image/png');
            }
        }
        catch (err) {
            console.error(`[QUEUE-SERVICE] Staging failed for job ${jobId}:`, err);
            await (0, firestoreService_1.updateJobStatus)(jobId, 'failed', { errors: [`Staging failed: ${err.message}`] });
            return;
        }
        // 2. Start background process (non-blocking)
        this.processJob(jobId, fileBuffer, mimeType, ranges, segmentImages, volumeNo, issueNumber, monthYear, issn);
    }
    /**
     * Performs processing of a staged job.
     */
    async processJob(jobId, fileBuffer, mimeType, ranges, segmentImages, volumeNo, issueNumber, monthYear, issn) {
        if (this.activeJobs.has(jobId))
            return;
        this.activeJobs.add(jobId);
        const startTime = Date.now();
        let importedCount = 0;
        let failedCount = 0;
        let totalConfidence = 0;
        const articles = [];
        await (0, firestoreService_1.updateJobStatus)(jobId, 'processing');
        console.log(`[QUEUE-SERVICE] Processing job ${jobId}. Segments count: ${ranges.length}`);
        try {
            let masterPdfBuffer = fileBuffer;
            // If ZIP, compile images to PDF
            if (mimeType.includes('zip') || filenameEndsWith(filenameOfJob(jobId), '.zip')) {
                await (0, firestoreService_1.updateJobStatus)(jobId, 'processing', { status: 'processing' });
                try {
                    masterPdfBuffer = await (0, splitterService_1.compileZipToPdf)(fileBuffer);
                }
                catch (err) {
                    await (0, firestoreService_1.addJobLog)(jobId, 'error', `ZIP Compilation failed: ${err.message}`);
                    throw err;
                }
            }
            // Loop through each page range segment
            for (let idx = 0; idx < ranges.length; idx++) {
                const range = ranges[idx];
                const segImgBuffer = segmentImages[idx];
                console.log(`[QUEUE-SERVICE] Job ${jobId}: processing article ${idx + 1}/${ranges.length} (Pages: ${range.startPage}-${range.endPage})`);
                try {
                    // A. Split PDF segment
                    const articlePdfBuffer = await (0, splitterService_1.splitPdf)(masterPdfBuffer, range.startPage, range.endPage);
                    // B. Extract text (Digital parse first)
                    await (0, firestoreService_1.updateJobStatus)(jobId, 'metadata_extraction');
                    const textResult = await (0, textExtractor_1.extractDigitalText)(masterPdfBuffer, range.startPage, range.endPage);
                    let extractedText = textResult.text;
                    let ocrConfidence = 100;
                    let extractionMethod = 'Digital';
                    // C. Fallback to OCR if text is missing or scanned
                    if (textResult.isScanned) {
                        if (segImgBuffer && segImgBuffer.length > 0) {
                            await (0, firestoreService_1.updateJobStatus)(jobId, 'ocr_running');
                            extractionMethod = 'OCR';
                            const ocrResult = await ocrService_1.ocrEngine.recognize(segImgBuffer);
                            extractedText = ocrResult.text;
                            ocrConfidence = ocrResult.confidence;
                        }
                        else {
                            await (0, firestoreService_1.addJobLog)(jobId, 'warning', `Article segment ${idx + 1} appears scanned but no page image was uploaded. OCR skipped.`);
                        }
                    }
                    // D. Parse Metadata
                    const parsed = (0, metadataParser_1.parseMetadata)(extractedText);
                    // E. Validate & Score
                    const validation = (0, validationService_1.validateMetadata)(parsed, !!articlePdfBuffer);
                    totalConfidence += ocrConfidence;
                    // F. Check Duplicates
                    const duplicate = await (0, duplicateChecker_1.checkForDuplicate)(parsed.title, parsed.authors.map(a => a.name), volumeNo, issueNumber);
                    // G. Stage the split PDF in R2
                    const tempArticleId = `staged_${jobId}_art_${idx}`;
                    const pdfKey = await (0, storageService_1.uploadSplitArticle)(articlePdfBuffer, tempArticleId, volumeNo, issueNumber);
                    // H. Assemble Draft Article
                    const draftArticle = {
                        id: tempArticleId,
                        ocrTitle: parsed.title,
                        title: parsed.title, // verified title initialized to OCR title
                        ocrAbstract: parsed.abstract,
                        abstract: parsed.abstract,
                        ocrKeywords: parsed.keywords,
                        keywords: parsed.keywords,
                        ocrSubjectClassification: parsed.subjectClassification,
                        subjectClassification: parsed.subjectClassification,
                        ocrPageRange: `${range.startPage}-${range.endPage}`,
                        pageRange: `${range.startPage}-${range.endPage}`,
                        ocrAuthors: parsed.authors,
                        authors: parsed.authors.map(a => ({
                            userId: 'admin_ingested',
                            name: a.name,
                            email: a.email || '',
                            affiliation: a.affiliation || '',
                            role: 'author'
                        })),
                        pdfKey,
                        pdfName: `article_${range.startPage}_${range.endPage}.pdf`,
                        isOld: true,
                        status: validation.needsManualReview ? 'Needs Review' : 'Ready to Publish',
                        confidenceScore: validation.score,
                        ocrConfidence,
                        extractionMethod,
                        duplicateDetected: duplicate.isDuplicate,
                        matchedArticleId: duplicate.matchedArticleId || null,
                        errors: validation.errors,
                        warnings: validation.warnings
                    };
                    articles.push(draftArticle);
                    importedCount++;
                }
                catch (err) {
                    failedCount++;
                    console.error(`[QUEUE-SERVICE] Failed to process segment ${idx + 1}:`, err);
                    await (0, firestoreService_1.addJobLog)(jobId, 'error', `Article Segment ${idx + 1} (Pages ${range.startPage}-${range.endPage}) failed: ${err.message}`);
                }
            }
            // Finish job
            const avgConfidence = ranges.length > 0 ? Math.round(totalConfidence / ranges.length) : 0;
            await (0, firestoreService_1.updateJobStatus)(jobId, 'ready_for_review', {
                articles,
                ocrConfidenceAverage: avgConfidence,
                importedCount,
                failedCount,
                processingTimeMs: Date.now() - startTime
            });
        }
        catch (error) {
            console.error(`[QUEUE-SERVICE] Job ${jobId} failed with critical error:`, error);
            await (0, firestoreService_1.updateJobStatus)(jobId, 'failed', {
                processingTimeMs: Date.now() - startTime
            });
        }
        finally {
            this.activeJobs.delete(jobId);
        }
    }
    /**
     * Resumes jobs that were interrupted by a server restart.
     */
    async resumeInterruptedJobs() {
        console.log('[QUEUE-SERVICE] Scanning for pending or interrupted digitization jobs...');
        try {
            const snapshot = await firebase_1.db.collection('archive_jobs')
                .where('status', 'in', ['queued', 'processing', 'ocr_running', 'metadata_extraction', 'validating'])
                .get();
            if (snapshot.empty) {
                console.log('[QUEUE-SERVICE] No interrupted jobs found.');
                return;
            }
            console.log(`[QUEUE-SERVICE] Found ${snapshot.size} jobs to resume.`);
            for (const doc of snapshot.docs) {
                const job = doc.data();
                const jobId = job.jobId;
                // Fetch staged master file from R2
                try {
                    const fileBuffer = await (0, storageService_1.downloadStagedFile)(`archive_jobs/${jobId}/original.bin`);
                    // Reconstruct ranges and segment images
                    const ranges = job.articles.map((art) => {
                        const [start, end] = art.ocrPageRange.split('-').map(Number);
                        return { startPage: start, endPage: end };
                    });
                    const segmentImages = [];
                    for (let i = 0; i < ranges.length; i++) {
                        try {
                            const imgBuf = await (0, storageService_1.downloadStagedFile)(`archive_jobs/${jobId}/segment_${i}`);
                            segmentImages.push(imgBuf);
                        }
                        catch {
                            // fallback if some images are missing
                            segmentImages.push(Buffer.alloc(0));
                        }
                    }
                    console.log(`[QUEUE-SERVICE] Resuming job: ${jobId} (${job.filename})`);
                    this.processJob(jobId, fileBuffer, job.filename.endsWith('.zip') ? 'application/zip' : 'application/pdf', ranges, segmentImages, job.volumeNo, job.issueNumber, job.monthYear, job.issn);
                }
                catch (err) {
                    console.error(`[QUEUE-SERVICE] Failed to resume job ${jobId}:`, err);
                    await (0, firestoreService_1.updateJobStatus)(jobId, 'failed', { errors: [`Resumption failed: ${err.message}`] });
                }
            }
        }
        catch (err) {
            console.error('[QUEUE-SERVICE] Error scanning jobs for resumption:', err);
        }
    }
}
exports.QueueService = QueueService;
// Helper functions for filename checks
function filenameOfJob(jobId) {
    return 'journal.pdf';
}
function filenameEndsWith(filename, ext) {
    return filename.endsWith(ext);
}
exports.queueService = new QueueService();
