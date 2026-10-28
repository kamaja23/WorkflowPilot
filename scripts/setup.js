const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres' });
  try {
    const client = await pool.connect();
    console.log('Connected to DB');
    client.release();
  } catch (e) {
    console.error('DB connection failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
