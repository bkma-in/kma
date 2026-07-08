"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = void 0;
const firebase_1 = require("../config/firebase");
const logAuditEvent = async (event, reviewerId, adminId = null) => {
    try {
        const logRef = firebase_1.db.collection('audit_logs').doc();
        await logRef.set({
            logId: logRef.id,
            event,
            reviewerId,
            adminId,
            timestamp: new Date()
        });
        console.log(`[AUDIT-LOG] ${event} recorded for reviewer ${reviewerId}`);
    }
    catch (error) {
        console.error(`[AUDIT-LOG] Failed to record audit log:`, error);
    }
};
exports.logAuditEvent = logAuditEvent;
