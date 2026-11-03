import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const API = 'https://api.github.com';

export const hasToken = () => Boolean(env.githubToken);

async function request(url, { method = 'GET', body } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-portfolio-dashboard',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (env.githubToken) headers.Authorization = `Bearer ${env.githubToken}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: body && JSON.stringify(body) });
  } catch {
    throw new HttpError(503, 'Could not reach the GitHub API');
  }

  if (res.status === 404) throw new HttpError(404, 'GitHub user not found');
  if (res.status === 401) throw new HttpError(500, 'GITHUB_TOKEN is invalid or expired');
  if ((res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
    throw new HttpError(429, 'GitHub API rate limit exceeded. Add a GITHUB_TOKEN or retry later.', {
      resetAt: reset ? new Date(reset).toISOString() : null,
    });
  }
  if (!res.ok) throw new HttpError(502, `GitHub API responded with ${res.status}`);
  return res.json();
}

// ---------- GraphQL path (token available): one request returns everything ----------

const PORTFOLIO_QUERY = `
query Portfolio($login: String!) {
  user(login: $login) {
    login name avatarUrl bio url location company websiteUrl
    followers { totalCount }
    following { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC,
                 orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes {
        databaseId name nameWithOwner description url homepageUrl
        stargazerCount forkCount isFork isArchived pushedAt updatedAt
        primaryLanguage { name }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
        repositoryTopics(first: 10) { nodes { topic { name } } }
      }
    }
  }
}`;

async function fetchViaGraphQL(login) {
  const result = await request(`${API}/graphql`, {
    method: 'POST',
    body: { query: PORTFOLIO_QUERY, variables: { login } },
  });
  if (result.errors?.length) {
    if (result.errors.some((e) => e.type === 'NOT_FOUND')) throw new HttpError(404, 'GitHub user not found');
    throw new HttpError(502, `GitHub GraphQL error: ${result.errors[0].message}`);
  }
  const u = result.data.user;
  return {
    user: {
      login: u.login,
      name: u.name,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      htmlUrl: u.url,
      location: u.location,
      company: u.company,
      blog: u.websiteUrl,
      followers: u.followers.totalCount,
      following: u.following.totalCount,
      publicRepos: u.repositories.totalCount,
    },
    repos: u.repositories.nodes.map((r) => ({
      id: r.databaseId,
      name: r.name,
      fullName: r.nameWithOwner,
      description: r.description,
      htmlUrl: r.url,
      homepage: r.homepageUrl || null,
      stars: r.stargazerCount,
      forks: r.forkCount,
      language: r.primaryLanguage?.name ?? null,
      isFork: r.isFork,
      isArchived: r.isArchived,
      topics: r.repositoryTopics.nodes.map((t) => t.topic.name),
      pushedAt: r.pushedAt,
      updatedAt: r.updatedAt,
      languages: r.languages.edges.map((e) => ({ name: e.node.name, bytes: e.size, color: e.node.color })),
    })),
  };
}

// ---------- REST fallback (no token): primary language only, size used as a byte estimate ----------

async function fetchViaRest(login) {
  const u = await request(`${API}/users/${encodeURIComponent(login)}`);
  const rawRepos = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await request(
      `${API}/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed&type=owner&page=${page}`
    );
    rawRepos.push(...batch);
    if (batch.length < 100) break;
  }
  return {
    user: {
      login: u.login,
      name: u.name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      htmlUrl: u.html_url,
      location: u.location,
      company: u.company,
      blog: u.blog || null,
      followers: u.followers,
      following: u.following,
      publicRepos: u.public_repos,
    },
    repos: rawRepos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      htmlUrl: r.html_url,
      homepage: r.homepage || null,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      isFork: r.fork,
      isArchived: r.archived,
      topics: r.topics ?? [],
      pushedAt: r.pushed_at,
      updatedAt: r.updated_at,
      // repo.size is in KB; it is the best size signal REST gives without one extra call per repo
      languages: r.language ? [{ name: r.language, bytes: Math.max(r.size, 1) * 1024, color: null }] : [],
    })),
  };
}

export async function fetchPortfolio(login) {
  return hasToken() ? fetchViaGraphQL(login) : fetchViaRest(login);
}
