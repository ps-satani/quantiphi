import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  githubToken: process.env.GITHUB_TOKEN?.trim() || '',
  dbPath: process.env.DB_PATH || './data/portfolio.db',
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 3600,
  // Any OpenAI-compatible chat API; defaults to Groq. Empty key = rule-based fallback.
  llmApiKey: process.env.LLM_API_KEY?.trim() || '',
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
  llmModel: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
};
