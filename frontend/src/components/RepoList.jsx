import RepoCard from './RepoCard.jsx';

const SORT_OPTIONS = [
  ['stars', 'Most stars'],
  ['forks', 'Most forks'],
  ['updated', 'Recently updated'],
  ['name', 'Name'],
];

export default function RepoList({ repos, settings, onSettingsChange }) {
  return (
    <section>
      <div className="section-head">
        <h2>Repositories <span className="muted">({repos.length})</span></h2>
        <div className="controls">
          <select
            value={settings.repoSort}
            onChange={(e) => onSettingsChange({ repoSort: e.target.value })}
            aria-label="Sort repositories"
          >
            {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.showForks}
              onChange={(e) => onSettingsChange({ showForks: e.target.checked })}
            />
            Show forks
          </label>
        </div>
      </div>
      <div className="repo-grid">
        {repos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
      </div>
    </section>
  );
}
