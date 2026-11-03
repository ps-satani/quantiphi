import { portfolioRepository } from '../db/portfolioRepository.js';
import { getDashboard } from '../services/dashboardService.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { REPO_SORTS, sortAndFilterRepos } from '../services/statsService.js';
import { ensureSynced } from '../services/syncService.js';
import { HttpError } from '../utils/httpError.js';

const isRefresh = (req) => req.query.refresh === 'true';

function parseRepoQuery(query) {
  const { sort, showForks } = query;
  if (sort !== undefined && !REPO_SORTS.includes(sort)) {
    throw new HttpError(400, `sort must be one of: ${REPO_SORTS.join(', ')}`);
  }
  if (showForks !== undefined && !['true', 'false'].includes(showForks)) {
    throw new HttpError(400, 'showForks must be true or false');
  }
  return { sort, showForks: showForks === undefined ? undefined : showForks === 'true' };
}

export async function getDashboardHandler(req, res) {
  res.json(await getDashboard(req.params.username, { force: isRefresh(req), ...parseRepoQuery(req.query) }));
}

export async function getProfile(req, res) {
  const meta = await ensureSynced(req.params.username, { force: isRefresh(req) });
  res.json({ meta, user: portfolioRepository.getUser(meta.login) });
}

export async function getRepos(req, res) {
  const { sort = 'stars', showForks = false } = parseRepoQuery(req.query);
  const meta = await ensureSynced(req.params.username, { force: isRefresh(req) });
  res.json({ meta, repos: sortAndFilterRepos(portfolioRepository.getRepos(meta.login), { sort, showForks }) });
}

export function getSettingsHandler(req, res) {
  res.json({ settings: getSettings(req.params.username) });
}

export function updateSettingsHandler(req, res) {
  res.json({ settings: updateSettings(req.params.username, req.body) });
}
