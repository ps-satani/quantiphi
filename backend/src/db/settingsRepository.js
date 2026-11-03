import { db } from './database.js';

export const DEFAULT_SETTINGS = { theme: 'dark', repoSort: 'stars', showForks: false };

const selectSettings = db.prepare('SELECT * FROM user_settings WHERE login = ?');
const upsertSettings = db.prepare(`
  INSERT INTO user_settings (login, theme, repo_sort, show_forks, updated_at)
  VALUES (@login, @theme, @repoSort, @showForks, datetime('now'))
  ON CONFLICT(login) DO UPDATE SET
    theme = excluded.theme, repo_sort = excluded.repo_sort,
    show_forks = excluded.show_forks, updated_at = excluded.updated_at
`);

const toSettings = (row) => ({
  theme: row.theme,
  repoSort: row.repo_sort,
  showForks: Boolean(row.show_forks),
});

export const settingsRepository = {
  get(login) {
    const row = selectSettings.get(login);
    return row ? toSettings(row) : { ...DEFAULT_SETTINGS };
  },

  save(login, settings) {
    upsertSettings.run({ login, ...settings, showForks: settings.showForks ? 1 : 0 });
    return this.get(login);
  },
};
