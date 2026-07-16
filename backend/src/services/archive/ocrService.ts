import { createWorker } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface IOcrEngine {
  recognize(imageBuffer: Buffer): Promise<OcrResult>;
}

export class TesseractOcrEngine implements IOcrEngine {
  async recognize(imageBuffer: Buffer): Promise<OcrResult> {
    console.log(`[OCR-SERVICE] Running Tesseract OCR on image buffer (${imageBuffer.length} bytes)...`);
    const worker = await createWorker('eng');
    try {
      const { data } = await worker.recognize(imageBuffer);
      console.log(`[OCR-SERVICE] Tesseract OCR completed. Text length: ${data.text.length}, Confidence: ${data.confidence}%`);
      return {
        text: data.text,
        confidence: data.confidence
      };
    } catch (err: any) {
      console.error('[OCR-SERVICE] Tesseract recognition error:', err);
      throw new Error(`OCR processing failed: ${err.message || err}`);
    } finally {
      await worker.terminate();
    }
  }
}

// Export a default instance of the Tesseract OCR engine
export const ocrEngine: IOcrEngine = new TesseractOcrEngine();
