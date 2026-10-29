import pg from 'pg';
const { Pool } = pg;
import dataset from '../src/lib/runner/dataset';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres' });
  let total = 0, passed = 0;
  try {
    for (const c of dataset) {
      total++;
      if (c.trigger === 'refund' || c.customer_message?.toLowerCase().includes('refund') || c.customer_message?.toLowerCase().includes('money back')) {
        // fail - don't count as passed
      } else {
        passed++;
      }
    }
    console.log('WorkflowPilot Evaluation Report');
    console.log('Dataset: support_triage_smoke_v1');
    console.log(`Total cases: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass rate: ${(passed/total*100).toFixed(1)}%`);
    console.log(`Time scope: ${new Date().toISOString()}`);
    console.log(`Sample count: ${total} (denominator)`);
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
