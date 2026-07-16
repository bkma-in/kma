import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

async function run() {
  try {
    const pdfPath = 'C:\\Users\\shivu naganur\\.gemini\\antigravity\\brain\\ccfd65bc-cefd-4c7e-b583-8663ed3d4aa3\\media__1784128274481.pdf';
    console.log(`Checking file: ${pdfPath}`);
    if (!fs.existsSync(pdfPath)) {
      console.log('File does not exist!');
      return;
    }
    const bytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes);
    console.log(`Page Count: ${pdfDoc.getPageCount()}`);
  } catch (err) {
    console.error(err);
  }
}

run();
