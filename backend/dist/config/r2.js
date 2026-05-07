"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("./env");
exports.s3Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: `https://${env_1.config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env_1.config.r2.accessKeyId,
        secretAccessKey: env_1.config.r2.secretAccessKey,
    },
});
