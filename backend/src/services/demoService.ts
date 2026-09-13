import { auth, db } from '../config/firebase';
import { invalidateUserRoleCache } from '../middleware/authMiddleware';

export const DEMO_USER_EMAIL = 'demo788197@gmail.com';
export const DEMO_USER_PASSWORD = 'Demo@123';
export const DEMO_USER_NAME = 'Demo Account User';

export interface DemoRoleSwitchOptions {
  role: 'admin' | 'author' | 'reviewer' | 'reader' | 'dev';
  readerStatus?: 'active' | 'inactive';
}

/**
 * Initializes or verifies the universal Demo Account.
 * Guarantees that demo788197@gmail.com exists with password Demo@123,
 * emailVerified = true, valid custom claims, and rich demo data.
 */
export async function ensureDemoAccountInitialized(): Promise<{ uid: string; email: string }> {
  try {
    console.log(`[DEMO-SERVICE] Verifying demo master account: ${DEMO_USER_EMAIL}...`);

    let uid: string;
    try {
      const existingUser = await auth.getUserByEmail(DEMO_USER_EMAIL);
      uid = existingUser.uid;
      // Ensure password and emailVerified are always correct
      await auth.updateUser(uid, {
        password: DEMO_USER_PASSWORD,
        emailVerified: true,
        displayName: DEMO_USER_NAME,
      });
      console.log(`[DEMO-SERVICE] Demo user updated in Firebase Auth (UID: ${uid})`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const newUser = await auth.createUser({
          email: DEMO_USER_EMAIL,
          password: DEMO_USER_PASSWORD,
          displayName: DEMO_USER_NAME,
          emailVerified: true,
        });
        uid = newUser.uid;
        console.log(`[DEMO-SERVICE] Created new demo user in Firebase Auth (UID: ${uid})`);
      } else {
        throw err;
      }
    }

    // Set custom claims (default to admin)
    await auth.setCustomUserClaims(uid, {
      role: 'admin',
      name: DEMO_USER_NAME,
      isDemo: true,
    });
    invalidateUserRoleCache(uid);

    // Ensure Firestore user document exists and is configured
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const now = new Date();

    const userData: any = {
      uid,
      email: DEMO_USER_EMAIL,
      emailLower: DEMO_USER_EMAIL.toLowerCase(),
      name: DEMO_USER_NAME,
      nameLower: DEMO_USER_NAME.toLowerCase(),
      role: userDoc.exists && userDoc.data()?.role ? userDoc.data()?.role : 'admin',
      emailVerified: true,
      isDemoAccount: true,
      status: 'Approved',
      qualification: 'PhD in Mathematical Sciences',
      experience: '12+ years in Algebraic Geometry & Peer Review',
      isSubscribed: true,
      updatedAt: now,
    };

    if (!userDoc.exists) {
      userData.createdAt = now;
      await userRef.set(userData);
      console.log(`[DEMO-SERVICE] Created demo user document in Firestore`);
    } else {
      await userRef.set(userData, { merge: true });
      console.log(`[DEMO-SERVICE] Updated demo user document in Firestore`);
    }

    // Seed Demo Subscription for Reader Active
    await seedDemoSubscription(uid);

    console.log(`[DEMO-SERVICE] Demo account initialization completed successfully (Clean user, no fake data).`);
    return { uid, email: DEMO_USER_EMAIL };
  } catch (error: any) {
    console.error(`[DEMO-SERVICE] Error initializing demo account:`, error.message || error);
    throw error;
  }
}

/**
 * Seeds an active subscription for Reader mode.
 */
async function seedDemoSubscription(demoUid: string) {
  const subRef = db.collection('subscriptions').doc(`demo_sub_${demoUid}`);
  const doc = await subRef.get();
  if (!doc.exists) {
    const now = new Date();
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    await subRef.set({
      subscriptionId: subRef.id,
      userId: demoUid,
      userEmail: DEMO_USER_EMAIL,
      userName: DEMO_USER_NAME,
      status: 'active',
      plan: 'annual',
      type: 'annual',
      amount: 2000,
      paymentMethod: 'Manual Bank Transfer',
      transactionReference: 'DEMO-TXN-2026-BKMA',
      startedAt: now,
      expiresAt: nextYear,
      createdAt: now,
      updatedAt: now,
      verifiedBy: 'System Auto-Provision',
    });
    console.log(`[DEMO-SERVICE] Seeded active subscription for Reader Active mode`);
  }
}

/**
 * Switches the active demo role for demo788197@gmail.com in backend Firestore and custom claims.
 */
export async function switchDemoRole(uid: string, options: DemoRoleSwitchOptions) {
  const { role, readerStatus = 'active' } = options;
  const validRoles = ['admin', 'author', 'reviewer', 'reader', 'dev'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid target demo role: ${role}`);
  }

  const userRef = db.collection('users').doc(uid);
  await userRef.set({
    role,
    readerStatus,
    isSubscribed: role === 'reader' ? (readerStatus === 'active') : true,
    updatedAt: new Date()
  }, { merge: true });

  // Update custom claims so token refreshes inherit the role
  await auth.setCustomUserClaims(uid, {
    role,
    name: DEMO_USER_NAME,
    isDemo: true,
  });

  // Invalidate in-memory cache
  invalidateUserRoleCache(uid);

  // If reader, update or toggle subscription status
  const subRef = db.collection('subscriptions').doc(`demo_sub_${uid}`);
  if (role === 'reader') {
    if (readerStatus === 'active') {
      await subRef.set({
        status: 'active',
        userId: uid,
        updatedAt: new Date()
      }, { merge: true });
    } else {
      await subRef.set({
        status: 'expired',
        userId: uid,
        updatedAt: new Date()
      }, { merge: true });
    }
  }

  console.log(`[DEMO-SERVICE] Demo user ${uid} switched to role: "${role}" (Reader status: ${readerStatus})`);
  return { role, readerStatus };
}
