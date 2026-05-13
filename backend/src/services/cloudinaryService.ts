import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
}

export const uploadImage = (
  fileBuffer: Buffer,
  folder: string = 'general'
): Promise<CloudinaryResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `kma/${folder}`,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload failed with no result'));
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      console.warn(`Cloudinary delete warning for ${publicId}:`, result);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // We don't necessarily want to fail the whole request if deletion fails, 
    // but we log it.
  }
};
