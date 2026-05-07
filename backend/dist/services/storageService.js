"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedPdfUrl = exports.uploadPdfToR2 = void 0;
const crypto_1 = __importDefault(require("crypto"));
const uploadPdfToR2 = async (fileBuffer, originalName, authorId) => {
    const extension = originalName.split('.').pop() || 'pdf';
    const randomString = crypto_1.default.randomBytes(8).toString('hex');
    const filename = `articles/${authorId}/${Date.now()}-${randomString}.${extension}`;
    console.log(`[MOCK R2] Uploading ${originalName} as ${filename} (Size: ${fileBuffer.length} bytes)`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return filename;
};
exports.uploadPdfToR2 = uploadPdfToR2;
const getSignedPdfUrl = async (objectKey) => {
    console.log(`[MOCK R2] Generating signed URL for ${objectKey}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    // Return a mock URL for testing
    return `https://mock-r2.local/${objectKey}?signature=mock_signature_valid_for_1_hour`;
};
exports.getSignedPdfUrl = getSignedPdfUrl;
