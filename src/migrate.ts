import fs from 'fs';
import path from 'path';
import { DB } from './db';

async function runMigrations() {
  
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  await DB.withClient(async (client: any) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    for (const f of files) {
      const key = f;
      const exists = (await client.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [key])).rowCount > 0;
      if (exists) {
        console.log('Skipping', f);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log('Applying', f);
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [key]);
    }
    console.log('Migrations complete');
  });
}

runMigrations().catch(err => { console.error(err); process.exit(1); });