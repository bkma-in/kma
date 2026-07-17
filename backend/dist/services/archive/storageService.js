"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadStagedFile = exports.uploadStagedFile = exports.uploadSplitArticle = exports.uploadOriginalJournal = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const r2_1 = require("../../config/r2");
const env_1 = require("../../config/env");
/**
 * Uploads the original un-split journal PDF to Cloudflare R2 bucket.
 * Key structure: issues/volume_X/issue_Y/original.pdf (or original filename)
 */
const uploadOriginalJournal = async (fileBuffer, originalName, volumeNo, issueNumber) => {
    const fileKey = `issues/volume_${volumeNo}/issue_${issueNumber}/${originalName}`;
    console.log(`[ARCHIVE-STORAGE] Uploading original journal as key: ${fileKey}`);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: env_1.config.r2.bucketName,
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
    await r2_1.s3Client.send(command);
    return fileKey;
};
exports.uploadOriginalJournal = uploadOriginalJournal;
/**
 * Uploads a split article PDF to R2.
 * Key structure: issues/volume_X/issue_Y/articles/articleId.pdf
 */
const uploadSplitArticle = async (fileBuffer, articleId, volumeNo, issueNumber) => {
    const fileKey = `issues/volume_${volumeNo}/issue_${issueNumber}/articles/${articleId}.pdf`;
    console.log(`[ARCHIVE-STORAGE] Uploading split article as key: ${fileKey}`);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: env_1.config.r2.bucketName,
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
    await r2_1.s3Client.send(command);
    return fileKey;
};
exports.uploadSplitArticle = uploadSplitArticle;
/**
 * Uploads raw files temporarily to R2 staging for background job restart support.
 * Key structure: archive_jobs/jobId/original.bin
 */
const uploadStagedFile = async (fileBuffer, jobId, mimeType = 'application/pdf') => {
    const fileKey = `archive_jobs/${jobId}/original.bin`;
    console.log(`[ARCHIVE-STORAGE] Uploading staging file for job ${jobId}`);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: env_1.config.r2.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType
    });
    await r2_1.s3Client.send(command);
    return fileKey;
};
exports.uploadStagedFile = uploadStagedFile;
/**
 * Downloads a staged file buffer from R2 to resume aborted processing.
 */
const downloadStagedFile = async (fileKey) => {
    console.log(`[ARCHIVE-STORAGE] Fetching staging buffer for key: ${fileKey}`);
    const command = new client_s3_1.GetObjectCommand({
        Bucket: env_1.config.r2.bucketName,
        Key: fileKey
    });
    const response = await r2_1.s3Client.send(command);
    if (!response.Body) {
        throw new Error(`Failed to download staged file: response body empty.`);
    }
    const chunks = [];
    const stream = response.Body;
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
};
exports.downloadStagedFile = downloadStagedFile;
