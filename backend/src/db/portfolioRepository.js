import { db } from './database.js';

// Data-access layer: the only place that writes SQL for users / repos / languages.

const upsertUser = db.prepare(`
  INSERT INTO users (login, name, avatar_url, bio, html_url, location, company, blog, followers, following, public_repos)
  VALUES (@login, @name, @avatarUrl, @bio, @htmlUrl, @location, @company, @blog, @followers, @following, @publicRepos)
  ON CONFLICT(login) DO UPDATE SET
    name = excluded.name, avatar_url = excluded.avatar_url, bio = excluded.bio,
    html_url = excluded.html_url, location = excluded.location, company = excluded.company,
    blog = excluded.blog, followers = excluded.followers, following = excluded.following,
    public_repos = excluded.public_repos
`);

const deleteReposByOwner = db.prepare('DELETE FROM repositories WHERE owner_login = ?');

const insertRepo = db.prepare(`
  INSERT INTO repositories (id, owner_login, name, full_name, description, html_url, homepage,
    stars, forks, language, is_fork, is_archived, topics, pushed_at, updated_at)
  VALUES (@id, @ownerLogin, @name, @fullName, @description, @htmlUrl, @homepage,
    @stars, @forks, @language, @isFork, @isArchived, @topics, @pushedAt, @updatedAt)
`);

const insertLanguage = db.prepare(
  'INSERT INTO repo_languages (repo_id, language, bytes, color) VALUES (?, ?, ?, ?)'
);

const selectUser = db.prepare('SELECT * FROM users WHERE login = ?');

const selectRepos = db.prepare('SELECT * FROM repositories WHERE owner_login = ?');

const selectRepoLanguages = db.prepare(`
  SELECT rl.repo_id, rl.language, rl.bytes, rl.color
  FROM repo_languages rl
  JOIN repositories r ON r.id = rl.repo_id
  WHERE r.owner_login = ?
  ORDER BY rl.bytes DESC
`);

// Replace a user's whole snapshot atomically: either everything is saved or nothing is.
const saveSnapshotTx = db.transaction((user, repos) => {
  upsertUser.run(user);
  deleteReposByOwner.run(user.login); // cascades to repo_languages
  for (const repo of repos) {
    insertRepo.run({
      ...repo,
      ownerLogin: user.login,
      isFork: repo.isFork ? 1 : 0,
      isArchived: repo.isArchived ? 1 : 0,
      topics: JSON.stringify(repo.topics ?? []),
    });
    for (const lang of repo.languages) {
      insertLanguage.run(repo.id, lang.name, lang.bytes, lang.color ?? null);
    }
  }
});

const toUser = (row) => row && {
  login: row.login,
  name: row.name,
  avatarUrl: row.avatar_url,
  bio: row.bio,
  htmlUrl: row.html_url,
  location: row.location,
  company: row.company,
  blog: row.blog,
  followers: row.followers,
  following: row.following,
  publicRepos: row.public_repos,
};

const toRepo = (row, languages) => ({
  id: row.id,
  name: row.name,
  fullName: row.full_name,
  description: row.description,
  htmlUrl: row.html_url,
  homepage: row.homepage,
  stars: row.stars,
  forks: row.forks,
  language: row.language,
  isFork: Boolean(row.is_fork),
  isArchived: Boolean(row.is_archived),
  topics: JSON.parse(row.topics),
  pushedAt: row.pushed_at,
  updatedAt: row.updated_at,
  languages,
});

export const portfolioRepository = {
  saveSnapshot(user, repos) {
    saveSnapshotTx(user, repos);
  },

  getUser(login) {
    return toUser(selectUser.get(login)) ?? null;
  },

  getRepos(login) {
    const langsByRepo = new Map();
    for (const l of selectRepoLanguages.all(login)) {
      if (!langsByRepo.has(l.repo_id)) langsByRepo.set(l.repo_id, []);
      langsByRepo.get(l.repo_id).push({ name: l.language, bytes: l.bytes, color: l.color });
    }
    return selectRepos.all(login).map((row) => toRepo(row, langsByRepo.get(row.id) ?? []));
  },
};
