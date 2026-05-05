import express from 'express';
import cors from 'cors';
import { config } from './config/env';

// Import Routes
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import issueRoutes from './routes/issueRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';

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

app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'KMA Backend is running' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
