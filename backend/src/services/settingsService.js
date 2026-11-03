import { settingsRepository } from '../db/settingsRepository.js';
import { HttpError } from '../utils/httpError.js';
import { REPO_SORTS } from './statsService.js';

const THEMES = ['dark', 'light'];

/** Partial update: only provided fields change; every field is validated server-side. */
export function updateSettings(login, input = {}) {
  const current = settingsRepository.get(login);
  const next = { ...current };

  if (input.theme !== undefined) {
    if (!THEMES.includes(input.theme)) throw new HttpError(400, `theme must be one of: ${THEMES.join(', ')}`);
    next.theme = input.theme;
  }
  if (input.repoSort !== undefined) {
    if (!REPO_SORTS.includes(input.repoSort)) throw new HttpError(400, `repoSort must be one of: ${REPO_SORTS.join(', ')}`);
    next.repoSort = input.repoSort;
  }
  if (input.showForks !== undefined) {
    if (typeof input.showForks !== 'boolean') throw new HttpError(400, 'showForks must be a boolean');
    next.showForks = input.showForks;
  }

  return settingsRepository.save(login, next);
}

export const getSettings = (login) => settingsRepository.get(login);
