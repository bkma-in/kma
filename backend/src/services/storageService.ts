import crypto from 'crypto';

export const uploadPdfToR2 = async (fileBuffer: Buffer, originalName: string, authorId: string): Promise<string> => {
  const extension = originalName.split('.').pop() || 'pdf';
  const randomString = crypto.randomBytes(8).toString('hex');
  const filename = `articles/${authorId}/${Date.now()}-${randomString}.${extension}`;

  console.log(`[MOCK R2] Uploading ${originalName} as ${filename} (Size: ${fileBuffer.length} bytes)`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return filename;
};

export const getSignedPdfUrl = async (objectKey: string): Promise<string> => {
  console.log(`[MOCK R2] Generating signed URL for ${objectKey}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));

  // Return a mock URL for testing
  return `https://mock-r2.local/${objectKey}?signature=mock_signature_valid_for_1_hour`;
};

