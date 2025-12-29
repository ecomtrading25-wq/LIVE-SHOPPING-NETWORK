import mysql from 'mysql2/promise';
import fs from 'fs';

const sql = fs.readFileSync('drizzle/migrations/avatar_studio.sql', 'utf8');

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const statements = sql.split(';').filter(s => s.trim());

for (const stmt of statements) {
  if (stmt.trim()) {
    try {
      await conn.execute(stmt);
      console.log('✓ Executed statement');
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.error('Error:', e.message);
      } else {
        console.log('⊙ Table already exists, skipping');
      }
    }
  }
}

await conn.end();
console.log('\n✓ Avatar tables migration complete');
