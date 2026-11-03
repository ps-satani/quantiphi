export default function RepoCard({ repo }) {
  return (
    <article className="card repo">
      <div className="repo-title">
        <a href={repo.htmlUrl} target="_blank" rel="noreferrer">{repo.name}</a>
        {repo.isFork && <span className="tag">fork</span>}
        {repo.isArchived && <span className="tag">archived</span>}
      </div>
      <p className="repo-desc">{repo.description || <span className="muted">No description</span>}</p>
      {repo.topics.length > 0 && (
        <div className="topics">
          {repo.topics.slice(0, 4).map((t) => <span key={t} className="topic">{t}</span>)}
        </div>
      )}
      <div className="repo-meta">
        {repo.language && (
          <span><span className="dot" style={{ background: repo.languageColor }} />{repo.language}</span>
        )}
        <span title="Stars">★ {repo.stars}</span>
        <span title="Forks">⑂ {repo.forks}</span>
        {repo.pushedAt && <span className="muted">Updated {repo.pushedAt.slice(0, 10)}</span>}
      </div>
    </article>
  );
}
