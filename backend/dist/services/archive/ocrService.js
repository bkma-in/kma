"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrEngine = exports.TesseractOcrEngine = void 0;
const tesseract_js_1 = require("tesseract.js");
class TesseractOcrEngine {
    async recognize(imageBuffer) {
        console.log(`[OCR-SERVICE] Running Tesseract OCR on image buffer (${imageBuffer.length} bytes)...`);
        const worker = await (0, tesseract_js_1.createWorker)('eng');
        try {
            const { data } = await worker.recognize(imageBuffer);
            console.log(`[OCR-SERVICE] Tesseract OCR completed. Text length: ${data.text.length}, Confidence: ${data.confidence}%`);
            return {
                text: data.text,
                confidence: data.confidence
            };
        }
        catch (err) {
            console.error('[OCR-SERVICE] Tesseract recognition error:', err);
            throw new Error(`OCR processing failed: ${err.message || err}`);
        }
        finally {
            await worker.terminate();
        }
    }
}
exports.TesseractOcrEngine = TesseractOcrEngine;
// Export a default instance of the Tesseract OCR engine
exports.ocrEngine = new TesseractOcrEngine();
