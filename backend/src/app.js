import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { hasToken } from './services/githubClient.js';
import { hasLlm } from './services/llmClient.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import userRoutes from './routes/userRoutes.js';

export const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', githubMode: hasToken() ? 'graphql' : 'rest', aiEnabled: hasLlm() });
});

app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);
