"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendArticleRejectedNotifications = exports.sendRevisionRequestedNotifications = exports.sendReviewerAssignedNotifications = exports.sendArticleSubmittedNotifications = exports.buildHtmlEmail = void 0;
const firebase_1 = require("../config/firebase");
const env_1 = require("../config/env");
const emailService_1 = require("./emailService");
/**
 * Builds HTML content based on the layout of the reviewer welcome template.
 */
const buildHtmlEmail = (recipientName, bannerTitle, bodyText, cardTitle, rows, actionUrl, actionText, noticeTitle, noticeText, bento1Icon, bento1Text, bento2Icon, bento2Text) => {
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

          <!-- Support Section -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; background-color: #ffffff; border: 1px dashed #e4e4e7; border-radius: 16px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #000000;">Need Help?</h3>
                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #71717a; line-height: 1.5;">If you experience any difficulty accessing your account, please contact the BKMA Editorial Office.</p>
                    
                    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <!-- Email Contact -->
                        <td style="padding: 0 16px 8px 16px;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td valign="middle" style="font-size: 16px; padding-right: 8px; line-height: 1; color: #000000;">✉</td>
                              <td valign="middle" style="font-size: 13px; font-weight: 600;">
                                <a href="mailto:keralamathsasso@gmail.com" style="color: #000000; text-decoration: none;">keralamathsasso@gmail.com</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <!-- Website Contact -->
                        <td style="padding: 0 16px 8px 16px;">
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
                const bodyText = `Congratulations! Your manuscript has been successfully submitted to the Bulletin of Kerala Mathematical Association. It is now registered in our peer-review queue. We will notify you once reviewers have been assigned.`;
                const cardRows = [
                    { label: 'Article Title', value: title },
                    { label: 'Authors', value: authorNamesStr },
                    { label: 'Status', value: 'Submitted (Awaiting Desk Review)' },
                ];
                const emailHtml = (0, exports.buildHtmlEmail)(author.name || 'Author', 'Manuscript Received Successfully', bodyText, 'Submission details', cardRows, env_1.config.brevo.loginUrl, 'Login', 'Desk Review Process', 'BKMA editors will conduct a desk review of the submission. If it meets BKMA guidelines, it will proceed to external peer review.', '📄', 'Track review progress', '⚙️', 'Update manuscript details');
                // Send email (non-blocking call)
                (0, emailService_1.sendTransactionalEmail)(author.email, author.name || 'Author', `Submission Confirmation: ${title}`, emailHtml).catch(err => {
                    console.error(`[NOTIF-SERVICE] Failed to send submission email to author ${author.email}:`, err);
                });
            }
        }
        // 2. Notify Admins via In-App Only (No Email)
        const adminsSnapshot = await firebase_1.db.collection('users').where('role', '==', 'admin').get();
        if (!adminsSnapshot.empty) {
            adminsSnapshot.docs.forEach(adminDoc => {
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
                const bodyText = `You have been assigned as a peer reviewer for a recently submitted article in the Bulletin of Kerala Mathematical Association. Your expertise is highly valuable to us in maintaining the scholarly quality of our publications.`;
                const cardRows = [
                    { label: 'Manuscript Title', value: title },
                    { label: 'Assigned On', value: new Date().toLocaleDateString() },
                    { label: 'Status', value: 'Under Review' },
                ];
                const emailHtml = (0, exports.buildHtmlEmail)(reviewer.name || 'Reviewer', 'New Review Assignment', bodyText, 'Assignment details', cardRows, env_1.config.brevo.loginUrl, 'Login', 'Reviewer Guidelines', 'Please follow the reviewer guidelines and provide an objective critique. If you have a conflict of interest, please let the editors know.', '🔍', 'Evaluate methodology', '📝', 'Submit remarks & recommendation');
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
                    { label: 'Comments / Notes', value: notes || 'Please refer to the author portal for specific reviewer/editor comments.' },
                ];
                const emailHtml = (0, exports.buildHtmlEmail)(author.name || 'Author', 'Revision Requested for Manuscript', bodyText, 'Revision details', cardRows, env_1.config.brevo.loginUrl, 'Login', 'Revision Instructions', 'Please ensure that your resubmission addresses the reviewer feedback point-by-point. You can explain changes in your resubmission cover notes.', '✏️', 'Edit manuscript text', '📤', 'Upload revised PDF');
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
                    { label: 'Rejection Reason', value: reason || 'No specific reason provided' },
                ];
                const emailHtml = (0, exports.buildHtmlEmail)(author.name || 'Author', isDeskReject ? 'Editorial Decision: Desk Rejected' : 'Editorial Decision: Rejected', bodyText, 'Decision details', cardRows, env_1.config.brevo.loginUrl, 'Login', 'Editorial Decision', 'Our decision is based on a high volume of submissions, suitability, and reviewers recommendation. We appreciate you choosing BKMA and wish you success with other publishing opportunities.', '📊', 'Review feedback details', '📧', 'Contact editorial office');
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
