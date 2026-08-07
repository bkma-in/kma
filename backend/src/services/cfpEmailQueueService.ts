import { db } from '../config/firebase';
import { sendTransactionalEmail } from './emailService';
import { buildHtmlEmail } from './notificationService';
import { config } from '../config/env';

export interface RecipientInfo {
  userId: string;
  email: string;
  name: string;
  role: 'author' | 'reader' | 'reviewer' | 'subscriber';
}

export interface QueueRecipientItem extends RecipientInfo {
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  error?: string;
  createdAt: string;
  sentAt?: string;
}

export interface QueueJobDoc {
  jobId: string;
  campaignId: string;
  cfpId: string;
  cfpTitle: string;
  cfpVolume: string;
  cfpIssue: string;
  cfpDeadline: string;
  batchIndex: number;
  totalRecipientsInBatch: number;
  recipients: QueueRecipientItem[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sentCount: number;
  failedCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface QueueStats {
  totalRecipients: number;
  sentCount: number;
  pendingCount: number;
  failedCount: number;
  emailsSentToday: number;
  dailyLimit: number;
  quotaUsedFormatted: string;
  estimatedCompletionDate: string | null;
  progressPercentage: number;
}

const DAILY_EMAIL_LIMIT = 100;
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Returns today's date key in YYYY-MM-DD format.
 */
export const getTodayDateKey = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

/**
 * Retrieves total emails sent today under the daily quota log.
 */
export const getEmailsSentTodayCount = async (): Promise<number> => {
  const dateKey = getTodayDateKey();
  const logRef = db.collection('cfp_email_logs').doc(dateKey);
  const doc = await logRef.get();
  if (!doc.exists) return 0;
  return doc.data()?.emailsSentToday || 0;
};

/**
 * Records emails sent today in Firestore log document atomically.
 */
export const incrementEmailsSentToday = async (count: number): Promise<number> => {
  const dateKey = getTodayDateKey();
  const logRef = db.collection('cfp_email_logs').doc(dateKey);

  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(logRef);
    let current = 0;
    if (doc.exists) {
      current = doc.data()?.emailsSentToday || 0;
    }
    const updated = current + count;
    transaction.set(logRef, { dateKey, emailsSentToday: updated, updatedAt: new Date() }, { merge: true });
    return updated;
  });
};

/**
 * Formats CFP announcement HTML content using BKMA email template.
 */
export const buildCfpNotificationEmailHtml = (cfp: any, recipientName: string): string => {
  const title = cfp.title || 'Call for Papers';
  const bannerTitle = `New Call for Papers: ${title}`;
  const bodyText = `We are pleased to announce a new Call for Papers for the <strong>Bulletin of Kerala Mathematics Association</strong>. We invite high-quality research submissions in pure and applied mathematics.`;
  const cardTitle = `Volume ${cfp.volume} • Issue ${cfp.issue}`;

  const rows = [
    { label: 'Journal Volume', value: `Volume ${cfp.volume}` },
    { label: 'Journal Issue', value: `Issue ${cfp.issue}` },
  ];

  const formatDateDDMMYYYY = (dateVal: any): string => {
    if (!dateVal) return 'N/A';
    if (typeof dateVal === 'string') {
      const parts = dateVal.split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (cfp.openingDate) {
    rows.push({ label: 'Opening Date', value: formatDateDDMMYYYY(cfp.openingDate) });
  }

  if (cfp.deadline) {
    rows.push({ label: 'Submission Deadline', value: formatDateDDMMYYYY(cfp.deadline) });
  }

  if (cfp.publicationDate) {
    rows.push({ label: 'Expected Publication', value: formatDateDDMMYYYY(cfp.publicationDate) });
  }

  const publicUrl = `${process.env.FRONTEND_URL || 'https://www.bkma.in'}/call-for-papers/${cfp.id || cfp.cfpId}`;
  const actionText = 'View Call for Papers & Guidelines';

  return buildHtmlEmail(
    recipientName,
    bannerTitle,
    bodyText,
    cardTitle,
    rows,
    publicUrl,
    actionText,
    'Author Notice',
    'Please review the author guidelines and manuscript formatting requirements before submitting your paper.',
    '📄',
    'Review Submission Guidelines',
    '🚀',
    'Submit Paper Online'
  );
};

/**
 * Creates an email campaign in `cfp_email_jobs` collection (batched into chunks of 100).
 * Checks user preferences (`notificationPreferences.callForPapers !== false`) and enforces idempotency.
 */
export const createCfpEmailCampaign = async (
  cfp: any,
  selectedRecipients: RecipientInfo[],
  publishedAtIso: string
): Promise<{ campaignId: string; totalEnqueued: number }> => {
  const campaignId = `${cfp.id}_${new Date(publishedAtIso).getTime()}`;

  // Idempotency check: verify if jobs for this campaign already exist
  const existingSnapshot = await db.collection('cfp_email_jobs')
    .where('campaignId', '==', campaignId)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    console.log(`[CFP-QUEUE] Campaign ${campaignId} already exists. Skipping duplicate creation.`);
    return { campaignId, totalEnqueued: 0 };
  }

  if (!selectedRecipients || selectedRecipients.length === 0) {
    return { campaignId, totalEnqueued: 0 };
  }

  // Deduplicate by recipientId / email
  const uniqueMap = new Map<string, RecipientInfo>();
  for (const r of selectedRecipients) {
    if (r.email && !uniqueMap.has(r.email.toLowerCase())) {
      uniqueMap.set(r.email.toLowerCase(), r);
    }
  }

  const validRecipients = Array.from(uniqueMap.values());

  // Filter out users who have disabled CFP email notifications in their preferences
  const userIds = validRecipients.map(r => r.userId).filter(Boolean);
  const disabledEmails = new Set<string>();

  if (userIds.length > 0) {
    for (let i = 0; i < userIds.length; i += 30) {
      const batchIds = userIds.slice(i, i + 30);
      const userDocs = await Promise.all(batchIds.map(uid => db.collection('users').doc(uid).get()));
      for (const uDoc of userDocs) {
        if (uDoc.exists) {
          const uData = uDoc.data()!;
          if (uData.notificationPreferences?.callForPapers === false) {
            if (uData.email) disabledEmails.add(uData.email.toLowerCase());
          }
        }
      }
    }
  }

  const eligibleRecipients = validRecipients.filter(r => !disabledEmails.has(r.email.toLowerCase()));

  if (eligibleRecipients.length === 0) {
    return { campaignId, totalEnqueued: 0 };
  }

  // Chunk eligible recipients into batches of 100
  const BATCH_SIZE = 100;
  const writeBatch = db.batch();
  let batchIndex = 0;

  for (let i = 0; i < eligibleRecipients.length; i += BATCH_SIZE) {
    const chunk = eligibleRecipients.slice(i, i + BATCH_SIZE);
    const jobId = `${campaignId}_batch_${batchIndex}`;

    const items: QueueRecipientItem[] = chunk.map(r => ({
      userId: r.userId,
      email: r.email,
      name: r.name,
      role: r.role,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString()
    }));

    const jobDoc: QueueJobDoc = {
      jobId,
      campaignId,
      cfpId: cfp.id || cfp.cfpId,
      cfpTitle: cfp.title,
      cfpVolume: cfp.volume,
      cfpIssue: cfp.issue,
      cfpDeadline: cfp.deadline,
      batchIndex,
      totalRecipientsInBatch: items.length,
      recipients: items,
      status: 'pending',
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const jobRef = db.collection('cfp_email_jobs').doc(jobId);
    writeBatch.set(jobRef, jobDoc);
    batchIndex++;
  }

  await writeBatch.commit();
  console.log(`[CFP-QUEUE] Enqueued ${eligibleRecipients.length} recipients across ${batchIndex} batches for campaign ${campaignId}`);

  return { campaignId, totalEnqueued: eligibleRecipients.length };
};

/**
 * Processes pending email jobs for the daily Render Cron invocation.
 * Sends up to `100 - emailsSentToday` emails via Brevo, updates Firestore statuses, and exits.
 */
export const processPendingEmailQueueBatch = async (): Promise<{
  sentToday: number;
  remainingQuota: number;
  processedInCall: number;
  completedJobsCount: number;
}> => {
  const sentToday = await getEmailsSentTodayCount();
  const availableQuota = Math.max(0, DAILY_EMAIL_LIMIT - sentToday);

  console.log(`[CFP-CRON] Starting daily queue processor. Sent today: ${sentToday}/${DAILY_EMAIL_LIMIT}. Available quota: ${availableQuota}`);

  if (availableQuota <= 0) {
    console.log(`[CFP-CRON] Daily limit of ${DAILY_EMAIL_LIMIT} emails reached for today. Skipping processing.`);
    return { sentToday, remainingQuota: 0, processedInCall: 0, completedJobsCount: 0 };
  }

  const jobsSnapshot = await db.collection('cfp_email_jobs')
    .where('status', 'in', ['pending', 'processing'])
    .orderBy('createdAt', 'asc')
    .limit(10)
    .get();

  if (jobsSnapshot.empty) {
    console.log('[CFP-CRON] No pending email jobs found in queue.');
    return { sentToday, remainingQuota: availableQuota, processedInCall: 0, completedJobsCount: 0 };
  }

  let remainingQuota = availableQuota;
  let processedInCall = 0;
  let completedJobsCount = 0;

  for (const doc of jobsSnapshot.docs) {
    if (remainingQuota <= 0) break;

    const job = doc.data() as QueueJobDoc;
    const cfpDoc = await db.collection('call_for_papers').doc(job.cfpId).get();
    const cfpData = cfpDoc.exists ? cfpDoc.data() : {
      title: job.cfpTitle,
      volume: job.cfpVolume,
      issue: job.cfpIssue,
      deadline: job.cfpDeadline,
      id: job.cfpId
    };

    let batchUpdated = false;
    let newSentCount = job.sentCount || 0;
    let newFailedCount = job.failedCount || 0;

    const updatedRecipients = [...job.recipients];

    for (let idx = 0; idx < updatedRecipients.length; idx++) {
      if (remainingQuota <= 0) break;

      const item = updatedRecipients[idx];
      if (item.status === 'sent') continue;
      if (item.status === 'failed' && item.attempts >= MAX_RETRY_ATTEMPTS) continue;

      item.status = 'processing';
      item.attempts = (item.attempts || 0) + 1;

      try {
        const emailHtml = buildCfpNotificationEmailHtml(cfpData, item.name || 'Esteemed Scholar');
        const subject = `Call for Papers: ${job.cfpTitle || 'Bulletin of BKMA'} (Vol ${job.cfpVolume}, Issue ${job.cfpIssue})`;

        await sendTransactionalEmail(item.email, item.name || 'Scholar', subject, emailHtml);

        item.status = 'sent';
        item.sentAt = new Date().toISOString();
        newSentCount++;
        remainingQuota--;
        processedInCall++;
        batchUpdated = true;
      } catch (err: any) {
        console.error(`[CFP-CRON] Failed to send email to ${item.email} (Attempt ${item.attempts}/${MAX_RETRY_ATTEMPTS}):`, err.message || err);
        item.error = err.message || 'Transmission failed';
        if (item.attempts >= MAX_RETRY_ATTEMPTS) {
          item.status = 'failed';
          newFailedCount++;
        } else {
          item.status = 'pending';
        }
        batchUpdated = true;
      }
    }

    if (batchUpdated) {
      const allDone = updatedRecipients.every(r => r.status === 'sent' || (r.status === 'failed' && r.attempts >= MAX_RETRY_ATTEMPTS));
      const jobStatus = allDone ? 'completed' : 'processing';

      if (allDone) completedJobsCount++;

      await doc.ref.update({
        recipients: updatedRecipients,
        sentCount: newSentCount,
        failedCount: newFailedCount,
        status: jobStatus,
        updatedAt: new Date()
      });
    }
  }

  if (processedInCall > 0) {
    await incrementEmailsSentToday(processedInCall);
  }

  const finalSentToday = await getEmailsSentTodayCount();
  console.log(`[CFP-CRON] Finished batch. Processed: ${processedInCall} emails. Sent today: ${finalSentToday}/${DAILY_EMAIL_LIMIT}. Completed jobs: ${completedJobsCount}.`);

  return {
    sentToday: finalSentToday,
    remainingQuota: Math.max(0, DAILY_EMAIL_LIMIT - finalSentToday),
    processedInCall,
    completedJobsCount
  };
};

/**
 * Returns complete queue monitoring metrics for Admin Dashboard.
 */
export const getQueueStats = async (cfpId?: string): Promise<QueueStats> => {
  let query: FirebaseFirestore.Query = db.collection('cfp_email_jobs');
  if (cfpId) {
    query = query.where('cfpId', '==', cfpId);
  }

  const snapshot = await query.get();
  let totalRecipients = 0;
  let sentCount = 0;
  let pendingCount = 0;
  let failedCount = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data() as QueueJobDoc;
    if (Array.isArray(data.recipients)) {
      data.recipients.forEach(r => {
        totalRecipients++;
        if (r.status === 'sent') sentCount++;
        else if (r.status === 'failed') failedCount++;
        else pendingCount++;
      });
    }
  });

  const emailsSentToday = await getEmailsSentTodayCount();
  const quotaUsedFormatted = `${emailsSentToday}/${DAILY_EMAIL_LIMIT}`;

  let estimatedCompletionDate: string | null = null;
  if (pendingCount > 0) {
    const remainingQuotaToday = Math.max(0, DAILY_EMAIL_LIMIT - emailsSentToday);
    let remainingPending = pendingCount - remainingQuotaToday;
    let daysNeeded = 1;
    if (remainingPending > 0) {
      daysNeeded += Math.ceil(remainingPending / DAILY_EMAIL_LIMIT);
    }
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (daysNeeded - 1));
    estimatedCompletionDate = targetDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  const progressPercentage = totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 100;

  return {
    totalRecipients,
    sentCount,
    pendingCount,
    failedCount,
    emailsSentToday,
    dailyLimit: DAILY_EMAIL_LIMIT,
    quotaUsedFormatted,
    estimatedCompletionDate,
    progressPercentage
  };
};

/**
 * Retries failed email recipients with attempts < MAX_RETRY_ATTEMPTS.
 */
export const retryFailedJobs = async (cfpId?: string): Promise<number> => {
  let query: FirebaseFirestore.Query = db.collection('cfp_email_jobs');
  if (cfpId) {
    query = query.where('cfpId', '==', cfpId);
  }

  const snapshot = await query.get();
  let resetCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as QueueJobDoc;
    let modified = false;

    const updatedRecipients = data.recipients.map(r => {
      if (r.status === 'failed' && r.attempts < MAX_RETRY_ATTEMPTS) {
        modified = true;
        resetCount++;
        return { ...r, status: 'pending' as const };
      }
      return r;
    });

    if (modified) {
      await doc.ref.update({
        recipients: updatedRecipients,
        status: 'pending',
        updatedAt: new Date()
      });
    }
  }

  return resetCount;
};

/**
 * Cancels pending email jobs.
 */
export const cancelPendingJobs = async (cfpId?: string): Promise<number> => {
  let query: FirebaseFirestore.Query = db.collection('cfp_email_jobs');
  if (cfpId) {
    query = query.where('cfpId', '==', cfpId);
  }

  const snapshot = await query.get();
  let cancelledCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as QueueJobDoc;
    let modified = false;

    const updatedRecipients = data.recipients.map(r => {
      if (r.status === 'pending') {
        modified = true;
        cancelledCount++;
        return { ...r, status: 'failed' as const, error: 'Cancelled by administrator' };
      }
      return r;
    });

    if (modified) {
      await doc.ref.update({
        recipients: updatedRecipients,
        status: 'completed',
        updatedAt: new Date()
      });
    }
  }

  return cancelledCount;
};
