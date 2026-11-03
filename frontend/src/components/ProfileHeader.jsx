import LanguagePie from './LanguagePie.jsx';

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function ProfileHeader({ user, summary, languages, contributions, badge }) {
  return (
    <section className="card profile">
      <div className="profile-main">
        <img className="avatar" src={user.avatarUrl} alt={user.login} />
        <div>
          {badge}
          <h1>{user.name || user.login}</h1>
          <a className="muted" href={user.htmlUrl} target="_blank" rel="noreferrer">@{user.login}</a>
          {user.bio && <p className="bio">{user.bio}</p>}
          <p className="muted meta-line">
            {[user.location, user.company, user.blog].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="stats">
        <Stat label="Followers" value={summary.followers} />
        <Stat label="Total stars" value={summary.totalStars} />
        <Stat label="Repositories" value={summary.ownedRepos} />
        <Stat label="Total forks" value={summary.totalForks} />
        <Stat label="Current streak" value={`${contributions.currentStreak}d`} />
        <Stat label="Longest streak" value={`${contributions.longestStreak}d`} />
      </div>

      <div className="profile-langs">
        <h3>Top languages</h3>
        <LanguagePie languages={languages} />
      </div>
    </section>
  );
}
