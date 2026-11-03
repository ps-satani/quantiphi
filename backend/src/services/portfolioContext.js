import { portfolioRepository } from '../db/portfolioRepository.js';
import { computeContributions, computeSummary, computeTopLanguages } from './statsService.js';
import { ensureSynced } from './syncService.js';

/** Loads everything the AI features reason about, from the SQLite cache. */
export async function loadPortfolio(username) {
  const { login } = await ensureSynced(username);
  const user = portfolioRepository.getUser(login);
  const repos = portfolioRepository.getRepos(login).filter((r) => !r.isFork);
  const oneYearAgo = new Date(Date.now() - 371 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    login,
    user,
    repos,
    languageTotals: portfolioRepository.getLanguageTotals(login),
    languages: computeTopLanguages(portfolioRepository.getLanguageTotals(login)),
    summary: computeSummary(user, repos),
    contributions: computeContributions(portfolioRepository.getContributions(login, oneYearAgo)),
  };
}

/** Compact plain-text facts sheet given to the LLM, so its answers stay grounded in real data. */
export function toContextText(p) {
  const repoLines = [...p.repos]
    .sort((a, b) => b.stars - a.stars || (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''))
    .slice(0, 20)
    .map((r) => {
      const langs = r.languages.map((l) => l.name).join('/') || 'n/a';
      const topics = r.topics.length ? ` [topics: ${r.topics.join(', ')}]` : '';
      return `- ${r.name} (${langs}, ★${r.stars}, forks ${r.forks}, last push ${r.pushedAt?.slice(0, 10) ?? 'n/a'}): ${r.description ?? 'no description'}${topics}`;
    });

  const c = p.contributions;
  return [
    `Developer: ${p.user.name || p.login} (@${p.login})`,
    p.user.bio && `Bio: ${p.user.bio}`,
    p.user.location && `Location: ${p.user.location}`,
    `Followers: ${p.summary.followers}, own public repos: ${p.summary.ownedRepos}, total stars: ${p.summary.totalStars}, total forks: ${p.summary.totalForks}`,
    `Top languages by code size: ${p.languages.map((l) => `${l.name} ${l.percentage}%`).join(', ') || 'none'}`,
    `Contributions last year: ${c.total} on ${c.activeDays} active days; current streak ${c.currentStreak} days; longest streak ${c.longestStreak} days`,
    'Repositories:',
    ...repoLines,
  ].filter(Boolean).join('\n');
}
