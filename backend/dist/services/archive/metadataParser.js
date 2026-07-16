"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMetadata = void 0;
/**
 * Deterministically parses article details from page 1 text using regex and heuristics.
 */
const parseMetadata = (pageText) => {
    console.log(`[METADATA-PARSER] Running parser on text length: ${pageText.length}`);
    // 1. Extract Abstract
    let abstract = '';
    const abstractRegex = /Abstract[\.\s:]+([\s\S]+?)(?=Keywords?|1\.\s+Introduction|Introduction|AMS\s+Subject|$)/i;
    const abstractMatch = pageText.match(abstractRegex);
    if (abstractMatch) {
        abstract = abstractMatch[1].trim().replace(/\s+/g, ' ');
    }
    // 2. Extract Keywords
    let keywordsStr = '';
    const keywordsRegex = /Keywords?[\.\s:]+([\s\S]+?)(?=\d{4}\s+Mathematics|AMS|Subject\s+Classification|1\.\s+Introduction|Introduction|$)/i;
    const keywordsMatch = pageText.match(keywordsRegex);
    if (keywordsMatch) {
        keywordsStr = keywordsMatch[1].trim();
    }
    const keywords = keywordsStr
        ? keywordsStr.split(/,|\s+and\s+/).map(k => k.trim().replace(/\.+$/, '')).filter(Boolean)
        : [];
    // 3. Extract Subject Classification (MSC)
    let subjectClassification = '';
    const mscRegex = /(?:\d{4}\s+Mathematics\s+Subject\s+Classification|Subject\s+Classification|AMS\s+Classification|Mathematics\s+Subject|AMS\s+Subject)[\.\s:]+([\s\S]+?)(?=1\.\s+Introduction|Introduction|$)/i;
    const mscMatch = pageText.match(mscRegex);
    if (mscMatch) {
        subjectClassification = mscMatch[1].trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
    }
    // 4. Extract Title, Authors, and Affiliations from the text before the Abstract
    let title = '';
    const authors = [];
    const preAbstractText = pageText.split(/Abstract/i)[0] || '';
    // Split by double newlines or single newlines and filter out journal meta stamps
    const blocks = preAbstractText
        .split(/\n\s*\n/)
        .map(b => b.trim())
        .filter(b => {
        if (!b)
            return false;
        const lower = b.toLowerCase();
        // Skip blocks containing standard journal headers
        if (lower.includes('bulletin') || lower.includes('kerala') || lower.includes('mathematical') || lower.includes('association'))
            return false;
        if (lower.includes('issn') || lower.includes('vol') || lower.includes('no.') || lower.includes('page') || lower.includes('pp.'))
            return false;
        return true;
    });
    if (blocks.length > 0) {
        // Block 0 is usually the Title
        title = blocks[0].replace(/\s+/g, ' ');
        // Block 1 is usually the Authors
        if (blocks.length > 1) {
            const authorListStr = blocks[1];
            // Clean author strings and split by comma or 'and'
            const rawNames = authorListStr.split(/,|\s+and\s+/).map(n => n.trim()).filter(Boolean);
            // Block 2 is usually the Affiliation
            const affiliation = blocks.length > 2 ? blocks[2].replace(/\s+/g, ' ') : '';
            // Look for possible emails inside the text block
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
            const emails = preAbstractText.match(emailRegex) || [];
            rawNames.forEach((name, idx) => {
                // Strip numbering tags like '1', '2' or '*'
                const cleanName = name.replace(/[\d\*]+$/, '').trim();
                if (cleanName) {
                    authors.push({
                        name: cleanName,
                        email: emails[idx] || '',
                        affiliation: affiliation
                    });
                }
            });
        }
    }
    // Fallbacks if extraction failed to capture any values
    if (!title) {
        title = 'Untitled Digitized Article';
    }
    if (authors.length === 0) {
        authors.push({ name: 'Unknown Author', email: '', affiliation: '' });
    }
    return {
        title,
        authors,
        abstract: abstract || 'No abstract text extracted.',
        keywords,
        subjectClassification
    };
};
exports.parseMetadata = parseMetadata;
