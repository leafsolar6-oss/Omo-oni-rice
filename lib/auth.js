/* Admin session tokens — persisted in SQLite (24h expiry).
   Stored in the DB (not module memory) so sessions survive bundling
   boundaries and server restarts. */
import crypto from 'crypto';
import { db } from './db.js';

const TTL = 24 * 3600 * 1000;

export function createSession(username) {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT OR REPLACE INTO sessions (token, username, expires) VALUES (?, ?, ?)')
    .run(token, username, Date.now() + TTL);
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return null;
  if (row.expires < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { username: row.username };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
