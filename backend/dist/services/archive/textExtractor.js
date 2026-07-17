"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDigitalText = void 0;
const pdfParse = require('pdf-parse');
/**
  * Extracts text from a digital PDF buffer in a page range.
  * If the extracted text is short (< 100 chars), it flags it as scanned/empty.
  */
const extractDigitalText = async (pdfBuffer, startPage, endPage) => {
    console.log(`[TEXT-EXTRACTOR] Parsing digital PDF page range: ${startPage}-${endPage}`);
    let textContent = '';
    // Use pdf-parse with custom page render callback to only read pages inside the range
    const options = {
        pagerender: (pageData) => {
            const pageNumber = pageData.pageIndex + 1;
            if (pageNumber >= startPage && pageNumber <= endPage) {
                textContent += pageData.text + '\n';
            }
            return '';
        }
    };
    try {
        await pdfParse(pdfBuffer, options);
        const cleanText = textContent.trim();
        const isScanned = cleanText.length < 100;
        console.log(`[TEXT-EXTRACTOR] Finished parsing. Extracted length: ${cleanText.length}. IsScanned: ${isScanned}`);
        return {
            text: cleanText,
            isScanned
        };
    }
    catch (err) {
        console.error('[TEXT-EXTRACTOR] pdf-parse failed:', err);
        // If it fails, assume it might be scanned or corrupted, and suggest OCR
        return {
            text: '',
            isScanned: true
        };
    }
};
exports.extractDigitalText = extractDigitalText;
