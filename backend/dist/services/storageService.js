"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePdfFromR2 = exports.getPdfStreamFromR2 = exports.getSignedPdfUrl = exports.uploadPdfToR2 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const r2_1 = require("../config/r2");
const env_1 = require("../config/env");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Uploads a PDF buffer to Cloudflare R2 bucket.
 * @param fileBuffer The buffer containing the PDF file.
 * @param originalName The original filename of the PDF.
 * @param authorId The ID of the author uploading the article.
 * @returns The object key of the uploaded PDF.
 */
const uploadPdfToR2 = async (fileBuffer, originalName, authorId, mimeType) => {
    // Runtime credential validation
    if (!env_1.config.r2.accountId || !env_1.config.r2.accessKeyId || !env_1.config.r2.secretAccessKey || !env_1.config.r2.bucketName) {
        console.error('[STORAGE-SERVICE] Missing Cloudflare R2 configuration.');
        throw new Error('Cloudflare R2 is not configured properly on the server.');
    }
    if (!fileBuffer || fileBuffer.length === 0) {
        console.error('[STORAGE-SERVICE] Upload failed: Invalid or empty file buffer.');
        throw new Error('Invalid file: File buffer is empty.');
    }
    const extension = originalName.split('.').pop() || 'pdf';
    const randomString = crypto_1.default.randomBytes(8).toString('hex');
    const filename = `articles/${authorId}/${Date.now()}-${randomString}.${extension}`;
    console.log(`[STORAGE-SERVICE] Upload started: "${originalName}" as key: "${filename}" (${fileBuffer.length} bytes)`);
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: env_1.config.r2.bucketName,
            Key: filename,
            Body: fileBuffer,
            ContentType: mimeType || 'application/pdf',
            Metadata: {
                originalName: originalName,
                authorId: authorId,
                uploadedAt: new Date().toISOString(),
            },
        });
        await r2_1.s3Client.send(command);
        console.log(`[STORAGE-SERVICE] Upload completed: "${filename}"`);
        return filename;
    }
    catch (error) {
        console.error(`[STORAGE-SERVICE] Upload failed for "${filename}": ${error.message || error}`);
        throw new Error(`R2 upload failure: ${error.message || error}`);
    }
};
exports.uploadPdfToR2 = uploadPdfToR2;
/**
 * Generates a presigned URL valid for downloading the PDF from R2.
 * @param objectKey The key of the PDF object in R2.
 * @param originalName Optional original filename to preserve on download.
 * @returns A promise resolving to the presigned download URL.
 */
const getSignedPdfUrl = async (objectKey, originalName) => {
    if (!env_1.config.r2.accountId || !env_1.config.r2.accessKeyId || !env_1.config.r2.secretAccessKey || !env_1.config.r2.bucketName) {
        console.error('[STORAGE-SERVICE] Missing Cloudflare R2 configuration.');
        throw new Error('Cloudflare R2 is not configured properly on the server.');
    }
    if (!objectKey) {
        console.error('[STORAGE-SERVICE] GetSignedPdfUrl failed: Object key is missing.');
        throw new Error('Object key is required to generate download URL.');
    }
    console.log(`[STORAGE-SERVICE] Download requested: "${objectKey}" (originalName: "${originalName || 'none'}")`);
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: env_1.config.r2.bucketName,
            Key: objectKey,
            ...(originalName ? { ResponseContentDisposition: `inline; filename="${originalName.replace(/"/g, '\\"')}"` } : {})
        });
        // Signed URL valid for 1 hour (3600 seconds)
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(r2_1.s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    }
    catch (error) {
        console.error(`[STORAGE-SERVICE] Download failed for key "${objectKey}": ${error.message || error}`);
        throw new Error(`R2 signed URL generation failure: ${error.message || error}`);
    }
};
exports.getSignedPdfUrl = getSignedPdfUrl;
/**
 * Returns a readable stream of a PDF file from R2.
 */
const getPdfStreamFromR2 = async (objectKey) => {
    if (!env_1.config.r2.accountId || !env_1.config.r2.accessKeyId || !env_1.config.r2.secretAccessKey || !env_1.config.r2.bucketName) {
        console.error('[STORAGE-SERVICE] Missing Cloudflare R2 configuration.');
        throw new Error('Cloudflare R2 is not configured properly on the server.');
    }
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: env_1.config.r2.bucketName,
            Key: objectKey,
        });
        const s3Response = await r2_1.s3Client.send(command);
        return s3Response.Body;
    }
    catch (error) {
        console.error(`[STORAGE-SERVICE] Stream failed for key "${objectKey}": ${error.message || error}`);
        throw new Error(`R2 stream failure: ${error.message || error}`);
    }
};
exports.getPdfStreamFromR2 = getPdfStreamFromR2;
/**
 * Deletes a PDF file from Cloudflare R2.
 * @param objectKey The key of the PDF object in R2.
 */
const deletePdfFromR2 = async (objectKey) => {
    if (!env_1.config.r2.accountId || !env_1.config.r2.accessKeyId || !env_1.config.r2.secretAccessKey || !env_1.config.r2.bucketName) {
        console.error('[STORAGE-SERVICE] Missing Cloudflare R2 configuration.');
        throw new Error('Cloudflare R2 is not configured properly on the server.');
    }
    if (!objectKey) {
        console.log('[STORAGE-SERVICE] Delete skipped: Empty object key.');
        return;
    }
    console.log(`[STORAGE-SERVICE] Deleting file: "${objectKey}"`);
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: env_1.config.r2.bucketName,
            Key: objectKey,
        });
        await r2_1.s3Client.send(command);
        console.log(`[STORAGE-SERVICE] Delete completed: "${objectKey}"`);
    }
    catch (error) {
        console.error(`[STORAGE-SERVICE] Delete failed for key "${objectKey}": ${error.message || error}`);
        throw new Error(`R2 delete failure: ${error.message || error}`);
    }
};
exports.deletePdfFromR2 = deletePdfFromR2;
