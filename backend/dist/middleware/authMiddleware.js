"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const firebase_1 = require("../config/firebase");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        console.log('Auth Middleware: No token provided');
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        let role = decodedToken.role;
        let name = decodedToken.name;
        if (!role || !name) {
            // Fallback: Fetch user details from Firestore and set claims for future bypass
            const userDoc = await firebase_1.db.collection('users').doc(decodedToken.uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            role = role || userData?.role || 'reader';
            name = name || userData?.name || decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
            // Update custom claims asynchronously in the background
            firebase_1.auth.setCustomUserClaims(decodedToken.uid, { role, name }).catch(err => {
                console.error('Background custom claims sync failed:', err);
            });
        }
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            role: role,
            name: name
        };
        next();
    }
    catch (error) {
        console.error('--- AUTH VERIFICATION FAILED ---');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
        console.error('--------------------------------');
        return res.status(401).json({ error: `Unauthorized: Invalid token - ${error.message}` });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
