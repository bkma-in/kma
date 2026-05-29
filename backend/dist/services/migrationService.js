"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const firebase_1 = require("../config/firebase");
const runMigrations = async () => {
    console.log('Starting Firestore database migrations...');
    try {
        const snapshot = await firebase_1.db.collection('users').get();
        let batch = firebase_1.db.batch();
        let count = 0;
        let opsInBatch = 0;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            let updated = false;
            const updateData = {};
            if (data.name && data.nameLower === undefined) {
                updateData.nameLower = data.name.toLowerCase();
                updated = true;
            }
            if (data.email && data.emailLower === undefined) {
                updateData.emailLower = data.email.toLowerCase();
                updated = true;
            }
            if (updated) {
                batch.update(doc.ref, updateData);
                count++;
                opsInBatch++;
                if (opsInBatch === 500) {
                    await batch.commit();
                    batch = firebase_1.db.batch();
                    opsInBatch = 0;
                }
            }
        }
        if (opsInBatch > 0) {
            await batch.commit();
        }
        if (count > 0) {
            console.log(`Successfully migrated ${count} users with lowercased search fields.`);
        }
        else {
            console.log('All users are already migrated.');
        }
    }
    catch (error) {
        console.error('Migration error:', error);
    }
};
exports.runMigrations = runMigrations;
