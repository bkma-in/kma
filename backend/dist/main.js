"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const migrationService_1 = require("./services/migrationService");
// Run migrations in background
(0, migrationService_1.runMigrations)().catch(err => console.error('Startup migration error:', err));
// Import Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const articleRoutes_1 = __importDefault(require("./routes/articleRoutes"));
const issueRoutes_1 = __importDefault(require("./routes/issueRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Use express.raw for webhooks to verify signatures
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), webhookRoutes_1.default);
// General JSON parsing
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/articles', articleRoutes_1.default);
app.use('/api/issues', issueRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
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
