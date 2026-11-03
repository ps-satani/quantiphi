import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import { SCHEMA } from './schema.js';

if (env.dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(path.resolve(env.dbPath)), { recursive: true });
}

export const db = new Database(env.dbPath);
db.pragma('journal_mode = WAL'); // readers don't block the writer
db.pragma('foreign_keys = ON');  // enables ON DELETE CASCADE
db.exec(SCHEMA);
