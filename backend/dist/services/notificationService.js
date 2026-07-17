"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndSendReviewReminders = exports.sendArticleRejectedNotifications = exports.sendRevisionRequestedNotifications = exports.sendReviewerAssignedNotifications = exports.sendArticleSubmittedNotifications = exports.buildHtmlEmail = void 0;
const firebase_1 = require("../config/firebase");
const env_1 = require("../config/env");
const emailService_1 = require("./emailService");
/**
 * Builds HTML content based on the layout of the reviewer welcome template.
 */
const buildHtmlEmail = (recipientName, bannerTitle, bodyText, cardTitle, rows, actionUrl, actionText, noticeTitle, noticeText, bento1Icon = '', bento1Text = '', bento2Icon = '', bento2Text = '', extraHtml) => {
    const rowsHtml = rows
        .map((row, index) => {
        const isLast = index === rows.length - 1;
        const borderStyle = isLast ? '' : 'border-bottom: 1px solid #e4e4e7;';
        return `
      <tr>
        <td style="padding: 10px 0; ${borderStyle} font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">${row.label}</td>
        <td align="right" style="padding: 10px 0; ${borderStyle} font-size: 14px; font-weight: 600; color: #000000;"><span style="color: #000000; text-decoration: none;">${row.value}</span></td>
      </tr>
    `;
    })
        .join('\n');
    const logoUrl = env_1.config.brevo.logoUrl;
    const privacyPolicyUrl = env_1.config.brevo.privacyPolicyUrl;
    const reviewerGuidelinesUrl = env_1.config.brevo.reviewerGuidelinesUrl;
    const supportUrl = env_1.config.brevo.supportUrl;
    const currentYear = new Date().getFullYear();
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>KMA Notification</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="width: 100% !important; max-width: 600px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%;">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <img src="${logoUrl}" alt="BKMA Logo" width="80" height="80" style="width: 80px; height: 80px; display: block;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #000000; letter-spacing: -0.02em; line-height: 1.2;">Bulletin of Kerala Mathematical Association</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: 0; border-top: 1px solid #a1a1aa; margin: 0;" />
            </td>
          </tr>

          <!-- Welcome Body -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #000000; letter-spacing: -0.01em;">${bannerTitle}</h2>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #3f3f46;">
                Dear ${recipientName},<br /><br />
                ${bodyText}
              </p>
            </td>
          </tr>

          <!-- Details Card -->
          <tr>
            <td style="padding: 0 40px 0 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; background-color: #ffffff; border: 1px solid #d4d4d8; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #000000;">${cardTitle}</h3>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; ${(actionText && actionUrl) ? 'margin-bottom: 24px;' : 'margin-bottom: 0;'}">
                      <!-- Dynamic rows of key-values -->
                      ${rowsHtml}
                    </table>
                    
                    ${(actionText && actionUrl) ? `
                    <!-- Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%;">
                      <tr>
                        <td align="center">
                          <a href="${actionUrl}" style="display: block; background-color: #000000; color: #ffffff; text-align: center; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${actionText}</a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${extraHtml || ''}

          <!-- Spacer -->
          <tr>
            <td height="24" style="font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Notice Section -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; background-color: #fafafa; border-left: 4px solid #000000; border-top: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; border-radius: 0 8px 8px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%;">
                      <tr>
                        <td width="20" valign="top" style="padding-top: 2px;">
                          <span style="display: block; width: 16px; height: 16px; border: 1.5px solid #000000; border-radius: 50%; text-align: center; font-size: 11px; line-height: 16px; font-weight: bold; color: #000000; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;">i</span>
                        </td>
                        <td width="12" style="font-size: 0; line-height: 0;">&nbsp;</td>
                        <td valign="top" style="font-size: 13px; line-height: 1.5; color: #52525b;">
                          <strong style="color: #000000; display: block; margin-bottom: 4px; font-size: 14px; font-weight: 700;">${noticeTitle}</strong>
                          ${noticeText}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${(bento1Text && bento2Text) ? `
          <!-- What You Can Do (Bento Grid in Tables) -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%;">
                <tr>
                  <td width="48%" style="padding: 16px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; vertical-align: top;">
                    <span style="font-size: 18px; display: block; margin-bottom: 8px;">${bento1Icon}</span>
                    <span style="font-size: 13px; font-weight: 600; color: #000000; line-height: 1.3; display: block;">${bento1Text}</span>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 16px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; vertical-align: top;">
                    <span style="font-size: 18px; display: block; margin-bottom: 8px;">${bento2Icon}</span>
                    <span style="font-size: 13px; font-weight: 600; color: #000000; line-height: 1.3; display: block;">${bento2Text}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Support Section -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; background-color: #ffffff; border: 1px dashed #e4e4e7; border-radius: 16px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #000000;">Need Help?</h3>
                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #71717a; line-height: 1.5;">If you experience any difficulty accessing your account, please contact:</p>
                    
                    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <!-- Email Contact -->
                        <td style="padding: 0 8px 8px 8px; vertical-align: middle;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td valign="middle" style="font-size: 16px; padding-right: 8px; line-height: 1; color: #000000;">✉</td>
                              <td valign="middle" style="font-size: 13px; font-weight: 600;">
                                <a href="mailto:keralamathsasso@gmail.com" style="color: #000000; text-decoration: none;">keralamathsasso@gmail.com</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <!-- Separator Pipe -->
                        <td style="padding: 0 8px 8px 8px; font-size: 13px; color: #71717a; vertical-align: middle;">|</td>
                        <!-- Website Contact -->
                        <td style="padding: 0 8px 8px 8px; vertical-align: middle;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td valign="middle" style="font-size: 16px; padding-right: 8px; line-height: 1; color: #000000;">🌐</td>
                              <td valign="middle" style="font-size: 13px; font-weight: 600;">
                                <a href="https://www.bkma.in" style="color: #000000; text-decoration: none;">www.bkma.in</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #000000; padding: 40px; text-align: center; color: #a1a1aa;">
              <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.1em;">Bulletin of Kerala Mathematical Association</h4>
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #a1a1aa; line-height: 1.4;">Advancing Mathematical Research Through Quality Publications</p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #a1a1aa;">Kerala, India</p>
              
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 24px auto;">
                <tr>
                  <td style="font-size: 12px;">
                    <a href="${privacyPolicyUrl}" style="color: #a1a1aa; text-decoration: underline; margin-right: 16px;">Privacy Policy</a>
                    <a href="${reviewerGuidelinesUrl}" style="color: #a1a1aa; text-decoration: underline; margin-right: 16px;">Reviewer Guidelines</a>
                    <a href="${supportUrl}" style="color: #a1a1aa; text-decoration: underline;">Support</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">
                © ${currentYear} Bulletin of Kerala Mathematical Association. All Rights Reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
exports.buildHtmlEmail = buildHtmlEmail;
/**
 * Helper to fetch unique author details for the article.
 */
const getActiveAuthors = async (article) => {
    const authorsList = [];
    if (article.authors && Array.isArray(article.authors)) {
        article.authors.forEach((auth) => {
            authorsList.push({
                uid: auth.userId || undefined,
                name: auth.name || 'Author',
                email: auth.email || ''
            });
        });
    }
    // Fallback to primary submitter if the list is empty
    if (authorsList.length === 0 && article.authorId) {
        const userDoc = await firebase_1.db.collection('users').doc(article.authorId).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        authorsList.push({
            uid: article.authorId,
            name: userData?.name || article.authorName || 'Author',
            email: userData?.email || article.authorEmail || ''
        });
    }
    // Deduplicate by email
    const seen = new Set();
    return authorsList.filter(author => {
        if (!author.email)
            return false;
        const emailLower = author.email.toLowerCase();
        if (seen.has(emailLower))
            return false;
        seen.add(emailLower);
        return true;
    });
};
/**
 * Triggers notifications after an article is submitted (both in-app and email).
 */
const sendArticleSubmittedNotifications = async (articleId) => {
    try {
        const articleDoc = await firebase_1.db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            console.warn(`[NOTIF-SERVICE] Article ${articleId} not found`);
            return;
        }
        const article = articleDoc.data();
        const title = article.title || 'Untitled Manuscript';
        const authors = await getActiveAuthors(article);
        const submitter = authors.find((a) => a.role === 'submitter' || a.uid === article.authorId) || authors[0];
        const submitterName = submitter?.name || 'Author';
        const authorNamesStr = authors.map((a) => a.name).join(', ');
        // 1. Notify Authors via In-App & Email
        const batch = firebase_1.db.batch();
        for (const author of authors) {
            if (author.uid) {
                const notifRef = firebase_1.db.collection('notifications').doc();
                batch.set(notifRef, {
                    notificationId: notifRef.id,
                    userId: author.uid,
                    type: 'ARTICLE_SUBMITTED_AUTHOR',
                    title: 'Submission Confirmation',
                    message: `Your article "${title}" has been successfully submitted.`,
                    metadata: { articleId },
                    read: false,
                    createdAt: new Date(),
                });
            }
            if (author.email) {
                const isRevision = (Array.isArray(article.revisionHistory) && article.revisionHistory.length > 0) ||
                    (article.adminNote !== undefined) ||
                    (article.reviews !== undefined);
                const bodyText = isRevision
                    ? `Congratulations! The revised version of your manuscript has been successfully submitted to the Bulletin of Kerala Mathematical Association. It has been returned to our peer-review queue for further assessment.`
                    : `Congratulations! Your manuscript has been successfully submitted to the Bulletin of Kerala Mathematical Association. It is now registered in our peer-review queue.`;
                const emailTitle = isRevision ? 'Manuscript Revision Received' : 'Manuscript Received Successfully';
                const sectionHeader = isRevision ? 'Review Process' : 'Desk Review Process';
                const sectionText = isRevision
                    ? 'BKMA editors and reviewers will assess the revised submission to determine if the requested changes have been addressed.'
                    : 'BKMA editors will conduct a desk review of the submission. If it meets BKMA guidelines, it will proceed to external peer review.';
                const cardRows = [
                    { label: 'Article Title', value: title },
                    { label: 'Authors', value: authorNamesStr },
                ];
                const emailHtml = (0, exports.buildHtmlEmail)(author.name || 'Author', emailTitle, bodyText, 'Submission details', cardRows, '', '', sectionHeader, sectionText, '', '', '', '');
                // Send email (non-blocking call)
                const emailSubject = isRevision ? `Manuscript Revision Received: ${title}` : `Submission Confirmation: ${title}`;
                (0, emailService_1.sendTransactionalEmail)(author.email, author.name || 'Author', emailSubject, emailHtml).catch(err => {
                    console.error(`[NOTIF-SERVICE] Failed to send submission email to author ${author.email}:`, err);
                });
            }
        }
        // 2. Notify Admins via In-App Only (No Email)
        const adminsSnapshot = await firebase_1.db.collection('users').where('role', '==', 'admin').get();
        if (!adminsSnapshot.empty) {
            adminsSnapshot.docs.forEach((adminDoc) => {
                const notifRef = firebase_1.db.collection('notifications').doc();
                batch.set(notifRef, {
                    notificationId: notifRef.id,
                    userId: adminDoc.id,
                    type: 'ARTICLE_SUBMITTED_ADMIN',
                    title: 'New Article Submitted',
                    message: `A new article "${title}" has been submitted by ${submitterName}.`,
                    metadata: { articleId },
                    read: false,
                    createdAt: new Date(),
                });
            });
        }
        await batch.commit();
        console.log(`[NOTIF-SERVICE] Sent submission notifications for article "${title}"`);
    }
    catch (error) {
        console.error('[NOTIF-SERVICE] Error in sendArticleSubmittedNotifications:', error);
    }
};
exports.sendArticleSubmittedNotifications = sendArticleSubmittedNotifications;
/**
 * Triggers notifications when reviewers are assigned to an article.
 */
const sendReviewerAssignedNotifications = async (articleId, reviewerIds) => {
    try {
        const articleDoc = await firebase_1.db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            console.warn(`[NOTIF-SERVICE] Article ${articleId} not found`);
            return;
        }
        const article = articleDoc.data();
        const title = article.title || 'Untitled Manuscript';
        const batch = firebase_1.db.batch();
        for (const revId of reviewerIds) {
            const revDoc = await firebase_1.db.collection('users').doc(revId).get();
            if (!revDoc.exists)
                continue;
            const reviewer = revDoc.data();
            // 1. Create In-App Notification
            const notifRef = firebase_1.db.collection('notifications').doc();
            batch.set(notifRef, {
                notificationId: notifRef.id,
                userId: revId,
                type: 'REVIEW_ASSIGNED',
                title: 'New Review Assignment',
                message: `You have been assigned to review the article "${title}".`,
                metadata: { articleId },
                read: false,
                createdAt: new Date(),
            });
            // 2. Send Email Notification
            if (reviewer.email) {
                const assignedAtDate = article.assignedAt ? (article.assignedAt.toDate ? article.assignedAt.toDate() : new Date(article.assignedAt)) : new Date();
                const deadlineDate = article.reviewDeadline ? new Date(article.reviewDeadline) : null;
                let durationStr = 'N/A';
                let formattedDeadline = 'N/A';
                if (deadlineDate && !isNaN(deadlineDate.getTime())) {
                    const startOfAssign = new Date(assignedAtDate.getFullYear(), assignedAtDate.getMonth(), assignedAtDate.getDate());
                    const startOfDeadline = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
                    const diffMs = startOfDeadline.getTime() - startOfAssign.getTime();
                    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                    durationStr = `${diffDays} Days`;
                    formattedDeadline = deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                }
                let bodyText = `You have been assigned as a peer reviewer for a recently submitted article in the Bulletin of Kerala Mathematical Association. Your expertise is highly valuable to us in maintaining the scholarly quality of our publications.`;
                if (article.reviewDeadline) {
                    bodyText += `<br /><br /><div style="background-color: #fafafa; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0; border-radius: 4px; font-size: 13px; color: #1e3a8a;"><strong>Workflow Notice:</strong> This deadline is intended for workflow management. You may still submit your review after the deadline if necessary.</div>`;
                    if (article.reviewerNote) {
                        bodyText += `<br /><strong>Note from Editor:</strong><br />"${article.reviewerNote}"`;
                    }
                }
                const cardRows = [
                    { label: 'Manuscript Title', value: title },
                    { label: 'Assigned By', value: article.assignedBy || 'Admin' },
                    { label: 'Assigned Date', value: assignedAtDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Review Deadline', value: formattedDeadline },
                    { label: 'Total Duration', value: durationStr },
                ];
                const emailHtml = (0, exports.buildHtmlEmail)(reviewer.name || 'Reviewer', 'New Review Assignment', bodyText, 'Assignment details', cardRows, '', '', `<a href="${env_1.config.brevo.reviewerGuidelinesUrl}" style="color: #000000; text-decoration: underline; font-weight: 700;">Reviewer Guidelines</a>`, `Please follow the <a href="${env_1.config.brevo.reviewerGuidelinesUrl}" style="color: #000000; text-decoration: underline;"><strong>Reviewer Guidelines</strong></a> and provide an objective critique. If you have a conflict of interest, please let the editors know.`, '', '', '', '');
                (0, emailService_1.sendTransactionalEmail)(reviewer.email, reviewer.name || 'Reviewer', `Review Invitation: ${title}`, emailHtml).catch(err => {
                    console.error(`[NOTIF-SERVICE] Failed to send review assignment email to reviewer ${reviewer.email}:`, err);
                });
            }
        }
        await batch.commit();
        console.log(`[NOTIF-SERVICE] Sent reviewer assignment notifications for article "${title}"`);
    }
    catch (error) {
        console.error('[NOTIF-SERVICE] Error in sendReviewerAssignedNotifications:', error);
    }
};
exports.sendReviewerAssignedNotifications = sendReviewerAssignedNotifications;
/**
 * Triggers notifications when revisions/improvements are requested (flagged as need changes).
 */
const sendRevisionRequestedNotifications = async (articleId, notes) => {
    try {
        const articleDoc = await firebase_1.db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            console.warn(`[NOTIF-SERVICE] Article ${articleId} not found`);
            return;
        }
        const article = articleDoc.data();
        const title = article.title || 'Untitled Manuscript';
        const authors = await getActiveAuthors(article);
        const batch = firebase_1.db.batch();
        for (const author of authors) {
            if (author.uid) {
                const notifRef = firebase_1.db.collection('notifications').doc();
                batch.set(notifRef, {
                    notificationId: notifRef.id,
                    userId: author.uid,
                    type: 'REVISION_REQUESTED',
                    title: 'Revision Requested',
                    message: `Your article "${title}" has been flagged as needing changes.`,
                    metadata: { articleId },
                    read: false,
                    createdAt: new Date(),
                });
            }
            if (author.email) {
                const bodyText = `After careful peer and editorial review, your manuscript has been flagged as needing changes. We invite you to update your manuscript and upload the revised version through the author dashboard.`;
                const cardRows = [
                    { label: 'Article Title', value: title },
                    { label: 'Current Status', value: 'Revision Requested' },
                ];
                const reviewerComments = [];
                if (article.reviews) {
                    Object.values(article.reviews).forEach((r) => {
                        if (r && r.remarks && r.remarks.trim()) {
                            const clean = r.remarks.trim();
                            if (clean !== 'Reviewed via peer assessment portal.' && clean !== 'Reviewed via peer assessment portal') {
                                reviewerComments.push(clean);
                            }
                        }
                    });
                }
                if (reviewerComments.length === 0 && article.reviewerFeedback?.remarks) {
                    const clean = article.reviewerFeedback.remarks.trim();
                    if (clean !== 'Reviewed via peer assessment portal.' && clean !== 'Reviewed via peer assessment portal') {
                        reviewerComments.push(clean);
                    }
                }
                let commentsHtml = '';
                if (reviewerComments.length > 0) {
                    commentsHtml += `<strong style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Reviewer Comments</strong>`;
                    reviewerComments.forEach((c, idx) => {
                        commentsHtml += `<div style="font-size: 13px; color: #4b5563; line-height: 1.5; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; font-style: italic;">"Reviewer #${idx + 1}: ${c}"</div>`;
                    });
                }
                if (notes && notes.trim()) {
                    commentsHtml += `<strong style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 16px; margin-bottom: 8px;">Editor Note</strong>`;
                    commentsHtml += `<div style="font-size: 13px; color: #b45309; line-height: 1.5; padding: 12px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; font-weight: 600;">${notes}</div>`;
                }
                else if (reviewerComments.length === 0) {
                    commentsHtml += `<strong style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Editor Note</strong>`;
                    commentsHtml += `<div style="font-size: 13px; color: #b45309; line-height: 1.5; padding: 12px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; font-weight: 600;">Please check the author portal for comments and requested changes.</div>`;
                }
                const extraHtml = `
          <!-- Comments / Notes Section -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%;">
                <tr>
                  <td>
                    ${commentsHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
                const emailHtml = (0, exports.buildHtmlEmail)(author.name || 'Author', 'Revision Requested for Manuscript', bodyText, 'Revision details', cardRows, '', '', 'Revision Instructions', 'Please ensure that your resubmission addresses the reviewer feedback point-by-point. You can explain changes in your resubmission cover notes.', '', '', '', '', extraHtml);
                (0, emailService_1.sendTransactionalEmail)(author.email, author.name || 'Author', `Revision Requested: ${title}`, emailHtml).catch(err => {
                    console.error(`[NOTIF-SERVICE] Failed to send revision requested email to author ${author.email}:`, err);
                });
            }
        }
        await batch.commit();
        console.log(`[NOTIF-SERVICE] Sent revision requested notifications for article "${title}"`);
    }
    catch (error) {
        console.error('[NOTIF-SERVICE] Error in sendRevisionRequestedNotifications:', error);
    }
};
exports.sendRevisionRequestedNotifications = sendRevisionRequestedNotifications;
/**
 * Triggers notifications when an article is rejected.
 */
const sendArticleRejectedNotifications = async (articleId, isDeskReject, reason) => {
    try {
        const articleDoc = await firebase_1.db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            console.warn(`[NOTIF-SERVICE] Article ${articleId} not found`);
            return;
        }
        const article = articleDoc.data();
        const title = article.title || 'Untitled Manuscript';
        const authors = await getActiveAuthors(article);
        const batch = firebase_1.db.batch();
        for (const author of authors) {
            if (author.uid) {
                const notifRef = firebase_1.db.collection('notifications').doc();
                batch.set(notifRef, {
                    notificationId: notifRef.id,
                    userId: author.uid,
                    type: 'ARTICLE_REJECTED',
                    title: 'Article Rejected',
                    message: `Your article "${title}" has been rejected. Reason: ${reason || 'No reason provided'}`,
                    metadata: { articleId },
                    read: false,
                    createdAt: new Date(),
                });
            }
            if (author.email) {
                const bodyText = `We regret to inform you that after careful consideration by our editorial board, we are unable to accept your manuscript for publication in the Bulletin of Kerala Mathematical Association in its current form.`;
                const cardRows = [
                    { label: 'Article Title', value: title },
                    { label: 'Final Status', value: isDeskReject ? 'Desk Rejected' : 'Rejected' },
                ];
                const extraHtml = `
          <!-- Rejection Reason Section -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%;">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Rejection Reason</span>
                    <div style="font-size: 14px; color: #e11d48; line-height: 1.6; font-weight: 600; padding: 16px; background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px;">
                      ${reason || 'No specific reason provided'}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
                const emailHtml = (0, exports.buildHtmlEmail)(author.name || 'Author', isDeskReject ? 'Editorial Decision: Desk Rejected' : 'Editorial Decision: Rejected', bodyText, 'Decision details', cardRows, '', '', 'Editorial Decision', `For more details, please read the <a href="${env_1.config.brevo.authorGuidelinesUrl}" style="color: #000000; text-decoration: underline;"><strong>Authors Guidelines</strong></a>.`, '', '', '', '', extraHtml);
                (0, emailService_1.sendTransactionalEmail)(author.email, author.name || 'Author', `Decision on Manuscript: ${title}`, emailHtml).catch(err => {
                    console.error(`[NOTIF-SERVICE] Failed to send rejection email to author ${author.email}:`, err);
                });
            }
        }
        await batch.commit();
        console.log(`[NOTIF-SERVICE] Sent rejection notifications for article "${title}"`);
    }
    catch (error) {
        console.error('[NOTIF-SERVICE] Error in sendArticleRejectedNotifications:', error);
    }
};
exports.sendArticleRejectedNotifications = sendArticleRejectedNotifications;
/**
 * Checks all active under-review articles, calculates the remaining days to the deadline,
 * and sends reminder notifications/emails 3 days before, 1 day before, on the deadline day,
 * and one "Review Deadline Passed" reminder.
 */
const checkAndSendReviewReminders = async () => {
    try {
        const today = new Date();
        // Normalize today to start of day in local/UTC timezone
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const snapshot = await firebase_1.db.collection('articles')
            .where('status', '==', 'under_review')
            .get();
        if (snapshot.empty)
            return;
        for (const doc of snapshot.docs) {
            const article = doc.data();
            if (!article.reviewDeadline || !article.reviewerIds || !Array.isArray(article.reviewerIds))
                continue;
            const deadlineDate = new Date(article.reviewDeadline);
            if (isNaN(deadlineDate.getTime()))
                continue;
            const deadlineStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
            // Calculate remaining days (positive means deadline is in the future, negative means passed)
            const diffMs = deadlineStart.getTime() - todayStart.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            let reminderType = '';
            let reminderSubject = '';
            let reminderMessage = '';
            let daysText = '';
            if (diffDays === 3) {
                reminderType = '3_days_before';
                reminderSubject = 'Review Deadline Reminder: 3 Days Left';
                reminderMessage = `Reminder: You have 3 days remaining to submit your review for "${article.title}".`;
                daysText = '3 Days Left';
            }
            else if (diffDays === 1) {
                reminderType = '1_day_before';
                reminderSubject = 'Urgent: Review Deadline Reminder: 1 Day Left';
                reminderMessage = `Urgent: You have 1 day remaining to submit your review for "${article.title}".`;
                daysText = '1 Day Left';
            }
            else if (diffDays === 0) {
                reminderType = 'deadline_day';
                reminderSubject = 'Review Deadline: Today';
                reminderMessage = `Reminder: Today is the review deadline for "${article.title}".`;
                daysText = 'Today';
            }
            else if (diffDays < 0) {
                reminderType = 'deadline_passed';
                reminderSubject = 'Review Deadline Passed';
                reminderMessage = `The recommended review deadline for "${article.title}" has passed. However, you can still complete and submit your review.`;
                daysText = `Overdue by ${Math.abs(diffDays)} Days`;
            }
            if (!reminderType)
                continue;
            // Check if this reminder has already been sent
            const sentReminders = article.sentReminders || [];
            if (sentReminders.includes(reminderType))
                continue;
            // Send reminder to all assigned reviewers
            const title = article.title || 'Untitled Manuscript';
            const batch = firebase_1.db.batch();
            for (const revId of article.reviewerIds) {
                const revDoc = await firebase_1.db.collection('users').doc(revId).get();
                if (!revDoc.exists)
                    continue;
                const reviewer = revDoc.data();
                // 1. Create In-App Notification
                const notifRef = firebase_1.db.collection('notifications').doc();
                batch.set(notifRef, {
                    notificationId: notifRef.id,
                    userId: revId,
                    type: 'REVIEW_REMINDER',
                    title: reminderSubject,
                    message: reminderMessage,
                    metadata: { articleId: doc.id },
                    read: false,
                    createdAt: new Date(),
                });
                // 2. Send Email
                if (reviewer.email) {
                    const bodyText = `This is a reminder regarding the manuscript review assigned to you.`;
                    const formattedDeadline = deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                    const cardRows = [
                        { label: 'Manuscript Title', value: title },
                        { label: 'Deadline Date', value: formattedDeadline },
                        { label: 'Status', value: daysText },
                    ];
                    let noticeText = reminderMessage;
                    if (diffDays < 0) {
                        noticeText += `<br /><br /><div style="background-color: #fafafa; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; border-radius: 4px; font-size: 13px; color: #991b1b;"><strong>Status Update:</strong> The recommended review timeline has passed. You may still complete and submit your review.</div>`;
                    }
                    else {
                        noticeText += `<br /><br /><div style="background-color: #fafafa; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0; border-radius: 4px; font-size: 13px; color: #1e3a8a;"><strong>Workflow Notice:</strong> This deadline is intended for workflow management. You may still submit your review after the deadline if necessary.</div>`;
                    }
                    const emailHtml = (0, exports.buildHtmlEmail)(reviewer.name || 'Reviewer', reminderSubject, bodyText + `<br /><br />${noticeText}`, 'Reminder details', cardRows, env_1.config.brevo.loginUrl, 'Go to Dashboard', 'Submission Info', 'You can view, download the article, and submit your review recommendations directly from your dashboard.', '📅', 'Check deadline status', '📝', 'Submit review on time');
                    (0, emailService_1.sendTransactionalEmail)(reviewer.email, reviewer.name || 'Reviewer', `${reminderSubject}: ${title}`, emailHtml).catch(err => {
                        console.error(`[REMINDER] Failed to send email to ${reviewer.email}:`, err);
                    });
                }
            }
            // Update sentReminders list on article
            batch.update(doc.ref, {
                sentReminders: [...sentReminders, reminderType]
            });
            await batch.commit();
            console.log(`[REMINDER] Sent ${reminderType} reminders for article ${doc.id}`);
        }
    }
    catch (error) {
        console.error('[REMINDER] Error in checkAndSendReviewReminders:', error);
    }
};
exports.checkAndSendReviewReminders = checkAndSendReviewReminders;
