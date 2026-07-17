import { Router, Request } from 'express';
import crypto from 'crypto';
import { db, auth } from '../config/firebase';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { uploadPdfToR2, getSignedPdfUrl, deletePdfFromR2, getPdfStreamFromR2 } from '../services/storageService';
import { extractPages, extractFirstPageText, extractMetadataWithGemini } from '../services/legacyImportService';

import { uploadImage, deleteImage } from '../services/cloudinaryService';
import {
  sendArticleSubmittedNotifications,
  sendReviewerAssignedNotifications,
  sendRevisionRequestedNotifications,
  sendArticleRejectedNotifications
} from '../services/notificationService';

const router = Router();

const normalizeRecommendation = (recommendation: string): string => {
  if (!recommendation) return '';
  const val = recommendation.trim().toLowerCase();
  if (val === 'accepted' || val === 'approved') return 'Approved';
  if (val === 'rejected') return 'Rejected';
  if (val === 'needs improvement' || val === 'needs revision' || val === 'revision') return 'Needs Improvement';
  return recommendation;
};

// Get signed URL for staged PDF or split article in archive jobs
router.get('/staged/pdf', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { key } = req.query;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'R2 Key is required' });
    }

    const stream = await getPdfStreamFromR2(key);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    if (stream && typeof (stream as any).pipe === 'function') {
      (stream as any).pipe(res);
    } else {
      res.status(500).json({ error: 'Invalid file stream received from storage.' });
    }
  } catch (err: any) {
    console.error('Failed to get signed staging URL:', err);
    res.status(500).json({ error: 'Failed to generate signed preview URL.' });
  }
});

// Submit Article or Save Draft (Author only)
router.post('/', requireAuth, requireRole(['author']), upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req: AuthRequest, res) => {
  try {
    const { title, abstract, status: requestedStatus = 'submitted', inviteeUserIds } = req.body;
    const authorId = req.user!.uid;
    const authorName = req.user!.name || 'Author';
    const authorEmail = req.user!.email || '';

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const pdfFile = files?.pdf?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    let objectKey = null;
    let pdfName = null;
    if (pdfFile) {
      objectKey = await uploadPdfToR2(pdfFile.buffer, pdfFile.originalname, authorId);
      pdfName = pdfFile.originalname;
    } else if (requestedStatus !== 'draft') {
      return res.status(400).json({ error: 'PDF file is required for final submission' });
    }

    let thumbnailUrl = null;
    let thumbnailPublicId = null;
    if (thumbnailFile) {
      const uploadResult = await uploadImage(thumbnailFile.buffer, 'articles');
      thumbnailUrl = uploadResult.secure_url;
      thumbnailPublicId = uploadResult.public_id;
    }

    const invitees = Array.isArray(inviteeUserIds) ? inviteeUserIds : (inviteeUserIds ? [inviteeUserIds] : []);
    
    // Rule: Article remains in DRAFT while there are pending invitations
    let finalStatus = requestedStatus;
    if (invitees.length > 0) {
      finalStatus = 'draft';
    }

    const participantIds = [authorId, ...invitees];

    const articleRef = db.collection('articles').doc();
    const newArticle: any = {
      articleId: articleRef.id,
      title,
      abstract,
      authorId, // Legacy field (submitter)
      participantIds, // New field for querying
      authors: [
        { 
          userId: authorId, 
          name: authorName, 
          email: authorEmail, 
          role: 'submitter', 
          accepted: true, 
          acceptedAt: new Date() 
        }
      ],
      reviewerId: null,
      status: finalStatus,
      pdfUrl: objectKey, 
      pdfName,
      thumbnail: thumbnailUrl,
      thumbnailPublicId: thumbnailPublicId,
      issueId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await articleRef.set(newArticle);

    // Create invitations if any
    if (invitees.length > 0) {
      const invitationsBatch = db.batch();
      for (const inviteeId of invitees) {
        if (inviteeId === authorId) continue; // Prevent self-invite

        // Fetch invitee details
        const inviteeDoc = await db.collection('users').doc(inviteeId).get();
        if (!inviteeDoc.exists) continue;
        const inviteeData = inviteeDoc.data()!;

        const inviteRef = articleRef.collection('invitations').doc();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = {
          inviteId: inviteRef.id,
          inviteeUserId: inviteeId,
          inviteeEmail: inviteeData.email,
          inviteeName: inviteeData.name,
          inviterUserId: authorId,
          token,
          status: 'pending',
          invitedAt: new Date(),
          expiresAt,
          history: [{ action: 'sent', at: new Date(), note: 'Initial invitation' }]
        };

        invitationsBatch.set(inviteRef, invitation);

        // Create Notification
        const notificationRef = db.collection('notifications').doc();
        invitationsBatch.set(notificationRef, {
          notificationId: notificationRef.id,
          userId: inviteeId,
          type: 'INVITATION_SENT',
          title: 'Co-author Invitation',
          message: `${authorName} has invited you to co-author the article "${title}".`,
          metadata: { articleId: articleRef.id, inviteId: inviteRef.id, token },
          read: false,
          createdAt: new Date()
        });

        // Also add to article authors array (pending)
        newArticle.authors.push({
          userId: inviteeId,
          name: inviteeData.name,
          email: inviteeData.email,
          role: 'coauthor',
          accepted: false,
          invitedAt: new Date()
        });
      }
      await invitationsBatch.commit();
      
      // Update article with pending authors
      await articleRef.update({ authors: newArticle.authors });
    }

    if (finalStatus === 'submitted') {
      sendArticleSubmittedNotifications(articleRef.id).catch(err => {
        console.error('Failed to trigger submission notifications on article create:', err);
      });
    }

    res.json({ success: true, article: newArticle, invitationsQueued: invitees.length > 0 });
  } catch (error) {
    console.error('Save article error:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// List Articles
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { role, uid } = req.user!;
    let articles: any[] = [];

    if (role === 'author') {
      const snapshot = await db.collection('articles').where('participantIds', 'array-contains', uid).get();
      articles = snapshot.docs.map(doc => doc.data());
    } else if (role === 'reviewer') {
      // Get articles where user is one of the assigned reviewerIds concurrently
      const [snapshotByArray, snapshotBySingle] = await Promise.all([
        db.collection('articles').where('reviewerIds', 'array-contains', uid).get(),
        db.collection('articles').where('reviewerId', '==', uid).get()
      ]);
      
      const articleMap = new Map();
      snapshotByArray.docs.forEach(doc => articleMap.set(doc.id, doc.data()));
      snapshotBySingle.docs.forEach(doc => articleMap.set(doc.id, doc.data()));
      articles = Array.from(articleMap.values());
    } else if (role === 'reader') {
      const snapshot = await db.collection('articles').where('status', '==', 'accepted').get();
      articles = snapshot.docs.map(doc => doc.data());
    } else if (role === 'admin') {
      const snapshot = await db.collection('articles').get();
      articles = snapshot.docs.map(doc => doc.data());
    }

    // Standard mapping and sorting
    articles = articles.map(data => {
      // Legacy mapping
      if (!data.authors && data.authorId) {
        data.authors = [
          { 
            userId: data.authorId, 
            name: 'Original Author', 
            email: '', 
            role: 'submitter', 
            accepted: true, 
            acceptedAt: data.createdAt 
          }
        ];
      }
      return data;
    });

    // In-memory sort since we can't use composite index easily
    articles.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      
      const timeA = dateA && dateA._seconds ? dateA._seconds : (dateA ? Math.floor(new Date(dateA).getTime() / 1000) : 0);
      const timeB = dateB && dateB._seconds ? dateB._seconds : (dateB ? Math.floor(new Date(dateB).getTime() / 1000) : 0);
      
      return timeB - timeA;
    });

    // Double-blind data stripping based on role
    articles = articles.map(art => {
      const sanitized = { ...art };
      if (role === 'reviewer') {
        // Strip Author details (Reviewers cannot know the Author)
        delete sanitized.authorId;
        delete sanitized.authors;
        delete sanitized.participantIds;
        if (sanitized.author) {
          sanitized.author = 'Anonymous Author';
        }
        // Only expose their own review feedback
        if (sanitized.reviews) {
          sanitized.reviewerFeedback = sanitized.reviews[uid] || null;
          delete sanitized.reviews;
        }
      } else if (role === 'author') {
        // Strip Reviewer details (Authors cannot know the Reviewers)
        delete sanitized.reviewerId;
        delete sanitized.reviewerIds;
        delete sanitized.assignedReviewers;
        
        // Anonymize the reviews
        if (sanitized.reviews) {
          const anonymousReviews: any = {};
          let idx = 1;
          for (const key of Object.keys(sanitized.reviews)) {
            const review = sanitized.reviews[key];
            anonymousReviews[`Reviewer ${idx}`] = {
              remarks: review.remarks,
              recommendation: review.recommendation,
              reviewedFile: review.reviewedFile,
              updatedAt: review.updatedAt
            };
            idx++;
          }
          sanitized.reviews = anonymousReviews;
        }
        // Anonymize legacy reviewerFeedback
        if (sanitized.reviewerFeedback) {
          sanitized.reviewerFeedback = {
            remarks: sanitized.reviewerFeedback.remarks,
            recommendation: sanitized.reviewerFeedback.recommendation
          };
        }
      } else if (role === 'admin') {
        // Expose reviews but also populate reviewerFeedback with the latest review for backward-compatibility
        if (sanitized.reviews && Object.keys(sanitized.reviews).length > 0) {
          const reviewList = Object.values(sanitized.reviews).sort((a: any, b: any) => {
            const getTimestamp = (val: any) => {
              if (!val) return 0;
              if (typeof val.toDate === 'function') return val.toDate().getTime();
              if (val._seconds) return val._seconds * 1000;
              if (val instanceof Date) return val.getTime();
              if (typeof val === 'string') return new Date(val).getTime();
              return 0;
            };
            return getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt);
          });
          sanitized.reviewerFeedback = reviewList[0];
        } else {
          sanitized.reviewerFeedback = null;
        }
      }
      return sanitized;
    });

    res.json({ success: true, articles });
  } catch (error) {
    console.error('List articles error:', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

// Delete Article (Author only, and only if draft or submitted)
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { uid, role } = req.user!;

    const articleRef = db.collection('articles').doc(id);
    const doc = await articleRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = doc.data()!;

    // Security check: Only author can delete, and only if not yet under review/accepted
    if (role !== 'admin' && article.authorId !== uid) {
      return res.status(403).json({ error: 'Unauthorized to delete this article' });
    }

    if (role !== 'admin' && !['draft', 'submitted', 'revised_submitted'].includes(article.status)) {
       return res.status(400).json({ error: 'Cannot delete article that is already under review or published' });
    }

    // Cleanup Cloudinary thumbnail if exists
    if (article.thumbnailPublicId) {
      await deleteImage(article.thumbnailPublicId);
    }

    // Cleanup PDF from R2
    if (article.pdfUrl) {
      try {
        await deletePdfFromR2(article.pdfUrl);
      } catch (err: any) {
        console.error(`[ROUTE-CLEANUP] Failed to delete main PDF ${article.pdfUrl} from R2:`, err.message || err);
      }
    }

    // Cleanup PDFs in revisionHistory from R2
    if (Array.isArray(article.revisionHistory)) {
      for (const rev of article.revisionHistory) {
        if (rev.pdfUrl) {
          try {
            await deletePdfFromR2(rev.pdfUrl);
          } catch (err: any) {
            console.error(`[ROUTE-CLEANUP] Failed to delete revision PDF ${rev.pdfUrl} from R2:`, err.message || err);
          }
        }
      }
    }

    // Cleanup invitations subcollection to prevent orphaned subcollection items
    const invitationsSnapshot = await articleRef.collection('invitations').get();
    if (!invitationsSnapshot.empty) {
      const inviteBatch = db.batch();
      invitationsSnapshot.docs.forEach(inviteDoc => {
        inviteBatch.delete(inviteDoc.ref);
      });
      await inviteBatch.commit();
      console.log(`[ROUTE-CLEANUP] Cleaned up ${invitationsSnapshot.size} co-author invitations for article ${id}`);
    }

    // Cleanup notifications related to this article
    const notificationsSnapshot = await db.collection('notifications')
      .where('metadata.articleId', '==', id)
      .get();
    if (!notificationsSnapshot.empty) {
      const notifBatch = db.batch();
      notificationsSnapshot.docs.forEach(notifDoc => {
        notifBatch.delete(notifDoc.ref);
      });
      await notifBatch.commit();
      console.log(`[ROUTE-CLEANUP] Cleaned up ${notificationsSnapshot.size} notifications for article ${id}`);
    }

    await articleRef.delete();
    res.json({ success: true, message: 'Article deleted successfully' });

  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Get Published Articles (Public endpoint)
router.get('/published', async (req, res) => {
  try {
    const snapshot = await db.collection('articles').where('status', '==', 'published').get();
    const articles = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.articleId,
        title: data.title,
        abstract: data.abstract,
        author: data.authors && data.authors.length > 0 ? data.authors[0].name : 'Old BKMA Contributor',
        authorId: data.authors && data.authors.length > 0 ? (data.authors[0].userId || data.authorId || null) : (data.authorId || null),
        authors: data.authors || [],
        isOld: data.isOld || false,
        createdAt: data.createdAt,
        issueId: data.issueId,
        vol: data.volume || 1,
        volume: data.volume,
        monthYear: data.monthYear,
        issueNumber: data.issueNumber,
        issn: data.issn,
        date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Recent',
        tag: data.tag || 'Scholarly',
        pdfAvailable: !!data.pdfUrl,
        fullContent: data.abstract // fallback content
      };
    });
    res.json({ success: true, articles });
  } catch (error) {
    console.error('Get published articles error:', error);
    res.status(500).json({ error: 'Failed to retrieve published articles' });
  }
});

// Get Single Article Details (with strict role-based access control and public abstract metadata fallback)
router.get('/:id', async (req: Request, res) => {
  try {
    const id = req.params.id as string;

    const articleDoc = await db.collection('articles').doc(id).get();
    if (!articleDoc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = articleDoc.data()!;

    // Optional Authentication check to see who is requesting
    let uid: string | null = null;
    let role = 'guest';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
        role = decoded.role || 'reader';
      } catch (err: any) {
        console.warn('Optional auth token verification failed:', err.message);
      }
    }

    let hasAccess = false;

    // Admin always has access
    if (role === 'admin') hasAccess = true;

    // Reviewer has access only if assigned
    if (role === 'reviewer' && uid) {
      const isAssigned = (Array.isArray(article.reviewerIds) && article.reviewerIds.includes(uid)) || (article.reviewerId === uid);
      if (isAssigned) {
        hasAccess = true;
      }
    }

    // Author has access if participant
    if (role === 'author' && uid) {
      const isParticipant = article.authorId === uid || (Array.isArray(article.participantIds) && article.participantIds.includes(uid));
      if (isParticipant) {
        hasAccess = true;
      }
    }

    // Reader/Guest access verification (only if published)
    const isPublished = article.status === 'published' || article.status === 'accepted';
    if (isPublished) {
      // Published articles are freely accessible to any authenticated user.
      hasAccess = true;
    } else {
      // If not published, only authorized roles (admins/reviewers/authors checked above) can view it
      if (!hasAccess) {
        return res.status(403).json({ error: 'Article not published yet' });
      }
    }

    // Double-blind reviewer metadata sanitization
    const sanitized = { ...article };
    if (role === 'reviewer' && uid) {
      delete sanitized.authorId;
      delete sanitized.authors;
      delete sanitized.participantIds;
      if (sanitized.author) {
        sanitized.author = 'Anonymous Author';
      }
      if (sanitized.reviews) {
        sanitized.reviewerFeedback = sanitized.reviews[uid] || null;
        delete sanitized.reviews;
      }
    } else if (role === 'author' && uid) {
      delete sanitized.reviewerId;
      delete sanitized.reviewerIds;
      delete sanitized.assignedReviewers;
      
      if (sanitized.reviews) {
        const anonymousReviews: any = {};
        let idx = 1;
        for (const key of Object.keys(sanitized.reviews)) {
          const review = sanitized.reviews[key];
          anonymousReviews[`Reviewer ${idx}`] = {
            remarks: review.remarks,
            recommendation: review.recommendation,
            reviewedFile: review.reviewedFile,
            updatedAt: review.updatedAt
          };
          idx++;
        }
        sanitized.reviews = anonymousReviews;
      }
      if (sanitized.reviewerFeedback) {
        sanitized.reviewerFeedback = {
          remarks: sanitized.reviewerFeedback.remarks,
          recommendation: sanitized.reviewerFeedback.recommendation
        };
      }
    } else if (role === 'admin') {
      if (sanitized.reviews && Object.keys(sanitized.reviews).length > 0) {
        const reviewList = Object.values(sanitized.reviews).sort((a: any, b: any) => {
          const getTimestamp = (val: any) => {
            if (!val) return 0;
            if (typeof val.toDate === 'function') return val.toDate().getTime();
            if (val._seconds) return val._seconds * 1000;
            if (val instanceof Date) return val.getTime();
            if (typeof val === 'string') return new Date(val).getTime();
            return 0;
          };
          return getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt);
        });
        sanitized.reviewerFeedback = reviewList[0];
      } else {
        sanitized.reviewerFeedback = null;
      }
    }

    // Apply subscription check restrictions
    if (!hasAccess) {
      // Hide full text and PDF keys for non-subscribers
      delete sanitized.pdfUrl;
      delete sanitized.pdfName;
      delete sanitized.fullContent;
      sanitized.hasAccess = false;
    } else {
      sanitized.hasAccess = true;
    }

    res.json({ success: true, article: sanitized });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to retrieve article details' });
  }
});

// Get Signed PDF URL for public Tribute/Obituary articles (no auth required)
router.get('/:id/pdf-public', async (req, res) => {
  try {
    const id = req.params.id as string;
    const articleDoc = await db.collection('articles').doc(id).get();
    if (!articleDoc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = articleDoc.data()!;
    const isTribute = /obituary|tribute|in memoriam/i.test(article.title || '') ||
      /obituary|tribute/i.test(article.tag || '');

    if (!isTribute) {
      return res.status(403).json({ error: 'Forbidden: This document is not publicly accessible without authentication.' });
    }

    const key = article.pdfUrl;
    if (!key) {
      return res.status(400).json({ error: 'No document has been uploaded for this article' });
    }

    const originalName = article.pdfName || 'manuscript.pdf';
    const signedUrl = await getSignedPdfUrl(key, originalName);
    res.json({ success: true, url: signedUrl });
  } catch (error) {
    console.error('Get public PDF URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Get Signed PDF URL (requires active subscription or purchase)
router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { role, uid } = req.user!;

    const articleDoc = await db.collection('articles').doc(id).get();
    if (!articleDoc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = articleDoc.data()!;

    // Access control check
    let hasAccess = false;
    if (role === 'admin') hasAccess = true;

    if (role === 'reviewer') {
      const isAssigned = (Array.isArray(article.reviewerIds) && article.reviewerIds.includes(uid)) || (article.reviewerId === uid);
      if (isAssigned) {
        hasAccess = true;
      } else {
        return res.status(403).json({ error: 'Article not assigned to you' });
      }
    }

    if (role === 'author') {
      const isParticipant = article.authorId === uid || (Array.isArray(article.participantIds) && article.participantIds.includes(uid));
      if (isParticipant) {
        hasAccess = true;
      } else {
        return res.status(403).json({ error: 'Forbidden: You are not an author of this article' });
      }
    }

    if (role === 'reader') {
      const isPublished = article.status === 'published' || article.status === 'accepted';
      if (!isPublished) {
        return res.status(403).json({ error: 'Article not published yet' });
      }

      // Published articles are freely readable by any authenticated reader.
      // Subscriptions / purchases are only required for premium gated content (future feature).
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Requires active subscription or article purchase' });
    }

    const key = (req.query.key as string) || article.pdfUrl;

    if (!key) {
      return res.status(400).json({ error: 'No document has been uploaded for this article' });
    }

    // Security check: ensure the requested key is associated with this article
    let keyValid = (key === article.pdfUrl);
    let originalName = article.pdfName || 'manuscript.pdf';

    if (!keyValid && Array.isArray(article.revisionHistory)) {
      const matchingRev = article.revisionHistory.find((rev: any) => rev.pdfUrl === key);
      if (matchingRev) {
        keyValid = true;
        originalName = matchingRev.pdfName || 'revision_manuscript.pdf';
      }
    }

    if (!keyValid && article.reviews) {
      const matchingReview = Object.values(article.reviews).find((rev: any) => rev.reviewedFile === key) as any;
      if (matchingReview) {
        keyValid = true;
        originalName = matchingReview.reviewedFileName || 'reviewer_assessment.pdf';
      }
    }

    if (!keyValid) {
      return res.status(403).json({ error: 'Forbidden: Requested file key does not belong to this article' });
    }

    const signedUrl = await getSignedPdfUrl(key, originalName);
    res.json({ success: true, url: signedUrl });

  } catch (error) {
    console.error('Get PDF URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Update Article (Author only)
// Enforces status-based edit restrictions:
// - draft: full editing allowed (title, abstract, category, pdf, thumbnail)
// - revision_requested: only abstract and pdf can be updated; title is locked
// - all other statuses: editing is blocked entirely
router.put('/:id', requireAuth, requireRole(['author']), upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { title, abstract, status = 'draft' } = req.body;
    const authorId = req.user!.uid;

    const articleRef = db.collection('articles').doc(id);
    const doc = await articleRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = doc.data()!;

    // Ownership check
    if (article.authorId !== authorId) {
      return res.status(403).json({ error: 'Unauthorized to update this article' });
    }

    // Status-based edit restriction
    const currentStatus = article.status;
    const editableStatuses = ['draft', 'revision_requested'];

    if (!editableStatuses.includes(currentStatus)) {
      return res.status(403).json({ 
        error: `Editing is not allowed when article status is "${currentStatus}". Editing is only permitted for drafts or when revision is requested.` 
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const pdfFile = files?.pdf?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    const { includeAcceptedOnly, forceSubmitWithoutRejected, submissionNotes } = req.body;

    let updateData: any = { updatedAt: new Date() };

    // Invitation Check for Final Submission
    if (status === 'submitted') {
      const invitationsSnapshot = await articleRef.collection('invitations').get();
      const invitations = invitationsSnapshot.docs.map(doc => doc.data());
      
      const pendingInvites = invitations.filter(i => i.status === 'pending');
      const rejectedInvites = invitations.filter(i => i.status === 'rejected');

      if (pendingInvites.length > 0 && !includeAcceptedOnly) {
        return res.status(400).json({ 
          error: 'Cannot submit article with pending invitations. Please wait for responses or choose to proceed without pending co-authors.',
          pendingCount: pendingInvites.length 
        });
      }

      if (rejectedInvites.length > 0 && !forceSubmitWithoutRejected) {
        return res.status(400).json({ 
          error: 'There are rejected invitations. Please re-invite these authors or explicitly confirm you want to proceed without them.',
          rejectedCount: rejectedInvites.length
        });
      }

      // Record Draft Resolution if forced or filtered
      if (includeAcceptedOnly || forceSubmitWithoutRejected) {
        updateData.draftResolution = {
          type: 'forceSubmit',
          who: authorId,
          at: new Date(),
          reason: submissionNotes || (forceSubmitWithoutRejected ? 'Proceeded without rejected co-authors' : 'Proceeded with accepted co-authors only'),
          pendingAtSubmit: pendingInvites.map(i => i.inviteeEmail || 'Unknown Email'),
          rejectedAtSubmit: rejectedInvites.map(i => i.inviteeEmail || 'Unknown Email')
        };
      }
    }

    if (currentStatus === 'revision_requested') {
      // REVISION MODE: Only abstract and PDF can be updated. Title is locked.
      if (title && title !== article.title) {
        return res.status(403).json({ 
          error: 'Title cannot be modified after submission. Only abstract and document can be updated during revision.' 
        });
      }

      updateData.abstract = abstract || article.abstract;

      // Store revision history before overwriting PDF
      if (pdfFile) {
        const revisionHistory = article.revisionHistory || [];
        if (article.pdfUrl) {
          revisionHistory.push({
            version: revisionHistory.length + 1,
            pdfUrl: article.pdfUrl,
            pdfName: article.pdfName,
            replacedAt: new Date(),
            abstract: article.abstract
          });
          updateData.revisionHistory = revisionHistory;
        }

        const objectKey = await uploadPdfToR2(pdfFile.buffer, pdfFile.originalname, authorId);
        updateData.pdfUrl = objectKey;
        updateData.pdfName = pdfFile.originalname;
      }

      // Only resubmit to revised_submitted when status is submitted or revised_submitted. Otherwise, keep it as revision_requested.
      if (status === 'submitted' || status === 'revised_submitted') {
        updateData.status = 'revised_submitted';
      } else {
        updateData.status = 'revision_requested';
      }

    } else {
      // DRAFT MODE: Full editing allowed (Continuity flow)
      if (title) updateData.title = title;
      if (abstract) updateData.abstract = abstract;
      updateData.status = status;

      if (pdfFile) {
        // Delete old draft PDF from R2 to prevent orphaned storage objects
        if (article.pdfUrl) {
          try {
            await deletePdfFromR2(article.pdfUrl);
          } catch (err: any) {
            console.error(`[ROUTE-CLEANUP] Failed to delete old draft PDF ${article.pdfUrl} from R2:`, err.message || err);
          }
        }
        const objectKey = await uploadPdfToR2(pdfFile.buffer, pdfFile.originalname, authorId);
        updateData.pdfUrl = objectKey;
        updateData.pdfName = pdfFile.originalname;
      }

      if (thumbnailFile) {
        // Delete old thumbnail
        if (article.thumbnailPublicId) {
          await deleteImage(article.thumbnailPublicId);
        }
        
        // Upload new thumbnail
        const uploadResult = await uploadImage(thumbnailFile.buffer, 'articles');
        updateData.thumbnail = uploadResult.secure_url;
        updateData.thumbnailPublicId = uploadResult.public_id;
      }
    }

    await articleRef.update(updateData);

    if ((updateData.status === 'submitted' || updateData.status === 'revised_submitted') && 
        (currentStatus !== 'submitted' && currentStatus !== 'revised_submitted')) {
      sendArticleSubmittedNotifications(id).catch(err => {
        console.error('Failed to trigger submission notifications on article update:', err);
      });
    }

    // Fetch latest data for summary if submitted
    let summary = null;
    if (updateData.status === 'submitted' || updateData.status === 'revised_submitted') {
      const invitationsSnapshot = await articleRef.collection('invitations').get();
      const invitations = invitationsSnapshot.docs.map(doc => doc.data());
      const updatedArticle = (await articleRef.get()).data()!;
      
      summary = {
        included: updatedArticle.authors.filter((a: any) => a.accepted),
        pending: invitations.filter((i: any) => i.status === 'pending'),
        rejected: invitations.filter((i: any) => i.status === 'rejected')
      };
    }

    res.json({ 
      success: true, 
      message: currentStatus === 'revision_requested' ? 'Revision submitted successfully' : 'Article updated successfully',
      submissionSummary: summary
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Admin Extract Metadata from Full PDF for Legacy Import
router.post('/import-extract', requireAuth, requireRole(['admin']), upload.single('pdf'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const { ranges } = req.body;
    let parsedRanges = [];
    try {
      parsedRanges = JSON.parse(ranges);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid ranges format. Must be JSON array of { startPage: number, endPage: number }' });
    }

    if (!Array.isArray(parsedRanges) || parsedRanges.length === 0) {
      return res.status(400).json({ error: 'At least one page range is required' });
    }

    const results = [];
    const fullPdfBuffer = req.file.buffer;

    for (const range of parsedRanges) {
      const { startPage, endPage } = range;
      try {
        // 1. Split page 1 to parse text efficiently
        const page1Buffer = await extractPages(fullPdfBuffer, startPage, startPage);
        // 2. Extract text from page 1
        const text = await extractFirstPageText(page1Buffer);
        // 3. Extract structured metadata using Gemini
        const metadata = await extractMetadataWithGemini(text);

        results.push({
          startPage,
          endPage,
          ...metadata
        });
      } catch (err: any) {
        console.error(`Failed to extract metadata for range ${startPage}-${endPage}:`, err);
        results.push({
          startPage,
          endPage,
          title: '',
          abstract: '',
          authors: [],
          keywords: [],
          subjectClassification: '',
          error: err.message || 'Extraction failed'
        });
      }
    }

    res.json({ success: true, extracted: results });
  } catch (error: any) {
    console.error('Import extract error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract metadata' });
  }
});

// Admin Import & Split Legacy Issue
router.post('/import-split', requireAuth, requireRole(['admin']), upload.single('pdf'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const { volumeNo, monthYear, issueNumber, issn, articlesJson } = req.body;
    if (!volumeNo || !monthYear || !issueNumber || !articlesJson) {
      return res.status(400).json({ error: 'Volume No, Month & Year, Issue Number, and Articles data are required' });
    }

    const parsedIssueNumber = parseInt(issueNumber, 10);
    if (isNaN(parsedIssueNumber) || parsedIssueNumber <= 0) {
      return res.status(400).json({ error: 'Issue Number must be a positive integer' });
    }

    let parsedArticles = [];
    try {
      parsedArticles = JSON.parse(articlesJson);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid articles JSON format' });
    }

    const fullPdfBuffer = req.file.buffer;
    const authorId = 'admin_ingested';

    const docId = `vol_${volumeNo}_issue_${parsedIssueNumber}_${monthYear.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const issueRef = db.collection('issues').doc(docId);

    const createdArticleIds: string[] = [];

    await db.runTransaction(async (transaction) => {
      const issueDoc = await transaction.get(issueRef);
      if (issueDoc.exists) {
        throw new Error('This publication issue already exists. Please use a different Volume or Issue Number.');
      }

      for (let i = 0; i < parsedArticles.length; i++) {
        const art = parsedArticles[i];
        const { title, abstract, authors, keywords, startPage, endPage, category, subjectClassification } = art;

        // Extract PDF pages
        const splitBuffer = await extractPages(fullPdfBuffer, startPage, endPage);

        // Upload split PDF
        const originalName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}_p${startPage}_p${endPage}.pdf`;
        const objectKey = await uploadPdfToR2(splitBuffer, originalName, authorId);

        // Save article doc
        const articleRef = db.collection('articles').doc();
        const finalAuthors = (authors || []).map((au: any, idx: number) => ({
          userId: au.userId || `legacy_${articleRef.id}_${idx}`,
          name: au.name,
          email: au.email || '',
          affiliation: au.affiliation || '',
          role: idx === 0 ? 'submitter' : 'coauthor',
          accepted: true,
          acceptedAt: new Date()
        }));

        const newArticle = {
          articleId: articleRef.id,
          title,
          abstract,
          authorId,
          participantIds: [authorId],
          authors: finalAuthors,
          reviewerId: null,
          status: 'published',
          pdfUrl: objectKey,
          pdfName: originalName,
          issueId: issueRef.id,
          volume: volumeNo,
          volumeNo: volumeNo,
          monthYear: monthYear,
          issueNumber: parsedIssueNumber,
          issn: issn || null,
          isOld: true,
          category: category || 'Mathematics',
          subjectClassification: subjectClassification || '',
          keywords: keywords || [],
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        transaction.set(articleRef, newArticle);
        createdArticleIds.push(articleRef.id);
      }

      const newIssue = {
        issueId: issueRef.id,
        title: `Volume ${volumeNo}, Issue ${parsedIssueNumber} (${monthYear})`,
        volume: volumeNo,
        issueNumber: parsedIssueNumber,
        monthYear: monthYear,
        issn: issn || null,
        articleIds: createdArticleIds,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      transaction.set(issueRef, newIssue);
    });

    res.json({ success: true, publishedCount: createdArticleIds.length, issueId: issueRef.id });
  } catch (error: any) {
    console.error('Import split error:', error);
    res.status(500).json({ error: error.message || 'Failed to split and import articles' });
  }
});

// Admin Bulk Publish Articles
router.patch('/bulk-publish', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { articleIds, volumeNo, monthYear, issueNumber, issn } = req.body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ error: 'Article IDs are required and must be a non-empty array' });
    }

    if (!volumeNo || !monthYear || issueNumber === undefined) {
      return res.status(400).json({ error: 'Volume Number, Month & Year, and Issue Number are required' });
    }

    const parsedIssueNumber = parseInt(issueNumber, 10);
    if (isNaN(parsedIssueNumber) || parsedIssueNumber <= 0) {
      return res.status(400).json({ error: 'Issue Number must be a positive integer' });
    }

    // Deterministic issue ID derived from volume, monthYear, and issueNumber
    const docId = `vol_${volumeNo}_issue_${parsedIssueNumber}_${monthYear.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const issueRef = db.collection('issues').doc(docId);

    await db.runTransaction(async (transaction) => {
      // Check if the issue already exists
      const issueDoc = await transaction.get(issueRef);
      if (issueDoc.exists) {
        throw new Error('This publication issue already exists. Please use a different Volume or Issue Number.');
      }

      // Fetch all requested articles
      const docRefs = articleIds.map(id => db.collection('articles').doc(id));
      const articleDocs = await Promise.all(docRefs.map(ref => transaction.get(ref)));

      const successfulArticleIds: string[] = [];
      let publishedCount = 0;

      articleDocs.forEach((doc) => {
        const id = doc.id;
        if (!doc.exists) {
          throw new Error(`Article ${id} not found`);
        }

        const data = doc.data()!;
        if (data.status === 'published') {
          throw new Error(`Article ${id} is already published`);
        }

        const isApprovedUnderReview = 
          data.status === 'under_review' && 
          data.reviewerFeedback && 
          (data.reviewerFeedback.recommendation === 'Approved' || data.reviewerFeedback.recommendation === 'Accepted');
        
        const isReadyToPublish = data.status === 'accepted' || isApprovedUnderReview;

        if (!isReadyToPublish) {
          throw new Error(`Article ${id} is not ready to publish`);
        }

        transaction.update(doc.ref, {
          status: 'published',
          issueId: issueRef.id,
          volume: volumeNo,
          volumeNo: volumeNo,
          monthYear: monthYear,
          issueNumber: parsedIssueNumber,
          issn: issn || null,
          publishedAt: new Date(),
          updatedAt: new Date()
        });

        successfulArticleIds.push(id);
        publishedCount++;
      });

      if (publishedCount > 0) {
        const newIssue = {
          issueId: issueRef.id,
          title: `Volume ${volumeNo}, Issue ${parsedIssueNumber} (${monthYear})`,
          volume: volumeNo,
          issueNumber: parsedIssueNumber,
          monthYear: monthYear,
          issn: issn || null,
          articleIds: successfulArticleIds,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        transaction.set(issueRef, newIssue);
      }
    });

    res.json({
      success: true,
      publishedCount: articleIds.length,
      failures: []
    });
  } catch (error: any) {
    console.error('Bulk publish transaction error:', error);
    res.status(400).json({ error: error.message || 'Failed to bulk publish articles' });
  }
});

// Admin Assign Reviewer
router.patch('/:id/assign', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { reviewerIds, reviewerNames, reviewDeadline, reviewerNote } = req.body;

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return res.status(400).json({ error: 'At least one reviewer ID is required' });
    }

    const articleRef = db.collection('articles').doc(id);
    const doc = await articleRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const articleData = doc.data()!;
    const pastReviews = articleData.pastReviews || [];

    // Archive current reviews if they exist
    if (articleData.reviews && Object.keys(articleData.reviews).length > 0) {
      const roundNumber = (articleData.revisionHistory?.length || 0) + 1;
      pastReviews.push({
        round: roundNumber,
        assignedAt: articleData.assignedAt || articleData.createdAt || new Date(),
        reviews: articleData.reviews
      });
    }

    await articleRef.update({
      reviewerIds: reviewerIds,
      assignedReviewers: reviewerNames || [],
      // For backward compatibility:
      reviewerId: reviewerIds[0],
      status: 'under_review',
      updatedAt: new Date(),
      
      // Store deadline and timeline details
      reviewDeadline: reviewDeadline || null,
      assignedAt: new Date(),
      assignedBy: req.user?.name || req.user?.email || 'Admin',
      reviewerNote: reviewerNote || null,
      sentReminders: [], // reset reminders for new assignment
      
      // Clear current reviews for the new round
      reviews: {},
      pastReviews: pastReviews
    });

    sendReviewerAssignedNotifications(id, reviewerIds).catch(err => {
      console.error('Failed to trigger reviewer assigned notifications:', err);
    });

    res.json({ success: true, message: 'Reviewers assigned successfully' });
  } catch (error: any) {
    console.error('Assign reviewer error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign reviewer' });
  }
});

// Reviewer/Admin Update Status
router.patch('/:id/status', requireAuth, requireRole(['admin', 'reviewer']), upload.single('reviewedFile'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { role, uid } = req.user!;
    const { status, rejectionReason, adminNote, remarks, recommendation, reviewedFile } = req.body;

    const articleRef = db.collection('articles').doc(id);
    const doc = await articleRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (role === 'reviewer') {
      const reviewerName = req.user!.name || 'Reviewer';
      const articleData = doc.data();
      const title = articleData?.title || 'Untitled Article';
      const normalizedRecommendation = normalizeRecommendation(recommendation || '');

      if (['Rejected', 'Needs Improvement'].includes(normalizedRecommendation)) {
        if (!remarks || !remarks.trim()) {
          return res.status(400).json({ error: 'Please provide reviewer comments explaining your decision for Rejection or Needs Revision.' });
        }
      }

      let reviewedFileKey = null;
      let reviewedFileName = null;
      if (req.file) {
        reviewedFileKey = await uploadPdfToR2(req.file.buffer, req.file.originalname, uid, req.file.mimetype);
        reviewedFileName = req.file.originalname;
      }

      // Reviewer logs their own feedback in the 'reviews' map
      await articleRef.update({
        [`reviews.${uid}`]: {
          remarks: remarks || '',
          recommendation: normalizedRecommendation,
          reviewedFile: reviewedFileKey || reviewedFile || null,
          reviewedFileName: reviewedFileName || null,
          reviewerName,
          updatedAt: new Date()
        },
        updatedAt: new Date()
      });

      // Send high-priority notifications to all Admins
      try {
        const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        if (!adminsSnapshot.empty) {
          const batch = db.batch();
          adminsSnapshot.docs.forEach(adminDoc => {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
              notificationId: notifRef.id,
              userId: adminDoc.id,
              type: 'REVIEW_SUBMITTED',
              title: 'Review Recommendation Submitted',
              message: `Reviewer ${reviewerName} has submitted a recommendation ("${normalizedRecommendation || 'None'}") for "${title}".`,
              metadata: { articleId: id },
              read: false,
              createdAt: new Date()
            });
          });
          await batch.commit();
        }
      } catch (notifErr) {
        console.error('Failed to send admin notifications:', notifErr);
      }
    } else if (role === 'admin') {
      const articleData = doc.data()!;
      const reviewsList = articleData.reviews ? Object.values(articleData.reviews) : [];
      const isOverdue = articleData.reviewDeadline ? new Date() > new Date(articleData.reviewDeadline) : false;

      // Validate workflow transitions
      if (status === 'accepted') {
        const hasAccepted = reviewsList.some((r: any) => ['Approved', 'Accepted'].includes(r.recommendation));
        if (!hasAccepted && !isOverdue) {
          return res.status(400).json({ error: 'Cannot move to publish list: At least one reviewer must accept the manuscript, or the review deadline must have expired.' });
        }
      }

      if (status === 'revision_requested') {
        const hasRevisionOrReject = reviewsList.some((r: any) => ['Rejected', 'Needs Improvement', 'Need Improvements'].includes(r.recommendation));
        if (!hasRevisionOrReject && !isOverdue) {
          return res.status(400).json({ error: 'Cannot send back to author: At least one reviewer must recommend revision or rejection, or the review deadline must have expired.' });
        }
      }

      if (status === 'rejected') {
        const hasReject = reviewsList.some((r: any) => r.recommendation === 'Rejected');
        if (!hasReject && !isOverdue) {
          return res.status(400).json({ error: 'Cannot reject article: At least one reviewer must recommend rejection, or the review deadline must have expired.' });
        }
      }

      // Admin updates article overall status/finalizes decision
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'rejected' || status === 'desk_rejected') {
        updateData.rejectedAt = new Date();
      }

      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
      if (adminNote !== undefined) updateData.adminNote = adminNote;

      await articleRef.update(updateData);

      // Trigger notifications based on status
      if (status === 'revision_requested') {
        sendRevisionRequestedNotifications(id, adminNote).catch(err => {
          console.error('Failed to trigger revision requested notifications:', err);
        });
      } else if (status === 'desk_rejected') {
        sendArticleRejectedNotifications(id, true, rejectionReason).catch(err => {
          console.error('Failed to trigger desk rejection notifications:', err);
        });
      } else if (status === 'rejected') {
        sendArticleRejectedNotifications(id, false, rejectionReason).catch(err => {
          console.error('Failed to trigger rejection notifications:', err);
        });
      }
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// --- INVITATION ENDPOINTS ---

// Create/Reset Invitation for an Article
router.post('/:id/invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { inviteeUserId } = req.body;
    const inviterUserId = req.user!.uid;
    const inviterName = req.user!.name || 'Author';

    const articleRef = db.collection('articles').doc(id);
    const articleDoc = await articleRef.get();
    if (!articleDoc.exists) return res.status(404).json({ error: 'Article not found' });
    const articleData = articleDoc.data()!;

    // Only submitter can invite
    if (articleData.authorId !== inviterUserId) {
      return res.status(403).json({ error: 'Only the submitter can invite co-authors' });
    }

    // Fetch invitee details
    const inviteeDoc = await db.collection('users').doc(inviteeUserId).get();
    if (!inviteeDoc.exists) return res.status(404).json({ error: 'Invitee not found' });
    const inviteeData = inviteeDoc.data()!;

    // Check if invitation already exists for this user
    const invitationsSnapshot = await articleRef.collection('invitations')
      .where('inviteeUserId', '==', inviteeUserId)
      .limit(1)
      .get();

    let inviteRef;
    let oldInvitation: any = null;

    if (!invitationsSnapshot.empty) {
      inviteRef = invitationsSnapshot.docs[0].ref;
      oldInvitation = invitationsSnapshot.docs[0].data();
    } else {
      inviteRef = articleRef.collection('invitations').doc();
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation: any = {
      inviteId: inviteRef.id,
      inviteeUserId,
      inviteeEmail: inviteeData.email,
      inviteeName: inviteeData.name,
      inviterUserId,
      token,
      status: 'pending',
      invitedAt: new Date(),
      expiresAt,
      history: (oldInvitation?.history || []).concat([{ action: 'sent', at: new Date(), note: 'Invitation created/reset' }])
    };

    await inviteRef.set(invitation);

    // Create Notification
    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      notificationId: notificationRef.id,
      userId: inviteeUserId,
      type: 'INVITATION_SENT',
      title: 'Co-author Invitation',
      message: `${inviterName} has invited you to co-author the article "${articleData.title}".`,
      metadata: { articleId: id, inviteId: inviteRef.id, token },
      read: false,
      createdAt: new Date()
    });

    // Ensure user is in authors array as pending
    const authors = articleData.authors || [];
    const authorIdx = authors.findIndex((a: any) => a.userId === inviteeUserId);
    if (authorIdx === -1) {
      authors.push({
        userId: inviteeUserId,
        name: inviteeData.name,
        email: inviteeData.email,
        role: 'coauthor',
        accepted: false,
        invitedAt: new Date()
      });
    } else {
      authors[authorIdx].accepted = false;
      authors[authorIdx].invitedAt = new Date();
    }

    await articleRef.update({ 
      authors,
      status: 'draft' // Lock to draft if new invitation sent
    });

    res.json({ success: true, inviteId: inviteRef.id, token });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// Resend Invitation
router.post('/:id/invitations/:inviteId/resend', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const inviteId = req.params.inviteId as string;
    const inviterUserId = req.user!.uid;
    const inviterName = req.user!.name || 'Author';

    const articleRef = db.collection('articles').doc(id);
    const articleDoc = await articleRef.get();
    if (!articleDoc.exists) return res.status(404).json({ error: 'Article not found' });
    const articleData = articleDoc.data()!;

    if (articleData.authorId !== inviterUserId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const inviteRef = articleRef.collection('invitations').doc(inviteId);
    const inviteDoc = await inviteRef.get();
    if (!inviteDoc.exists) return res.status(404).json({ error: 'Invitation not found' });
    const inviteData = inviteDoc.data()!;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updateData = {
      token,
      status: 'pending',
      invitedAt: new Date(),
      expiresAt,
      history: inviteData.history.concat([{ action: 'resend', at: new Date() }])
    };

    await inviteRef.update(updateData);

    // Create Notification
    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      notificationId: notificationRef.id,
      userId: inviteData.inviteeUserId,
      type: 'INVITATION_SENT',
      title: 'Co-author Invitation (Resent)',
      message: `${inviterName} has resent the invitation to co-author "${articleData.title}".`,
      metadata: { articleId: id, inviteId, token },
      read: false,
      createdAt: new Date()
    });

    res.json({ success: true, token });
  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
});

// List Invitations for an Article
router.get('/:id/invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const uid = req.user!.uid;

    const articleDoc = await db.collection('articles').doc(id).get();
    if (!articleDoc.exists) return res.status(404).json({ error: 'Article not found' });
    const articleData = articleDoc.data()!;

    const isAuthorOrParticipant = articleData.authorId === uid || 
      (articleData.authors && articleData.authors.some((a: any) => a.userId === uid)) ||
      req.user!.role === 'admin';

    if (!isAuthorOrParticipant) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('articles').doc(id).collection('invitations').get();
    const invitations = snapshot.docs.map(doc => doc.data());

    res.json({ success: true, invitations });
  } catch (error) {
    console.error('List invitations error:', error);
    res.status(500).json({ error: 'Failed to list invitations' });
  }
});

// --- GLOBAL INVITATION ROUTES (Public-ish) ---

// Get Invitation Metadata by Token
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { articleId } = req.query;
    let snapshot;

    if (!articleId) {
      return res.status(400).json({ error: 'Missing articleId' });
    }

    // Direct lookup is efficient and doesn't require composite indexes
    snapshot = await db.collection('articles').doc(articleId as string).collection('invitations')
      .where('token', '==', token).limit(1).get();

    if (!snapshot || snapshot.empty) {
      return res.status(404).json({ error: 'Invitation not found or invalid token' });
    }

    const inviteData = snapshot.docs[0].data();
    const articleRef = snapshot.docs[0].ref.parent.parent!;
    const articleDoc = await articleRef.get();
    const articleData = articleDoc.data()!;

    res.json({ 
      success: true, 
      invitation: inviteData,
      article: {
        title: articleData.title,
        abstract: articleData.abstract,
        authorName: articleData.authors?.find((a: any) => a.role === 'submitter')?.name || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Get invitation by token error:', error);
    res.status(500).json({ error: 'Failed to fetch invitation details' });
  }
});

router.post('/invitations/:token/accept', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { token } = req.params;
    const { articleId } = req.query;
    const uid = req.user!.uid;

    if (!articleId) {
      return res.status(400).json({ error: 'Missing articleId' });
    }

    const snapshot = await db.collection('articles').doc(articleId as string).collection('invitations')
      .where('token', '==', token).limit(1).get();

    if (!snapshot || snapshot.empty) return res.status(404).json({ error: 'Invalid token' });

    const inviteRef = snapshot.docs[0].ref;
    const inviteData = snapshot.docs[0].data();

    if (inviteData.inviteeUserId !== uid) {
      return res.status(403).json({ error: 'This invitation was not meant for you' });
    }

    if (inviteData.status !== 'pending') {
      return res.status(400).json({ error: `Invitation is already ${inviteData.status}` });
    }

    if (new Date(inviteData.expiresAt._seconds * 1000) < new Date()) {
      await inviteRef.update({ status: 'expired' });
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    const articleRef = inviteRef.parent.parent!;
    const articleDoc = await articleRef.get();
    const articleData = articleDoc.data()!;

    // Update Invitation
    await inviteRef.update({
      status: 'accepted',
      acceptedAt: new Date(),
      history: inviteData.history.concat([{ action: 'accepted', at: new Date() }])
    });

    // Update Article Authors
    const authors = articleData.authors || [];
    const authorIdx = authors.findIndex((a: any) => a.userId === uid);
    if (authorIdx !== -1) {
      authors[authorIdx].accepted = true;
      authors[authorIdx].acceptedAt = new Date();
    } else {
      authors.push({
        userId: uid,
        name: req.user!.name,
        email: req.user!.email,
        role: 'coauthor',
        accepted: true,
        acceptedAt: new Date()
      });
    }

    // Check if all are accepted
    const allAccepted = authors.every((a: any) => a.accepted === true);
    const pendingAuthors = authors.filter((a: any) => !a.accepted).map((a: any) => a.name);
    
    let autoSubmitted = false;
    // Only auto-submit if it was in draft status (waiting for co-authors)
    if (allAccepted && articleData.status === 'draft') {
      await articleRef.update({ 
        authors,
        status: 'submitted', 
        submittedAt: new Date(),
        updatedAt: new Date()
      });
      autoSubmitted = true;
      sendArticleSubmittedNotifications(articleId as string).catch(err => {
        console.error('Failed to trigger submission notifications on auto-submit:', err);
      });
    } else {
      await articleRef.update({ authors, updatedAt: new Date() });
    }

    res.json({ 
      success: true, 
      message: autoSubmitted 
        ? 'Invitation accepted and manuscript automatically submitted for review!' 
        : 'Invitation accepted. Awaiting other co-authors.',
      autoSubmitted,
      remainingAuthors: pendingAuthors
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

router.post('/invitations/:token/reject', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { token } = req.params;
    const { articleId } = req.query;
    const { reason } = req.body;
    const uid = req.user!.uid;

    if (!reason || reason.length < 10) {
      return res.status(400).json({ error: 'Rejection reason must be at least 10 characters' });
    }

    if (!articleId) {
      return res.status(400).json({ error: 'Missing articleId' });
    }

    const snapshot = await db.collection('articles').doc(articleId as string).collection('invitations')
      .where('token', '==', token).limit(1).get();

    if (!snapshot || snapshot.empty) return res.status(404).json({ error: 'Invalid token' });

    const inviteRef = snapshot.docs[0].ref;
    const inviteData = snapshot.docs[0].data();

    if (inviteData.inviteeUserId !== uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await inviteRef.update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedReason: reason,
      history: inviteData.history.concat([{ action: 'rejected', at: new Date(), note: reason }])
    });

    const articleRef = inviteRef.parent.parent!;
    const articleDoc = await articleRef.get();
    const articleData = articleDoc.data()!;

    // Update authors array in article document
    const authors = articleData.authors || [];
    const authorIdx = authors.findIndex((a: any) => a.userId === uid);
    if (authorIdx !== -1) {
      authors[authorIdx].status = 'rejected';
      authors[authorIdx].rejectedAt = new Date();
      authors[authorIdx].rejectedReason = reason;
      await articleRef.update({ authors });
    }

    // Notify inviter
    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      notificationId: notificationRef.id,
      userId: inviteData.inviterUserId,
      type: 'INVITATION_REJECTED',
      title: 'Invitation Rejected',
      message: `${req.user!.name} has declined the invitation for "${articleData.title}". Reason: ${reason}`,
      metadata: { articleId: articleData.articleId, rejectedReason: reason },
      read: false,
      createdAt: new Date()
    });

    res.json({ success: true, message: 'Invitation rejected' });
  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({ error: 'Failed to reject invitation' });
  }
});

// --- REVISION ENDPOINTS ---

// Submitter Upload Revised Manuscript
router.post('/:id/revisions', requireAuth, upload.fields([
  { name: 'pdf', maxCount: 1 }
]), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { message } = req.body;
    const uid = req.user!.uid;

    const articleRef = db.collection('articles').doc(id);
    const articleDoc = await articleRef.get();
    if (!articleDoc.exists) return res.status(404).json({ error: 'Article not found' });
    const articleData = articleDoc.data()!;

    // Only submitter can upload revisions
    if (articleData.authorId !== uid) {
      return res.status(403).json({ error: 'Only the original submitter can upload revised manuscripts' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const pdfFile = files?.pdf?.[0];

    if (!pdfFile) {
      return res.status(400).json({ error: 'Revised PDF file is required' });
    }

    // Backup current PDF to history
    const revisionHistory = articleData.revisionHistory || [];
    revisionHistory.push({
      version: revisionHistory.length + 1,
      pdfUrl: articleData.pdfUrl,
      pdfName: articleData.pdfName,
      abstract: articleData.abstract,
      submittedAt: articleData.updatedAt || articleData.createdAt,
      message: 'Previous version'
    });

    const objectKey = await uploadPdfToR2(pdfFile.buffer, pdfFile.originalname, uid);

    await articleRef.update({
      pdfUrl: objectKey,
      pdfName: pdfFile.originalname,
      status: 'revision_submitted',
      updatedAt: new Date(),
      revisionHistory
    });

    // Notify all co-authors
    const authors = articleData.authors || [];
    const notificationBatch = db.batch();
    for (const author of authors) {
      if (author.userId === uid) continue;
      const notifRef = db.collection('notifications').doc();
      notificationBatch.set(notifRef, {
        notificationId: notifRef.id,
        userId: author.userId,
        type: 'REVISION_SUBMITTED',
        title: 'Revision Submitted',
        message: `The revised manuscript for "${articleData.title}" has been submitted by the primary author.`,
        metadata: { articleId: id },
        read: false,
        createdAt: new Date()
      });
    }
    await notificationBatch.commit();

    res.json({ success: true, message: 'Revision submitted successfully' });
  } catch (error) {
    console.error('Revision upload error:', error);
    res.status(500).json({ error: 'Failed to upload revision' });
  }
});

export default router;
