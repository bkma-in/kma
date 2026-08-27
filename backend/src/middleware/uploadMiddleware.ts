import multer from 'multer';

// Use memory storage so we can upload directly to cloud without writing to local disk
const storage = multer.memoryStorage();

export const upload = multer({
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
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and WEBP are allowed.'));
    }
  }
});

export const spreadsheetUpload = multer({
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
    } else {
      cb(new Error('Invalid file type. Only CSV, XLSX, and XLS spreadsheet files are allowed.'));
    }
  }
});
