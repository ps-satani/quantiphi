import { languageColor } from '../utils/languageColors.js';

// Pure functions: no DB or HTTP here, so every calculation is easy to test and explain.

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (d) => d.toISOString().slice(0, 10);

export function computeSummary(user, repos) {
  const owned = repos.filter((r) => !r.isFork);
  return {
    totalStars: owned.reduce((sum, r) => sum + r.stars, 0),
    totalForks: owned.reduce((sum, r) => sum + r.forks, 0),
    ownedRepos: owned.length,
    forkedRepos: repos.length - owned.length,
    followers: user.followers,
    following: user.following,
  };
}

/** Byte share per language; anything past the top `limit` is grouped into "Other". */
export function computeTopLanguages(languageTotals, limit = 6) {
  const totalBytes = languageTotals.reduce((sum, l) => sum + l.bytes, 0);
  if (totalBytes === 0) return [];

  const pct = (bytes) => Math.round((bytes / totalBytes) * 1000) / 10; // one decimal place
  const top = languageTotals.slice(0, limit).map((l) => ({
    name: l.name,
    bytes: l.bytes,
    repoCount: l.repoCount,
    percentage: pct(l.bytes),
    color: languageColor(l.name, l.color),
  }));

  const rest = languageTotals.slice(limit);
  if (rest.length) {
    const bytes = rest.reduce((sum, l) => sum + l.bytes, 0);
    top.push({ name: 'Other', bytes, repoCount: null, percentage: pct(bytes), color: '#8b949e' });
  }
  return top;
}

/**
 * Intensity level 0–4 per day, like GitHub: 0 = no activity, then quartiles of the non-zero days,
 * so one huge day doesn't wash every other day out to level 1.
 */
function levelThresholds(counts) {
  const nonZero = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (!nonZero.length) return [Infinity, Infinity, Infinity];
  const q = (p) => nonZero[Math.floor(p * (nonZero.length - 1))];
  return [q(0.25), q(0.5), q(0.75)];
}

function levelFor(count, [q1, q2, q3]) {
  if (count === 0) return 0;
  if (count <= q1) return 1;
  if (count <= q2) return 2;
  if (count <= q3) return 3;
  return 4;
}

/** Builds a 53-week Sunday-first grid ending today, plus streak statistics. */
export function computeContributions(days, today = new Date()) {
  const counts = new Map(days.map((d) => [d.date, d.count]));
  const todayStr = isoDate(today);

  const end = new Date(`${todayStr}T00:00:00Z`);
  const start = new Date(end.getTime() - 364 * DAY_MS);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back up to Sunday

  const cells = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const date = isoDate(new Date(t));
    cells.push({ date, count: counts.get(date) ?? 0 });
  }

  const thresholds = levelThresholds(cells.map((c) => c.count));
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7).map((c) => ({ ...c, level: levelFor(c.count, thresholds) })));
  }

  // Longest streak: longest run of consecutive active days in the window.
  let longestStreak = 0;
  let run = 0;
  for (const c of cells) {
    run = c.count > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  // Current streak: count back from today; today not being active yet doesn't break the streak.
  let currentStreak = 0;
  let i = cells.length - 1;
  if (cells[i]?.count === 0) i--;
  while (i >= 0 && cells[i].count > 0) {
    currentStreak++;
    i--;
  }

  const active = cells.filter((c) => c.count > 0);
  const bestDay = active.reduce((best, c) => (c.count > (best?.count ?? 0) ? c : best), null);

  return {
    total: cells.reduce((sum, c) => sum + c.count, 0),
    activeDays: active.length,
    currentStreak,
    longestStreak,
    bestDay,
    from: cells[0].date,
    to: todayStr,
    weeks,
  };
}

const SORTERS = {
  stars: (a, b) => b.stars - a.stars || b.forks - a.forks,
  forks: (a, b) => b.forks - a.forks || b.stars - a.stars,
  updated: (a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''),
  name: (a, b) => a.name.localeCompare(b.name),
};
export const REPO_SORTS = Object.keys(SORTERS);

export function sortAndFilterRepos(repos, { sort = 'stars', showForks = false } = {}) {
  return repos
    .filter((r) => showForks || !r.isFork)
    .sort(SORTERS[sort] ?? SORTERS.stars)
    .map((r) => ({
      ...r,
      languages: r.languages.map((l) => ({ ...l, color: languageColor(l.name, l.color) })),
      languageColor: r.language ? languageColor(r.language, r.languages.find((l) => l.name === r.language)?.color) : null,
    }));
}
