import { portfolioRepository } from '../db/portfolioRepository.js';
import { settingsRepository } from '../db/settingsRepository.js';
import { SUGGESTED_QUESTIONS } from './chatService.js';
import { hasLlm } from './llmClient.js';
import { getLatestMatch } from './matchService.js';
import { ensureSynced } from './syncService.js';
import {
  computeContributions,
  computeSummary,
  computeTopLanguages,
  sortAndFilterRepos,
} from './statsService.js';

/** Everything the dashboard page needs in one response. */
export async function getDashboard(username, { force = false, sort, showForks } = {}) {
  const meta = await ensureSynced(username, { force });
  const login = meta.login;

  const user = portfolioRepository.getUser(login);
  const repos = portfolioRepository.getRepos(login);
  const settings = settingsRepository.get(login);

  const oneYearAgo = new Date(Date.now() - 371 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const contributions = computeContributions(portfolioRepository.getContributions(login, oneYearAgo));

  return {
    // REST fallback only sees ~90 days of public events, so the heatmap is partial
    meta: { ...meta, contributionsComplete: meta.via === 'graphql' },
    user,
    summary: computeSummary(user, repos),
    languages: computeTopLanguages(portfolioRepository.getLanguageTotals(login)),
    contributions,
    repos: sortAndFilterRepos(repos, {
      sort: sort ?? settings.repoSort,
      showForks: showForks ?? settings.showForks,
    }),
    settings,
    latestMatch: getLatestMatch(login),
    assistant: { aiEnabled: hasLlm(), suggestions: SUGGESTED_QUESTIONS },
  };
}
