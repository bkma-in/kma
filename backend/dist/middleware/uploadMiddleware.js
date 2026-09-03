"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proofUpload = exports.spreadsheetUpload = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Use memory storage so we can upload directly to cloud without writing to local disk
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and WEBP are allowed.'));
        }
    }
});
exports.spreadsheetUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15 MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'application/octet-stream',
            'application/wps-office.xlsx',
            'application/x-excel'
        ];
        const fileName = (file.originalname || '').toLowerCase();
        const isSpreadsheetExt = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        if (allowedMimeTypes.includes(file.mimetype) || isSpreadsheetExt) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only CSV, XLSX, and XLS spreadsheet files are allowed.'));
        }
    }
});
exports.proofUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB strict limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const fileName = (file.originalname || '').toLowerCase();
        const hasAllowedExt = fileName.endsWith('.pdf') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');
        if (allowedMimeTypes.includes(file.mimetype) || hasAllowedExt) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF files under 5MB are allowed.'));
        }
    }
});
