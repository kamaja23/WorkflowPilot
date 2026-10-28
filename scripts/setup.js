import pg from 'pg';
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres' });
  try {
    const client = await pool.connect();
    console.log('Connected to DB');
    const r = await client.query('SELECT count(*) FROM workflows');
    console.log('Workflows:', r.rows[0].count);
    client.release();
  } catch (e) {
    console.error('DB check failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
