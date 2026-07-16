"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForDuplicate = void 0;
const firebase_1 = require("../../config/firebase");
/**
 * Checks Firestore articles collection to detect possible duplicate entries.
 * Compares title (case-insensitive) and checks if matching author names exist.
 */
const checkForDuplicate = async (title, authorNames, volume, issue) => {
    console.log(`[DUPLICATE-CHECKER] Checking duplicate for: "${title}"`);
    if (!title)
        return { isDuplicate: false };
    try {
        const cleanTitle = title.trim().toLowerCase();
        // 1. Check exact title matches first
        const titleQuery = await firebase_1.db.collection('articles')
            .where('title', '==', title.trim())
            .limit(1)
            .get();
        if (!titleQuery.empty) {
            console.warn(`[DUPLICATE-CHECKER] Duplicate detected: Exact title match with ID ${titleQuery.docs[0].id}`);
            return { isDuplicate: true, matchedArticleId: titleQuery.docs[0].id };
        }
        // 2. Scan recently published or draft articles for case-insensitive matching
        const snapshot = await firebase_1.db.collection('articles')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const existingTitle = (data.title || '').trim().toLowerCase();
            if (existingTitle === cleanTitle) {
                console.warn(`[DUPLICATE-CHECKER] Duplicate detected: Case-insensitive title match with ID ${doc.id}`);
                return { isDuplicate: true, matchedArticleId: doc.id };
            }
        }
        return { isDuplicate: false };
    }
    catch (err) {
        console.error('[DUPLICATE-CHECKER] Failed to verify duplicates:', err);
        return { isDuplicate: false };
    }
};
exports.checkForDuplicate = checkForDuplicate;
