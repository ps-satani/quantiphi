import { db } from './database.js';

const insertMatch = db.prepare(`
  INSERT INTO match_results (login, jd_excerpt, percentage, breakdown)
  VALUES (?, ?, ?, ?)
`);
const selectLatest = db.prepare(`
  SELECT * FROM match_results WHERE login = ? ORDER BY id DESC LIMIT 1
`);

const toMatch = (row) => row && {
  id: row.id,
  jdExcerpt: row.jd_excerpt,
  percentage: row.percentage,
  ...JSON.parse(row.breakdown),
  createdAt: row.created_at,
};

export const matchRepository = {
  save(login, jdExcerpt, result) {
    const { percentage, ...breakdown } = result;
    const { lastInsertRowid } = insertMatch.run(login, jdExcerpt, percentage, JSON.stringify(breakdown));
    return toMatch(db.prepare('SELECT * FROM match_results WHERE id = ?').get(lastInsertRowid));
  },

  getLatest(login) {
    return toMatch(selectLatest.get(login)) ?? null;
  },
};
