// Reset the database to fresh demo data: node scripts/reseed.js
// Uses Postgres when DATABASE_URL is set, SQLite otherwise.
import { seed, USE_POSTGRES } from '../lib/db.js';

await seed(true);
console.log(`✅ Database reseeded (${USE_POSTGRES ? 'Postgres' : 'SQLite'}).`);
