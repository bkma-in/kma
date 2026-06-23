import * as admin from 'firebase-admin';
import { db } from '../src/config/firebase';
import { s3Client } from '../src/config/r2';
import { config } from '../src/config/env';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

async function clearCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  console.log(`Clearing collection "${collectionPath}" (${snapshot.size} documents)...`);

  let batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    // If it's articles, let's clean up invitations subcollection
    if (collectionPath === 'articles') {
      const invites = await doc.ref.collection('invitations').get();
      for (const invite of invites.docs) {
        batch.delete(invite.ref);
        count++;
        if (count >= 400) {
          await batch.commit();
          console.log(`Committed batch deletion of ${count} subcollection items.`);
          batch = db.batch();
          count = 0;
        }
      }
    }
    batch.delete(doc.ref);
    count++;

    // Commit batch if it reaches the limit
    if (count >= 400) {
      await batch.commit();
      console.log(`Committed batch deletion of ${count} items.`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Committed remaining deletions.`);
  }
}

async function purgeR2Bucket() {
  console.log(`Purging R2 Bucket: "${config.r2.bucketName}"...`);
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: config.r2.bucketName,
    });
    const listResult = await s3Client.send(listCommand);
    const contents = listResult.Contents || [];

    if (contents.length === 0) {
      console.log('R2 Bucket is already empty.');
      return;
    }

    console.log(`Found ${contents.length} objects to delete.`);
    const objectsToDelete = contents.map(obj => ({ Key: obj.Key }));

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: config.r2.bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });

    const deleteResult = await s3Client.send(deleteCommand);
    console.log(`Successfully deleted ${deleteResult.Deleted?.length || 0} objects from R2.`);
  } catch (err: any) {
    console.error('Failed to purge R2 bucket:', err.message || err);
  }
}

async function runCleanup() {
  console.log('=== STARTING DATABASE & STORAGE CLEANUP ===');

  // Verify users count before cleanup
  const usersBefore = await db.collection('users').get();
  console.log(`Preserving users: ${usersBefore.size} user profiles found.`);

  // 1. Clear Firestore collections
  await clearCollection('articles');
  await clearCollection('notifications');
  await clearCollection('reported_issues');
  await clearCollection('issues');
  await clearCollection('subscriptions');

  // 2. Clear Cloudflare R2 bucket files
  await purgeR2Bucket();

  // 3. Post-cleanup validation
  console.log('\n--- Post-Cleanup Verification ---');
  const usersAfter = await db.collection('users').get();
  console.log(`Users collection size: ${usersAfter.size} (Expected: ${usersBefore.size})`);
  if (usersBefore.size !== usersAfter.size) {
    console.error('❌ ERROR: User profiles count mismatch! Some users were deleted!');
  } else {
    console.log('✅ Success: User profiles are fully preserved.');
  }

  const articlesAfter = await db.collection('articles').get();
  const notificationsAfter = await db.collection('notifications').get();
  const reportedIssuesAfter = await db.collection('reported_issues').get();

  console.log(`Articles remaining: ${articlesAfter.size} (Expected: 0)`);
  console.log(`Notifications remaining: ${notificationsAfter.size} (Expected: 0)`);
  console.log(`Reported issues remaining: ${reportedIssuesAfter.size} (Expected: 0)`);

  if (articlesAfter.size === 0 && notificationsAfter.size === 0 && reportedIssuesAfter.size === 0) {
    console.log('✅ Success: Database is fully cleaned of non-user data.');
  } else {
    console.error('❌ ERROR: Some non-user database records remain.');
  }

  console.log('=== CLEANUP COMPLETED ===');
  process.exit(0);
}

runCleanup().catch(console.error);
