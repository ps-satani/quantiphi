const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Donut chart in plain SVG: each slice is a circle stroke, dashed to its share of the circumference.
export default function LanguagePie({ languages }) {
  if (!languages.length) return <p className="muted">No language data yet.</p>;

  let offset = 0;
  const slices = languages.map((lang) => {
    const length = (lang.percentage / 100) * CIRCUMFERENCE;
    const slice = { ...lang, length, offset };
    offset += length;
    return slice;
  });

  return (
    <div className="pie">
      <svg viewBox="0 0 160 160" width="150" height="150" role="img" aria-label="Top languages">
        <g transform="rotate(-90 80 80)">
          {slices.map((s) => (
            <circle
              key={s.name}
              cx="80" cy="80" r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth="26"
              strokeDasharray={`${s.length} ${CIRCUMFERENCE - s.length}`}
              strokeDashoffset={-s.offset}
            >
              <title>{`${s.name}: ${s.percentage}%`}</title>
            </circle>
          ))}
        </g>
      </svg>
      <ul className="legend">
        {languages.map((l) => (
          <li key={l.name}>
            <span className="dot" style={{ background: l.color }} />
            <span>{l.name}</span>
            <span className="muted">{l.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
