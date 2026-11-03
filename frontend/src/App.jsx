import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client.js';
import ContributionGraph from './components/ContributionGraph.jsx';
import MatchBadge from './components/MatchBadge.jsx';
import MatchPanel from './components/MatchPanel.jsx';
import ProfileHeader from './components/ProfileHeader.jsx';
import RepoList from './components/RepoList.jsx';
import SearchBar from './components/SearchBar.jsx';

const initialUser = new URLSearchParams(window.location.search).get('user') || '';

function sourceLabel(meta) {
  const when = meta.fetchedAt ? new Date(meta.fetchedAt).toLocaleTimeString() : '—';
  if (meta.source === 'cache') return `Served from SQLite cache · fetched ${when}`;
  if (meta.source === 'stale-cache') return `GitHub unavailable, showing cached data from ${when}`;
  return `Fresh from GitHub (${meta.via}) · ${when}`;
}

export default function App() {
  const [username, setUsername] = useState(initialUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (name, { refresh = false } = {}) => {
    setLoading(true);
    setError('');
    try {
      setData(await api.getDashboard(name, { refresh }));
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (username) load(username);
  }, [username, load]);

  useEffect(() => {
    document.documentElement.dataset.theme = data?.settings.theme ?? 'dark';
  }, [data?.settings.theme]);

  const search = (name) => {
    window.history.replaceState(null, '', `?user=${encodeURIComponent(name)}`);
    if (name === username) load(name);
    else setUsername(name);
  };

  const changeSettings = async (patch) => {
    try {
      await api.updateSettings(data.user.login, patch);
      await load(data.user.login);
    } catch (err) {
      setError(err.message);
    }
  };

  const runMatch = async (jobDescription) => {
    const { match } = await api.createMatch(data.user.login, jobDescription);
    setData((prev) => ({ ...prev, latestMatch: match }));
  };

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">DevFolio</span>
        <SearchBar initialValue={initialUser} onSearch={search} loading={loading} />
        {data && (
          <div className="topbar-actions">
            <button className="ghost" onClick={() => load(data.user.login, { refresh: true })} disabled={loading}>
              Refresh
            </button>
            <button
              className="ghost"
              onClick={() => changeSettings({ theme: data.settings.theme === 'dark' ? 'light' : 'dark' })}
            >
              {data.settings.theme === 'dark' ? 'Light' : 'Dark'} mode
            </button>
          </div>
        )}
      </header>

      {error && <div className="alert">{error}</div>}
      {!data && !loading && !error && (
        <div className="empty">Enter a GitHub username to build their developer portfolio.</div>
      )}

      {data && (
        <main className="dashboard">
          <p className="muted source">{sourceLabel(data.meta)}</p>
          {data.meta.warning && <div className="alert warn">{data.meta.warning}</div>}
          <ProfileHeader
            user={data.user}
            summary={data.summary}
            languages={data.languages}
            contributions={data.contributions}
            badge={<MatchBadge match={data.latestMatch} />}
          />
          <MatchPanel match={data.latestMatch} onSubmit={runMatch} />
          <ContributionGraph contributions={data.contributions} complete={data.meta.contributionsComplete} />
          <RepoList repos={data.repos} settings={data.settings} onSettingsChange={changeSettings} />
        </main>
      )}
    </div>
  );
}
