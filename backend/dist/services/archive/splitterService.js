"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileZipToPdf = exports.splitPdf = void 0;
const pdf_lib_1 = require("pdf-lib");
const adm_zip_1 = __importDefault(require("adm-zip"));
/**
 * Extracts a page range (1-indexed, inclusive) from a source PDF buffer.
 */
const splitPdf = async (pdfBuffer, startPage, endPage) => {
    console.log(`[SPLITTER-SERVICE] Splitting PDF pages: ${startPage} to ${endPage}`);
    try {
        const srcDoc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
        const dstDoc = await pdf_lib_1.PDFDocument.create();
        const pageCount = srcDoc.getPageCount();
        const pageIndices = [];
        for (let i = startPage - 1; i <= endPage - 1; i++) {
            if (i >= 0 && i < pageCount) {
                pageIndices.push(i);
            }
        }
        if (pageIndices.length === 0) {
            throw new Error(`Invalid page range: ${startPage}-${endPage} is out of bounds (total pages: ${pageCount})`);
        }
        const copiedPages = await dstDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((page) => dstDoc.addPage(page));
        const pdfBytes = await dstDoc.save();
        return Buffer.from(pdfBytes);
    }
    catch (err) {
        console.error('[SPLITTER-SERVICE] PDF split failed:', err);
        throw new Error(`Failed to split PDF range ${startPage}-${endPage}: ${err.message}`);
    }
};
exports.splitPdf = splitPdf;
/**
 * Compiles a ZIP archive containing page images (PNG, JPG, JPEG) into a single PDF buffer.
 * Images are sorted numerically based on filenames to preserve reading order.
 */
const compileZipToPdf = async (zipBuffer) => {
    console.log(`[SPLITTER-SERVICE] Compiling ZIP archive of page scans to PDF...`);
    try {
        const zip = new adm_zip_1.default(zipBuffer);
        const entries = zip.getEntries();
        // Find and sort image files
        const imageEntries = entries
            .filter((e) => !e.isDirectory && /\.(png|jpe?g)$/i.test(e.entryName))
            .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true, sensitivity: 'base' }));
        if (imageEntries.length === 0) {
            throw new Error('No valid PNG or JPG page images found inside the ZIP file.');
        }
        console.log(`[SPLITTER-SERVICE] Found ${imageEntries.length} page images in ZIP. Compiling...`);
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        for (const entry of imageEntries) {
            const imgBuffer = entry.getData();
            const lowerName = entry.entryName.toLowerCase();
            let embeddedImage;
            if (lowerName.endsWith('.png')) {
                embeddedImage = await pdfDoc.embedPng(imgBuffer);
            }
            else {
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
    }
    catch (err) {
        console.error('[SPLITTER-SERVICE] ZIP compiler failed:', err);
        throw new Error(`Failed to compile ZIP to PDF: ${err.message}`);
    }
};
exports.compileZipToPdf = compileZipToPdf;
