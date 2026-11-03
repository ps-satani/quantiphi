import { app } from './app.js';
import { env } from './config/env.js';
import { hasToken } from './services/githubClient.js';

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
  if (!hasToken()) console.warn('No GITHUB_TOKEN set: using REST fallback (60 requests/hour).');
});
