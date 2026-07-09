import { db } from '../src/config/firebase';
import {
  sendArticleSubmittedNotifications,
  sendReviewerAssignedNotifications,
  sendRevisionRequestedNotifications,
  sendArticleRejectedNotifications
} from '../src/services/notificationService';

const runTest = async () => {
  console.log('--- START NOTIFICATION FLOW TEST ---');
  
  // 1. Create a dummy submitter, coauthor, reviewer, and admin
  const submitterId = 'test_submitter_' + Date.now();
  const coauthorId = 'test_coauthor_' + Date.now();
  const reviewerId = 'test_reviewer_' + Date.now();
  const adminId = 'test_admin_' + Date.now();
  const articleId = 'test_article_' + Date.now();

  console.log('Creating dummy users in DB...');
  await db.collection('users').doc(submitterId).set({
    uid: submitterId,
    name: 'Test Submitter',
    email: 'test_submitter@bkma.test',
    role: 'author'
  });

  await db.collection('users').doc(coauthorId).set({
    uid: coauthorId,
    name: 'Test Coauthor',
    email: 'test_coauthor@bkma.test',
    role: 'author'
  });

  await db.collection('users').doc(reviewerId).set({
    uid: reviewerId,
    name: 'Test Reviewer',
    email: 'test_reviewer@bkma.test',
    role: 'reviewer'
  });

  await db.collection('users').doc(adminId).set({
    uid: adminId,
    name: 'Test Admin',
    email: 'test_admin@bkma.test',
    role: 'admin'
  });

  console.log('Creating dummy article in DB...');
  await db.collection('articles').doc(articleId).set({
    articleId: articleId,
    title: 'Test Notification Article',
    abstract: 'This is a test article for notification and email flow.',
    authorId: submitterId,
    authors: [
      { userId: submitterId, name: 'Test Submitter', email: 'test_submitter@bkma.test', role: 'submitter', accepted: true },
      { userId: coauthorId, name: 'Test Coauthor', email: 'test_coauthor@bkma.test', role: 'coauthor', accepted: true }
    ],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Test 1: Submission
  console.log('\n--- 1. Testing Submission ---');
  await db.collection('articles').doc(articleId).update({ status: 'submitted' });
  await sendArticleSubmittedNotifications(articleId);

  // Test 2: Reviewer assignment
  console.log('\n--- 2. Testing Reviewer Assignment ---');
  await db.collection('articles').doc(articleId).update({
    reviewerIds: [reviewerId],
    status: 'under_review'
  });
  await sendReviewerAssignedNotifications(articleId, [reviewerId]);

  // Test 3: Revision Requested
  console.log('\n--- 3. Testing Revision Requested ---');
  await db.collection('articles').doc(articleId).update({ status: 'revision_requested' });
  await sendRevisionRequestedNotifications(articleId, 'Please rewrite the abstract and check Theorem 2.');

  // Test 4: Desk Rejection
  console.log('\n--- 4. Testing Rejection (Desk Rejected) ---');
  await db.collection('articles').doc(articleId).update({ status: 'desk_rejected' });
  await sendArticleRejectedNotifications(articleId, true, 'Out of scope for KMA.');

  // Verify created notifications
  console.log('\n--- VERIFYING NOTIFICATIONS IN FIRESTORE ---');
  const userIds = [submitterId, coauthorId, reviewerId, adminId];
  for (const userId of userIds) {
    const notifsSnapshot = await db.collection('notifications').where('userId', '==', userId).get();
    console.log(`User ${userId} notifications: ${notifsSnapshot.size}`);
    notifsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(` - [${data.type}] ${data.title}: ${data.message}`);
    });
  }

  // Cleanup
  console.log('\nCleaning up database documents...');
  await db.collection('users').doc(submitterId).delete();
  await db.collection('users').doc(coauthorId).delete();
  await db.collection('users').doc(reviewerId).delete();
  await db.collection('users').doc(adminId).delete();
  await db.collection('articles').doc(articleId).delete();

  // Delete notifications
  for (const userId of userIds) {
    const notifsSnapshot = await db.collection('notifications').where('userId', '==', userId).get();
    const batch = db.batch();
    notifsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  console.log('--- TEST COMPLETED SUCCESSFULLY ---');
  process.exit(0);
};

runTest().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
