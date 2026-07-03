import { db } from '../src/config/firebase';
import { uploadPdfToR2, deletePdfFromR2, getSignedPdfUrl } from '../src/services/storageService';

async function runDeletionTest() {
  console.log('=== STARTING ARTICLE DELETION CLEANUP TESTS ===');

  const authorId = 'test_author_deletion_123';
  const articleRef = db.collection('articles').doc();
  const articleId = articleRef.id;

  console.log(`Created test article ID: ${articleId}`);

  let mainPdfKey = '';
  let revisionPdfKey = '';

  try {
    // 1. Upload mock files to R2
    console.log('\n--- 1. Uploading mock files to R2 ---');
    mainPdfKey = await uploadPdfToR2(Buffer.from('main file'), 'main_manuscript.pdf', authorId);
    revisionPdfKey = await uploadPdfToR2(Buffer.from('revision file'), 'rev_manuscript.pdf', authorId);

    console.log(`- Main PDF key: ${mainPdfKey}`);
    console.log(`- Revision PDF key: ${revisionPdfKey}`);

    // 2. Set Firestore article data
    console.log('\n--- 2. Setting article data in Firestore ---');
    await articleRef.set({
      articleId,
      title: 'Deletion Audit Test Article',
      abstract: 'Testing clean sweep of R2 objects, invitations, and notifications on deletion.',
      authorId,
      status: 'submitted',
      pdfUrl: mainPdfKey,
      pdfName: 'main_manuscript.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
      revisionHistory: [
        {
          version: 1,
          pdfUrl: revisionPdfKey,
          pdfName: 'rev_manuscript.pdf',
          replacedAt: new Date()
        }
      ]
    });

    // 3. Add an invitation in subcollection
    console.log('\n--- 3. Adding invitation subcollection document ---');
    const inviteRef = articleRef.collection('invitations').doc();
    await inviteRef.set({
      inviteId: inviteRef.id,
      inviteeEmail: 'coauthor@kma.org',
      status: 'pending',
      invitedAt: new Date()
    });

    // 4. Add a notification document
    console.log('\n--- 4. Adding notification referencing article ---');
    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      notificationId: notificationRef.id,
      userId: authorId,
      type: 'INVITATION_SENT',
      metadata: {
        articleId,
        inviteId: inviteRef.id
      },
      createdAt: new Date()
    });

    // Verify setup
    console.log('\n--- 5. Verifying setup before deletion ---');
    const artDoc = await articleRef.get();
    const invites = await articleRef.collection('invitations').get();
    const notifs = await db.collection('notifications').where('metadata.articleId', '==', articleId).get();

    console.log(`- Article exists? ${artDoc.exists}`);
    console.log(`- Invitations count: ${invites.size}`);
    console.log(`- Notifications count: ${notifs.size}`);

    if (!artDoc.exists || invites.size !== 1 || notifs.size !== 1) {
      throw new Error('Setup validation failed!');
    }

    // 5. Run the deletion logic (mirroring DELETE route)
    console.log('\n--- 6. Running deletion sweep logic ---');
    const article = artDoc.data()!;

    // A. Delete main PDF from R2
    if (article.pdfUrl) {
      console.log(`Deleting main PDF: ${article.pdfUrl}`);
      await deletePdfFromR2(article.pdfUrl);
    }

    // B. Delete revision PDFs from R2
    if (Array.isArray(article.revisionHistory)) {
      for (const rev of article.revisionHistory) {
        if (rev.pdfUrl) {
          console.log(`Deleting revision PDF: ${rev.pdfUrl}`);
          await deletePdfFromR2(rev.pdfUrl);
        }
      }
    }

    // C. Clean invitations subcollection
    const invitationsSnapshot = await articleRef.collection('invitations').get();
    if (!invitationsSnapshot.empty) {
      console.log(`Deleting ${invitationsSnapshot.size} invitation documents...`);
      const inviteBatch = db.batch();
      invitationsSnapshot.docs.forEach(inviteDoc => {
        inviteBatch.delete(inviteDoc.ref);
      });
      await inviteBatch.commit();
    }

    // D. Clean notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('metadata.articleId', '==', articleId)
      .get();
    if (!notificationsSnapshot.empty) {
      console.log(`Deleting ${notificationsSnapshot.size} notification documents...`);
      const notifBatch = db.batch();
      notificationsSnapshot.docs.forEach(notifDoc => {
        notifBatch.delete(notifDoc.ref);
      });
      await notifBatch.commit();
    }

    // E. Delete article doc
    await articleRef.delete();
    console.log('Deleted main Firestore article doc.');

    // 6. Post-Deletion Verification
    console.log('\n--- 7. Verifying Cleanup ---');
    const artDocPost = await articleRef.get();
    const invitesPost = await articleRef.collection('invitations').get();
    const notifsPost = await db.collection('notifications').where('metadata.articleId', '==', articleId).get();

    console.log(`- Article doc exists? ${artDocPost.exists} (Expected: false)`);
    console.log(`- Invitations remaining: ${invitesPost.size} (Expected: 0)`);
    console.log(`- Notifications remaining: ${notifsPost.size} (Expected: 0)`);

    // Verify R2 files are gone
    let mainPdfAccessError = false;
    try {
      const url = await getSignedPdfUrl(mainPdfKey);
      const res = await fetch(url);
      if (res.status === 404 || res.status === 403) mainPdfAccessError = true;
    } catch {
      mainPdfAccessError = true;
    }

    let revPdfAccessError = false;
    try {
      const url = await getSignedPdfUrl(revisionPdfKey);
      const res = await fetch(url);
      if (res.status === 404 || res.status === 403) revPdfAccessError = true;
    } catch {
      revPdfAccessError = true;
    }

    console.log(`- Main PDF R2 deleted verified? ${mainPdfAccessError}`);
    console.log(`- Revision PDF R2 deleted verified? ${revPdfAccessError}`);

    if (artDocPost.exists || invitesPost.size !== 0 || notifsPost.size !== 0 || !mainPdfAccessError || !revPdfAccessError) {
      throw new Error('Cleanup validation failed! Some records or files remain.');
    }
    console.log('\n✅ DELETION CLEANUP TEST PASSED SUCCESSFULLY!');

  } catch (err: any) {
    console.error('❌ Deletion test failed:', err.message || err);
  }

  console.log('\n=== ARTICLE DELETION CLEANUP TESTS COMPLETED ===');
}

runDeletionTest().catch(console.error);
