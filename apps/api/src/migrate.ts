import { pool } from './db.js';
import { migrate } from './schema.js';

await migrate();
await pool.end();
