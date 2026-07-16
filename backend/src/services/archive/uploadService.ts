import multer from 'multer';

// Use memory storage for fast upload processing and staging to R2
const storage = multer.memoryStorage();

/**
 * Custom multer configuration for Legacy Journal Digitization uploads.
 * Supports PDFs, ZIP archives, PNG, JPEG, and TIFF files up to 150MB.
 */
export const archiveUpload = multer({
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
    } else {
      cb(new Error('Invalid file format. Allowed types: PDF, ZIP, PNG, JPEG, TIFF'));
    }
  }
});
