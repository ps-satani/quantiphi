# DevFolio — GitHub Developer Portfolio

A full-stack developer dashboard that turns a GitHub profile into a personal branding page: contribution heatmap, repository cards, profile summary with a top-languages chart, a **Tech Stack Compatibility** score against any job description, and two AI assistant features.

**Stack:** Node.js · Express · SQLite (better-sqlite3) · GitHub GraphQL & REST APIs · React (Vite) · optional OpenAI-compatible LLM (Groq by default)

---

## Features

| Area | Feature |
|---|---|
| Profile header | Avatar, bio, followers, total stars, repos, forks, current & longest streak, **Top Languages donut chart** |
| Contribution graph | 53-week heatmap, 5 intensity levels, totals, active days, streaks, best day |
| Repository cards | Stars, forks, language tag, description, topics, last update; sort + show/hide forks |
| Caching engine | SQLite cache of users, repos, per-repo language bytes, contributions and user settings with TTL |
| Vibe Check | Paste a job description → **Match %** badge at the top of the profile with matched / partial / missing skills |
| Extra feature 1 | **Portfolio Assistant chatbot** — recruiters ask questions about the developer, answered from cached GitHub data |
| Extra feature 2 | **AI Recruiter Pitch & Gap Plan** — a tailored pitch for the last job description + concrete project ideas for each missing skill |
| Settings | Theme (dark/light), repo sort, show forks — persisted per user in SQLite |

---

## Architecture

```
frontend (React, presentation only)
   │  /api/*  (Vite dev proxy)
   ▼
backend (Express)
   routes → controllers → services → repositories → SQLite
                              │
                              └── githubClient (GraphQL with token, REST fallback)
                              └── llmClient   (OpenAI-compatible, optional)
```

All business logic lives on the server — totals, language percentages, heatmap levels, streaks, sorting, match scoring, validation. The React app only renders API responses.

### Backend layout

```
backend/src
├── app.js / server.js          Express app + bootstrap
├── config/env.js               Environment config
├── config/skills.js            Skill dictionary for the match score
├── db/schema.js                SQLite schema
├── db/*Repository.js           Data-access layer (all SQL lives here)
├── services/
│   ├── githubClient.js         GitHub GraphQL (1 request) / REST fallback
│   ├── syncService.js          Cache-aside logic with TTL + stale fallback
│   ├── statsService.js         Pure functions: summary, languages, heatmap, streaks, sorting
│   ├── dashboardService.js     Aggregates everything for the dashboard
│   ├── settingsService.js      Settings validation
│   ├── matchService.js         Tech Stack Compatibility score
│   ├── portfolioContext.js     Facts sheet for the AI features
│   ├── chatService.js          Portfolio Assistant (LLM + rule-based fallback)
│   ├── pitchService.js         Recruiter pitch + gap plan (LLM + template fallback)
│   └── llmClient.js            OpenAI-compatible chat client
├── middleware/                 Username validation, error handling
└── controllers/, routes/
```

### Database (SQLite)

| Table | Purpose |
|---|---|
| `users` | Cached GitHub profile |
| `repositories` | Cached repo metadata (stars, forks, language, topics, dates) |
| `repo_languages` | Bytes of code per language per repo |
| `contribution_days` | Contribution count per day |
| `user_settings` | Theme, repo sort, show forks |
| `match_results` | History of job-description matches (latest = profile badge) |
| `cache_meta` | When each user's snapshot was fetched and via which API |

---

## How the key logic works

**Caching (cache-aside with TTL).** Every request calls `ensureSynced`. If `cache_meta.fetched_at` is younger than `CACHE_TTL_SECONDS`, data is served from SQLite. Otherwise GitHub is queried and the snapshot is replaced inside a single transaction. If GitHub fails (rate limit, network) and older data exists, the old data is served with `source: "stale-cache"` and a warning instead of an error.

**GitHub API.** With a token, one GraphQL query returns the profile, up to 100 repos with per-repo language byte sizes, and the full contribution calendar. Without a token, the REST fallback uses `/users/:u`, `/users/:u/repos` and `/users/:u/events/public` (≈90 days of activity).

**Top languages.** SQL aggregates `SUM(bytes)` per language over non-fork repos; the top 6 are returned with percentages, the rest grouped as "Other".

**Heatmap levels.** Level 0 = no contributions; levels 1–4 are the quartiles of non-zero days, so one unusually busy day doesn't flatten everything else.

**Streaks.** Current streak counts back from today (today with no activity yet doesn't break it). Longest streak is the longest run of consecutive active days in the year.

**Tech Stack Compatibility.**
1. Technologies are detected in the job description with whole-word matching against a dictionary of ~35 skills and their aliases (`java` doesn't match inside `javascript`; `C`, `Go`, `R` are case-sensitive).
2. Each skill maps to GitHub languages that prove it (`React → JavaScript/TypeScript`, `Docker → Dockerfile`).
3. Score per skill from the cached repos: **1.0** if there is code in a mapped language, **0.5** if a repo's name/topics/description mentions it, **0** otherwise.
4. `Match % = earned / skills detected × 100`. Tiers: ≥75 strong, ≥50 good, ≥25 partial, else low.

**AI features.** Both build a compact facts sheet from SQLite and send it to the LLM with instructions to answer only from those facts. With no `LLM_API_KEY`, or if the LLM call fails, they fall back to deterministic rule-based / template answers, so the app always works.

---

## Setup

Requirements: Node.js 18+.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # add GITHUB_TOKEN (recommended) and optionally LLM_API_KEY
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Open `http://localhost:5173/?user=<github-username>`.

### Environment variables (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `GITHUB_TOKEN` | — | GitHub personal access token (no scopes needed). Enables GraphQL and 5,000 req/hour |
| `DB_PATH` | `./data/portfolio.db` | SQLite file |
| `CACHE_TTL_SECONDS` | `3600` | How long cached GitHub data is considered fresh |
| `LLM_API_KEY` | — | Optional key for an OpenAI-compatible API (Groq by default) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | LLM endpoint |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | LLM model |

---

## API

Base path: `/api`. Errors return `{ "error": { "message": "..." } }` with an appropriate status code.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status, GitHub mode, whether AI is enabled |
| GET | `/users/:username/dashboard?refresh=true` | Everything the dashboard needs |
| GET | `/users/:username/profile` | Cached profile |
| GET | `/users/:username/repos?sort=stars\|forks\|updated\|name&showForks=true` | Sorted repositories |
| GET | `/users/:username/settings` | User settings |
| PUT | `/users/:username/settings` | Body: `{ theme?, repoSort?, showForks? }` |
| POST | `/users/:username/match` | Body: `{ jobDescription }` → match result |
| POST | `/users/:username/chat` | Body: `{ question, history? }` → `{ reply, mode }` |
| POST | `/users/:username/pitch` | Pitch + gap plan for the latest match |

Every response that touches GitHub data includes `meta.source` (`github`, `cache`, `stale-cache`) so the cache behaviour is visible.
