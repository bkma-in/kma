"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMetadata = void 0;
/**
 * Validates extracted metadata fields and calculates a heuristic confidence score.
 * If confidence < 70%, it flags the article for manual review.
 */
const validateMetadata = (metadata, hasPdf) => {
    const errors = [];
    const warnings = [];
    let score = 0;
    // 1. Title verification
    if (metadata.title && metadata.title !== 'Untitled Digitized Article') {
        score += 25;
    }
    else {
        errors.push('Title is missing or invalid.');
    }
    // 2. Authors verification
    const hasValidAuthor = metadata.authors && metadata.authors.length > 0 && metadata.authors[0].name !== 'Unknown Author';
    if (hasValidAuthor) {
        score += 20;
    }
    else {
        errors.push('At least one author is required.');
    }
    // 3. Abstract verification
    if (metadata.abstract && metadata.abstract !== 'No abstract text extracted.') {
        score += 30;
    }
    else {
        errors.push('Abstract summary is missing.');
    }
    // 4. Keywords verification
    if (metadata.keywords && metadata.keywords.length > 0) {
        score += 15;
    }
    else {
        warnings.push('No keywords detected. It is recommended to add keywords.');
    }
    // 5. MSC Classification
    if (metadata.subjectClassification) {
        score += 10;
    }
    else {
        warnings.push('MSC Subject Classification code is missing.');
    }
    // 6. PDF availability check
    if (!hasPdf) {
        errors.push('Digital PDF binary missing for this article segment.');
    }
    const isValid = errors.length === 0;
    const needsManualReview = score < 70 || !isValid;
    console.log(`[VALIDATION-SERVICE] Completed validation. Score: ${score}%. IsValid: ${isValid}, NeedsReview: ${needsManualReview}`);
    return {
        isValid,
        score,
        needsManualReview,
        errors,
        warnings
    };
};
exports.validateMetadata = validateMetadata;
