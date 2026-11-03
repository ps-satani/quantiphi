import { matchRepository } from '../db/matchRepository.js';
import { HttpError } from '../utils/httpError.js';
import { chatCompletion } from './llmClient.js';
import { loadPortfolio, toContextText } from './portfolioContext.js';

const GAP_TIPS = {
  SQL: 'add a small project backed by PostgreSQL with migrations and a few JOIN/aggregate queries',
  MongoDB: 'build a REST API on MongoDB with Mongoose schemas and indexes',
  Docker: 'add a Dockerfile and docker-compose.yml to an existing project',
  Kubernetes: 'deploy one existing service with a Deployment + Service manifest',
  AWS: 'deploy an existing API to AWS (Lambda or EC2) and document it in the README',
  TypeScript: 'migrate one JavaScript project to TypeScript',
  React: 'build a small React frontend for one of the existing APIs',
  GraphQL: 'add a GraphQL endpoint alongside an existing REST API',
};
const gapTip = (skill) => GAP_TIPS[skill] ?? `publish a small, well-documented project that uses ${skill}`;

function templatePitch(p, match) {
  const name = p.user.name || p.login;
  const langs = p.languages.filter((l) => l.name !== 'Other').slice(0, 3).map((l) => l.name);
  const highlights = [...p.repos].sort((a, b) => b.stars - a.stars).slice(0, 2);
  const proven = match.matched.map((s) => s.skill);
  const partial = match.partial.map((s) => s.skill);

  const pitch = [
    `${name} is a developer working mainly in ${langs.join(', ') || 'several languages'}, with ${p.summary.ownedRepos} public repositories and ${p.contributions.total} contributions in the last year.`,
    proven.length && `For this role, ${proven.join(', ')} ${proven.length === 1 ? 'is' : 'are'} backed by real code on GitHub.`,
    partial.length && `${partial.join(', ')} also ${partial.length === 1 ? 'appears' : 'appear'} in their projects.`,
    highlights.length && `Highlights: ${highlights.map((r) => `${r.name}${r.description ? ` (${r.description})` : ''}`).join('; ')}.`,
  ].filter(Boolean).join(' ');

  return { pitch, gaps: match.missing.map((skill) => ({ skill, suggestion: gapTip(skill) })) };
}

/** Recruiter-ready pitch + learning plan for the most recent job description match. */
export async function generatePitch(username) {
  const portfolio = await loadPortfolio(username);
  const match = matchRepository.getLatest(portfolio.login);
  if (!match) throw new HttpError(400, 'Run a Tech Stack Compatibility check first');

  const fallback = templatePitch(portfolio, match);
  const reply = await chatCompletion(
    [
      {
        role: 'system',
        content:
          'You write short, factual recruiter pitches for developers using ONLY the facts provided. ' +
          'Return strict JSON: {"pitch": string (max 90 words, third person), "gaps": [{"skill": string, "suggestion": string (one concrete project idea, max 20 words)}]}. ' +
          'Include one gap entry for each missing skill listed, and no others.',
      },
      {
        role: 'user',
        content:
          `Job description excerpt: ${match.jdExcerpt}\n` +
          `Match: ${match.percentage}%. Proven: ${match.matched.map((s) => s.skill).join(', ') || 'none'}. ` +
          `Partial: ${match.partial.map((s) => s.skill).join(', ') || 'none'}. Missing: ${match.missing.join(', ') || 'none'}.\n\n` +
          toContextText(portfolio),
      },
    ],
    { maxTokens: 600 }
  );

  if (reply) {
    try {
      const parsed = JSON.parse(reply.replace(/^```(?:json)?\s*|\s*```$/g, ''));
      if (typeof parsed.pitch === 'string' && Array.isArray(parsed.gaps)) {
        return { ...parsed, percentage: match.percentage, mode: 'ai' };
      }
    } catch {
      // malformed JSON from the model: fall through to the template
    }
  }
  return { ...fallback, percentage: match.percentage, mode: 'template' };
}
