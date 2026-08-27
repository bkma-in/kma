import { db } from '../config/firebase';

export const logAuditEvent = async (
  event: 
    | 'Reviewer Created' 
    | 'Credentials Email Sent' 
    | 'Credentials Email Failed' 
    | 'Credentials Resent' 
    | 'Reviewer First Login' 
    | 'Password Changed' 
    | 'Reviewer Deactivated' 
    | 'Reviewer Reactivated' 
    | 'Reviewer Approved' 
    | 'Email Verified'
    | 'Life Member Enrolled'
    | 'Life Members Bulk Imported'
    | 'Life Member Updated'
    | 'Life Member Removed',
  reviewerId: string,
  adminId: string | null = null
) => {
  try {
    const logRef = db.collection('audit_logs').doc();
    await logRef.set({
      logId: logRef.id,
      event,
      reviewerId,
      adminId,
      timestamp: new Date()
    });
    console.log(`[AUDIT-LOG] ${event} recorded for reviewer ${reviewerId}`);
  } catch (error) {
    console.error(`[AUDIT-LOG] Failed to record audit log:`, error);
  }
};
