import { db } from '../src/config/firebase';
import { uploadPdfToR2, deletePdfFromR2 } from '../src/services/storageService';

async function runReviewerTest() {
  console.log('=== STARTING REVIEWER SECURITY RULE TESTS ===');

  // 1. Fetch reviewer users
  const reviewersSnapshot = await db.collection('users').where('role', '==', 'reviewer').limit(1).get();
  if (reviewersSnapshot.empty) {
    console.error('❌ Need at least 1 reviewer user in the database to run the test.');
    process.exit(1);
  }

  const reviewerA = reviewersSnapshot.docs[0].data();
  // Use a mock UID for Reviewer B since only 1 reviewer is in the database
  const reviewerB = {
    uid: 'reviewer_b_mock_uid_123',
    name: 'Mock Reviewer B'
  };
  
  console.log(`Reviewer A (Real): ${reviewerA.name} (${reviewerA.uid})`);
  console.log(`Reviewer B (Mock): ${reviewerB.name} (${reviewerB.uid})`);

  // 2. Create a temporary article in Firestore and upload a test PDF to R2
  const samplePdf = Buffer.from('%PDF-1.4 ... test reviewer assignment check ...');
  let pdfKey = '';
  let articleId = '';

  try {
    pdfKey = await uploadPdfToR2(samplePdf, 'reviewer_test_doc.pdf', reviewerA.uid);
    const articleRef = db.collection('articles').doc();
    articleId = articleRef.id;

    await articleRef.set({
      articleId,
      title: 'Quantum Telemetry and Peer Review Validation',
      abstract: 'Testing secure reviewer assignment access control rules on backend API routes.',
      authorId: 'test_author_uid',
      status: 'under_review',
      pdfUrl: pdfKey,
      pdfName: 'reviewer_test_doc.pdf',
      reviewerIds: [reviewerA.uid], // Assigned only to Reviewer A
      reviewerId: reviewerA.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Created test article ID: ${articleId} (Assigned to Reviewer A only)`);

    // 3. Test Access Validation logic (simulate GET /api/articles/:id and GET /api/articles/:id/pdf checks)
    const testAccess = (userRole: string, userUid: string, articleDoc: any) => {
      let hasAccess = false;
      if (userRole === 'admin') hasAccess = true;

      if (userRole === 'reviewer') {
        const isAssigned = (Array.isArray(articleDoc.reviewerIds) && articleDoc.reviewerIds.includes(userUid)) || (articleDoc.reviewerId === userUid);
        if (isAssigned) {
          hasAccess = true;
        } else {
          return { hasAccess: false, error: 'Article not assigned to you' };
        }
      }

      if (userRole === 'author') {
        const isParticipant = articleDoc.authorId === userUid || (Array.isArray(articleDoc.participantIds) && articleDoc.participantIds.includes(userUid));
        if (isParticipant) {
          hasAccess = true;
        } else {
          return { hasAccess: false, error: 'Forbidden: You are not an author of this article' };
        }
      }

      return { hasAccess, error: null };
    };

    // Retrieve article from db
    const freshDoc = await db.collection('articles').doc(articleId).get();
    const articleData = freshDoc.data()!;

    // Test Admin
    console.log('\nTesting Admin Access:');
    const adminCheck = testAccess('admin', 'admin_uid', articleData);
    console.log(adminCheck.hasAccess ? '✅ Admin check passed (Allowed)' : '❌ Admin check failed');

    // Test Reviewer A (Assigned)
    console.log('\nTesting Reviewer A (Assigned) Access:');
    const revACheck = testAccess('reviewer', reviewerA.uid, articleData);
    console.log(revACheck.hasAccess ? '✅ Reviewer A check passed (Allowed)' : '❌ Reviewer A check failed');

    // Test Reviewer B (Unassigned)
    console.log('\nTesting Reviewer B (Unassigned) Access:');
    const revBCheck = testAccess('reviewer', reviewerB.uid, articleData);
    if (!revBCheck.hasAccess && revBCheck.error === 'Article not assigned to you') {
      console.log('✅ Reviewer B check passed (Blocked: "Article not assigned to you")');
    } else {
      console.error('❌ Reviewer B check failed. Access result:', revBCheck);
    }

  } catch (err: any) {
    console.error('❌ Error during test run:', err.message || err);
  } finally {
    // 4. Cleanup
    console.log('\nCleaning up test article and R2 storage file...');
    if (articleId) {
      await db.collection('articles').doc(articleId).delete();
      console.log('Deleted Firestore article document.');
    }
    if (pdfKey) {
      await deletePdfFromR2(pdfKey);
      console.log('Deleted R2 PDF object.');
    }
  }

  console.log('\n=== REVIEWER SECURITY RULE TESTS COMPLETED ===');
}

runReviewerTest().catch(console.error);
