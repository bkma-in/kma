"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveUpload = void 0;
const multer_1 = __importDefault(require("multer"));
// Use memory storage for fast upload processing and staging to R2
const storage = multer_1.default.memoryStorage();
/**
 * Custom multer configuration for Legacy Journal Digitization uploads.
 * Supports PDFs, ZIP archives, PNG, JPEG, and TIFF files up to 150MB.
 */
exports.archiveUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 150 * 1024 * 1024 // 150 MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/zip',
            'application/x-zip-compressed',
            'image/jpeg',
            'image/png',
            'image/tiff'
        ];
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const isAllowedExt = ['pdf', 'zip', 'png', 'jpg', 'jpeg', 'tiff', 'tif'].includes(extension || '');
        if (allowedMimeTypes.includes(file.mimetype) || isAllowedExt) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file format. Allowed types: PDF, ZIP, PNG, JPEG, TIFF'));
        }
    }
});
