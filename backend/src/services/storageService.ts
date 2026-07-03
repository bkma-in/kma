import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/r2';
import { config } from '../config/env';
import crypto from 'crypto';

/**
 * Uploads a PDF buffer to Cloudflare R2 bucket.
 * @param fileBuffer The buffer containing the PDF file.
 * @param originalName The original filename of the PDF.
 * @param authorId The ID of the author uploading the article.
 * @returns The object key of the uploaded PDF.
 */
export const uploadPdfToR2 = async (fileBuffer: Buffer, originalName: string, authorId: string, mimeType?: string): Promise<string> => {
  // Runtime credential validation
  if (!config.r2.accountId || !config.r2.accessKeyId || !config.r2.secretAccessKey || !config.r2.bucketName) {
    console.error('[STORAGE-SERVICE] Missing Cloudflare R2 configuration.');
    throw new Error('Cloudflare R2 is not configured properly on the server.');
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    console.error('[STORAGE-SERVICE] Upload failed: Invalid or empty file buffer.');
    throw new Error('Invalid file: File buffer is empty.');
  }

  const extension = originalName.split('.').pop() || 'pdf';
  const randomString = crypto.randomBytes(8).toString('hex');
  const filename = `articles/${authorId}/${Date.now()}-${randomString}.${extension}`;

  console.log(`[STORAGE-SERVICE] Upload started: "${originalName}" as key: "${filename}" (${fileBuffer.length} bytes)`);

  try {
    const command = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: filename,
      Body: fileBuffer,
      ContentType: mimeType || 'application/pdf',
      Metadata: {
        originalName: originalName,
        authorId: authorId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);
    console.log(`[STORAGE-SERVICE] Upload completed: "${filename}"`);
    return filename;
  } catch (error: any) {
    console.error(`[STORAGE-SERVICE] Upload failed for "${filename}": ${error.message || error}`);
    throw new Error(`R2 upload failure: ${error.message || error}`);
  }
};

/**
 * Generates a presigned URL valid for downloading the PDF from R2.
 * @param objectKey The key of the PDF object in R2.
 * @param originalName Optional original filename to preserve on download.
 * @returns A promise resolving to the presigned download URL.
 */
export const getSignedPdfUrl = async (objectKey: string, originalName?: string): Promise<string> => {
  if (!config.r2.accountId || !config.r2.accessKeyId || !config.r2.secretAccessKey || !config.r2.bucketName) {
    console.error('[STORAGE-SERVICE] Missing Cloudflare R2 configuration.');
    throw new Error('Cloudflare R2 is not configured properly on the server.');
  }

  if (!objectKey) {
    console.error('[STORAGE-SERVICE] GetSignedPdfUrl failed: Object key is missing.');
    throw new Error('Object key is required to generate download URL.');
  }

  console.log(`[STORAGE-SERVICE] Download requested: "${objectKey}" (originalName: "${originalName || 'none'}")`);

  try {
    const command = new GetObjectCommand({
      Bucket: config.r2.bucketName,
      Key: objectKey,
      ...(originalName ? { ResponseContentDisposition: `inline; filename="${originalName.replace(/"/g, '\\"')}"` } : {})
    });

    // Signed URL valid for 1 hour (3600 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error: any) {
    console.error(`[STORAGE-SERVICE] Download failed for key "${objectKey}": ${error.message || error}`);
    throw new Error(`R2 signed URL generation failure: ${error.message || error}`);
  }
};

/**
 * Deletes a PDF file from Cloudflare R2.
 * @param objectKey The key of the PDF object in R2.
 */
export const deletePdfFromR2 = async (objectKey: string): Promise<void> => {
  if (!config.r2.accountId || !config.r2.accessKeyId || !config.r2.secretAccessKey || !config.r2.bucketName) {
    console.error('[STORAGE-SERVICE] Missing Cloudflare R2 configuration.');
    throw new Error('Cloudflare R2 is not configured properly on the server.');
  }

  if (!objectKey) {
    console.log('[STORAGE-SERVICE] Delete skipped: Empty object key.');
    return;
  }

  console.log(`[STORAGE-SERVICE] Deleting file: "${objectKey}"`);

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.r2.bucketName,
      Key: objectKey,
    });

    await s3Client.send(command);
    console.log(`[STORAGE-SERVICE] Delete completed: "${objectKey}"`);
  } catch (error: any) {
    console.error(`[STORAGE-SERVICE] Delete failed for key "${objectKey}": ${error.message || error}`);
    throw new Error(`R2 delete failure: ${error.message || error}`);
  }
};
