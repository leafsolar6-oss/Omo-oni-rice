/* Admin session tokens — persisted in the database (24h expiry).
   Works on both backends: Postgres (DATABASE_URL set) and SQLite. */
import crypto from 'crypto';
import { USE_POSTGRES, getSqlite, pgPool, seed } from './db.js';

const TTL = 24 * 3600 * 1000;

export async function createSession(username) {
  await seed(false);
  const token = crypto.randomBytes(24).toString('hex');
  if (USE_POSTGRES) {
    await pgPool.query(
      `INSERT INTO sessions (token, username, expires) VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET username = $2, expires = $3`,
      [token, username, Date.now() + TTL]);
  } else {
    getSqlite().prepare('INSERT OR REPLACE INTO sessions (token, username, expires) VALUES (?, ?, ?)')
      .run(token, username, Date.now() + TTL);
  }
  return token;
}

export async function getSession(token) {
  if (!token) return null;
  await seed(false);
  const row = USE_POSTGRES
    ? (await pgPool.query('SELECT * FROM sessions WHERE token = $1', [token])).rows[0]
    : getSqlite().prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return null;
  if (Number(row.expires) < Date.now()) {
    await destroySession(token);
    return null;
  }
  return { username: row.username };
}

export async function destroySession(token) {
  if (!token) return;
  await seed(false);
  if (USE_POSTGRES) {
    await pgPool.query('DELETE FROM sessions WHERE token = $1', [token]);
  } else {
    getSqlite().prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}
