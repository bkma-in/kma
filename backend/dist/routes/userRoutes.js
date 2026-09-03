"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const XLSX = __importStar(require("xlsx"));
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const cloudinaryService_1 = require("../services/cloudinaryService");
const emailService_1 = require("../services/emailService");
const notificationService_1 = require("../services/notificationService");
const auditService_1 = require("../services/auditService");
const env_1 = require("../config/env");
// Helper to send reviewer onboarding credentials via email
const sendReviewerCredentialsEmail = async (name, email, tempPassword, _req) => {
    const logoUrl = env_1.config.brevo.logoUrl;
    const loginUrl = env_1.config.brevo.loginUrl;
    const privacyPolicyUrl = env_1.config.brevo.privacyPolicyUrl;
    const reviewerGuidelinesUrl = env_1.config.brevo.reviewerGuidelinesUrl;
    const supportUrl = env_1.config.brevo.supportUrl;
    const currentYear = new Date().getFullYear();
    const subject = 'Welcome to Kerala Mathematical Association Reviewer Portal';
    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to KMA Reviewer Portal</title>
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
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #000000; letter-spacing: -0.02em; line-height: 1.2;">Bulletin of Kerala Mathematics Association</h1>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #000000; letter-spacing: -0.01em;">Welcome to the BKMA Community!</h2>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #3f3f46;">
                Dear ${name},<br /><br />
                Congratulations! Your reviewer account has been successfully created for the Bulletin of Kerala Mathematics Association. We are delighted to welcome you as a valued member of our reviewer panel. Your expertise and contribution will play a vital role in maintaining the quality and integrity of scholarly publications.
              </p>
            </td>
          </tr>

          <!-- Login Credentials Card -->
          <tr>
            <td style="padding: 0 40px 0 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; background-color: #ffffff; border: 1px solid #d4d4d8; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #000000;">Your Login Credentials</h3>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; margin-bottom: 24px;">
                      <!-- Email Row -->
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">EMAIL</td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; font-weight: 600; color: #000000;"><span style="color: #000000; text-decoration: none;">${email}</span></td>
                      </tr>
                      <!-- Password Row -->
                      <tr>
                        <td style="padding: 10px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">TEMP PASSWORD</td>
                        <td align="right" style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #000000;"><span style="color: #000000;">${tempPassword}</span></td>
                      </tr>
                    </table>
                    
                    <!-- Login Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" style="display: block; background-color: #000000; color: #ffffff; text-align: center; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Login</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr>
            <td height="24" style="font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Security Notice -->
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
                          <strong style="color: #000000; display: block; margin-bottom: 4px; font-size: 14px; font-weight: 700;">Security Notice</strong>
                          For your security, you will be required to change your password immediately after your first successful login. Please keep your login credentials confidential.
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
                    <span style="font-size: 18px; display: block; margin-bottom: 8px;">📄</span>
                    <span style="font-size: 13px; font-weight: 600; color: #000000; line-height: 1.3; display: block;">Review assigned manuscripts</span>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 16px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; vertical-align: top;">
                    <span style="font-size: 18px; display: block; margin-bottom: 8px;">📖</span>
                    <span style="font-size: 13px; font-weight: 600; color: #000000; line-height: 1.3; display: block;">Contribute to BKMA process</span>
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
              <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.1em;">Bulletin of Kerala Mathematics Association</h4>
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
                © ${currentYear} Bulletin of Kerala Mathematics Association. All Rights Reserved.
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
    try {
        await (0, emailService_1.sendTransactionalEmail)(email, name, subject, htmlContent);
        return true;
    }
    catch (error) {
        console.error('Failed to send reviewer credentials email:', error);
        return false;
    }
};
const router = (0, express_1.Router)();
// Get Current User Profile
router.get('/profile', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await firebase_1.db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({ success: true, profile: userDoc.data() });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Get Notification Preferences
router.get('/notification-preferences', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await firebase_1.db.collection('users').doc(uid).get();
        const defaultPreferences = {
            callForPapers: true,
            announcements: true,
            invoices: true,
            receipts: true,
            subscriptionRenewals: true,
            reviewAssignments: true,
            articleDecisions: true
        };
        if (!userDoc.exists) {
            return res.json({ success: true, preferences: defaultPreferences });
        }
        const currentPrefs = userDoc.data()?.notificationPreferences || {};
        res.json({
            success: true,
            preferences: { ...defaultPreferences, ...currentPrefs }
        });
    }
    catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
});
// Update Notification Preferences
router.put('/notification-preferences', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const { preferences } = req.body;
        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({ error: 'Invalid preferences payload' });
        }
        const userRef = firebase_1.db.collection('users').doc(uid);
        await userRef.set({
            notificationPreferences: preferences,
            updatedAt: new Date()
        }, { merge: true });
        res.json({ success: true, preferences });
    }
    catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
});
// Get Public Profile (Unauthenticated)
router.get('/:id/public-profile', async (req, res) => {
    try {
        const { id } = req.params;
        const userDoc = await firebase_1.db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        const data = userDoc.data();
        res.json({
            success: true,
            profile: {
                uid: data.uid,
                name: data.name,
                email: data.email || '',
                role: data.role || 'author',
                bio: data.bio || '',
                designation: data.designation || '',
                phone: data.phone || '',
                profileImage: data.profileImage || '',
                createdAt: data.createdAt,
                affiliation: data.affiliation || ''
            }
        });
    }
    catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({ error: 'Failed to fetch public profile' });
    }
});
// Update Profile (Optimized: 1 Read, 1 Write, Non-blocking Cleanup)
router.put('/profile', authMiddleware_1.requireAuth, uploadMiddleware_1.upload.single('profileImage'), async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, phone, designation, bio } = req.body;
        // 1. Lightweight Validation & Sanitization
        const sanitizedBio = bio?.trim().slice(0, 500) || '';
        const sanitizedName = name?.trim();
        const sanitizedPhone = phone?.trim();
        const userRef = firebase_1.db.collection('users').doc(uid);
        // Performance: Only one read to get current state (required for old image ID)
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        const userData = userDoc.data();
        const updateData = {
            updatedAt: new Date(),
        };
        // Only add to update payload if provided to avoid overwriting with undefined
        if (sanitizedName) {
            updateData.name = sanitizedName;
            updateData.nameLower = sanitizedName.toLowerCase();
        }
        if (sanitizedPhone !== undefined)
            updateData.phone = sanitizedPhone;
        if (designation !== undefined)
            updateData.designation = designation.trim();
        if (bio !== undefined)
            updateData.bio = sanitizedBio;
        // 2. Handle Image Operations
        if (req.file) {
            // Must await upload to get the new URL for the database
            const uploadResult = await (0, cloudinaryService_1.uploadImage)(req.file.buffer, 'profiles');
            // Performance: Fire-and-forget deletion of old image (don't block the response)
            if (userData.profileImagePublicId) {
                (0, cloudinaryService_1.deleteImage)(userData.profileImagePublicId).catch(err => console.error('Background cleanup error (old image):', err));
            }
            updateData.profileImage = uploadResult.secure_url;
            updateData.profileImagePublicId = uploadResult.public_id;
        }
        else if (typeof req.body.profileImage === 'string' && req.body.profileImage.startsWith('data:image/')) {
            const matches = req.body.profileImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                const uploadResult = await (0, cloudinaryService_1.uploadImage)(buffer, 'profiles');
                if (userData.profileImagePublicId) {
                    (0, cloudinaryService_1.deleteImage)(userData.profileImagePublicId).catch(err => console.error('Background cleanup error (old image):', err));
                }
                updateData.profileImage = uploadResult.secure_url;
                updateData.profileImagePublicId = uploadResult.public_id;
            }
        }
        else if (req.body.profileImage === null || req.body.profileImage === 'null') {
            // Explicitly removed profile image
            if (userData.profileImagePublicId) {
                (0, cloudinaryService_1.deleteImage)(userData.profileImagePublicId).catch(err => console.error('Background cleanup error (removed image):', err));
            }
            updateData.profileImage = null;
            updateData.profileImagePublicId = null;
        }
        // 3. Database Update (Single Write)
        await userRef.update(updateData);
        // Sync Custom Claims if Name changed
        if (sanitizedName) {
            if (!userData.role) {
                console.error(`[AUTH-DIAGNOSTIC] ❌ Cannot sync custom claims: User ${uid} has no role in Firestore`);
            }
            else {
                console.log(`[AUTH-DIAGNOSTIC] Syncing custom claims for UID: ${uid}, Role: "${userData.role}", Name: "${sanitizedName}"`);
                firebase_1.auth.setCustomUserClaims(uid, { role: userData.role, name: sanitizedName }).catch((err) => console.error('[AUTH-DIAGNOSTIC] Background custom claims sync error:', err));
            }
        }
        // Performance: Avoid second read by merging locally
        const mergedProfile = {
            ...userData,
            ...updateData,
            // Ensure complex objects like Date/Timestamp are handled consistently
            updatedAt: updateData.updatedAt
        };
        res.json({
            success: true,
            profile: mergedProfile
        });
    }
    catch (error) {
        console.error('Senior Audit - Update profile error:', error);
        res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
});
// Report an Issue (Bug/UI)
router.post('/report-issue', authMiddleware_1.requireAuth, uploadMiddleware_1.upload.single('screenshot'), async (req, res) => {
    try {
        const { uid } = req.user;
        const { type, description, metadata } = req.body;
        let screenshotUrl = null;
        let screenshotPublicId = null;
        if (req.file) {
            const uploadResult = await (0, cloudinaryService_1.uploadImage)(req.file.buffer, 'issues');
            screenshotUrl = uploadResult.secure_url;
            screenshotPublicId = uploadResult.public_id;
        }
        const issueRef = firebase_1.db.collection('reported_issues').doc();
        const newIssue = {
            issueId: issueRef.id,
            userId: uid,
            type,
            description,
            metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
            screenshot: screenshotUrl,
            screenshotPublicId,
            status: 'Open',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await issueRef.set(newIssue);
        res.json({ success: true, issue: newIssue });
    }
    catch (error) {
        console.error('Report issue error:', error);
        res.status(500).json({ error: 'Failed to report issue' });
    }
});
// Get All Reported Issues (for Developer Dashboard)
router.get('/reported-issues', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin', 'dev']), async (_req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('reported_issues').orderBy('createdAt', 'desc').get();
        const issues = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Normalize Firestore Timestamps to ISO strings for the frontend
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
        });
        res.json({ success: true, issues });
    }
    catch (error) {
        console.error('Get reported issues error:', error);
        res.status(500).json({ error: 'Failed to fetch reported issues' });
    }
});
// Update Reported Issue Status (for Developer Dashboard)
router.patch('/reported-issues/:id/status', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin', 'dev']), async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['Open', 'In Progress', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        const issueRef = firebase_1.db.collection('reported_issues').doc(id);
        const issueDoc = await issueRef.get();
        if (!issueDoc.exists) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        await issueRef.update({ status, updatedAt: new Date() });
        const updated = { ...issueDoc.data(), status, updatedAt: new Date().toISOString() };
        res.json({ success: true, issue: updated });
    }
    catch (error) {
        console.error('Update issue status error:', error);
        res.status(500).json({ error: 'Failed to update issue status' });
    }
});
// Search Users (Registered users only)
router.get('/', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { search = '', limit = '20' } = req.query;
        const searchTerm = search.toLowerCase();
        const limitNum = parseInt(limit) || 20;
        if (!searchTerm) {
            return res.json({ success: true, users: [] });
        }
        // High performance prefix queries run concurrently
        const nameQuery = firebase_1.db.collection('users')
            .where('nameLower', '>=', searchTerm)
            .where('nameLower', '<=', searchTerm + '\uf8ff')
            .limit(limitNum)
            .get();
        const emailQuery = firebase_1.db.collection('users')
            .where('emailLower', '>=', searchTerm)
            .where('emailLower', '<=', searchTerm + '\uf8ff')
            .limit(limitNum)
            .get();
        const [nameSnap, emailSnap] = await Promise.all([nameQuery, emailQuery]);
        const userMap = new Map();
        nameSnap.docs.forEach((doc) => {
            const data = doc.data();
            userMap.set(doc.id, {
                id: doc.id,
                name: data.name,
                email: data.email,
                affiliation: data.affiliation || ''
            });
        });
        emailSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (!userMap.has(doc.id)) {
                userMap.set(doc.id, {
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    affiliation: data.affiliation || ''
                });
            }
        });
        const users = Array.from(userMap.values()).slice(0, limitNum);
        res.json({ success: true, users });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});
// Helper to generate temporary password
const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8) + '!' + Math.floor(Math.random() * 100);
};
// Admin: Get all reviewers
router.get('/reviewers', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('users').where('role', '==', 'reviewer').get();
        const reviewers = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                qualification: data.qualification || '',
                experience: data.experience || '',
                regDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
                status: data.status || 'Pending',
                rejectionReason: data.rejectionReason || '',
                profileImage: data.profileImage || null,
                mustChangePassword: data.mustChangePassword === true,
                credentialsShared: data.credentialsShared === true
            };
        });
        // In-memory sort by regDate descending
        reviewers.sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime());
        res.json({ success: true, reviewers });
    }
    catch (error) {
        console.error('Get reviewers error:', error);
        res.status(500).json({ error: 'Failed to fetch reviewers' });
    }
});
// Admin: Get all authors (paginated)
router.get('/authors', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { pageSize = '50', cursor } = req.query;
        const limitNum = parseInt(pageSize) || 50;
        // Fetch all authors from database using simple query (no composite index required)
        const snapshot = await firebase_1.db.collection('users').where('role', '==', 'author').get();
        let allAuthors = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                affiliation: data.affiliation || 'N/A',
                regDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
                phone: data.phone || '',
                designation: data.designation || '',
                bio: data.bio || '',
                profileImage: data.profileImage || null
            };
        });
        // Sort by regDate descending (createdAt) in memory
        allAuthors.sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime());
        // Apply pagination cursor in-memory
        let startIndex = 0;
        if (cursor) {
            // Expected format: "<timestamp>|<docId>"
            const [ts, docId] = cursor.split('|');
            const cursorTime = new Date(ts).getTime();
            const foundIndex = allAuthors.findIndex((a) => {
                const aTime = new Date(a.regDate).getTime();
                return aTime === cursorTime && a.id === docId;
            });
            if (foundIndex !== -1) {
                startIndex = foundIndex + 1;
            }
        }
        const paginatedAuthors = allAuthors.slice(startIndex, startIndex + limitNum);
        let nextCursor = null;
        if (startIndex + limitNum < allAuthors.length) {
            const lastDoc = paginatedAuthors[paginatedAuthors.length - 1];
            nextCursor = `${lastDoc.regDate}|${lastDoc.id}`;
        }
        res.json({ success: true, authors: paginatedAuthors, nextCursor });
    }
    catch (error) {
        console.error('Get authors error:', error);
        res.status(500).json({ error: 'Failed to fetch authors' });
    }
});
// Admin: Get all readers
router.get('/readers', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('users').where('role', '==', 'reader').get();
        // Also fetch all active subscriptions to check for subscription plan and status
        const subsSnapshot = await firebase_1.db.collection('subscriptions').where('status', '==', 'active').get();
        const activeSubscribes = new Map();
        subsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            activeSubscribes.set(data.userId, data);
        });
        const readers = snapshot.docs.map((doc) => {
            const data = doc.data();
            const subData = activeSubscribes.get(doc.id);
            const isLifeMember = data.lifeMember === true || data.isLifeMember === true || subData?.type === 'lifetime' || subData?.type === 'life' || subData?.plan === 'lifetime';
            const isSubscribed = isLifeMember || !!subData || data.isSubscribed === true;
            const subscriptionPlan = isLifeMember ? 'lifetime' : (subData?.plan || subData?.type || null);
            return {
                id: doc.id,
                name: data.name || 'Anonymous Reader',
                email: data.email || '',
                phone: data.phone || '',
                bio: data.bio || '',
                designation: data.designation || '',
                profileImage: data.profileImage || null,
                regDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
                isLifeMember,
                isSubscribed,
                subscriptionPlan,
                subscriptionStatus: isSubscribed ? 'active' : 'inactive',
                subscriptionStartedAt: subData?.startedAt?.toDate ? subData.startedAt.toDate().toISOString() : subData?.startedAt || null,
                subscriptionExpiresAt: subData?.expiresAt?.toDate ? subData.expiresAt.toDate().toISOString() : subData?.expiresAt || null
            };
        });
        // In-memory sort by regDate descending
        readers.sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime());
        res.json({ success: true, readers });
    }
    catch (error) {
        console.error('Get readers error:', error);
        res.status(500).json({ error: 'Failed to fetch readers' });
    }
});
// Admin: Update reviewer status (Approve/Reject/Deactivate/Reactivate)
router.patch('/reviewers/:id/status', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const adminId = req.user.uid;
    try {
        const id = req.params.id;
        const { status, rejectionReason } = req.body;
        const validStatuses = ['Approved', 'Rejected', 'Pending', 'Deactivated'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const userRef = firebase_1.db.collection('users').doc(id);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Reviewer not found' });
        }
        const userData = userDoc.data();
        const previousStatus = userData.status;
        const updateData = {
            status,
            updatedAt: new Date()
        };
        if (status === 'Rejected') {
            updateData.rejectionReason = rejectionReason || '';
        }
        else {
            updateData.rejectionReason = '';
        }
        // Handle account activation/deactivation in Firebase Auth and log audit events
        if (status === 'Deactivated') {
            await firebase_1.auth.updateUser(id, { disabled: true });
            await (0, auditService_1.logAuditEvent)('Reviewer Deactivated', id, adminId);
        }
        else if (status === 'Approved') {
            await firebase_1.auth.updateUser(id, { disabled: false }).catch(() => { });
            if (previousStatus === 'Deactivated') {
                await (0, auditService_1.logAuditEvent)('Reviewer Reactivated', id, adminId);
            }
            else if (previousStatus === 'Pending') {
                await (0, auditService_1.logAuditEvent)('Reviewer Approved', id, adminId);
            }
        }
        await userRef.update(updateData);
        res.json({ success: true, reviewer: { ...userDoc.data(), ...updateData, id } });
    }
    catch (error) {
        console.error('Update reviewer status error:', error);
        res.status(500).json({ error: error.message || 'Failed to update reviewer status' });
    }
});
// Admin: Create pre-approved reviewer user (delivered via secure email onboarding)
router.post('/reviewers', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const adminId = req.user.uid;
    try {
        const { name, email, qualification, experience } = req.body;
        if (!name || !email || !qualification || !experience) {
            return res.status(400).json({ error: 'All fields (name, email, qualification, experience) are required' });
        }
        const tempPassword = generateTempPassword();
        // 1. Create user in Firebase Auth with emailVerified set to true since credentials are emailed by Admin
        const userRecord = await firebase_1.auth.createUser({
            email,
            password: tempPassword,
            displayName: name,
            emailVerified: true
        });
        // 2. Create user document in Firestore (password is NOT stored in Firestore)
        const userData = {
            uid: userRecord.uid,
            name,
            email,
            nameLower: name.toLowerCase(),
            emailLower: email.toLowerCase(),
            role: 'reviewer',
            status: 'Approved',
            qualification,
            experience,
            mustChangePassword: true,
            emailVerified: true,
            createdByAdmin: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        try {
            // Write profile to database first
            await firebase_1.db.collection('users').doc(userRecord.uid).set(userData);
            // Then apply custom claims
            await firebase_1.auth.setCustomUserClaims(userRecord.uid, { role: 'reviewer', name });
        }
        catch (err) {
            // Rollback: Delete the auth user if database write or claims config fails
            await firebase_1.auth.deleteUser(userRecord.uid).catch((authErr) => console.error('Failed to delete Auth user on rollback:', authErr));
            throw err;
        }
        // Record Reviewer Created in audit log
        await (0, auditService_1.logAuditEvent)('Reviewer Created', userRecord.uid, adminId);
        // Send credentials via email asynchronously
        const emailSent = await sendReviewerCredentialsEmail(name, email, tempPassword, req);
        if (emailSent) {
            await (0, auditService_1.logAuditEvent)('Credentials Email Sent', userRecord.uid, adminId);
            await firebase_1.db.collection('users').doc(userRecord.uid).update({ credentialsShared: true, emailVerified: true });
        }
        else {
            await (0, auditService_1.logAuditEvent)('Credentials Email Failed', userRecord.uid, adminId);
        }
        res.json({
            success: true,
            emailSent,
            reviewer: {
                id: userRecord.uid,
                name,
                email,
                qualification,
                experience,
                regDate: userData.createdAt.toISOString(),
                status: 'Approved',
                mustChangePassword: true,
                credentialsShared: emailSent
            }
        });
    }
    catch (error) {
        console.error('Create reviewer error:', error);
        res.status(500).json({ error: error.message || 'Failed to create reviewer user' });
    }
});
// Admin: Resend reviewer credentials (regenerates password, updates Auth, emails Reviewer, logs audit)
router.post('/reviewers/:id/resend-credentials', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const adminId = req.user.uid;
    try {
        const id = req.params.id;
        const userRef = firebase_1.db.collection('users').doc(id);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Reviewer not found' });
        }
        const userData = userDoc.data();
        if (userData.role !== 'reviewer') {
            return res.status(400).json({ error: 'User is not a reviewer' });
        }
        const tempPassword = generateTempPassword();
        // 1. Update password securely in Firebase Authentication (invalidates old temp password) and ensure emailVerified is true
        await firebase_1.auth.updateUser(id, { password: tempPassword, emailVerified: true });
        // 2. Reset mustChangePassword flag in Firestore document to true and set emailVerified to true
        await userRef.update({
            mustChangePassword: true,
            credentialsShared: false,
            emailVerified: true,
            updatedAt: new Date()
        });
        // 3. Send email with new temporary credentials
        const emailSent = await sendReviewerCredentialsEmail(userData.name, userData.email, tempPassword, req);
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to deliver credentials email. Please try again.' });
        }
        // Update credentialsShared to true on successful email delivery
        await userRef.update({
            credentialsShared: true,
            updatedAt: new Date()
        });
        // 4. Record Credentials Resent in audit log
        await (0, auditService_1.logAuditEvent)('Credentials Resent', id, adminId);
        res.json({ success: true, message: 'Credentials have been sent successfully.' });
    }
    catch (error) {
        console.error('Resend credentials error:', error);
        res.status(500).json({ error: error.message || 'Failed to resend credentials' });
    }
});
// ==========================================
// KMA LIFE MEMBERS MANAGEMENT (ADMIN)
// ==========================================
// Helper to normalize and match spreadsheet keys
const extractRowField = (row, fieldKeys) => {
    const normalizedRowKeys = Object.keys(row).map(k => ({
        orig: k,
        norm: k.toLowerCase().replace(/[^a-z0-9]/g, '')
    }));
    for (const field of fieldKeys) {
        const normField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
        const found = normalizedRowKeys.find(k => k.norm === normField || k.norm.includes(normField));
        if (found && row[found.orig] !== undefined && row[found.orig] !== null) {
            return String(row[found.orig]).trim();
        }
    }
    return '';
};
// Admin: Get all KMA Life Members
router.get('/life-members', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        // 1. Fetch all records from life_members collection
        const lifeMembersSnap = await firebase_1.db.collection('life_members').get();
        // 2. Fetch active subscriptions to check who has an active discounted pass
        const activeSubsSnap = await firebase_1.db.collection('subscriptions')
            .where('status', '==', 'active')
            .get();
        const activeSubsByEmail = new Map();
        const activeSubsById = new Map();
        activeSubsSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.email)
                activeSubsByEmail.set(data.email.toLowerCase(), { id: doc.id, ...data });
            if (data.membershipId)
                activeSubsById.set(data.membershipId.toUpperCase(), { id: doc.id, ...data });
        });
        // 3. Fetch registered users with isLifeMember = true to cross-reference
        const usersSnap = await firebase_1.db.collection('users').where('isLifeMember', '==', true).get();
        const registeredUsersMap = new Map();
        usersSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.email)
                registeredUsersMap.set(data.email.toLowerCase(), { id: doc.id, ...data });
            if (data.membershipNumber)
                registeredUsersMap.set(data.membershipNumber.toUpperCase(), { id: doc.id, ...data });
        });
        const members = [];
        const seenUniqueIds = new Set();
        lifeMembersSnap.docs.forEach((doc) => {
            const data = doc.data();
            const uniqueId = (data.uniqueId || doc.id).toUpperCase().trim();
            seenUniqueIds.add(uniqueId);
            const emailLower = (data.email || '').toLowerCase().trim();
            const sub = activeSubsById.get(uniqueId) || activeSubsByEmail.get(emailLower);
            const regUser = registeredUsersMap.get(emailLower) || registeredUsersMap.get(uniqueId);
            members.push({
                id: doc.id,
                uniqueId: uniqueId,
                name: data.name || regUser?.name || 'Life Member',
                email: data.email || regUser?.email || '',
                phone: data.phone || regUser?.phone || '',
                designation: data.designation || regUser?.designation || '',
                affiliation: data.affiliation || regUser?.affiliation || '',
                address: data.address || '',
                notes: data.notes || '',
                source: data.source || 'admin_enrolled',
                status: data.status || 'Active',
                enrolledDate: data.enrolledDate?.toDate ? data.enrolledDate.toDate().toISOString() : data.enrolledDate || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                hasActiveSubscription: !!sub,
                subscriptionId: sub?.id || null,
                subscriptionPlan: sub ? 'Annual Pass (50% Concession)' : null,
                subscriptionExpiresAt: sub?.expiresAt?.toDate ? sub.expiresAt.toDate().toISOString() : sub?.expiresAt || null,
                isUserRegistered: !!regUser,
                userId: regUser?.id || null,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            });
        });
        // Also include any users marked as isLifeMember in users collection that were not yet in life_members collection
        registeredUsersMap.forEach((regUser, key) => {
            const memId = (regUser.membershipNumber || key).toUpperCase().trim();
            if (!seenUniqueIds.has(memId)) {
                seenUniqueIds.add(memId);
                const emailLower = (regUser.email || '').toLowerCase().trim();
                const sub = activeSubsById.get(memId) || activeSubsByEmail.get(emailLower);
                members.push({
                    id: regUser.id,
                    uniqueId: memId,
                    name: regUser.name || 'Life Member',
                    email: regUser.email || '',
                    phone: regUser.phone || '',
                    designation: regUser.designation || '',
                    affiliation: regUser.affiliation || '',
                    address: '',
                    notes: '',
                    source: regUser.lifeMemberSource || 'admin_enrolled',
                    status: 'Active',
                    enrolledDate: regUser.createdAt?.toDate ? regUser.createdAt.toDate().toISOString() : regUser.createdAt || new Date().toISOString(),
                    hasActiveSubscription: !!sub,
                    subscriptionId: sub?.id || null,
                    subscriptionPlan: sub ? 'Annual Pass (50% Concession)' : null,
                    subscriptionExpiresAt: sub?.expiresAt?.toDate ? sub.expiresAt.toDate().toISOString() : sub?.expiresAt || null,
                    isUserRegistered: true,
                    userId: regUser.id,
                    createdAt: regUser.createdAt?.toDate ? regUser.createdAt.toDate().toISOString() : regUser.createdAt || new Date().toISOString()
                });
            }
        });
        // Sort by enrolledDate descending
        members.sort((a, b) => new Date(b.enrolledDate).getTime() - new Date(a.enrolledDate).getTime());
        res.json({ success: true, members });
    }
    catch (error) {
        console.error('Get life members error:', error);
        res.status(500).json({ error: 'Failed to fetch life members list' });
    }
});
// Admin: Add a single KMA Life Member
router.post('/life-members', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const adminId = req.user.uid;
    try {
        const { uniqueId, name, email, phone, designation, affiliation, address, notes, enrolledDate, sendWelcomeEmail } = req.body;
        if (!uniqueId || !email) {
            return res.status(400).json({ error: 'Unique Membership ID and Email Address are required.' });
        }
        const normUniqueId = uniqueId.trim().toUpperCase();
        const emailLower = email.trim().toLowerCase();
        const cleanName = (name && typeof name === 'string' && name.trim()) ? name.trim() : emailLower.split('@')[0];
        // Check if uniqueId already exists in life_members collection
        const existingById = await firebase_1.db.collection('life_members').doc(normUniqueId).get();
        if (existingById.exists) {
            return res.status(400).json({ error: `A Life Member with Unique ID "${normUniqueId}" already exists.` });
        }
        // Check if email already exists in life_members collection
        const existingByEmail = await firebase_1.db.collection('life_members').where('emailLower', '==', emailLower).get();
        if (!existingByEmail.empty) {
            return res.status(400).json({ error: `A Life Member with email address "${emailLower}" already exists.` });
        }
        const memberData = {
            uniqueId: normUniqueId,
            name: cleanName,
            email: email.trim(),
            emailLower: emailLower,
            phone: phone ? phone.trim() : '',
            designation: designation ? designation.trim() : '',
            affiliation: affiliation ? affiliation.trim() : '',
            address: address ? address.trim() : '',
            notes: notes ? notes.trim() : '',
            source: 'admin_enrolled',
            status: 'Active',
            enrolledDate: enrolledDate ? new Date(enrolledDate) : new Date(),
            createdByAdmin: adminId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // 1. Save to life_members collection
        await firebase_1.db.collection('life_members').doc(normUniqueId).set(memberData);
        // 2. Synchronize with users collection if account already exists with this email
        const userQuery = await firebase_1.db.collection('users').where('emailLower', '==', emailLower).limit(1).get();
        let isUserRegistered = false;
        let userId = null;
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            isUserRegistered = true;
            userId = userDoc.id;
            await userDoc.ref.update({
                isLifeMember: true,
                lifeMember: true,
                membershipNumber: normUniqueId,
                affiliation: affiliation ? affiliation.trim() : userDoc.data()?.affiliation || '',
                designation: designation ? designation.trim() : userDoc.data()?.designation || '',
                updatedAt: new Date()
            });
        }
        // 3. Log audit event
        await (0, auditService_1.logAuditEvent)('Life Member Enrolled', normUniqueId, adminId);
        // 4. Send Welcome Email if requested
        if (sendWelcomeEmail === true) {
            (0, notificationService_1.sendLifeMemberWelcomeEmail)(email.trim(), cleanName, normUniqueId).catch(err => {
                console.error('Failed to send Life Member welcome email:', err);
            });
        }
        res.json({
            success: true,
            message: `Life Member ${cleanName} (${normUniqueId}) added successfully.`,
            member: {
                id: normUniqueId,
                ...memberData,
                enrolledDate: memberData.enrolledDate.toISOString(),
                createdAt: memberData.createdAt.toISOString(),
                isUserRegistered,
                userId,
                hasActiveSubscription: false
            }
        });
    }
    catch (error) {
        console.error('Add life member error:', error);
        res.status(500).json({ error: error.message || 'Failed to add life member' });
    }
});
// Admin: Bulk import KMA Life Members from CSV or Excel (.csv, .xlsx, .xls)
router.post('/life-members/import', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), uploadMiddleware_1.spreadsheetUpload.single('file'), async (req, res) => {
    const adminId = req.user.uid;
    try {
        let rows = [];
        // Support both file upload and raw JSON payload
        if (req.file) {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                return res.status(400).json({ error: 'Spreadsheet contains no sheets.' });
            }
            const worksheet = workbook.Sheets[firstSheetName];
            rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        }
        else if (req.body.rows && Array.isArray(req.body.rows)) {
            rows = req.body.rows;
        }
        else {
            return res.status(400).json({ error: 'Please upload a CSV or Excel file or provide rows array.' });
        }
        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: 'Spreadsheet is empty or no valid rows found.' });
        }
        // Pre-fetch all existing life member IDs and emails to prevent collisions and detect updates
        const conflictMode = (req.body.conflictMode || req.query.conflictMode || 'skip').toString().toLowerCase(); // 'skip' or 'overwrite'
        const existingSnap = await firebase_1.db.collection('life_members').get();
        const existingIds = new Set();
        const existingEmails = new Map(); // emailLower -> uniqueId
        existingSnap.docs.forEach((doc) => {
            const data = doc.data();
            const id = (data.uniqueId || doc.id || '').toString().toUpperCase().trim();
            if (id)
                existingIds.add(id);
            if (doc.id)
                existingIds.add(doc.id.toString().toUpperCase().trim());
            const emailVal = (data.emailLower || data.email || '').toString().toLowerCase().trim();
            if (emailVal) {
                existingEmails.set(emailVal, id);
            }
        });
        let importedCount = 0;
        let updatedCount = 0;
        let duplicateCount = 0;
        let skippedCount = 0;
        const errors = [];
        const inBatchIds = new Set();
        const inBatchEmails = new Set();
        const writeBatches = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // header is row 1
            const rawId = extractRowField(row, ['uniqueid', 'membershipid', 'memberid', 'membershipnumber', 'id', 'lmid', 'lm_id', 'unique_id', 'membership']);
            const name = extractRowField(row, ['name', 'fullname', 'membername', 'full_name', 'member_name']);
            const email = extractRowField(row, ['email', 'emailid', 'mail', 'emailaddress', 'email_id', 'email_address', 'email_ids', 'mail_id']);
            const phone = extractRowField(row, ['phone', 'phonenumber', 'mobile', 'contact', 'mobile_number', 'phone_number']);
            const affiliation = extractRowField(row, ['affiliation', 'institution', 'organization', 'college', 'university', 'department']);
            const designation = extractRowField(row, ['designation', 'role', 'title', 'position']);
            const address = extractRowField(row, ['address', 'location', 'place', 'city']);
            const enrolledDateRaw = extractRowField(row, ['enrolleddate', 'datejoined', 'joiningdate', 'date', 'membershipdate']);
            if (!email) {
                errors.push(`Row ${rowNum}: Email address is missing. Skipped.`);
                skippedCount++;
                continue;
            }
            const emailLower = email.toLowerCase().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailLower)) {
                errors.push(`Row ${rowNum}: Invalid email format "${email}". Skipped.`);
                skippedCount++;
                continue;
            }
            // Generate or normalize uniqueId
            let uniqueId = rawId ? rawId.toUpperCase().trim() : '';
            if (!uniqueId) {
                uniqueId = `LM-${Date.now().toString().slice(-4)}${i + 1}`;
            }
            const cleanName = (name && name.trim()) ? name.trim() : emailLower.split('@')[0];
            // In-file duplicate checking
            if (inBatchIds.has(uniqueId)) {
                errors.push(`Row ${rowNum} (${uniqueId}): Duplicate Unique ID in spreadsheet. Skipped.`);
                duplicateCount++;
                skippedCount++;
                continue;
            }
            if (inBatchEmails.has(emailLower)) {
                errors.push(`Row ${rowNum} (${emailLower}): Duplicate email in spreadsheet. Skipped.`);
                duplicateCount++;
                skippedCount++;
                continue;
            }
            inBatchIds.add(uniqueId);
            inBatchEmails.add(emailLower);
            const isExisting = existingIds.has(uniqueId) || existingEmails.has(emailLower);
            // Handle duplicate/existing according to admin choice (skip vs overwrite)
            if (isExisting && conflictMode === 'skip') {
                duplicateCount++;
                errors.push(`Row ${rowNum} (${uniqueId} - ${emailLower}): Already exists in registry. Skipped.`);
                continue;
            }
            let enrolledDate = new Date();
            if (enrolledDateRaw) {
                const parsed = new Date(enrolledDateRaw);
                if (!isNaN(parsed.getTime())) {
                    enrolledDate = parsed;
                }
            }
            const docRef = firebase_1.db.collection('life_members').doc(uniqueId);
            const memberPayload = {
                uniqueId,
                name: cleanName,
                email: email.trim(),
                emailLower: emailLower,
                phone: phone || '',
                designation: designation || '',
                affiliation: affiliation || '',
                address: address || '',
                source: 'imported',
                status: 'Active',
                enrolledDate: enrolledDate,
                updatedAt: new Date(),
                ...(isExisting ? {} : { createdAt: new Date(), createdByAdmin: adminId })
            };
            writeBatches.push({ docRef, data: memberPayload });
            if (isExisting) {
                updatedCount++;
            }
            else {
                importedCount++;
            }
        }
        // Execute Firestore batches in chunks of 450 (Firestore limit is 500)
        const chunkSize = 450;
        for (let i = 0; i < writeBatches.length; i += chunkSize) {
            const chunk = writeBatches.slice(i, i + chunkSize);
            const batch = firebase_1.db.batch();
            chunk.forEach(item => {
                batch.set(item.docRef, item.data, { merge: true });
            });
            await batch.commit();
        }
        // Sync isLifeMember: true to any existing accounts in users collection
        const allImportedEmails = Array.from(inBatchEmails);
        for (let i = 0; i < allImportedEmails.length; i += 30) {
            const emailChunk = allImportedEmails.slice(i, i + 30);
            const userMatches = await firebase_1.db.collection('users').where('emailLower', 'in', emailChunk).get();
            if (!userMatches.empty) {
                const userBatch = firebase_1.db.batch();
                userMatches.docs.forEach((uDoc) => {
                    const uEmail = (uDoc.data()?.email || '').toLowerCase();
                    const matchItem = writeBatches.find(b => b.data.emailLower === uEmail);
                    userBatch.update(uDoc.ref, {
                        isLifeMember: true,
                        lifeMember: true,
                        membershipNumber: matchItem?.data.uniqueId || uDoc.data()?.membershipNumber || 'LM-IMPORTED',
                        updatedAt: new Date()
                    });
                });
                await userBatch.commit();
            }
        }
        // Record audit event
        await (0, auditService_1.logAuditEvent)('Life Members Bulk Imported', `${importedCount} added, ${updatedCount} updated, ${duplicateCount} duplicates`, adminId);
        let resultMessage = '';
        if (importedCount === 0 && duplicateCount > 0 && conflictMode === 'skip') {
            resultMessage = `All ${duplicateCount} records already exist in the Life Members registry. No new records added.`;
        }
        else if (conflictMode === 'skip' && duplicateCount > 0) {
            resultMessage = `Import complete: ${importedCount} new members enrolled, ${duplicateCount} existing duplicates skipped.`;
        }
        else if (conflictMode === 'overwrite' && updatedCount > 0) {
            resultMessage = `Import complete: ${importedCount} new members enrolled, ${updatedCount} existing members updated.`;
        }
        else {
            resultMessage = `Import complete: ${importedCount} new members enrolled.`;
        }
        res.json({
            success: true,
            message: resultMessage,
            summary: {
                total: rows.length,
                imported: importedCount,
                updated: updatedCount,
                duplicates: duplicateCount,
                skipped: skippedCount + (conflictMode === 'skip' ? duplicateCount : 0),
                errors
            }
        });
    }
    catch (error) {
        console.error('Import life members error:', error);
        res.status(500).json({ error: error.message || 'Failed to import life members spreadsheet' });
    }
});
// Admin: Update KMA Life Member
router.put('/life-members/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const adminId = req.user.uid;
    try {
        const id = req.params.id;
        const { name, email, phone, designation, affiliation, address, notes, status, uniqueId } = req.body;
        const memberRef = firebase_1.db.collection('life_members').doc(id);
        const memberDoc = await memberRef.get();
        if (!memberDoc.exists) {
            return res.status(404).json({ error: 'Life Member record not found.' });
        }
        const currentData = memberDoc.data();
        const updateData = {
            updatedAt: new Date()
        };
        if (name !== undefined)
            updateData.name = name.trim();
        if (phone !== undefined)
            updateData.phone = phone.trim();
        if (designation !== undefined)
            updateData.designation = designation.trim();
        if (affiliation !== undefined)
            updateData.affiliation = affiliation.trim();
        if (address !== undefined)
            updateData.address = address.trim();
        if (notes !== undefined)
            updateData.notes = notes.trim();
        if (status !== undefined)
            updateData.status = status;
        if (email !== undefined && email.trim().toLowerCase() !== currentData.emailLower) {
            const newEmailLower = email.trim().toLowerCase();
            // Verify email uniqueness
            const checkEmail = await firebase_1.db.collection('life_members').where('emailLower', '==', newEmailLower).get();
            if (!checkEmail.empty && checkEmail.docs[0].id !== id) {
                return res.status(400).json({ error: `Email "${newEmailLower}" is already assigned to another Life Member.` });
            }
            updateData.email = email.trim();
            updateData.emailLower = newEmailLower;
        }
        await memberRef.update(updateData);
        // Sync with users collection if registered
        const emailToMatch = updateData.emailLower || currentData.emailLower;
        const userQuery = await firebase_1.db.collection('users').where('emailLower', '==', emailToMatch).limit(1).get();
        if (!userQuery.empty) {
            await userQuery.docs[0].ref.update({
                name: updateData.name || currentData.name,
                affiliation: updateData.affiliation || currentData.affiliation,
                designation: updateData.designation || currentData.designation,
                phone: updateData.phone || currentData.phone,
                updatedAt: new Date()
            });
        }
        await (0, auditService_1.logAuditEvent)('Life Member Updated', id, adminId);
        res.json({
            success: true,
            message: 'Life Member details updated successfully.',
            member: {
                id,
                ...currentData,
                ...updateData
            }
        });
    }
    catch (error) {
        console.error('Update life member error:', error);
        res.status(500).json({ error: error.message || 'Failed to update life member' });
    }
});
// Admin: Delete/Remove KMA Life Member
router.delete('/life-members/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    const adminId = req.user.uid;
    try {
        const id = req.params.id;
        const memberRef = firebase_1.db.collection('life_members').doc(id);
        const memberDoc = await memberRef.get();
        if (!memberDoc.exists) {
            return res.status(404).json({ error: 'Life Member record not found.' });
        }
        const memberData = memberDoc.data();
        // Remove from life_members collection
        await memberRef.delete();
        // If user has an active profile, revoke isLifeMember flag
        if (memberData.emailLower) {
            const userQuery = await firebase_1.db.collection('users').where('emailLower', '==', memberData.emailLower).limit(1).get();
            if (!userQuery.empty) {
                await userQuery.docs[0].ref.update({
                    isLifeMember: false,
                    lifeMember: false,
                    updatedAt: new Date()
                });
            }
        }
        await (0, auditService_1.logAuditEvent)('Life Member Removed', id, adminId);
        res.json({ success: true, message: `Life Member ${memberData.name} (${id}) removed successfully.` });
    }
    catch (error) {
        console.error('Delete life member error:', error);
        res.status(500).json({ error: error.message || 'Failed to remove life member' });
    }
});
exports.default = router;
