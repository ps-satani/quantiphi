import { useState } from 'react';

export default function MatchPanel({ match, onSubmit }) {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(jd);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="section-head">
        <h2>Tech Stack Compatibility</h2>
        <span className="muted">Paste a job description to score it against this developer's repositories</span>
      </div>

      <form onSubmit={submit} className="match-form">
        <textarea
          rows={5}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="e.g. We are hiring a backend engineer with Node.js, Express, PostgreSQL and Docker…"
        />
        <button type="submit" disabled={loading || !jd.trim()}>{loading ? 'Scoring…' : 'Calculate match'}</button>
      </form>
      {error && <div className="alert">{error}</div>}

      {match && (
        <div className="match-result">
          <p className="muted">
            {match.percentage}% across {match.skillsDetected} technologies detected in: “{match.jdExcerpt}”
          </p>
          <div className="chips">
            {match.matched.map((s) => (
              <span key={s.skill} className="chip ok" title={`Code in ${s.languages.join(', ')} (${s.codeShare}% of bytes)`}>
                ✓ {s.skill}
              </span>
            ))}
            {match.partial.map((s) => (
              <span key={s.skill} className="chip half" title={`Mentioned in: ${s.repos.join(', ')}`}>
                ~ {s.skill}
              </span>
            ))}
            {match.missing.map((skill) => (
              <span key={skill} className="chip miss">✗ {skill}</span>
            ))}
          </div>
          <p className="muted legend-line">✓ code in that language · ~ mentioned in a repo (half credit) · ✗ no evidence</p>
        </div>
      )}
    </section>
  );
}
