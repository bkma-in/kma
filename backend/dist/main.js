"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const env_1 = require("./config/env");
const migrationService_1 = require("./services/migrationService");
const notificationService_1 = require("./services/notificationService");
const queueService_1 = require("./services/archive/queueService");
// Run migrations in background
(0, migrationService_1.runMigrations)().catch(err => console.error('Startup migration error:', err));
// Resume interrupted archive jobs
queueService_1.queueService.resumeInterruptedJobs().catch(err => console.error('Startup archive jobs resumption error:', err));
// Run reviewer reminders at startup and set 12-hour interval scheduler
(0, notificationService_1.checkAndSendReviewReminders)().catch(err => console.error('Startup reminders check error:', err));
setInterval(() => {
    (0, notificationService_1.checkAndSendReviewReminders)().catch(err => console.error('Scheduled reminders check error:', err));
}, 12 * 60 * 60 * 1000);
// Import Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const articleRoutes_1 = __importDefault(require("./routes/articleRoutes"));
const issueRoutes_1 = __importDefault(require("./routes/issueRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const archiveRoutes_1 = __importDefault(require("./routes/archiveRoutes"));
// Import Rate Limiters and IP Trust Validator
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
// Configure Dynamic Proxy Trust (trusts Render internal network & verified Cloudflare IPs)
app.set('trust proxy', rateLimiter_1.isTrustedProxy);
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    exposedHeaders: ['Retry-After']
}));
// Razorpay Webhooks: Dedicated rate limiter + raw body parsing for signature verification
app.use('/api/webhooks', rateLimiter_1.webhookRateLimiter, express_1.default.raw({ type: 'application/json' }), webhookRoutes_1.default);
// General Request Payload Size Limits (1MB for JSON and URL-encoded data)
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// Global API Rate Limiter
app.use('/api/', rateLimiter_1.globalRateLimiter);
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/articles', articleRoutes_1.default);
app.use('/api/issues', issueRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/archive', archiveRoutes_1.default);
app.get('/', (req, res) => {
    res.send({ status: 'ok', message: 'KMA Backend is running' });
});
// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('[GLOBAL-ERROR-HANDLER]', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';
    res.status(status).json({
        success: false,
        error: message
    });
});
app.listen(env_1.config.port, () => {
    console.log(`Server running on port ${env_1.config.port}`);
});
