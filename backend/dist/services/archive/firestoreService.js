"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishArchiveArticles = exports.generateSearchTextField = exports.addJobLog = exports.updateJobStatus = exports.createJob = void 0;
const firebase_1 = require("../../config/firebase");
/**
 * Creates a pending job log inside the archive_jobs collection.
 */
const createJob = async (jobData) => {
    const jobId = jobData.jobId || firebase_1.db.collection('archive_jobs').doc().id;
    console.log(`[ARCHIVE-FIRESTORE] Creating job log: ${jobId}`);
    const newJob = {
        jobId,
        status: 'queued',
        filename: jobData.filename || 'unknown.pdf',
        fileKey: jobData.fileKey || '',
        volumeNo: jobData.volumeNo || '',
        issueNumber: jobData.issueNumber || '',
        monthYear: jobData.monthYear || '',
        issn: jobData.issn || '0973-2721',
        startedAt: new Date(),
        completedAt: null,
        processingTimeMs: 0,
        importedCount: 0,
        failedCount: 0,
        ocrConfidenceAverage: 0,
        errors: [],
        warnings: [],
        articles: [],
        ...jobData
    };
    await firebase_1.db.collection('archive_jobs').doc(jobId).set(newJob);
    return jobId;
};
exports.createJob = createJob;
/**
 * Updates status and metadata on an archive job.
 */
const updateJobStatus = async (jobId, status, extraData = {}) => {
    console.log(`[ARCHIVE-FIRESTORE] Job ${jobId} status update: ${status}`);
    const updatePayload = {
        status,
        ...extraData
    };
    if (status === 'completed' || status === 'failed') {
        updatePayload.completedAt = new Date();
    }
    await firebase_1.db.collection('archive_jobs').doc(jobId).update(updatePayload);
};
exports.updateJobStatus = updateJobStatus;
/**
 * Adds an error or warning log to the job execution record.
 */
const addJobLog = async (jobId, type, message) => {
    const jobRef = firebase_1.db.collection('archive_jobs').doc(jobId);
    const docSnap = await jobRef.get();
    if (!docSnap.exists)
        return;
    const data = docSnap.data();
    if (type === 'error') {
        const errors = [...(data.errors || []), message];
        await jobRef.update({ errors });
    }
    else {
        const warnings = [...(data.warnings || []), message];
        await jobRef.update({ warnings });
    }
};
exports.addJobLog = addJobLog;
/**
 * Helper to build the searchText field to keep the landing page search efficient.
 */
const generateSearchTextField = (title, authors, abstract, keywords, subjectClassification) => {
    const authorNames = authors.map(a => a.name).join(' ');
    const keywordsStr = keywords.join(' ');
    return [
        title,
        authorNames,
        abstract,
        keywordsStr,
        subjectClassification
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
};
exports.generateSearchTextField = generateSearchTextField;
/**
 * Commits a list of verified articles to the main articles collection.
 * Reuses KMA articles schema, sets status to 'accepted', and updates the archive job status.
 */
const publishArchiveArticles = async (jobId, verifiedArticles, volumeNo, issueNumber) => {
    const batch = firebase_1.db.batch();
    for (const art of verifiedArticles) {
        const articleRef = firebase_1.db.collection('articles').doc();
        // Map verified values and compute search index
        const searchText = (0, exports.generateSearchTextField)(art.title, art.authors, art.abstract, art.keywords, art.subjectClassification);
        const articleDoc = {
            articleId: articleRef.id,
            title: art.title,
            abstract: art.abstract,
            authors: art.authors.map((a) => ({
                userId: a.userId || 'admin_ingested',
                name: a.name,
                email: a.email || '',
                affiliation: a.affiliation || '',
                role: 'author'
            })),
            keywords: art.keywords,
            subjectClassification: art.subjectClassification,
            pdfUrl: art.pdfKey,
            pdfName: art.pdfName || 'article.pdf',
            status: 'accepted', // Enter 'Ready to Publish' KMA state
            isOld: true,
            // Archive double versioning fields
            ocrTitle: art.ocrTitle || art.title,
            ocrAbstract: art.ocrAbstract || art.abstract,
            ocrAuthors: art.ocrAuthors || art.authors,
            ocrKeywords: art.ocrKeywords || art.keywords,
            ocrSubjectClassification: art.ocrSubjectClassification || art.subjectClassification,
            ocrPageRange: art.ocrPageRange || art.pageRange,
            pageRange: art.pageRange,
            // Search field
            searchText,
            // Existing metadata linkages
            reviewerId: null,
            issueId: null, // assigned during bulk publish
            createdAt: new Date(),
            updatedAt: new Date()
        };
        batch.set(articleRef, articleDoc);
    }
    // Update job status to completed
    const jobRef = firebase_1.db.collection('archive_jobs').doc(jobId);
    batch.update(jobRef, {
        status: 'completed',
        completedAt: new Date()
    });
    await batch.commit();
    console.log(`[ARCHIVE-FIRESTORE] Batch publish finished. Job ${jobId} set to completed.`);
};
exports.publishArchiveArticles = publishArchiveArticles;
