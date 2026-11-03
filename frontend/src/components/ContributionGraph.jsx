import { useEffect, useRef } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Label a column with its month when the month changes from the previous column.
function monthLabels(weeks) {
  let last = -1;
  return weeks.map((week) => {
    const month = Number(week[0].date.slice(5, 7)) - 1;
    if (month === last) return '';
    last = month;
    return MONTHS[month];
  });
}

export default function ContributionGraph({ contributions, complete }) {
  const { weeks, total, activeDays, currentStreak, longestStreak, bestDay } = contributions;
  const labels = monthLabels(weeks);
  const scrollRef = useRef(null);

  // On narrow screens, start scrolled to the most recent weeks.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [weeks]);

  return (
    <section className="card">
      <div className="section-head">
        <h2>{total.toLocaleString()} contributions in the last year</h2>
        <span className="muted">
          {activeDays} active days · streak {currentStreak}d · longest {longestStreak}d
          {bestDay && ` · best day ${bestDay.count} on ${bestDay.date}`}
        </span>
      </div>

      <div className="heatmap-scroll" ref={scrollRef}>
        <div className="heatmap">
          {weeks.map((week, i) => (
            <div className="heatmap-col" key={week[0].date}>
              <span className="heatmap-month">{labels[i]}</span>
              {week.map((day) => (
                <span
                  key={day.date}
                  className={`cell level-${day.level}`}
                  title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-foot">
        {!complete && (
          <span className="muted">Partial data: add a GITHUB_TOKEN for the full contribution calendar.</span>
        )}
        <span className="scale">
          Less {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`cell level-${l}`} />)} More
        </span>
      </div>
    </section>
  );
}
