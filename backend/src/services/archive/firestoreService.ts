import { db } from '../../config/firebase';

export interface ArchiveJob {
  jobId: string;
  status: 'queued' | 'processing' | 'ocr_running' | 'metadata_extraction' | 'validating' | 'ready_for_review' | 'completed' | 'failed';
  filename: string;
  fileKey: string;
  volumeNo: string;
  issueNumber: string;
  monthYear: string;
  issn: string;
  startedAt: Date;
  completedAt: Date | null;
  processingTimeMs: number;
  importedCount: number;
  failedCount: number;
  ocrConfidenceAverage: number;
  errors: string[];
  warnings: string[];
  articles: any[];
}

/**
 * Creates a pending job log inside the archive_jobs collection.
 */
export const createJob = async (jobData: Partial<ArchiveJob>): Promise<string> => {
  const jobId = jobData.jobId || db.collection('archive_jobs').doc().id;
  console.log(`[ARCHIVE-FIRESTORE] Creating job log: ${jobId}`);

  const newJob: ArchiveJob = {
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

  await db.collection('archive_jobs').doc(jobId).set(newJob);
  return jobId;
};

/**
 * Updates status and metadata on an archive job.
 */
export const updateJobStatus = async (
  jobId: string,
  status: ArchiveJob['status'],
  extraData: Partial<ArchiveJob> = {}
): Promise<void> => {
  console.log(`[ARCHIVE-FIRESTORE] Job ${jobId} status update: ${status}`);
  const updatePayload: any = {
    status,
    ...extraData
  };
  
  if (status === 'completed' || status === 'failed') {
    updatePayload.completedAt = new Date();
  }

  await db.collection('archive_jobs').doc(jobId).update(updatePayload);
};

/**
 * Adds an error or warning log to the job execution record.
 */
export const addJobLog = async (
  jobId: string,
  type: 'error' | 'warning',
  message: string
): Promise<void> => {
  const jobRef = db.collection('archive_jobs').doc(jobId);
  const docSnap = await jobRef.get();
  
  if (!docSnap.exists) return;
  const data = docSnap.data() as ArchiveJob;

  if (type === 'error') {
    const errors = [...(data.errors || []), message];
    await jobRef.update({ errors });
  } else {
    const warnings = [...(data.warnings || []), message];
    await jobRef.update({ warnings });
  }
};

/**
 * Helper to build the searchText field to keep the landing page search efficient.
 */
export const generateSearchTextField = (
  title: string,
  authors: any[],
  abstract: string,
  keywords: string[],
  subjectClassification: string
): string => {
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

/**
 * Commits a list of verified articles to the main articles collection.
 * Reuses KMA articles schema, sets status to 'accepted', and updates the archive job status.
 */
export const publishArchiveArticles = async (
  jobId: string,
  verifiedArticles: any[],
  volumeNo: string,
  issueNumber: string
): Promise<void> => {
  const batch = db.batch();

  for (const art of verifiedArticles) {
    const articleRef = db.collection('articles').doc();
    
    // Map verified values and compute search index
    const searchText = generateSearchTextField(
      art.title,
      art.authors,
      art.abstract,
      art.keywords,
      art.subjectClassification
    );

    const articleDoc = {
      articleId: articleRef.id,
      title: art.title,
      abstract: art.abstract,
      authors: art.authors.map((a: any) => ({
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
  const jobRef = db.collection('archive_jobs').doc(jobId);
  batch.update(jobRef, {
    status: 'completed',
    completedAt: new Date()
  });

  await batch.commit();
  console.log(`[ARCHIVE-FIRESTORE] Batch publish finished. Job ${jobId} set to completed.`);
};
