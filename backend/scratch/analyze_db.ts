import * as admin from 'firebase-admin';
import { db } from '../src/config/firebase';
import { s3Client } from '../src/config/r2';
import { config } from '../src/config/env';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function analyze() {
  console.log('=== DATABASE & STORAGE AUDIT ===');
  
  // 1. Audit Firestore Collections
  const collections = await db.listCollections();
  console.log('\nRoot Collections found in Firestore:');
  
  for (const col of collections) {
    const snapshot = await col.get();
    console.log(`- Collection: "${col.id}" (${snapshot.size} documents)`);
    
    // Check subcollections under documents
    for (const doc of snapshot.docs) {
      const subCols = await doc.ref.listCollections();
      for (const subCol of subCols) {
        const subSnap = await subCol.get();
        console.log(`  - Subcollection under "${col.id}/${doc.id}": "${subCol.id}" (${subSnap.size} documents)`);
      }
    }
  }

  // 2. Audit Cloudflare R2 Bucket
  console.log('\nCloudflare R2 Bucket audit:');
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: config.r2.bucketName,
    });
    const listResult = await s3Client.send(listCommand);
    const contents = listResult.Contents || [];
    console.log(`Bucket Name: ${config.r2.bucketName}`);
    console.log(`Total Objects: ${contents.length}`);
    for (const obj of contents) {
      console.log(`- Key: "${obj.Key}" (Size: ${obj.Size} bytes, LastModified: ${obj.LastModified})`);
    }
  } catch (err: any) {
    console.error('Failed to list R2 objects:', err.message || err);
  }
}

analyze().catch(console.error);
