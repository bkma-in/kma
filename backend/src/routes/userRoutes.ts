import { Router } from 'express';
import { db, auth } from '../config/firebase';
import { FieldPath } from 'firebase-admin/firestore';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { uploadImage, deleteImage } from '../services/cloudinaryService';

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
      auth.setCustomUserClaims(uid, { role: userData.role || 'reader', name: sanitizedName }).catch(err => 
        console.error('Background custom claims sync error:', err)
      );
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
router.get('/reported-issues', requireAuth, requireRole(['admin', 'dev', 'developer']), async (req: AuthRequest, res) => {
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
router.patch('/reported-issues/:id/status', requireAuth, requireRole(['admin', 'dev', 'developer']), async (req: AuthRequest, res) => {
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
        rejectionReason: data.rejectionReason || ''
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

// Admin: Update reviewer status (Approve/Reject)
router.patch('/reviewers/:id/status', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;

    const validStatuses = ['Approved', 'Rejected', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'Rejected') {
      updateData.rejectionReason = rejectionReason || '';
    } else {
      updateData.rejectionReason = '';
    }

    await userRef.update(updateData);

    res.json({ success: true, reviewer: { ...userDoc.data(), ...updateData, id } });
  } catch (error) {
    console.error('Update reviewer status error:', error);
    res.status(500).json({ error: 'Failed to update reviewer status' });
  }
});

// Admin: Create pre-approved reviewer user
router.post('/reviewers', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
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

    // 2. Create user document in Firestore
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

    res.json({ 
      success: true, 
      reviewer: {
        id: userRecord.uid,
        name,
        email,
        qualification,
        experience,
        regDate: userData.createdAt.toISOString(),
        status: 'Approved'
      }, 
      tempPassword 
    });
  } catch (error: any) {
    console.error('Create reviewer error:', error);
    res.status(500).json({ error: error.message || 'Failed to create reviewer user' });
  }
});

export default router;
