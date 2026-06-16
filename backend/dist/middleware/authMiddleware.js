"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const firebase_1 = require("../config/firebase");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        console.log('[AUTH-DIAGNOSTIC] Auth Middleware: No token provided');
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        console.log(`[AUTH-DIAGNOSTIC] Token successfully verified for UID: ${decodedToken.uid}`);
        // 1. Authoritative Source: Check Custom User Claims first
        let role = decodedToken.role;
        let name = decodedToken.name;
        let source = 'Custom Claims';
        // 2. Fallback Source: Fetch user details from Firestore if missing from claims
        if (!role) {
            console.log(`[AUTH-DIAGNOSTIC] Role not found in Custom Claims for UID: ${decodedToken.uid}. Fetching from Firestore.`);
            const userDoc = await firebase_1.db.collection('users').doc(decodedToken.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                role = userData?.role;
                name = name || userData?.name;
                source = 'Firestore Collection';
            }
            else {
                console.warn(`[AUTH-DIAGNOSTIC] Firestore document does not exist for UID: ${decodedToken.uid}`);
            }
        }
        // 3. Validation
        const validRoles = ['admin', 'reviewer', 'author', 'reader', 'dev'];
        if (!role || !validRoles.includes(role)) {
            console.error(`[AUTH-DIAGNOSTIC] ❌ Access Denied: User ${decodedToken.uid} has invalid or missing role: "${role}"`);
            return res.status(403).json({ error: 'Unauthorized: User has no valid role assigned.' });
        }
        name = name || decodedToken.email?.split('@')[0] || 'User';
        console.log(`[AUTH-DIAGNOSTIC] Route Guard Decision: ALLOWED. User: ${decodedToken.uid}, Role: "${role}" (Source: ${source}), Name: "${name}"`);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            role: role,
            name: name
        };
        next();
    }
    catch (error) {
        console.error('[AUTH-DIAGNOSTIC] ❌ AUTH VERIFICATION FAILED');
        console.error('[AUTH-DIAGNOSTIC] Error Code:', error.code);
        console.error('[AUTH-DIAGNOSTIC] Error Message:', error.message);
        return res.status(401).json({ error: `Unauthorized: Invalid token - ${error.message}` });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
