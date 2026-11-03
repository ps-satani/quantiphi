// SQLite schema. GitHub logins are case-insensitive, so login columns use COLLATE NOCASE.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  login         TEXT PRIMARY KEY COLLATE NOCASE,
  name          TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  html_url      TEXT,
  location      TEXT,
  company       TEXT,
  blog          TEXT,
  followers     INTEGER NOT NULL DEFAULT 0,
  following     INTEGER NOT NULL DEFAULT 0,
  public_repos  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS repositories (
  id            INTEGER PRIMARY KEY,
  owner_login   TEXT NOT NULL COLLATE NOCASE REFERENCES users(login) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  description   TEXT,
  html_url      TEXT NOT NULL,
  homepage      TEXT,
  stars         INTEGER NOT NULL DEFAULT 0,
  forks         INTEGER NOT NULL DEFAULT 0,
  language      TEXT,
  is_fork       INTEGER NOT NULL DEFAULT 0,
  is_archived   INTEGER NOT NULL DEFAULT 0,
  topics        TEXT NOT NULL DEFAULT '[]',
  pushed_at     TEXT,
  updated_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_repos_owner ON repositories(owner_login);

-- Byte count per language per repo (GitHub's own measure of how much code is in each language)
CREATE TABLE IF NOT EXISTS repo_languages (
  repo_id   INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  language  TEXT NOT NULL,
  bytes     INTEGER NOT NULL DEFAULT 0,
  color     TEXT,
  PRIMARY KEY (repo_id, language)
);

-- One row per calendar day of contribution activity
CREATE TABLE IF NOT EXISTS contribution_days (
  login  TEXT NOT NULL COLLATE NOCASE REFERENCES users(login) ON DELETE CASCADE,
  date   TEXT NOT NULL,
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (login, date)
);

-- Per-user display preferences
CREATE TABLE IF NOT EXISTS user_settings (
  login       TEXT PRIMARY KEY COLLATE NOCASE,
  theme       TEXT NOT NULL DEFAULT 'dark',
  repo_sort   TEXT NOT NULL DEFAULT 'stars',
  show_forks  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- History of Tech Stack Compatibility checks; the latest one is shown as the profile badge
CREATE TABLE IF NOT EXISTS match_results (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  login        TEXT NOT NULL COLLATE NOCASE,
  jd_excerpt   TEXT NOT NULL,
  percentage   INTEGER NOT NULL,
  breakdown    TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_match_login ON match_results(login, id);

-- When each cached resource was last fetched from GitHub (drives TTL freshness)
CREATE TABLE IF NOT EXISTS cache_meta (
  cache_key   TEXT PRIMARY KEY COLLATE NOCASE,
  fetched_at  INTEGER NOT NULL,
  source      TEXT NOT NULL
);
`;
