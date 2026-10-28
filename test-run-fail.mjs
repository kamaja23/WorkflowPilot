import { runWorkflow } from './src/lib/runner/runner.ts';
runWorkflow('00000000-0000-0000-0000-000000000001', {customer_message:'I want a refund now', priority:'high', product_area:'billing'}).then(r=>{
  console.log('STATUS:', r.status);
  process.exit(0);
}).catch(e=>{console.error(e.message);process.exit(1);});
