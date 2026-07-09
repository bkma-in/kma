import { Router } from 'express';
import { db, auth } from '../config/firebase';
import { FieldPath } from 'firebase-admin/firestore';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { uploadImage, deleteImage } from '../services/cloudinaryService';
import { sendTransactionalEmail } from '../services/emailService';
import { logAuditEvent } from '../services/auditService';

import { config } from '../config/env';

// Helper to send reviewer onboarding credentials via email
const sendReviewerCredentialsEmail = async (name: string, email: string, tempPassword: string, req: any) => {
  const logoUrl = config.brevo.logoUrl;
  const loginUrl = config.brevo.loginUrl;
  const privacyPolicyUrl = config.brevo.privacyPolicyUrl;
  const reviewerGuidelinesUrl = config.brevo.reviewerGuidelinesUrl;
  const supportUrl = config.brevo.supportUrl;
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #000000; letter-spacing: -0.01em;">Welcome to the BKMA Community!</h2>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #3f3f46;">
                Dear ${name},<br /><br />
                Congratulations! Your reviewer account has been successfully created for the Bulletin of Kerala Mathematical Association. We are delighted to welcome you as a valued member of our reviewer panel. Your expertise and contribution will play a vital role in maintaining the quality and integrity of scholarly publications.
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

  try {
    await sendTransactionalEmail(email, name, subject, htmlContent);
    return true;
  } catch (error) {
    console.error('Failed to send reviewer credentials email:', error);
    return false;
  }
};

const router = Router();

// Get Current User Profile
router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ success: true, profile: userDoc.data() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Profile (Optimized: 1 Read, 1 Write, Non-blocking Cleanup)
router.put('/profile', requireAuth, upload.single('profileImage'), async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const { name, phone, designation, bio } = req.body;

    // 1. Lightweight Validation & Sanitization
    const sanitizedBio = bio?.trim().slice(0, 500) || '';
    const sanitizedName = name?.trim();
    const sanitizedPhone = phone?.trim();

    const userRef = db.collection('users').doc(uid);
    
    // Performance: Only one read to get current state (required for old image ID)
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data()!;
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only add to update payload if provided to avoid overwriting with undefined
    if (sanitizedName) {
      updateData.name = sanitizedName;
      updateData.nameLower = sanitizedName.toLowerCase();
    }
    if (sanitizedPhone !== undefined) updateData.phone = sanitizedPhone;
    if (designation !== undefined) updateData.designation = designation.trim();
    if (bio !== undefined) updateData.bio = sanitizedBio;

    // 2. Handle Image Operations
    if (req.file) {
      // Must await upload to get the new URL for the database
      const uploadResult = await uploadImage(req.file.buffer, 'profiles');
      
      // Performance: Fire-and-forget deletion of old image (don't block the response)
      if (userData.profileImagePublicId) {
        deleteImage(userData.profileImagePublicId).catch(err => 
          console.error('Background cleanup error (old image):', err)
        );
      }

      updateData.profileImage = uploadResult.secure_url;
      updateData.profileImagePublicId = uploadResult.public_id;
    } else if (req.body.profileImage === null || req.body.profileImage === 'null') {
      // Explicitly removed profile image
      if (userData.profileImagePublicId) {
        deleteImage(userData.profileImagePublicId).catch(err => 
          console.error('Background cleanup error (removed image):', err)
        );
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
      } else {
        console.log(`[AUTH-DIAGNOSTIC] Syncing custom claims for UID: ${uid}, Role: "${userData.role}", Name: "${sanitizedName}"`);
        auth.setCustomUserClaims(uid, { role: userData.role, name: sanitizedName }).catch(err => 
          console.error('[AUTH-DIAGNOSTIC] Background custom claims sync error:', err)
        );
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

  } catch (error: any) {
    console.error('Senior Audit - Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Report an Issue (Bug/UI)
router.post('/report-issue', requireAuth, upload.single('screenshot'), async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const { type, description, metadata } = req.body;

    let screenshotUrl = null;
    let screenshotPublicId = null;

    if (req.file) {
      const uploadResult = await uploadImage(req.file.buffer, 'issues');
      screenshotUrl = uploadResult.secure_url;
      screenshotPublicId = uploadResult.public_id;
    }

    const issueRef = db.collection('reported_issues').doc();
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
  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
});

// Get All Reported Issues (for Developer Dashboard)
router.get('/reported-issues', requireAuth, requireRole(['admin', 'dev']), async (req: AuthRequest, res) => {
  try {
    const snapshot = await db.collection('reported_issues').orderBy('createdAt', 'desc').get();
    const issues = snapshot.docs.map(doc => {
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
  } catch (error) {
    console.error('Get reported issues error:', error);
    res.status(500).json({ error: 'Failed to fetch reported issues' });
  }
});

// Update Reported Issue Status (for Developer Dashboard)
router.patch('/reported-issues/:id/status', requireAuth, requireRole(['admin', 'dev']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['Open', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const issueRef = db.collection('reported_issues').doc(id);
    const issueDoc = await issueRef.get();

    if (!issueDoc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issueRef.update({ status, updatedAt: new Date() });

    const updated = { ...issueDoc.data(), status, updatedAt: new Date().toISOString() };
    res.json({ success: true, issue: updated });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ error: 'Failed to update issue status' });
  }
});

// Search Users (Registered users only)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { search = '', limit = '20' } = req.query;
    const searchTerm = (search as string).toLowerCase();
    const limitNum = parseInt(limit as string) || 20;

    if (!searchTerm) {
      return res.json({ success: true, users: [] });
    }

    // High performance prefix queries run concurrently
    const nameQuery = db.collection('users')
      .where('nameLower', '>=', searchTerm)
      .where('nameLower', '<=', searchTerm + '\uf8ff')
      .limit(limitNum)
      .get();

    const emailQuery = db.collection('users')
      .where('emailLower', '>=', searchTerm)
      .where('emailLower', '<=', searchTerm + '\uf8ff')
      .limit(limitNum)
      .get();

    const [nameSnap, emailSnap] = await Promise.all([nameQuery, emailQuery]);
    const userMap = new Map();

    nameSnap.docs.forEach(doc => {
      const data = doc.data();
      userMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        email: data.email,
        affiliation: data.affiliation || ''
      });
    });

    emailSnap.docs.forEach(doc => {
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
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Helper to generate temporary password
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8) + '!' + Math.floor(Math.random() * 100);
};

// Admin: Get all reviewers
router.get('/reviewers', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'reviewer').get();
    const reviewers = snapshot.docs.map(doc => {
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
  } catch (error) {
    console.error('Get reviewers error:', error);
    res.status(500).json({ error: 'Failed to fetch reviewers' });
  }
});

// Admin: Get all authors (paginated)
router.get('/authors', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { pageSize = '50', cursor } = req.query;
    const limitNum = parseInt(pageSize as string) || 50;

    // Fetch all authors from database using simple query (no composite index required)
    const snapshot = await db.collection('users').where('role', '==', 'author').get();
    
    let allAuthors = snapshot.docs.map(doc => {
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
      const [ts, docId] = (cursor as string).split('|');
      const cursorTime = new Date(ts).getTime();
      
      const foundIndex = allAuthors.findIndex(a => {
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
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

// Admin: Update reviewer status (Approve/Reject/Deactivate/Reactivate)
router.patch('/reviewers/:id/status', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  const adminId = req.user!.uid;
  try {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;

    const validStatuses = ['Approved', 'Rejected', 'Pending', 'Deactivated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }

    const userData = userDoc.data()!;
    const previousStatus = userData.status;

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'Rejected') {
      updateData.rejectionReason = rejectionReason || '';
    } else {
      updateData.rejectionReason = '';
    }

    // Handle account activation/deactivation in Firebase Auth and log audit events
    if (status === 'Deactivated') {
      await auth.updateUser(id, { disabled: true });
      await auth.revokeRefreshTokens(id);
      await logAuditEvent('Reviewer Deactivated', id, adminId);
    } else if (status === 'Approved' && previousStatus === 'Deactivated') {
      await auth.updateUser(id, { disabled: false });
      await logAuditEvent('Reviewer Reactivated', id, adminId);
    }

    await userRef.update(updateData);

    res.json({ success: true, reviewer: { ...userDoc.data(), ...updateData, id } });
  } catch (error: any) {
    console.error('Update reviewer status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update reviewer status' });
  }
});

// Admin: Create pre-approved reviewer user (delivered via secure email onboarding)
router.post('/reviewers', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  const adminId = req.user!.uid;
  try {
    const { name, email, qualification, experience } = req.body;

    if (!name || !email || !qualification || !experience) {
      return res.status(400).json({ error: 'All fields (name, email, qualification, experience) are required' });
    }

    const tempPassword = generateTempPassword();

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password: tempPassword,
      displayName: name
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Write profile to database first
      await db.collection('users').doc(userRecord.uid).set(userData);
      
      // Then apply custom claims
      await auth.setCustomUserClaims(userRecord.uid, { role: 'reviewer', name });
    } catch (err) {
      // Rollback: Delete the auth user if database write or claims config fails
      await auth.deleteUser(userRecord.uid).catch(authErr => 
        console.error('Failed to delete Auth user on rollback:', authErr)
      );
      throw err;
    }

    // Record Reviewer Created in audit log
    await logAuditEvent('Reviewer Created', userRecord.uid, adminId);

    // Send credentials via email asynchronously
    const emailSent = await sendReviewerCredentialsEmail(name, email, tempPassword, req);

    if (emailSent) {
      await logAuditEvent('Credentials Email Sent', userRecord.uid, adminId);
      await db.collection('users').doc(userRecord.uid).update({ credentialsShared: true });
    } else {
      await logAuditEvent('Credentials Email Failed', userRecord.uid, adminId);
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
  } catch (error: any) {
    console.error('Create reviewer error:', error);
    res.status(500).json({ error: error.message || 'Failed to create reviewer user' });
  }
});

// Admin: Resend reviewer credentials (regenerates password, updates Auth, emails Reviewer, logs audit)
router.post('/reviewers/:id/resend-credentials', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  const adminId = req.user!.uid;
  try {
    const id = req.params.id as string;
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }

    const userData = userDoc.data()!;
    if (userData.role !== 'reviewer') {
      return res.status(400).json({ error: 'User is not a reviewer' });
    }

    const tempPassword = generateTempPassword();

    // 1. Update password securely in Firebase Authentication (invalidates old temp password)
    await auth.updateUser(id, { password: tempPassword });

    // 2. Reset mustChangePassword flag in Firestore document to true
    await userRef.update({
      mustChangePassword: true,
      credentialsShared: false,
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
    await logAuditEvent('Credentials Resent', id, adminId);

    res.json({ success: true, message: 'Credentials have been sent successfully.' });
  } catch (error: any) {
    console.error('Resend credentials error:', error);
    res.status(500).json({ error: error.message || 'Failed to resend credentials' });
  }
});

export default router;

