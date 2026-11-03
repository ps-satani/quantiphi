import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  githubToken: process.env.GITHUB_TOKEN?.trim() || '',
  dbPath: process.env.DB_PATH || './data/portfolio.db',
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 3600,
};
