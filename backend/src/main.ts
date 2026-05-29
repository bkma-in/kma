import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { runMigrations } from './services/migrationService';

// Run migrations in background
runMigrations().catch(err => console.error('Startup migration error:', err));

// Import Routes
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import issueRoutes from './routes/issueRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';

const app = express();

app.use(cors());

// Use express.raw for webhooks to verify signatures
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// General JSON parsing
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'KMA Backend is running' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
