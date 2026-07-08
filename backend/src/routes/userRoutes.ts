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
  const currentYear = new Date().getFullYear();
  const subject = 'Welcome to Kerala Mathematical Association Reviewer Portal';
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>BKMA Reviewer Portal Welcome</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
  <script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          "colors": {
            "surface-container-highest": "#d3e4fe",
            "primary": "#000000",
            "tertiary-fixed-dim": "#c4c7c9",
            "surface": "#f8f9ff",
            "surface-container-high": "#dce9ff",
            "on-primary": "#ffffff",
            "on-surface": "#0b1c30",
            "on-secondary-fixed-variant": "#003ea8",
            "error": "#ba1a1a",
            "inverse-surface": "#213145",
            "surface-variant": "#d3e4fe",
            "error-container": "#ffdad6",
            "on-background": "#0b1c30",
            "background": "#f8f9ff",
            "on-primary-fixed-variant": "#3f465c",
            "on-error": "#ffffff",
            "on-secondary-container": "#fefcff",
            "on-primary-container": "#7c839b",
            "tertiary-fixed": "#e0e3e5",
            "surface-container-low": "#eff4ff",
            "on-error-container": "#93000a",
            "primary-container": "#131b2e",
            "on-secondary": "#ffffff",
            "on-primary-fixed": "#131b2e",
            "outline": "#76777d",
            "tertiary": "#000000",
            "surface-container": "#e5eeff",
            "surface-bright": "#f8f9ff",
            "secondary-fixed": "#dbe1ff",
            "inverse-on-surface": "#eaf1ff",
            "surface-tint": "#565e74",
            "outline-variant": "#c6c6cd",
            "surface-container-lowest": "#ffffff",
            "on-tertiary-container": "#818486",
            "inverse-primary": "#bec6e0",
            "on-tertiary": "#ffffff",
            "surface-dim": "#cbdbf5",
            "on-tertiary-fixed": "#191c1e",
            "tertiary-container": "#191c1e",
            "on-tertiary-fixed-variant": "#444749",
            "primary-fixed-dim": "#bec6e0",
            "on-surface-variant": "#45464d",
            "primary-fixed": "#dae2fd",
            "secondary-fixed-dim": "#b4c5ff",
            "on-secondary-fixed": "#00174b",
            "secondary-container": "#316bf3",
            "secondary": "#0051d5"
          },
          "borderRadius": {
            "DEFAULT": "0.25rem",
            "lg": "0.5rem",
            "xl": "0.75rem",
            "full": "9999px"
          },
          "spacing": {
            "component-padding": "20px",
            "edge-margin": "32px",
            "inline-gap": "12px",
            "container-width": "600px",
            "stack-gap": "24px"
          },
          "fontFamily": {
            "h1": ["Inter"], "h1-mobile": ["Inter"], "label-caps": ["Inter"], "h3": ["Inter"], "body-lg": ["Inter"], "body-md": ["Inter"], "h2": ["Inter"]
          },
          "fontSize": {
            "h1": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
            "h1-mobile": ["22px", {"lineHeight": "28px", "fontWeight": "700"}],
            "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
            "h3": ["16px", {"lineHeight": "24px", "fontWeight": "600"}],
            "body-lg": ["16px", {"lineHeight": "26px", "fontWeight": "400"}],
            "body-md": ["14px", {"lineHeight": "22px", "fontWeight": "400"}],
            "h2": ["20px", {"lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
          }
        },
      },
    }
  </script>
  <style>
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      vertical-align: middle;
    }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f8f9ff; }
    .email-container { max-width: 600px; margin: 0 auto; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .grid-col-2 { grid-template-columns: 1fr 1fr !important; }
      .mobile-padding { padding: 16px !important; }
    }
  </style>
</head>
<body class="bg-surface">
  <div class="email-container bg-surface font-body-md text-on-surface">
    <!-- Header Section -->
    <header class="flex flex-col items-center justify-center w-full px-edge-margin pt-edge-margin pb-stack-gap bg-surface">
      <div class="mb-4">
        <img alt="BKMA Logo" class="mx-auto" height="80" src="${logoUrl}" width="80"/>
      </div>
      <h1 class="font-h1 text-h1 text-primary text-center">Bulletin of Kerala Mathematical Association</h1>
      <p class="font-h2 text-h2 text-on-primary-container text-center mt-1">Reviewer Portal</p>
      <div class="mt-stack-gap">
        <img alt="Welcome Icon" class="mx-auto" height="64" src="https://lh3.googleusercontent.com/aida/AP1WRLv0p14rMHw0mDmB4wQPIUTPeRxJx-CJD60PRtAVL8LCUZ4d7jNDWPdYoOS-0wk14A8VxyPAS55TXuYe-wXSuuf5Dmrw7DsUbwUvuNpsMZH6u4unGaGQgi_zZnS6WodYOlX2JclG5SUdViLGG2YxaBI0jYiFujugx9zOCywtforY2DkVsi5anPbHeShUra6Xb-xo0EEfS79UH_7xSK9i_0Rg3_zqUKFN-cFM9CX355zsav9rvZedEzaALA" width="64"/>
      </div>
    </header>

    <!-- Welcome Body -->
    <main class="px-edge-margin mobile-padding">
      <section class="mb-stack-gap">
        <h2 class="font-h1 text-h1 text-on-surface mb-4">Welcome to the BKMA Reviewer Community!</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          Dear ${name},<br/><br/>
          Congratulations! Your reviewer account has been successfully created for the Bulletin of Kerala Mathematical Association. We are delighted to welcome you as a valued member of our reviewer panel. Your expertise and contribution will play a vital role in maintaining the quality and integrity of scholarly publications.
        </p>
      </section>

      <!-- Login Credentials Card -->
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-component-padding mb-stack-gap shadow-sm">
        <h3 class="font-h2 text-h2 text-primary mb-inline-gap">Your Login Credentials</h3>
        <div class="space-y-2 mb-stack-gap">
          <div class="flex justify-between items-center border-b border-surface-container pb-2">
            <span class="font-label-caps text-on-primary-container">EMAIL</span>
            <span class="font-h3 text-h3 text-on-surface">${email}</span>
          </div>
          <div class="flex justify-between items-center pb-2">
            <span class="font-label-caps text-on-primary-container">TEMP PASSWORD</span>
            <span class="font-h3 text-h3 text-on-surface">${tempPassword}</span>
          </div>
        </div>
        <a class="block w-full bg-secondary text-on-secondary text-center font-h3 text-h3 py-4 rounded-lg shadow-md hover:opacity-90 transition-opacity active:scale-[0.98]" href="${loginUrl}">
          Login
        </a>
      </div>

      <!-- Security Notice -->
      <div class="border-l-4 border-secondary bg-surface-container-low p-component-padding mb-stack-gap rounded-r-lg flex items-start gap-4">
        <span class="material-symbols-outlined text-secondary" style="font-size: 24px;">info</span>
        <div>
          <h4 class="font-h3 text-h3 text-on-surface">Security Notice</h4>
          <p class="font-body-md text-on-surface-variant mt-1">For your security, you will be required to change your password immediately after your first successful login. Please keep your login credentials confidential.</p>
        </div>
      </div>

      <!-- What You Can Do (Bento-ish Grid) -->
      <section class="mb-stack-gap">
        <h3 class="font-label-caps text-on-primary-container mb-4 text-center font-bold">WHAT YOU CAN DO</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-surface-container p-4 rounded-xl border border-surface-container-high">
            <span class="material-symbols-outlined text-primary mb-2" style="font-size: 20px;">description</span>
            <p class="font-h3 text-h3 text-on-surface leading-tight">Review assigned manuscripts</p>
          </div>
          <div class="bg-surface-container p-4 rounded-xl border border-surface-container-high">
            <span class="material-symbols-outlined text-primary mb-2" style="font-size: 20px;">star</span>
            <p class="font-h3 text-h3 text-on-surface leading-tight">Submit review recommendations</p>
          </div>
          <div class="bg-surface-container p-4 rounded-xl border border-surface-container-high">
            <span class="material-symbols-outlined text-primary mb-2" style="font-size: 20px;">notifications_active</span>
            <p class="font-h3 text-h3 text-on-surface leading-tight">Receive review notifications</p>
          </div>
          <div class="bg-surface-container p-4 rounded-xl border border-surface-container-high">
            <span class="material-symbols-outlined text-primary mb-2" style="font-size: 20px;">menu_book</span>
            <p class="font-h3 text-h3 text-on-surface leading-tight">Contribute to BKMA process</p>
          </div>
        </div>
      </section>

      <!-- Support Section -->
      <section class="text-center py-stack-gap bg-surface-container-lowest rounded-xl px-4 border border-outline-variant mb-stack-gap">
        <h3 class="font-h3 text-h3 text-on-surface mb-2">Need Help?</h3>
        <p class="font-body-md text-on-surface-variant mb-4">If you experience any difficulty accessing your account, please contact the BKMA Editorial Office.</p>
        <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
          <a class="flex items-center gap-2 text-secondary font-h3" href="mailto:keralamathsasso@gmail.com">
            <span class="material-symbols-outlined" style="font-size: 18px;">mail</span>
            keralamathsasso@gmail.com
          </a>
          <a class="flex items-center gap-2 text-secondary font-h3" href="https://www.bkma.in">
            <span class="material-symbols-outlined" style="font-size: 18px;">language</span>
            www.bkma.in
          </a>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-primary-container text-on-secondary-container p-edge-margin text-center flex flex-col items-center">
      <h4 class="font-label-caps text-label-caps mb-2 text-on-secondary-container">Bulletin of Kerala Mathematical Association</h4>
      <p class="font-body-md text-body-md opacity-80 mb-2">Advancing Mathematical Research Through Quality Publications</p>
      <p class="font-body-md text-body-md opacity-80 mb-6">Kerala, India</p>
      <div class="flex gap-4 mb-6">
        <a class="text-on-secondary-container underline font-body-md opacity-80 hover:opacity-100 transition-opacity" href="#">Privacy Policy</a>
        <a class="text-on-secondary-container underline font-body-md opacity-80 hover:opacity-100 transition-opacity" href="#">Reviewer Guidelines</a>
        <a class="text-on-secondary-container underline font-body-md opacity-80 hover:opacity-100 transition-opacity" href="#">Support</a>
      </div>
      <p class="font-label-caps text-label-caps opacity-60">
        © ${currentYear} Bulletin of Kerala Mathematical Association. All Rights Reserved.
      </p>
    </footer>
  </div>
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
        mustChangePassword: data.mustChangePassword === true
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
        mustChangePassword: true
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
      updatedAt: new Date()
    });

    // 3. Send email with new temporary credentials
    const emailSent = await sendReviewerCredentialsEmail(userData.name, userData.email, tempPassword, req);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to deliver credentials email. Please try again.' });
    }

    // 4. Record Credentials Resent in audit log
    await logAuditEvent('Credentials Resent', id, adminId);

    res.json({ success: true, message: 'Credentials have been sent successfully.' });
  } catch (error: any) {
    console.error('Resend credentials error:', error);
    res.status(500).json({ error: error.message || 'Failed to resend credentials' });
  }
});

export default router;
