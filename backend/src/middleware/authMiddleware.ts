import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    name: string;
  };
  file?: any;
  files?: any;
  params: any;
  body: any;
  query: any;
}

/**
 * Optional Authentication Resolver:
 * Pre-verifies Firebase Auth Bearer tokens on top-level routes (/api/) if present.
 * Populates req.user once so that rate limiters and route guards reuse the verified identity
 * without duplicating Firebase token verification logic.
 */
export const authenticateOptional = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    let role = decodedToken.role as string | undefined;
    let name = decodedToken.name as string | undefined;

    if (!role) {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        role = userData?.role;
        name = name || userData?.name;
      }
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: (role || '') as string,
      name: (name || decodedToken.email?.split('@')[0] || 'User') as string
    };
  } catch (error) {
    // Continue without setting req.user on token verification error; requireAuth handles strict enforcement
  }
  next();
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // If authenticateOptional has already verified the token and populated req.user:
  if (req.user && req.user.uid) {
    const isRegistering = req.originalUrl.endsWith('/register') || req.path === '/register';
    const validRoles = ['admin', 'reviewer', 'author', 'reader', 'dev'];
    if (!isRegistering && (!req.user.role || !validRoles.includes(req.user.role))) {
      console.error(`[AUTH-DIAGNOSTIC] ❌ Access Denied: User ${req.user.uid} has invalid or missing role: "${req.user.role}"`);
      return res.status(403).json({ error: 'Unauthorized: User has no valid role assigned.' });
    }
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[AUTH-DIAGNOSTIC] Auth Middleware: No token provided');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    console.log(`[AUTH-DIAGNOSTIC] Token successfully verified for UID: ${decodedToken.uid}`);
    
    let role = decodedToken.role as string | undefined;
    let name = decodedToken.name as string | undefined;
    let source = 'Custom Claims';

    if (!role) {
      console.log(`[AUTH-DIAGNOSTIC] Role not found in Custom Claims for UID: ${decodedToken.uid}. Fetching from Firestore.`);
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        role = userData?.role;
        name = name || userData?.name;
        source = 'Firestore Collection';
      } else {
        console.warn(`[AUTH-DIAGNOSTIC] Firestore document does not exist for UID: ${decodedToken.uid}`);
      }
    }

    const isRegistering = req.originalUrl.endsWith('/register') || req.path === '/register';
    const validRoles = ['admin', 'reviewer', 'author', 'reader', 'dev'];
    if (!isRegistering && (!role || !validRoles.includes(role))) {
      console.error(`[AUTH-DIAGNOSTIC] ❌ Access Denied: User ${decodedToken.uid} has invalid or missing role: "${role}"`);
      return res.status(403).json({ error: 'Unauthorized: User has no valid role assigned.' });
    }

    name = name || decodedToken.email?.split('@')[0] || 'User';

    console.log(`[AUTH-DIAGNOSTIC] Route Guard Decision: ALLOWED. User: ${decodedToken.uid}, Role: "${role || 'unregistered'}" (Source: ${source}), Name: "${name}"`);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: (role || '') as string,
      name: name as string
    };
    next();
  } catch (error: any) {
    console.error('[AUTH-DIAGNOSTIC] ❌ AUTH VERIFICATION FAILED');
    console.error('[AUTH-DIAGNOSTIC] Error Code:', error.code);
    console.error('[AUTH-DIAGNOSTIC] Error Message:', error.message);
    return res.status(401).json({ error: `Unauthorized: Invalid token - ${error.message}` });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.error('[AUTH-DIAGNOSTIC] ❌ Permission Failure: No authenticated user in request context');
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      console.error(`[AUTH-DIAGNOSTIC] ❌ Permission Failure: User ${req.user.uid} with role "${req.user.role}" attempted to access route requiring one of [${roles.join(', ')}]`);
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    console.log(`[AUTH-DIAGNOSTIC] Role verified: "${req.user.role}" matches allowed [${roles.join(', ')}]`);
    next();
  };
};
