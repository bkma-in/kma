import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../config/r2';
import { config } from '../../config/env';

/**
 * Uploads the original un-split journal PDF to Cloudflare R2 bucket.
 * Key structure: issues/volume_X/issue_Y/original.pdf (or original filename)
 */
export const uploadOriginalJournal = async (
  fileBuffer: Buffer,
  originalName: string,
  volumeNo: string,
  issueNumber: string
): Promise<string> => {
  const fileKey = `issues/volume_${volumeNo}/issue_${issueNumber}/${originalName}`;
  console.log(`[ARCHIVE-STORAGE] Uploading original journal as key: ${fileKey}`);

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: 'application/pdf',
    Metadata: {
      originalName,
      volumeNo,
      issueNumber,
      uploadedAt: new Date().toISOString()
    }
  });

  await s3Client.send(command);
  return fileKey;
};

/**
 * Uploads a split article PDF to R2.
 * Key structure: issues/volume_X/issue_Y/articles/articleId.pdf
 */
export const uploadSplitArticle = async (
  fileBuffer: Buffer,
  articleId: string,
  volumeNo: string,
  issueNumber: string
): Promise<string> => {
  const fileKey = `issues/volume_${volumeNo}/issue_${issueNumber}/articles/${articleId}.pdf`;
  console.log(`[ARCHIVE-STORAGE] Uploading split article as key: ${fileKey}`);

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: 'application/pdf',
    Metadata: {
      articleId,
      volumeNo,
      issueNumber,
      uploadedAt: new Date().toISOString()
    }
  });

  await s3Client.send(command);
  return fileKey;
};

/**
 * Uploads raw files temporarily to R2 staging for background job restart support.
 * Key structure: archive_jobs/jobId/original.bin
 */
export const uploadStagedFile = async (
  fileBuffer: Buffer,
  jobId: string,
  mimeType: string = 'application/pdf'
): Promise<string> => {
  const fileKey = `archive_jobs/${jobId}/original.bin`;
  console.log(`[ARCHIVE-STORAGE] Uploading staging file for job ${jobId}`);

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimeType
  });

  await s3Client.send(command);
  return fileKey;
};

/**
 * Downloads a staged file buffer from R2 to resume aborted processing.
 */
export const downloadStagedFile = async (fileKey: string): Promise<Buffer> => {
  console.log(`[ARCHIVE-STORAGE] Fetching staging buffer for key: ${fileKey}`);
  
  const command = new GetObjectCommand({
    Bucket: config.r2.bucketName,
    Key: fileKey
  });

  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error(`Failed to download staged file: response body empty.`);
  }

  const chunks: any[] = [];
  const stream = response.Body as any;
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};
