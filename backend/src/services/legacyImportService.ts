import { PDFDocument } from 'pdf-lib';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
const pdfParse = require('pdf-parse');

/**
 * Extracts a specific range of pages from a PDF buffer.
 * @param fullPdfBuffer The buffer containing the complete PDF file.
 * @param startPage 1-indexed start page.
 * @param endPage 1-indexed end page.
 * @returns A promise resolving to the split PDF buffer.
 */
export const extractPages = async (
  fullPdfBuffer: Buffer,
  startPage: number,
  endPage: number
): Promise<Buffer> => {
  if (startPage <= 0 || endPage < startPage) {
    throw new Error(`Invalid page range: ${startPage} to ${endPage}`);
  }

  const srcDoc = await PDFDocument.load(fullPdfBuffer);
  const totalPages = srcDoc.getPageCount();

  if (startPage > totalPages || endPage > totalPages) {
    throw new Error(`Page range exceeds total PDF pages (${totalPages})`);
  }

  const subDoc = await PDFDocument.create();
  
  // pdf-lib page indices are 0-indexed
  const pageIndices: number[] = [];
  for (let i = startPage - 1; i < endPage; i++) {
    pageIndices.push(i);
  }

  const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach((page) => subDoc.addPage(page));

  const pdfBytes = await subDoc.save();
  return Buffer.from(pdfBytes);
};

/**
 * Extracts raw text from the first page of a PDF buffer.
 * @param pdfBuffer The buffer containing the PDF file.
 * @returns A promise resolving to the text of the first page.
 */
export const extractFirstPageText = async (pdfBuffer: Buffer): Promise<string> => {
  const options = {
    max: 1 // only parse page 1
  };
  const parsed = await pdfParse(pdfBuffer, options);
  return parsed.text || '';
};

/**
 * Calls Gemini to extract structured article metadata from page text.
 * @param pageText The text of the first page of the article.
 * @returns Extracted metadata containing title, abstract, authors, keywords, and MSC code.
 */
export const extractMetadataWithGemini = async (pageText: string): Promise<{
  title: string;
  abstract: string;
  keywords: string[];
  authors: Array<{ name: string; email: string; affiliation: string }>;
  subjectClassification: string;
}> => {
  if (!config.gemini.apiKey) {
    console.warn('[GEMINI] Gemini API Key is missing. Falling back to default empty values.');
    return {
      title: '',
      abstract: '',
      keywords: [],
      authors: [],
      subjectClassification: ''
    };
  }

  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT' as any,
        properties: {
          title: { type: 'STRING' as any, description: 'The title of the academic article.' },
          abstract: { type: 'STRING' as any, description: 'The abstract text of the article.' },
          keywords: {
            type: 'ARRAY' as any,
            items: { type: 'STRING' as any },
            description: 'Keywords listed on the first page.'
          },
          authors: {
            type: 'ARRAY' as any,
            items: {
              type: 'OBJECT' as any,
              properties: {
                name: { type: 'STRING' as any, description: 'The author\'s full name.' },
                email: { type: 'STRING' as any, description: 'The author\'s email address, if printed on page 1. Otherwise empty.' },
                affiliation: { type: 'STRING' as any, description: 'The department or institution of the author, if printed on page 1. Otherwise empty.' }
              },
              required: ['name']
            },
            description: 'List of authors of the article.'
          },
          subjectClassification: {
            type: 'STRING' as any,
            description: 'AMS / Mathematics Subject Classification numbers (e.g. 2000 Mathematics Subject Classification: 34Lxx).'
          }
        },
        required: ['title', 'abstract', 'authors']
      }
    }
  });

  const prompt = `
Analyze the following extracted text from the first page of an academic research paper. 
Extract the Title, Abstract, Keywords, Authors (with emails and affiliations if available), and Subject Classification.
Return the result strictly conforming to the requested JSON schema.

Extracted Text:
---
${pageText}
---
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('[GEMINI] Failed to extract metadata with Gemini:', error);
    throw new Error('Gemini metadata extraction failed.');
  }
};
