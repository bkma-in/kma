"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
cloudinary_1.v2.config({
    cloud_name: env_1.config.cloudinary.cloudName,
    api_key: env_1.config.cloudinary.apiKey,
    api_secret: env_1.config.cloudinary.apiSecret,
});
const uploadImage = (fileBuffer, folder = 'general') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: `kma/${folder}`,
            resource_type: 'auto',
        }, (error, result) => {
            if (error)
                return reject(error);
            if (!result)
                return reject(new Error('Cloudinary upload failed with no result'));
            resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
            });
        });
        uploadStream.end(fileBuffer);
    });
};
exports.uploadImage = uploadImage;
const deleteImage = async (publicId) => {
    try {
        if (!publicId)
            return;
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        if (result.result !== 'ok' && result.result !== 'not found') {
            console.warn(`Cloudinary delete warning for ${publicId}:`, result);
        }
    }
    catch (error) {
        console.error('Cloudinary delete error:', error);
        // We don't necessarily want to fail the whole request if deletion fails, 
        // but we log it.
    }
};
exports.deleteImage = deleteImage;
