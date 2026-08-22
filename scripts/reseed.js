// Reset the SQLite database to fresh demo data: node scripts/reseed.js
import { seed } from '../lib/db.js';

seed(true);
console.log('✅ Database reseeded.');
