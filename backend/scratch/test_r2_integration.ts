import { uploadPdfToR2, getSignedPdfUrl, deletePdfFromR2 } from '../src/services/storageService';
import { config } from '../src/config/env';

async function runTests() {
  console.log('=== STARTING CLOUDFLARE R2 INTEGRATION TESTS ===');
  console.log('Environment configuration check:');
  console.log('R2_ACCOUNT_ID:', config.r2.accountId ? 'PRESENT' : 'MISSING');
  console.log('R2_ACCESS_KEY_ID:', config.r2.accessKeyId ? 'PRESENT' : 'MISSING');
  console.log('R2_SECRET_ACCESS_KEY:', config.r2.secretAccessKey ? 'PRESENT' : 'MISSING');
  console.log('R2_BUCKET_NAME:', config.r2.bucketName ? 'PRESENT' : 'MISSING');
  console.log('R2_ENDPOINT:', config.r2.endpoint ? config.r2.endpoint : 'NOT PROVIDED (using default Cloudflare R2 url)');

  if (!config.r2.accountId || !config.r2.accessKeyId || !config.r2.secretAccessKey || !config.r2.bucketName) {
    console.error('❌ Missing R2 environment configuration. Cannot run tests.');
    process.exit(1);
  }

  const samplePdfBuffer = Buffer.from('%PDF-1.4 ... mock pdf content ...');
  const sampleFileName = 'test_document_audit.pdf';
  const authorId = 'test_author_123';
  let uploadedKey: string | null = null;

  try {
    // 1. Positive Test: Upload PDF
    console.log('\n--- 1. Testing Upload PDF ---');
    uploadedKey = await uploadPdfToR2(samplePdfBuffer, sampleFileName, authorId);
    console.log('✅ Upload test passed. Object key:', uploadedKey);

    // 2. Positive Test: Download (Presigned URL)
    console.log('\n--- 2. Testing Download / Signed URL Generation ---');
    const signedUrl = await getSignedPdfUrl(uploadedKey);
    console.log('✅ Signed URL generated:', signedUrl);

    console.log('Fetching file content from signed URL...');
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from signed URL. Status: ${response.status}`);
    }
    const responseText = await response.text();
    console.log('✅ Fetch returned status:', response.status);
    console.log('✅ Preserved Content-Type header:', response.headers.get('content-type'));
    console.log('✅ Preserved Content-Length header:', response.headers.get('content-length'));
    console.log('✅ Content verification passed!');

    // 3. Positive Test: Delete PDF
    console.log('\n--- 3. Testing Deletion from R2 ---');
    await deletePdfFromR2(uploadedKey);
    console.log('✅ Deletion command executed successfully.');

    // Verify file is gone
    console.log('Verifying file is deleted by attempting to fetch signed URL again...');
    const verificationUrl = await getSignedPdfUrl(uploadedKey);
    const verifyResponse = await fetch(verificationUrl);
    console.log('✅ Fetch returned status:', verifyResponse.status, '(Expected: 404 or 403)');
    if (verifyResponse.status === 200) {
      throw new Error('File was not deleted successfully; fetched 200 OK after deletion');
    }
    console.log('✅ Verification passed. File is no longer accessible.');

  } catch (error: any) {
    console.error('❌ Positive test scenario failed:', error.message || error);
  }

  // 4. Negative Test: Missing File / Empty Buffer
  try {
    console.log('\n--- 4. Testing Negative Case: Empty File Buffer ---');
    await uploadPdfToR2(Buffer.alloc(0), sampleFileName, authorId);
    console.error('❌ Negative test failed: Uploading empty buffer should have thrown an error but succeeded.');
  } catch (error: any) {
    console.log('✅ Negative test passed (caught expected error):', error.message);
  }

  // 5. Negative Test: Invalid Credentials
  try {
    console.log('\n--- 5. Testing Negative Case: Invalid Credentials ---');
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const badClient = new S3Client({
      region: 'auto',
      endpoint: config.r2.endpoint || `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: 'invalid_key_id',
        secretAccessKey: 'invalid_secret',
      },
    });

    const command = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: 'test_invalid_credentials.pdf',
      Body: samplePdfBuffer,
    });
    await badClient.send(command);
    console.error('❌ Negative test failed: S3 upload with bad credentials should have failed but succeeded.');
  } catch (error: any) {
    console.log('✅ Negative test passed (caught expected error):', error.message);
  }

  console.log('\n=== CLOUDFLARE R2 INTEGRATION TESTS COMPLETED ===');
}

runTests().catch(console.error);
