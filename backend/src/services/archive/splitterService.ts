import { PDFDocument } from 'pdf-lib';
import AdmZip from 'adm-zip';

/**
 * Extracts a page range (1-indexed, inclusive) from a source PDF buffer.
 */
export const splitPdf = async (
  pdfBuffer: Buffer,
  startPage: number,
  endPage: number
): Promise<Buffer> => {
  console.log(`[SPLITTER-SERVICE] Splitting PDF pages: ${startPage} to ${endPage}`);

  try {
    const srcDoc = await PDFDocument.load(pdfBuffer);
    const dstDoc = await PDFDocument.create();

    const pageCount = srcDoc.getPageCount();
    const pageIndices: number[] = [];

    for (let i = startPage - 1; i <= endPage - 1; i++) {
      if (i >= 0 && i < pageCount) {
        pageIndices.push(i);
      }
    }

    if (pageIndices.length === 0) {
      throw new Error(`Invalid page range: ${startPage}-${endPage} is out of bounds (total pages: ${pageCount})`);
    }

    const copiedPages = await dstDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach(page => dstDoc.addPage(page));

    const pdfBytes = await dstDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err: any) {
    console.error('[SPLITTER-SERVICE] PDF split failed:', err);
    throw new Error(`Failed to split PDF range ${startPage}-${endPage}: ${err.message}`);
  }
};

/**
 * Compiles a ZIP archive containing page images (PNG, JPG, JPEG) into a single PDF buffer.
 * Images are sorted numerically based on filenames to preserve reading order.
 */
export const compileZipToPdf = async (zipBuffer: Buffer): Promise<Buffer> => {
  console.log(`[SPLITTER-SERVICE] Compiling ZIP archive of page scans to PDF...`);

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // Find and sort image files
    const imageEntries = entries
      .filter(e => !e.isDirectory && /\.(png|jpe?g)$/i.test(e.entryName))
      .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true, sensitivity: 'base' }));

    if (imageEntries.length === 0) {
      throw new Error('No valid PNG or JPG page images found inside the ZIP file.');
    }

    console.log(`[SPLITTER-SERVICE] Found ${imageEntries.length} page images in ZIP. Compiling...`);

    const pdfDoc = await PDFDocument.create();

    for (const entry of imageEntries) {
      const imgBuffer = entry.getData();
      const lowerName = entry.entryName.toLowerCase();
      
      let embeddedImage;
      if (lowerName.endsWith('.png')) {
        embeddedImage = await pdfDoc.embedPng(imgBuffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(imgBuffer);
      }

      const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height
      });
    }

    const pdfBytes = await pdfDoc.save();
    console.log(`[SPLITTER-SERVICE] Compiled PDF successfully. Size: ${pdfBytes.length} bytes.`);
    return Buffer.from(pdfBytes);
  } catch (err: any) {
    console.error('[SPLITTER-SERVICE] ZIP compiler failed:', err);
    throw new Error(`Failed to compile ZIP to PDF: ${err.message}`);
  }
};
