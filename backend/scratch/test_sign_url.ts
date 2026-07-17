import { getSignedPdfUrl } from '../src/services/storageService';

async function test() {
  try {
    const key = 'issues/volume_19/issue_1/2025 June Issue.pdf';
    console.log(`Generating signed URL for: ${key}`);
    const url = await getSignedPdfUrl(key);
    console.log(`SUCCESS! URL: ${url}`);
  } catch (err: any) {
    console.error(`ERROR:`, err);
  }
}

test();
