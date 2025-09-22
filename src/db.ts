import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set in .env');

export class DB {
  private static _pool: Pool | null = null;

  public static get pool(): Pool {
    if (!DB._pool) DB._pool = new Pool({ connectionString });
    return DB._pool;
  }

  public static async withClient<T>(fn: (client: any) => Promise<T>) {
    const client = await DB.pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }
}