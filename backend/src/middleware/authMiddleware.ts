import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    name: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Auth Middleware: No token provided');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    // Fallback: Fetch user details from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const role = userData?.role || 'reader';
    const name = userData?.name || decodedToken.email?.split('@')[0] || 'User';

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: role as string,
      name: name as string
    };
    next();
  } catch (error: any) {
    console.error('--- AUTH VERIFICATION FAILED ---');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Full Error:', JSON.stringify(error, null, 2));
    console.error('--------------------------------');
    return res.status(401).json({ error: `Unauthorized: Invalid token - ${error.message}` });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
