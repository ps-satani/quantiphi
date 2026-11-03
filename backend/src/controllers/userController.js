import { portfolioRepository } from '../db/portfolioRepository.js';
import { ensureSynced } from '../services/syncService.js';

export async function getProfile(req, res) {
  const meta = await ensureSynced(req.params.username, { force: req.query.refresh === 'true' });
  res.json({ meta, user: portfolioRepository.getUser(meta.login) });
}

export async function getRepos(req, res) {
  const meta = await ensureSynced(req.params.username, { force: req.query.refresh === 'true' });
  res.json({ meta, repos: portfolioRepository.getRepos(meta.login) });
}
