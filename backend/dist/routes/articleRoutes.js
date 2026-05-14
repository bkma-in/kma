"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const storageService_1 = require("../services/storageService");
const cloudinaryService_1 = require("../services/cloudinaryService");
const router = (0, express_1.Router)();
// Submit Article or Save Draft (Author only)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['author']), uploadMiddleware_1.upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, abstract, status: requestedStatus = 'submitted', inviteeUserIds } = req.body;
        const authorId = req.user.uid;
        const authorName = req.user.name || 'Author';
        const authorEmail = req.user.email || '';
        const files = req.files;
        const pdfFile = files?.pdf?.[0];
        const thumbnailFile = files?.thumbnail?.[0];
        let objectKey = null;
        let pdfName = null;
        if (pdfFile) {
            objectKey = await (0, storageService_1.uploadPdfToR2)(pdfFile.buffer, pdfFile.originalname, authorId);
            pdfName = pdfFile.originalname;
        }
        else if (requestedStatus !== 'draft') {
            return res.status(400).json({ error: 'PDF file is required for final submission' });
        }
        let thumbnailUrl = null;
        let thumbnailPublicId = null;
        if (thumbnailFile) {
            const uploadResult = await (0, cloudinaryService_1.uploadImage)(thumbnailFile.buffer, 'articles');
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
        const articleRef = firebase_1.db.collection('articles').doc();
        const newArticle = {
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
            const invitationsBatch = firebase_1.db.batch();
            for (const inviteeId of invitees) {
                if (inviteeId === authorId)
                    continue; // Prevent self-invite
                // Fetch invitee details
                const inviteeDoc = await firebase_1.db.collection('users').doc(inviteeId).get();
                if (!inviteeDoc.exists)
                    continue;
                const inviteeData = inviteeDoc.data();
                const inviteRef = articleRef.collection('invitations').doc();
                const token = crypto_1.default.randomBytes(32).toString('hex');
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
                const notificationRef = firebase_1.db.collection('notifications').doc();
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
        res.json({ success: true, article: newArticle, invitationsQueued: invitees.length > 0 });
    }
    catch (error) {
        console.error('Save article error:', error);
        res.status(500).json({ error: 'Failed to save article' });
    }
});
// List Articles
router.get('/', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { role, uid } = req.user;
        let query = firebase_1.db.collection('articles');
        if (role === 'author') {
            // Search in participantIds which includes submitter and co-authors
            query = query.where('participantIds', 'array-contains', uid);
        }
        else if (role === 'reviewer') {
            query = query.where('reviewerId', '==', uid);
        }
        if (role === 'reader') {
            query = query.where('status', '==', 'accepted');
        }
        // Note: We removed orderBy('createdAt', 'desc') here to avoid a composite index requirement 
        // for the 'participantIds' array-contains filter. We'll sort in memory.
        const snapshot = await query.get();
        let articles = snapshot.docs.map(doc => {
            const data = doc.data();
            // Legacy mapping
            if (!data.authors && data.authorId) {
                data.authors = [
                    {
                        userId: data.authorId,
                        name: 'Original Author', // We don't have the name here easily, but we can map it
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
            const timeA = a.createdAt?._seconds || 0;
            const timeB = b.createdAt?._seconds || 0;
            return timeB - timeA;
        });
        res.json({ success: true, articles });
    }
    catch (error) {
        console.error('List articles error:', error);
        res.status(500).json({ error: 'Failed to list articles' });
    }
});
// Delete Article (Author only, and only if draft or submitted)
router.delete('/:id', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { uid, role } = req.user;
        const articleRef = firebase_1.db.collection('articles').doc(id);
        const doc = await articleRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const article = doc.data();
        // Security check: Only author can delete, and only if not yet under review/accepted
        if (role !== 'admin' && article.authorId !== uid) {
            return res.status(403).json({ error: 'Unauthorized to delete this article' });
        }
        if (role !== 'admin' && !['draft', 'submitted'].includes(article.status)) {
            return res.status(400).json({ error: 'Cannot delete article that is already under review or published' });
        }
        // Cleanup Cloudinary thumbnail if exists
        if (article.thumbnailPublicId) {
            await (0, cloudinaryService_1.deleteImage)(article.thumbnailPublicId);
        }
        await articleRef.delete();
        res.json({ success: true, message: 'Article deleted successfully' });
    }
    catch (error) {
        console.error('Delete article error:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});
// Get Signed PDF URL (requires active subscription for reader)
router.get('/:id/pdf', authMiddleware_1.requireAuth, async (req, res) => {
    // ... (rest of the file remains the same)
    try {
        const id = req.params.id;
        const { role, uid } = req.user;
        const articleDoc = await firebase_1.db.collection('articles').doc(id).get();
        if (!articleDoc.exists) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const article = articleDoc.data();
        // Access control check
        let hasAccess = false;
        if (['admin', 'reviewer'].includes(role))
            hasAccess = true;
        if (role === 'author' && article.authorId === uid)
            hasAccess = true;
        if (role === 'reader') {
            if (article.status !== 'accepted' || !article.issueId) {
                return res.status(403).json({ error: 'Article not published yet' });
            }
            // Check subscription
            const subQuery = await firebase_1.db.collection('subscriptions')
                .where('userId', '==', uid)
                .where('issueId', '==', article.issueId)
                .where('status', '==', 'active')
                .limit(1)
                .get();
            if (!subQuery.empty) {
                hasAccess = true;
            }
        }
        if (!hasAccess) {
            return res.status(403).json({ error: 'Forbidden: Requires active subscription for this issue' });
        }
        const signedUrl = await (0, storageService_1.getSignedPdfUrl)(article.pdfUrl);
        res.json({ success: true, url: signedUrl });
    }
    catch (error) {
        console.error('Get PDF URL error:', error);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
});
// Update Article (Author only)
// Enforces status-based edit restrictions:
// - draft: full editing allowed (title, abstract, category, pdf, thumbnail)
// - revision_requested: only abstract and pdf can be updated; title is locked
// - all other statuses: editing is blocked entirely
router.put('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['author']), uploadMiddleware_1.upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        const id = req.params.id;
        const { title, abstract, status = 'draft' } = req.body;
        const authorId = req.user.uid;
        const articleRef = firebase_1.db.collection('articles').doc(id);
        const doc = await articleRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const article = doc.data();
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
        const files = req.files;
        const pdfFile = files?.pdf?.[0];
        const thumbnailFile = files?.thumbnail?.[0];
        const { includeAcceptedOnly, forceSubmitWithoutRejected, submissionNotes } = req.body;
        let updateData = { updatedAt: new Date() };
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
                const objectKey = await (0, storageService_1.uploadPdfToR2)(pdfFile.buffer, pdfFile.originalname, authorId);
                updateData.pdfUrl = objectKey;
                updateData.pdfName = pdfFile.originalname;
            }
            // Auto-set status back to submitted after revision
            updateData.status = 'submitted';
        }
        else {
            // DRAFT MODE: Full editing allowed (Continuity flow)
            if (title)
                updateData.title = title;
            if (abstract)
                updateData.abstract = abstract;
            updateData.status = status;
            if (pdfFile) {
                const objectKey = await (0, storageService_1.uploadPdfToR2)(pdfFile.buffer, pdfFile.originalname, authorId);
                updateData.pdfUrl = objectKey;
                updateData.pdfName = pdfFile.originalname;
            }
            if (thumbnailFile) {
                // Delete old thumbnail
                if (article.thumbnailPublicId) {
                    await (0, cloudinaryService_1.deleteImage)(article.thumbnailPublicId);
                }
                // Upload new thumbnail
                const uploadResult = await (0, cloudinaryService_1.uploadImage)(thumbnailFile.buffer, 'articles');
                updateData.thumbnail = uploadResult.secure_url;
                updateData.thumbnailPublicId = uploadResult.public_id;
            }
        }
        await articleRef.update(updateData);
        // Fetch latest data for summary if submitted
        let summary = null;
        if (updateData.status === 'submitted') {
            const invitationsSnapshot = await articleRef.collection('invitations').get();
            const invitations = invitationsSnapshot.docs.map(doc => doc.data());
            const updatedArticle = (await articleRef.get()).data();
            summary = {
                included: updatedArticle.authors.filter((a) => a.accepted),
                pending: invitations.filter((i) => i.status === 'pending'),
                rejected: invitations.filter((i) => i.status === 'rejected')
            };
        }
        res.json({
            success: true,
            message: currentStatus === 'revision_requested' ? 'Revision submitted successfully' : 'Article updated successfully',
            submissionSummary: summary
        });
    }
    catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});
// Admin Assign Reviewer
router.patch('/:id/assign', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const id = req.params.id;
        const { reviewerId } = req.body;
        // Use transaction for atomic update
        await firebase_1.db.runTransaction(async (transaction) => {
            const articleRef = firebase_1.db.collection('articles').doc(id);
            const articleDoc = await transaction.get(articleRef);
            if (!articleDoc.exists) {
                throw new Error('Article not found');
            }
            transaction.update(articleRef, {
                reviewerId,
                status: 'under_review',
                updatedAt: new Date()
            });
        });
        // Optional: Email reviewer about assignment
        res.json({ success: true, message: 'Reviewer assigned successfully' });
    }
    catch (error) {
        console.error('Assign reviewer error:', error);
        res.status(500).json({ error: error.message || 'Failed to assign reviewer' });
    }
});
// Reviewer/Admin Update Status
router.patch('/:id/status', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin', 'reviewer']), async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body; // e.g. "accepted", "rejected", "revision_requested"
        const articleRef = firebase_1.db.collection('articles').doc(id);
        await articleRef.update({
            status,
            updatedAt: new Date()
        });
        // Optional: Trigger email to author about decision
        res.json({ success: true, message: 'Status updated successfully' });
    }
    catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});
// --- INVITATION ENDPOINTS ---
// Create/Reset Invitation for an Article
router.post('/:id/invitations', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { inviteeUserId } = req.body;
        const inviterUserId = req.user.uid;
        const inviterName = req.user.name || 'Author';
        const articleRef = firebase_1.db.collection('articles').doc(id);
        const articleDoc = await articleRef.get();
        if (!articleDoc.exists)
            return res.status(404).json({ error: 'Article not found' });
        const articleData = articleDoc.data();
        // Only submitter can invite
        if (articleData.authorId !== inviterUserId) {
            return res.status(403).json({ error: 'Only the submitter can invite co-authors' });
        }
        // Fetch invitee details
        const inviteeDoc = await firebase_1.db.collection('users').doc(inviteeUserId).get();
        if (!inviteeDoc.exists)
            return res.status(404).json({ error: 'Invitee not found' });
        const inviteeData = inviteeDoc.data();
        // Check if invitation already exists for this user
        const invitationsSnapshot = await articleRef.collection('invitations')
            .where('inviteeUserId', '==', inviteeUserId)
            .limit(1)
            .get();
        let inviteRef;
        let oldInvitation = null;
        if (!invitationsSnapshot.empty) {
            inviteRef = invitationsSnapshot.docs[0].ref;
            oldInvitation = invitationsSnapshot.docs[0].data();
        }
        else {
            inviteRef = articleRef.collection('invitations').doc();
        }
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const invitation = {
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
        const notificationRef = firebase_1.db.collection('notifications').doc();
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
        const authorIdx = authors.findIndex((a) => a.userId === inviteeUserId);
        if (authorIdx === -1) {
            authors.push({
                userId: inviteeUserId,
                name: inviteeData.name,
                email: inviteeData.email,
                role: 'coauthor',
                accepted: false,
                invitedAt: new Date()
            });
        }
        else {
            authors[authorIdx].accepted = false;
            authors[authorIdx].invitedAt = new Date();
        }
        await articleRef.update({
            authors,
            status: 'draft' // Lock to draft if new invitation sent
        });
        res.json({ success: true, inviteId: inviteRef.id, token });
    }
    catch (error) {
        console.error('Create invitation error:', error);
        res.status(500).json({ error: 'Failed to create invitation' });
    }
});
// Resend Invitation
router.post('/:id/invitations/:inviteId/resend', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const inviteId = req.params.inviteId;
        const inviterUserId = req.user.uid;
        const inviterName = req.user.name || 'Author';
        const articleRef = firebase_1.db.collection('articles').doc(id);
        const articleDoc = await articleRef.get();
        if (!articleDoc.exists)
            return res.status(404).json({ error: 'Article not found' });
        const articleData = articleDoc.data();
        if (articleData.authorId !== inviterUserId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const inviteRef = articleRef.collection('invitations').doc(inviteId);
        const inviteDoc = await inviteRef.get();
        if (!inviteDoc.exists)
            return res.status(404).json({ error: 'Invitation not found' });
        const inviteData = inviteDoc.data();
        const token = crypto_1.default.randomBytes(32).toString('hex');
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
        const notificationRef = firebase_1.db.collection('notifications').doc();
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
    }
    catch (error) {
        console.error('Resend invitation error:', error);
        res.status(500).json({ error: 'Failed to resend invitation' });
    }
});
// List Invitations for an Article
router.get('/:id/invitations', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const uid = req.user.uid;
        const articleDoc = await firebase_1.db.collection('articles').doc(id).get();
        if (!articleDoc.exists)
            return res.status(404).json({ error: 'Article not found' });
        const articleData = articleDoc.data();
        const isAuthorOrParticipant = articleData.authorId === uid ||
            (articleData.authors && articleData.authors.some((a) => a.userId === uid)) ||
            req.user.role === 'admin';
        if (!isAuthorOrParticipant) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const snapshot = await firebase_1.db.collection('articles').doc(id).collection('invitations').get();
        const invitations = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, invitations });
    }
    catch (error) {
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
        snapshot = await firebase_1.db.collection('articles').doc(articleId).collection('invitations')
            .where('token', '==', token).limit(1).get();
        if (!snapshot || snapshot.empty) {
            return res.status(404).json({ error: 'Invitation not found or invalid token' });
        }
        const inviteData = snapshot.docs[0].data();
        const articleRef = snapshot.docs[0].ref.parent.parent;
        const articleDoc = await articleRef.get();
        const articleData = articleDoc.data();
        res.json({
            success: true,
            invitation: inviteData,
            article: {
                title: articleData.title,
                abstract: articleData.abstract,
                authorName: articleData.authors?.find((a) => a.role === 'submitter')?.name || 'Unknown'
            }
        });
    }
    catch (error) {
        console.error('Get invitation by token error:', error);
        res.status(500).json({ error: 'Failed to fetch invitation details' });
    }
});
router.post('/invitations/:token/accept', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { token } = req.params;
        const { articleId } = req.query;
        const uid = req.user.uid;
        if (!articleId) {
            return res.status(400).json({ error: 'Missing articleId' });
        }
        const snapshot = await firebase_1.db.collection('articles').doc(articleId).collection('invitations')
            .where('token', '==', token).limit(1).get();
        if (!snapshot || snapshot.empty)
            return res.status(404).json({ error: 'Invalid token' });
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
        const articleRef = inviteRef.parent.parent;
        const articleDoc = await articleRef.get();
        const articleData = articleDoc.data();
        // Update Invitation
        await inviteRef.update({
            status: 'accepted',
            acceptedAt: new Date(),
            history: inviteData.history.concat([{ action: 'accepted', at: new Date() }])
        });
        // Update Article Authors
        const authors = articleData.authors || [];
        const authorIdx = authors.findIndex((a) => a.userId === uid);
        if (authorIdx !== -1) {
            authors[authorIdx].accepted = true;
            authors[authorIdx].acceptedAt = new Date();
        }
        else {
            authors.push({
                userId: uid,
                name: req.user.name,
                email: req.user.email,
                role: 'coauthor',
                accepted: true,
                acceptedAt: new Date()
            });
        }
        // Check if all are accepted
        const allAccepted = authors.every((a) => a.accepted === true);
        const pendingAuthors = authors.filter((a) => !a.accepted).map((a) => a.name);
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
        }
        else {
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
    }
    catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});
router.post('/invitations/:token/reject', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { token } = req.params;
        const { articleId } = req.query;
        const { reason } = req.body;
        const uid = req.user.uid;
        if (!reason || reason.length < 10) {
            return res.status(400).json({ error: 'Rejection reason must be at least 10 characters' });
        }
        if (!articleId) {
            return res.status(400).json({ error: 'Missing articleId' });
        }
        const snapshot = await firebase_1.db.collection('articles').doc(articleId).collection('invitations')
            .where('token', '==', token).limit(1).get();
        if (!snapshot || snapshot.empty)
            return res.status(404).json({ error: 'Invalid token' });
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
        const articleRef = inviteRef.parent.parent;
        const articleDoc = await articleRef.get();
        const articleData = articleDoc.data();
        // Update authors array in article document
        const authors = articleData.authors || [];
        const authorIdx = authors.findIndex((a) => a.userId === uid);
        if (authorIdx !== -1) {
            authors[authorIdx].status = 'rejected';
            authors[authorIdx].rejectedAt = new Date();
            authors[authorIdx].rejectedReason = reason;
            await articleRef.update({ authors });
        }
        // Notify inviter
        const notificationRef = firebase_1.db.collection('notifications').doc();
        await notificationRef.set({
            notificationId: notificationRef.id,
            userId: inviteData.inviterUserId,
            type: 'INVITATION_REJECTED',
            title: 'Invitation Rejected',
            message: `${req.user.name} has declined the invitation for "${articleData.title}". Reason: ${reason}`,
            metadata: { articleId: articleData.articleId, rejectedReason: reason },
            read: false,
            createdAt: new Date()
        });
        res.json({ success: true, message: 'Invitation rejected' });
    }
    catch (error) {
        console.error('Reject invitation error:', error);
        res.status(500).json({ error: 'Failed to reject invitation' });
    }
});
// --- REVISION ENDPOINTS ---
// Submitter Upload Revised Manuscript
router.post('/:id/revisions', authMiddleware_1.requireAuth, uploadMiddleware_1.upload.fields([
    { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
    try {
        const id = req.params.id;
        const { message } = req.body;
        const uid = req.user.uid;
        const articleRef = firebase_1.db.collection('articles').doc(id);
        const articleDoc = await articleRef.get();
        if (!articleDoc.exists)
            return res.status(404).json({ error: 'Article not found' });
        const articleData = articleDoc.data();
        // Only submitter can upload revisions
        if (articleData.authorId !== uid) {
            return res.status(403).json({ error: 'Only the original submitter can upload revised manuscripts' });
        }
        const files = req.files;
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
        const objectKey = await (0, storageService_1.uploadPdfToR2)(pdfFile.buffer, pdfFile.originalname, uid);
        await articleRef.update({
            pdfUrl: objectKey,
            pdfName: pdfFile.originalname,
            status: 'revision_submitted',
            updatedAt: new Date(),
            revisionHistory
        });
        // Notify all co-authors
        const authors = articleData.authors || [];
        const notificationBatch = firebase_1.db.batch();
        for (const author of authors) {
            if (author.userId === uid)
                continue;
            const notifRef = firebase_1.db.collection('notifications').doc();
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
    }
    catch (error) {
        console.error('Revision upload error:', error);
        res.status(500).json({ error: 'Failed to upload revision' });
    }
});
exports.default = router;
