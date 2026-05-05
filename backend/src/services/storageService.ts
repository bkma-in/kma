import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/r2';
import { config } from '../config/env';
import crypto from 'crypto';

export const uploadPdfToR2 = async (fileBuffer: Buffer, originalName: string, authorId: string): Promise<string> => {
  const extension = originalName.split('.').pop() || 'pdf';
  const randomString = crypto.randomBytes(8).toString('hex');
  const filename = `articles/${authorId}/${Date.now()}-${randomString}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: filename,
    Body: fileBuffer,
    ContentType: 'application/pdf',
  });

  await s3Client.send(command);
  
  // Return the object key, not the public URL, because we will generate signed URLs
  return filename;
};

export const getSignedPdfUrl = async (objectKey: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: config.r2.bucketName,
    Key: objectKey,
  });

  // URL valid for 1 hour
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
