import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env';
import { runMigrations } from './services/migrationService';
import { checkAndSendReviewReminders } from './services/notificationService';
import { queueService } from './services/archive/queueService';

// Run migrations in background
runMigrations().catch(err => console.error('Startup migration error:', err));

// Resume interrupted archive jobs
queueService.resumeInterruptedJobs().catch(err => console.error('Startup archive jobs resumption error:', err));

// Run reviewer reminders at startup and set 12-hour interval scheduler
checkAndSendReviewReminders().catch(err => console.error('Startup reminders check error:', err));
setInterval(() => {
  checkAndSendReviewReminders().catch(err => console.error('Scheduled reminders check error:', err));
}, 12 * 60 * 60 * 1000);

// Import Routes
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import issueRoutes from './routes/issueRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import archiveRoutes from './routes/archiveRoutes';

// Import Auth Middleware
import { authenticateOptional } from './middleware/authMiddleware';

// Import Rate Limiters and IP Trust Validator
import { globalRateLimiter, webhookRateLimiter, isTrustedProxy } from './middleware/rateLimiter';

const app = express();

// Configure Dynamic Proxy Trust (trusts Render internal network & verified Cloudflare IPs)
app.set('trust proxy', isTrustedProxy);

app.use(compression());
app.use(cors({
  exposedHeaders: ['Retry-After']
}));

// Razorpay Webhooks: Dedicated rate limiter + raw body parsing for signature verification
app.use('/api/webhooks', webhookRateLimiter, express.raw({ type: 'application/json' }), webhookRoutes);

// General Request Payload Size Limits (1MB for JSON and URL-encoded data)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Pre-verify token context once for global rate limiting & route guards
app.use('/api/', authenticateOptional);

// Global API Rate Limiter
app.use('/api/', globalRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/archive', archiveRoutes);


app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'KMA Backend is running' });
});

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[GLOBAL-ERROR-HANDLER]', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  res.status(status).json({
    success: false,
    error: message
  });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
