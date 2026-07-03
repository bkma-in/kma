import { db } from '../src/config/firebase';
import { uploadPdfToR2, getSignedPdfUrl, deletePdfFromR2 } from '../src/services/storageService';
import { config } from '../src/config/env';

async function runReviewerUploadTest() {
  console.log('=== STARTING REVIEWER FILE UPLOAD & PRESERVATION TESTS ===');

  // 1. Fetch a real reviewer from DB
  const reviewerSnapshot = await db.collection('users').where('role', '==', 'reviewer').limit(1).get();
  if (reviewerSnapshot.empty) {
    console.error('❌ Need at least 1 reviewer user in the database to run the test.');
    process.exit(1);
  }
  const reviewer = reviewerSnapshot.docs[0].data();
  const reviewerUid = reviewer.uid;
  console.log(`Reviewer: ${reviewer.name} (${reviewerUid})`);

  // 2. Fetch or create a temporary article doc in Firestore
  const articleRef = db.collection('articles').doc();
  const articleId = articleRef.id;

  const mockFileContent = Buffer.from('%PDF-1.4 ... mock reviewer assessment remarks ...');
  const mockFileName = 'reviewer_detailed_remarks_report.pdf';

  let uploadedFileKey = '';

  try {
    // 3. Simulate upload to R2
    console.log('\n--- 1. Simulating Reviewer PDF Upload to R2 ---');
    uploadedFileKey = await uploadPdfToR2(mockFileContent, mockFileName, reviewerUid, 'application/pdf');
    console.log('✅ Uploaded file key:', uploadedFileKey);

    // 4. Update the DB record with reviews map
    console.log('\n--- 2. Simulating DB Status Update (reviews map entry) ---');
    await articleRef.set({
      articleId,
      title: 'Auditing R2 Storage Layer Security and Performance',
      abstract: 'Testing file attachment upload from peer reviewers.',
      authorId: 'test_author_123',
      status: 'under_review',
      reviewerIds: [reviewerUid],
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: {
        [reviewerUid]: {
          remarks: 'Good paper, but need layout updates.',
          recommendation: 'Needs Improvement',
          reviewedFile: uploadedFileKey,
          reviewedFileName: mockFileName,
          reviewerName: reviewer.name,
          updatedAt: new Date()
        }
      }
    });
    console.log('✅ Successfully wrote reviews map entry to Firestore.');

    // Verify DB contents
    const freshDoc = await articleRef.get();
    const freshData = freshDoc.data()!;
    const reviewerReview = freshData.reviews[reviewerUid];
    console.log('✅ Verified Firestore record:');
    console.log('- reviewedFile:', reviewerReview.reviewedFile);
    console.log('- reviewedFileName:', reviewerReview.reviewedFileName);

    if (reviewerReview.reviewedFile !== uploadedFileKey || reviewerReview.reviewedFileName !== mockFileName) {
      throw new Error('Firestore record values mismatch!');
    }

    // 5. Generate and test signed URL download with filename preservation
    console.log('\n--- 3. Testing Download / Signed URL Generation with Name Preservation ---');
    // Simulate routes key validation
    let keyValid = false;
    let preservedName = '';
    if (freshData.reviews) {
      const match = Object.values(freshData.reviews).find((r: any) => r.reviewedFile === uploadedFileKey) as any;
      if (match) {
        keyValid = true;
        preservedName = match.reviewedFileName;
      }
    }

    console.log(`Security key check passed? ${keyValid}`);
    console.log(`Preserved filename to request: "${preservedName}"`);

    if (!keyValid || preservedName !== mockFileName) {
      throw new Error('Key validation failed during URL generation simulation');
    }

    const signedUrl = await getSignedPdfUrl(uploadedFileKey, preservedName);
    console.log('✅ Generated signed URL:', signedUrl);

    console.log('Fetching file content from signed URL...');
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch reviewer file from signed URL. Status: ${response.status}`);
    }

    const contentLen = response.headers.get('content-length');
    const contentDisp = response.headers.get('content-disposition');
    const contentType = response.headers.get('content-type');

    console.log('✅ Fetch returned status:', response.status);
    console.log('✅ Response Content-Type:', contentType);
    console.log('✅ Response Content-Length:', contentLen);
    console.log('✅ Response Content-Disposition:', contentDisp);

    // Verify filename is inside content disposition
    if (!contentDisp || !contentDisp.includes(mockFileName)) {
      throw new Error(`Filename not preserved in Content-Disposition! Received: ${contentDisp}`);
    }
    console.log('✅ Filename preservation verification passed!');

  } catch (err: any) {
    console.error('❌ Integration test failed:', err.message || err);
  } finally {
    // 6. Cleanup
    console.log('\n--- 4. Cleanup Temp Data ---');
    if (articleId) {
      await articleRef.delete();
      console.log('Deleted Firestore test article doc.');
    }
    if (uploadedFileKey) {
      await deletePdfFromR2(uploadedFileKey);
      console.log('Deleted R2 assessment attachment.');
    }
  }

  console.log('\n=== REVIEWER FILE UPLOAD TESTS COMPLETED ===');
}

runReviewerUploadTest().catch(console.error);
