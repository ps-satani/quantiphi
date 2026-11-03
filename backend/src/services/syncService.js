import { env } from '../config/env.js';
import { cacheRepository } from '../db/cacheRepository.js';
import { portfolioRepository } from '../db/portfolioRepository.js';
import { fetchPortfolio, hasToken } from './githubClient.js';

const cacheKey = (login) => `portfolio:${login}`;

/**
 * Cache-aside: serve from SQLite while fresh, otherwise refetch from GitHub and persist.
 * If GitHub fails (rate limit / network) but we have older data, serve it as stale instead of erroring.
 * Returns metadata: source (cache | github | stale-cache), via (graphql | rest), fetchedAt.
 */
export async function ensureSynced(username, { force = false } = {}) {
  const key = cacheKey(username);
  const cachedUser = portfolioRepository.getUser(username);
  const cachedMeta = cacheRepository.getMeta(key);

  if (!force && cachedUser && cacheRepository.isFresh(key, env.cacheTtlSeconds)) {
    return { source: 'cache', via: cachedMeta.source, login: cachedUser.login, fetchedAt: cachedMeta.fetched_at };
  }

  try {
    const { user, repos, contributions } = await fetchPortfolio(username);
    portfolioRepository.saveSnapshot(user, repos, contributions);
    const via = hasToken() ? 'graphql' : 'rest';
    cacheRepository.markFetched(key, via);
    return { source: 'github', via, login: user.login, fetchedAt: Date.now() };
  } catch (err) {
    if (cachedUser && err.status !== 404) {
      return {
        source: 'stale-cache',
        via: cachedMeta?.source ?? null,
        login: cachedUser.login,
        fetchedAt: cachedMeta?.fetched_at ?? null,
        warning: err.message,
      };
    }
    throw err;
  }
}
