import { SKILLS } from '../config/skills.js';
import { matchRepository } from '../db/matchRepository.js';
import { portfolioRepository } from '../db/portfolioRepository.js';
import { HttpError } from '../utils/httpError.js';
import { ensureSynced } from './syncService.js';

const MIN_JD_LENGTH = 20;
const MAX_JD_LENGTH = 10000;
const EVIDENCE = { language: 1, project: 0.5, none: 0 };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// Whole-word match that also treats "+", "#" and "." as part of a word (so "c++" ≠ "c", "node.js" ≠ "js").
const wordPattern = (alias, flags) =>
  new RegExp(`(?<![a-z0-9+#.])${escapeRegex(alias)}(?![a-z0-9+#])`, flags);

const COMPILED = SKILLS.map((s) => ({
  ...s,
  patterns: [
    ...(s.aliases ?? []).map((a) => wordPattern(a, 'i')),
    ...(s.exact ?? []).map((a) => new RegExp(`(?<![A-Za-z0-9+#.])${escapeRegex(a)}(?![A-Za-z0-9+#])`)),
  ],
}));

/** Step 1 — which skills does the job description ask for? */
export function extractSkills(jobDescription) {
  return COMPILED.filter((s) => s.patterns.some((p) => p.test(jobDescription)));
}

/** Step 2 — score each requested skill against the cached repos; pure function. */
export function scoreSkills(requested, languageTotals, repos) {
  const totalBytes = languageTotals.reduce((sum, l) => sum + l.bytes, 0) || 1;
  const bytesByLang = new Map(languageTotals.map((l) => [l.name, l.bytes]));
  const owned = repos.filter((r) => !r.isFork);
  const repoText = owned.map((r) => ({
    name: r.name,
    text: [r.name, r.description ?? '', ...r.topics].join(' ').toLowerCase(),
  }));

  const skills = requested.map((s) => {
    const langs = s.languages.filter((l) => bytesByLang.has(l));
    if (langs.length) {
      const share = langs.reduce((sum, l) => sum + bytesByLang.get(l), 0) / totalBytes;
      return { skill: s.skill, evidence: 'language', score: EVIDENCE.language, languages: langs, codeShare: Math.round(share * 1000) / 10 };
    }
    const keywords = [...(s.keywords ?? []), ...(s.aliases ?? [])].map((k) => wordPattern(k, 'i'));
    const repoNames = repoText.filter((r) => keywords.some((k) => k.test(r.text))).map((r) => r.name);
    if (repoNames.length) {
      return { skill: s.skill, evidence: 'project', score: EVIDENCE.project, repos: repoNames.slice(0, 5) };
    }
    return { skill: s.skill, evidence: 'none', score: EVIDENCE.none };
  });

  const earned = skills.reduce((sum, s) => sum + s.score, 0);
  const percentage = skills.length ? Math.round((earned / skills.length) * 100) : 0;

  return {
    percentage,
    tier: percentage >= 75 ? 'strong' : percentage >= 50 ? 'good' : percentage >= 25 ? 'partial' : 'low',
    matched: skills.filter((s) => s.evidence === 'language'),
    partial: skills.filter((s) => s.evidence === 'project'),
    missing: skills.filter((s) => s.evidence === 'none').map((s) => s.skill),
    skillsDetected: skills.length,
  };
}

export async function computeMatch(username, jobDescription) {
  if (typeof jobDescription !== 'string') throw new HttpError(400, 'jobDescription must be a string');
  const jd = jobDescription.trim();
  if (jd.length < MIN_JD_LENGTH) throw new HttpError(400, `Job description must be at least ${MIN_JD_LENGTH} characters`);
  if (jd.length > MAX_JD_LENGTH) throw new HttpError(400, `Job description must be at most ${MAX_JD_LENGTH} characters`);

  const requested = extractSkills(jd);
  if (!requested.length) {
    throw new HttpError(422, 'No recognizable technologies found in the job description');
  }

  // Uses the SQLite cache; only hits GitHub if the cache is missing or expired.
  const { login } = await ensureSynced(username);
  const result = scoreSkills(
    requested,
    portfolioRepository.getLanguageTotals(login),
    portfolioRepository.getRepos(login)
  );

  const excerpt = jd.length > 140 ? `${jd.slice(0, 140)}…` : jd;
  return matchRepository.save(login, excerpt, result);
}

export const getLatestMatch = (login) => matchRepository.getLatest(login);
