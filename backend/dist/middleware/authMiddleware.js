"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = exports.authenticateOptional = exports.clearUserRoleCache = exports.invalidateUserRoleCache = void 0;
const firebase_1 = require("../config/firebase");
const USER_ROLE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const userRoleCache = new Map();
/**
 * Invalidate cached user role by UID (call on profile/role update)
 */
const invalidateUserRoleCache = (uid) => {
    if (uid) {
        userRoleCache.delete(uid);
    }
};
exports.invalidateUserRoleCache = invalidateUserRoleCache;
/**
 * Clear all cached user roles
 */
const clearUserRoleCache = () => {
    userRoleCache.clear();
};
exports.clearUserRoleCache = clearUserRoleCache;
/**
 * Resolves user role and name from custom claims, in-memory cache, or Firestore fallback
 */
async function resolveUserRole(uid) {
    const cached = userRoleCache.get(uid);
    if (cached && (Date.now() - cached.cachedAt < USER_ROLE_TTL_MS)) {
        return { role: cached.role, name: cached.name };
    }
    const userDoc = await firebase_1.db.collection('users').doc(uid).get();
    if (userDoc.exists) {
        const userData = userDoc.data();
        const role = userData?.role;
        const name = userData?.name;
        if (role) {
            userRoleCache.set(uid, { role, name: name || '', cachedAt: Date.now() });
        }
        return { role, name };
    }
    return {};
}
/**
 * Optional Authentication Resolver:
 * Pre-verifies Firebase Auth Bearer tokens on top-level routes (/api/) if present.
 * Populates req.user once so that rate limiters and route guards reuse the verified identity
 * without duplicating Firebase token verification logic.
 */
const authenticateOptional = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        let role = decodedToken.role;
        let name = decodedToken.name;
        if (!role) {
            const resolved = await resolveUserRole(decodedToken.uid);
            role = resolved.role;
            name = name || resolved.name;
        }
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            role: (role || ''),
            name: (name || decodedToken.email?.split('@')[0] || 'User')
        };
    }
    catch (error) {
        // Continue without setting req.user on token verification error; requireAuth handles strict enforcement
    }
    next();
};
exports.authenticateOptional = authenticateOptional;
const requireAuth = async (req, res, next) => {
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
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        console.log(`[AUTH-DIAGNOSTIC] Token successfully verified for UID: ${decodedToken.uid}`);
        let role = decodedToken.role;
        let name = decodedToken.name;
        let source = 'Custom Claims';
        if (!role) {
            const resolved = await resolveUserRole(decodedToken.uid);
            role = resolved.role;
            name = name || resolved.name;
            source = 'Role Cache / Firestore';
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
            role: (role || ''),
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
