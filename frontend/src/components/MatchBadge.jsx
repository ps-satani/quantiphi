const TIER_LABEL = { strong: 'Strong match', good: 'Good match', partial: 'Partial match', low: 'Low match' };

export default function MatchBadge({ match }) {
  if (!match) return null;
  return (
    <span className={`match-badge tier-${match.tier}`} title={`For: ${match.jdExcerpt}`}>
      <strong>{match.percentage}%</strong> {TIER_LABEL[match.tier]}
    </span>
  );
}
