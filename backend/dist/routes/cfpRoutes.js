"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const cloudinaryService_1 = require("../services/cloudinaryService");
const storageService_1 = require("../services/storageService");
const cfpEmailQueueService_1 = require("../services/cfpEmailQueueService");
const router = (0, express_1.Router)();
/**
 * Computes dynamic status for a CFP based on openingDate and deadline.
 * Status logic:
 * - 'draft' or 'archived' remain unchanged.
 * - If today < openingDate => 'scheduled'
 * - If openingDate <= today <= deadline => 'published'
 * - If today > deadline => 'closed'
 */
const computeCfpStatus = (cfp) => {
    if (cfp.status === 'draft' || cfp.status === 'archived') {
        return cfp.status;
    }
    const today = new Date().toISOString().split('T')[0];
    const opening = cfp.openingDate ? cfp.openingDate.split('T')[0] : today;
    const deadline = cfp.deadline ? cfp.deadline.split('T')[0] : '2099-12-31';
    if (today < opening)
        return 'scheduled';
    if (today > deadline)
        return 'closed';
    return 'published';
};
/**
 * Helper to fetch unique recipients for selected roles.
 */
const fetchRecipientsByRoles = async (roles) => {
    const selectedRoles = [];
    if (roles.authors)
        selectedRoles.push('author');
    if (roles.readers)
        selectedRoles.push('reader');
    if (roles.reviewers)
        selectedRoles.push('reviewer');
    const recipients = [];
    const seenEmails = new Set();
    if (selectedRoles.length > 0) {
        const userSnapshot = await firebase_1.db.collection('users')
            .where('role', 'in', selectedRoles)
            .get();
        userSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const email = data.email?.toLowerCase();
            if (email && !seenEmails.has(email) && data.status !== 'Inactive') {
                seenEmails.add(email);
                recipients.push({
                    userId: doc.id,
                    email: data.email,
                    name: data.name || data.displayName || 'Scholar',
                    role: data.role
                });
            }
        });
    }
    // Handle active Subscribers collection if checked
    if (roles.subscribers) {
        const subSnapshot = await firebase_1.db.collection('subscriptions')
            .where('status', '==', 'active')
            .get();
        subSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const email = (data.userEmail || data.email)?.toLowerCase();
            if (email && !seenEmails.has(email)) {
                seenEmails.add(email);
                recipients.push({
                    userId: data.userId || doc.id,
                    email: data.userEmail || data.email,
                    name: data.userName || data.name || 'Subscriber',
                    role: 'subscriber'
                });
            }
        });
    }
    return recipients;
};
// 1. List CFPs (Public & Admin)
router.get('/', async (req, res) => {
    try {
        const { status, year, volume, issue, topic, search } = req.query;
        let query = firebase_1.db.collection('call_for_papers');
        const snapshot = await query.get();
        let cfps = snapshot.docs.map(doc => {
            const data = doc.data();
            const computedStatus = computeCfpStatus(data);
            return {
                ...data,
                id: doc.id,
                status: computedStatus,
                isPublished: computedStatus === 'published' || computedStatus === 'closed'
            };
        });
        // Apply Client-requested filtering
        if (status && typeof status === 'string' && status !== 'all') {
            cfps = cfps.filter(c => c.status.toLowerCase() === status.toLowerCase());
        }
        if (volume && typeof volume === 'string') {
            cfps = cfps.filter(c => String(c.volume) === String(volume));
        }
        if (issue && typeof issue === 'string') {
            cfps = cfps.filter(c => String(c.issue) === String(issue));
        }
        if (year && typeof year === 'string') {
            cfps = cfps.filter(c => {
                const d = c.deadline || c.openingDate || c.createdAt;
                return d && String(d).includes(year);
            });
        }
        if (topic && typeof topic === 'string') {
            const topicLower = topic.toLowerCase();
            cfps = cfps.filter(c => Array.isArray(c.topics) && c.topics.some((t) => t.toLowerCase().includes(topicLower)));
        }
        if (search && typeof search === 'string') {
            const q = search.toLowerCase();
            cfps = cfps.filter(c => (c.title && c.title.toLowerCase().includes(q)) ||
                (c.description && c.description.toLowerCase().includes(q)) ||
                (c.theme && c.theme.toLowerCase().includes(q)));
        }
        // Sort newest createdAt / deadline first
        cfps.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
        });
        res.json({ success: true, cfps });
    }
    catch (error) {
        console.error('List CFPs error:', error);
        res.status(500).json({ error: 'Failed to list Call for Papers' });
    }
});
// 2. Get Single CFP
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await firebase_1.db.collection('call_for_papers').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Call for Papers not found' });
        }
        const data = doc.data();
        const computedStatus = computeCfpStatus(data);
        res.json({
            success: true,
            cfp: {
                ...data,
                id: doc.id,
                status: computedStatus,
                isPublished: computedStatus === 'published' || computedStatus === 'closed'
            }
        });
    }
    catch (error) {
        console.error('Get CFP error:', error);
        res.status(500).json({ error: 'Failed to retrieve Call for Papers' });
    }
});
// 3. Estimate Recipient Counts (Admin Publish Modal)
router.post('/estimate-recipients', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { authors, readers, reviewers, subscribers } = req.body;
        let authorsCount = 0;
        let readersCount = 0;
        let reviewersCount = 0;
        let subscribersCount = 0;
        if (authors) {
            const snap = await firebase_1.db.collection('users').where('role', '==', 'author').get();
            authorsCount = snap.size;
        }
        if (readers) {
            const snap = await firebase_1.db.collection('users').where('role', '==', 'reader').get();
            readersCount = snap.size;
        }
        if (reviewers) {
            const snap = await firebase_1.db.collection('users').where('role', '==', 'reviewer').get();
            reviewersCount = snap.size;
        }
        if (subscribers) {
            const snap = await firebase_1.db.collection('subscriptions').where('status', '==', 'active').get();
            subscribersCount = snap.size;
        }
        const recipients = await fetchRecipientsByRoles({ authors, readers, reviewers, subscribers });
        const totalEstimated = recipients.length;
        res.json({
            success: true,
            breakdown: {
                authors: authorsCount,
                readers: readersCount,
                reviewers: reviewersCount,
                subscribers: subscribersCount
            },
            totalEstimated
        });
    }
    catch (error) {
        console.error('Estimate recipients error:', error);
        res.status(500).json({ error: 'Failed to estimate recipients' });
    }
});
// 4. Create CFP (Admin Only)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), uploadMiddleware_1.upload.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'attachment', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files;
        const body = req.body;
        let bannerUrl = null;
        let attachmentData = null;
        if (files?.banner && files.banner[0]) {
            const result = await (0, cloudinaryService_1.uploadImage)(files.banner[0].buffer, 'cfp_banners');
            bannerUrl = result.secure_url;
        }
        if (files?.attachment && files.attachment[0]) {
            const file = files.attachment[0];
            const key = await (0, storageService_1.uploadPdfToR2)(file.buffer, file.originalname, req.user?.uid || 'admin');
            attachmentData = {
                url: key,
                fileName: file.originalname
            };
        }
        const cfpRef = firebase_1.db.collection('call_for_papers').doc();
        const newCfp = {
            id: cfpRef.id,
            title: body.title || 'Untitled Call for Papers',
            subtitle: body.subtitle || '',
            description: body.description || '',
            theme: body.theme || '',
            volume: body.volume || '1',
            issue: body.issue || '1',
            openingDate: body.openingDate || new Date().toISOString().split('T')[0],
            deadline: body.deadline || '',
            publicationDate: body.publicationDate || '',
            eligibility: body.eligibility || '',
            topics: body.topics ? (typeof body.topics === 'string' ? JSON.parse(body.topics) : body.topics) : [],
            authorGuidelines: body.authorGuidelines || '',
            paperFormatRequirements: body.paperFormatRequirements || '',
            reviewProcess: body.reviewProcess || '',
            importantDates: body.importantDates ? (typeof body.importantDates === 'string' ? JSON.parse(body.importantDates) : body.importantDates) : [],
            contactEmail: body.contactEmail || '',
            contactPhone: body.contactPhone || '',
            banner: bannerUrl || body.bannerUrl || null,
            attachment: attachmentData || (body.attachmentUrl ? { url: body.attachmentUrl, fileName: 'Guidelines.pdf' } : null),
            status: body.status || 'draft',
            isPublished: body.status === 'published',
            createdBy: req.user?.uid || 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await cfpRef.set(newCfp);
        res.json({ success: true, cfp: newCfp });
    }
    catch (error) {
        console.error('Create CFP error:', error);
        res.status(500).json({ error: error.message || 'Failed to create Call for Papers' });
    }
});
// 5. Update CFP (Admin Only)
router.put('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), uploadMiddleware_1.upload.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'attachment', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = firebase_1.db.collection('call_for_papers').doc(id);
        const existingDoc = await docRef.get();
        if (!existingDoc.exists) {
            return res.status(404).json({ error: 'Call for Papers not found' });
        }
        const files = req.files;
        const body = req.body;
        const existingData = existingDoc.data();
        let bannerUrl = existingData.banner;
        let attachmentData = existingData.attachment;
        if (files?.banner && files.banner[0]) {
            const result = await (0, cloudinaryService_1.uploadImage)(files.banner[0].buffer, 'cfp_banners');
            bannerUrl = result.secure_url;
        }
        else if (body.bannerUrl) {
            bannerUrl = body.bannerUrl;
        }
        if (files?.attachment && files.attachment[0]) {
            const file = files.attachment[0];
            const key = await (0, storageService_1.uploadPdfToR2)(file.buffer, file.originalname, req.user?.uid || 'admin');
            attachmentData = {
                url: key,
                fileName: file.originalname
            };
        }
        const updatedData = {
            ...existingData,
            title: body.title ?? existingData.title,
            subtitle: body.subtitle ?? existingData.subtitle,
            description: body.description ?? existingData.description,
            theme: body.theme ?? existingData.theme,
            volume: body.volume ?? existingData.volume,
            issue: body.issue ?? existingData.issue,
            openingDate: body.openingDate ?? existingData.openingDate,
            deadline: body.deadline ?? existingData.deadline,
            publicationDate: body.publicationDate ?? existingData.publicationDate,
            eligibility: body.eligibility ?? existingData.eligibility,
            topics: body.topics ? (typeof body.topics === 'string' ? JSON.parse(body.topics) : body.topics) : existingData.topics,
            authorGuidelines: body.authorGuidelines ?? existingData.authorGuidelines,
            paperFormatRequirements: body.paperFormatRequirements ?? existingData.paperFormatRequirements,
            reviewProcess: body.reviewProcess ?? existingData.reviewProcess,
            importantDates: body.importantDates ? (typeof body.importantDates === 'string' ? JSON.parse(body.importantDates) : body.importantDates) : existingData.importantDates,
            contactEmail: body.contactEmail ?? existingData.contactEmail,
            contactPhone: body.contactPhone ?? existingData.contactPhone,
            banner: bannerUrl,
            attachment: attachmentData,
            status: body.status ?? existingData.status,
            updatedAt: new Date()
        };
        await docRef.update(updatedData);
        res.json({ success: true, cfp: { ...updatedData, id } });
    }
    catch (error) {
        console.error('Update CFP error:', error);
        res.status(500).json({ error: error.message || 'Failed to update Call for Papers' });
    }
});
// 6. Publish CFP (Admin Only)
router.post('/:id/publish', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { sendInAppNotification, sendEmailNotification, recipients } = req.body;
        const docRef = firebase_1.db.collection('call_for_papers').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Call for Papers not found' });
        }
        const publishedAt = new Date().toISOString();
        await docRef.update({
            status: 'published',
            isPublished: true,
            lastPublishedAt: publishedAt,
            updatedAt: new Date()
        });
        const cfpData = { ...doc.data(), id };
        // Fetch target recipients for notifications
        const targetRecipients = await fetchRecipientsByRoles(recipients || { authors: true, readers: true, subscribers: true });
        // 1. Send In-App Notifications immediately to all selected recipients
        if (sendInAppNotification !== false && targetRecipients.length > 0) {
            const notifBatch = firebase_1.db.batch();
            const deadlineText = cfpData.deadline
                ? new Date(cfpData.deadline).toLocaleDateString('en-GB')
                : 'Open';
            for (const r of targetRecipients) {
                if (r.userId) {
                    const nRef = firebase_1.db.collection('notifications').doc();
                    notifBatch.set(nRef, {
                        notificationId: nRef.id,
                        userId: r.userId,
                        type: 'CFP_PUBLISHED',
                        title: `New Call for Papers: Vol ${cfpData.volume} • Issue ${cfpData.issue}`,
                        message: `A new Call for Papers has been published for ${cfpData.title}. Submission deadline: ${deadlineText}.`,
                        metadata: { cfpId: id, volume: cfpData.volume, issue: cfpData.issue },
                        read: false,
                        createdAt: new Date()
                    });
                }
            }
            await notifBatch.commit();
            console.log(`[CFP] Delivered ${targetRecipients.length} in-app notifications for published CFP ${id}`);
        }
        // 2. Queue Email Campaign if enabled (batched into chunks of 100 with idempotency check)
        let emailEnqueuedCount = 0;
        let campaignId = '';
        if (sendEmailNotification && targetRecipients.length > 0) {
            const campaignResult = await (0, cfpEmailQueueService_1.createCfpEmailCampaign)(cfpData, targetRecipients, publishedAt);
            emailEnqueuedCount = campaignResult.totalEnqueued;
            campaignId = campaignResult.campaignId;
        }
        res.json({
            success: true,
            message: 'Call for Papers published successfully.',
            cfpId: id,
            inAppNotificationsSent: targetRecipients.length,
            emailsQueued: emailEnqueuedCount,
            campaignId
        });
    }
    catch (error) {
        console.error('Publish CFP error:', error);
        res.status(500).json({ error: error.message || 'Failed to publish Call for Papers' });
    }
});
// 7. Unpublish / Archive / Duplicate / Delete
router.post('/:id/unpublish', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await firebase_1.db.collection('call_for_papers').doc(id).update({
            status: 'draft',
            isPublished: false,
            updatedAt: new Date()
        });
        res.json({ success: true, message: 'CFP unpublished and set to draft' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to unpublish CFP' });
    }
});
router.post('/:id/archive', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await firebase_1.db.collection('call_for_papers').doc(id).update({
            status: 'archived',
            isPublished: false,
            updatedAt: new Date()
        });
        res.json({ success: true, message: 'CFP archived successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to archive CFP' });
    }
});
router.post('/:id/duplicate', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await firebase_1.db.collection('call_for_papers').doc(id).get();
        if (!doc.exists)
            return res.status(404).json({ error: 'CFP not found' });
        const data = doc.data();
        const newRef = firebase_1.db.collection('call_for_papers').doc();
        const duplicated = {
            ...data,
            id: newRef.id,
            title: `${data.title} (Copy)`,
            status: 'draft',
            isPublished: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await newRef.set(duplicated);
        res.json({ success: true, cfp: duplicated });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to duplicate CFP' });
    }
});
router.delete('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = firebase_1.db.collection('call_for_papers').doc(id);
        const doc = await docRef.get();
        if (!doc.exists)
            return res.status(404).json({ error: 'CFP not found' });
        if (doc.data()?.status !== 'draft') {
            return res.status(400).json({ error: 'Only draft CFPs can be deleted. Please unpublish or archive published calls.' });
        }
        await docRef.delete();
        res.json({ success: true, message: 'Draft CFP deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete CFP' });
    }
});
// 8. Queue Processing & Monitoring Endpoints
// Render Cron Endpoint (Invoked once per day via Render Cron or Admin)
router.post('/queue/process', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
        // Verify CRON_SECRET or Admin authorization
        const expectedSecret = process.env.CRON_SECRET || 'kma_cron_secret_key';
        const isSecretValid = cronSecret === expectedSecret;
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isSecretValid && !isAdmin) {
            return res.status(401).json({ error: 'Unauthorized. Valid CRON_SECRET header or admin credentials required.' });
        }
        const result = await (0, cfpEmailQueueService_1.processPendingEmailQueueBatch)();
        res.json({
            success: true,
            message: 'Render Cron queue processing completed.',
            ...result
        });
    }
    catch (error) {
        console.error('Queue processing error:', error);
        res.status(500).json({ error: 'Failed to process email queue' });
    }
});
// Queue Stats
router.get('/queue/stats', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const cfpId = req.query.cfpId;
        const stats = await (0, cfpEmailQueueService_1.getQueueStats)(cfpId);
        res.json({ success: true, stats });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch queue stats' });
    }
});
// Retry Failed Queue Items
router.post('/queue/retry', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { cfpId } = req.body;
        const resetCount = await (0, cfpEmailQueueService_1.retryFailedJobs)(cfpId);
        res.json({ success: true, resetCount, message: `Reset ${resetCount} failed email recipients to pending.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retry queue' });
    }
});
// Cancel Pending Queue Items
router.post('/queue/cancel', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { cfpId } = req.body;
        const cancelledCount = await (0, cfpEmailQueueService_1.cancelPendingJobs)(cfpId);
        res.json({ success: true, cancelledCount, message: `Cancelled ${cancelledCount} pending email recipients.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to cancel queue' });
    }
});
exports.default = router;
