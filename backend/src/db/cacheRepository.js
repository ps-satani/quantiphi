import { db } from './database.js';

const getMeta = db.prepare('SELECT fetched_at, source FROM cache_meta WHERE cache_key = ?');
const upsertMeta = db.prepare(`
  INSERT INTO cache_meta (cache_key, fetched_at, source) VALUES (?, ?, ?)
  ON CONFLICT(cache_key) DO UPDATE SET fetched_at = excluded.fetched_at, source = excluded.source
`);

export const cacheRepository = {
  getMeta(key) {
    return getMeta.get(key) ?? null;
  },

  isFresh(key, ttlSeconds) {
    const meta = getMeta.get(key);
    return Boolean(meta) && Date.now() - meta.fetched_at < ttlSeconds * 1000;
  },

  markFetched(key, source) {
    upsertMeta.run(key, Date.now(), source);
  },
};
