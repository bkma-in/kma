"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCodeRateLimiter = exports.sendVerificationRateLimiter = exports.webhookRateLimiter = exports.archiveRateLimiter = exports.paymentRateLimiter = exports.downloadRateLimiter = exports.signedUrlRateLimiter = exports.uploadRateLimiter = exports.pdfRateLimiter = exports.authRateLimiter = exports.globalRateLimiter = exports.getClientIp = exports.isTrustedProxy = exports.PRIVATE_IPV6_CIDRS = exports.PRIVATE_IPV4_CIDRS = exports.CLOUDFLARE_IPV6_CIDRS = exports.CLOUDFLARE_IPV4_CIDRS = void 0;
exports.isCloudflareIp = isCloudflareIp;
exports.isPrivateIp = isPrivateIp;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
/**
 * Official Cloudflare Published IPv4 and IPv6 Network Ranges
 * Reference: https://www.cloudflare.com/ips/
 */
exports.CLOUDFLARE_IPV4_CIDRS = [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22'
];
exports.CLOUDFLARE_IPV6_CIDRS = [
    '2400:cb00::/32',
    '2606:4600::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32'
];
/**
 * Private and Loopback Network Ranges (Render internal load balancers / local dev)
 */
exports.PRIVATE_IPV4_CIDRS = [
    '127.0.0.0/8',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
];
exports.PRIVATE_IPV6_CIDRS = [
    '::1/128',
    'fc00::/7',
    'fe80::/10'
];
function ipv4ToBigInt(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4)
        return null;
    let num = 0n;
    for (let i = 0; i < 4; i++) {
        const p = parseInt(parts[i], 10);
        if (isNaN(p) || p < 0 || p > 255)
            return null;
        num = (num << 8n) + BigInt(p);
    }
    return num;
}
function ipv6ToBigInt(ip) {
    let formatted = ip.trim();
    if (formatted.startsWith('::ffff:')) {
        formatted = formatted.substring(7);
        return ipv4ToBigInt(formatted);
    }
    if (formatted.includes('.')) {
        const lastColon = formatted.lastIndexOf(':');
        const v4 = formatted.substring(lastColon + 1);
        const v4Num = ipv4ToBigInt(v4);
        if (v4Num === null)
            return null;
        return 0xffff00000000n + v4Num;
    }
    if (formatted.includes('::')) {
        const parts = formatted.split('::');
        const left = parts[0] ? parts[0].split(':') : [];
        const right = parts[1] ? parts[1].split(':') : [];
        const missing = 8 - (left.length + right.length);
        const zeros = new Array(missing).fill('0');
        formatted = [...left, ...zeros, ...right].join(':');
    }
    const groups = formatted.split(':');
    if (groups.length !== 8)
        return null;
    let num = 0n;
    for (let i = 0; i < 8; i++) {
        const val = parseInt(groups[i] || '0', 16);
        if (isNaN(val) || val < 0 || val > 0xffff)
            return null;
        num = (num << 16n) + BigInt(val);
    }
    return num;
}
function isIPv4InCidr(ip, cidr) {
    const [rangeIp, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    const ipNum = ipv4ToBigInt(ip);
    const rangeNum = ipv4ToBigInt(rangeIp);
    if (ipNum === null || rangeNum === null)
        return false;
    const mask = prefix === 0 ? 0n : (~0n << BigInt(32 - prefix)) & 0xffffffffn;
    return (ipNum & mask) === (rangeNum & mask);
}
function isIPv6InCidr(ip, cidr) {
    const [rangeIp, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    const ipNum = ipv6ToBigInt(ip);
    const rangeNum = ipv6ToBigInt(rangeIp);
    if (ipNum === null || rangeNum === null)
        return false;
    const mask = prefix === 0 ? 0n : (~0n << BigInt(128 - prefix)) & ((1n << 128n) - 1n);
    return (ipNum & mask) === (rangeNum & mask);
}
function isCloudflareIp(ip) {
    if (!ip || typeof ip !== 'string')
        return false;
    const cleanIp = ip.replace(/^::ffff:/, '').trim();
    if (cleanIp.includes('.')) {
        return exports.CLOUDFLARE_IPV4_CIDRS.some(cidr => isIPv4InCidr(cleanIp, cidr));
    }
    return exports.CLOUDFLARE_IPV6_CIDRS.some(cidr => isIPv6InCidr(cleanIp, cidr));
}
function isPrivateIp(ip) {
    if (!ip || typeof ip !== 'string')
        return false;
    const cleanIp = ip.replace(/^::ffff:/, '').trim();
    if (cleanIp.includes('.')) {
        return exports.PRIVATE_IPV4_CIDRS.some(cidr => isIPv4InCidr(cleanIp, cidr));
    }
    return exports.PRIVATE_IPV6_CIDRS.some(cidr => isIPv6InCidr(cleanIp, cidr));
}
/**
 * Express trust proxy validator function:
 * Returns true if the proxy IP is a Render internal load balancer or a Cloudflare IP.
 */
const isTrustedProxy = (ip) => {
    return isPrivateIp(ip) || isCloudflareIp(ip);
};
exports.isTrustedProxy = isTrustedProxy;
/**
 * Secure Client IP Resolver:
 * Resolves real client IP safely.
 * Only trusts 'CF-Connecting-IP' header if the request's proxy hop before Render
 * is confirmed to originate from a published Cloudflare IP range.
 * Direct requests to Render that supply forged 'CF-Connecting-IP' headers are IGNORED.
 */
const getClientIp = (req) => {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) {
        const hops = req.ips || [];
        const immediateHop = hops.length > 0 ? hops[hops.length - 1] : req.socket.remoteAddress || '';
        if (isCloudflareIp(immediateHop)) {
            return cfIp.trim();
        }
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};
exports.getClientIp = getClientIp;
/**
 * Key Generator:
 * Uses verified Firebase Auth UID (req.user.uid) if user is authenticated via requireAuth middleware.
 * Uses secure client IP address if unauthenticated.
 * Never trusts client-supplied headers or body parameters for UID.
 */
const keyGenerator = (req) => {
    const authReq = req;
    if (authReq.user && authReq.user.uid) {
        return `uid_${authReq.user.uid}`;
    }
    return (0, exports.getClientIp)(req);
};
/**
 * IP-only Key Generator:
 * Used for network-level/unauthenticated rate limiters (e.g. global IP fallback, webhooks).
 */
const ipKeyGenerator = (req) => {
    return (0, exports.getClientIp)(req);
};
/**
 * Security Event Logger:
 * Logs rate limit violations safely without exposing sensitive data (tokens, passwords, OTPs, secrets).
 */
const logRateLimitViolation = (req, category, retryAfterSeconds) => {
    const authReq = req;
    const uid = authReq.user?.uid || 'anonymous';
    const ip = (0, exports.getClientIp)(req);
    const method = req.method;
    const url = req.originalUrl;
    const timestamp = new Date().toISOString();
    console.warn(`[SECURITY-ALERT][RATE-LIMIT] [${timestamp}] Category: "${category}" | Endpoint: ${method} ${url} | IP: ${ip} | UID: ${uid} | RetryAfter: ${retryAfterSeconds}s`);
};
/**
 * Custom Factory for Rate Limit Handlers:
 * Calculates dynamic Retry-After header and returns consistent JSON error response.
 */
const createRateLimiterHandler = (category, defaultMessage) => {
    return (req, res) => {
        const rateLimitInfo = req.rateLimit;
        let retryAfter = 60;
        if (rateLimitInfo && rateLimitInfo.resetTime) {
            retryAfter = Math.max(1, Math.ceil((new Date(rateLimitInfo.resetTime).getTime() - Date.now()) / 1000));
        }
        logRateLimitViolation(req, category, retryAfter);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
            success: false,
            message: defaultMessage,
            retryAfter
        });
    };
};
/**
 * 1. Global API Abuse Protection (300 requests / 15 minutes / IP)
 * Prevents general layer-7 flooding without blocking users on shared NAT networks.
 */
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.globalWindowMs,
    max: env_1.config.rateLimit.globalMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: createRateLimiterHandler('Global API', 'Too many requests. Please wait a moment and try again.')
});
/**
 * 2. Authentication Rate Limiter (10 requests / 15 minutes / UID or IP)
 * Protects login, registration, OTP, password reset, and password change endpoints.
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.authWindowMs,
    max: env_1.config.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('Authentication', 'Too many attempts. Please wait a few minutes before trying again.')
});
/**
 * 3. PDF Generation Rate Limiter (10 requests / 15 minutes / UID or IP)
 * Protects CPU/Memory intensive PDF generation endpoints.
 */
exports.pdfRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.pdfWindowMs,
    max: env_1.config.rateLimit.pdfMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('PDF Generation', 'PDF generation limit reached. Please wait a few minutes before requesting more documents.')
});
/**
 * 4. File Upload Rate Limiter (15 requests / 15 minutes / UID or IP)
 * Protects article file uploads, Cloudflare R2 storage, and Cloudinary operations.
 */
exports.uploadRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.uploadWindowMs,
    max: env_1.config.rateLimit.uploadMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('File Upload', 'File upload limit reached. Please wait a few minutes before uploading more files.')
});
/**
 * 5. Signed URL Generation Rate Limiter (30 requests / 15 minutes / UID or IP)
 * Protects presigned R2 preview URL generation and staging endpoints.
 */
exports.signedUrlRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.signedUrlWindowMs,
    max: env_1.config.rateLimit.signedUrlMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('Signed URL', 'Too many file preview requests. Please wait a moment and try again.')
});
/**
 * 6. File Download Rate Limiter (60 requests / 15 minutes / UID or IP)
 * Protects article downloads against scraping while accommodating legitimate readers.
 */
exports.downloadRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.downloadWindowMs,
    max: env_1.config.rateLimit.downloadMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('File Download', 'Download request limit reached. Please try again in a few minutes.')
});
/**
 * 7. Payment Order Rate Limiter (30 requests / 15 minutes / UID or IP)
 * Protects payment order creation & verification endpoints against fraud/abuse.
 */
exports.paymentRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.paymentWindowMs,
    max: env_1.config.rateLimit.paymentMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('Payment Order', 'Too many payment creation requests. Please wait a moment and try again.')
});
/**
 * 8. Archive & Bulk Operations Rate Limiter (10 requests / 15 minutes / UID)
 * Protects heavy archive extraction, chunking, and administrative batch processing.
 */
exports.archiveRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.archiveWindowMs,
    max: env_1.config.rateLimit.archiveMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('Archive Operations', 'Too many archive processing requests. Please try again later.')
});
/**
 * 9. Razorpay Webhook Dedicated Rate Limiter (100 requests / 1 minute / IP)
 * Provides dedicated IP-based rate limiting for Razorpay webhooks to prevent HTTP flooding
 * without interfering with valid payment events.
 */
exports.webhookRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.webhookWindowMs,
    max: env_1.config.rateLimit.webhookMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: createRateLimiterHandler('Razorpay Webhook', 'Too many webhook requests.')
});
/**
 * 10. Send Verification Email Rate Limiter (5 requests / 15 minutes / UID or IP)
 * Protects email sending API against verification email spam and email bombing.
 */
exports.sendVerificationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.sendVerificationWindowMs,
    max: env_1.config.rateLimit.sendVerificationMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('Send Verification Email', 'Too many verification email requests. Please wait a few minutes before requesting another email.')
});
/**
 * 11. Verify Code Rate Limiter (10 attempts / 15 minutes / UID or IP)
 * Protects code verification endpoint against brute-force code guessing attacks.
 */
exports.verifyCodeRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.verifyCodeWindowMs,
    max: env_1.config.rateLimit.verifyCodeMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: createRateLimiterHandler('Verify Email Code', 'Too many verification attempts. Please wait 15 minutes before trying again.')
});
