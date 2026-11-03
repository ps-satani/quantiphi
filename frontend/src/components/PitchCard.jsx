import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function PitchCard({ username, matchId }) {
  const [pitch, setPitch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // A new job description invalidates the old pitch
  useEffect(() => {
    setPitch(null);
  }, [matchId]);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      setPitch(await api.pitch(username));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pitch">
      <button className="ghost" onClick={generate} disabled={loading}>
        {loading ? 'Writing…' : pitch ? 'Regenerate recruiter pitch' : 'Generate recruiter pitch & gap plan'}
      </button>
      {error && <div className="alert">{error}</div>}
      {pitch && (
        <div className="pitch-body">
          <p>{pitch.pitch}</p>
          {pitch.gaps.length > 0 && (
            <>
              <h3>How to close the gaps</h3>
              <ul>
                {pitch.gaps.map((g) => <li key={g.skill}><strong>{g.skill}:</strong> {g.suggestion}</li>)}
              </ul>
            </>
          )}
          <button className="ghost" onClick={() => navigator.clipboard?.writeText(pitch.pitch)}>Copy pitch</button>
          <span className="muted mode">{pitch.mode === 'ai' ? 'Written by AI from GitHub data' : 'Generated from GitHub data'}</span>
        </div>
      )}
    </div>
  );
}
