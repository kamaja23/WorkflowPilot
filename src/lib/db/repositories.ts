import pool from './pool';

export const repositories = {
  async getWorkflows() {
    const res = await pool.query('SELECT * FROM workflows ORDER BY created_at ASC');
    return res.rows;
  },
  async getWorkflowById(id: string) {
    const res = await pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
    return res.rows[0] || null;
  },
  async createRun(workflowId: string, workflowVersion: number, input: any) {
    const res = await pool.query(
      `INSERT INTO workflow_runs (workflow_id, workflow_version, status, input, started_at) 
       VALUES ($1,$2,'running',$3,NOW()) RETURNING *`,
      [workflowId, workflowVersion, input ? JSON.stringify(input) : null]
    );
    return res.rows[0];
  },
  async createStep(runId: string, step: any) {
    const res = await pool.query(
      `INSERT INTO workflow_steps (run_id, step_key, step_name, position, status, input, attempt, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [runId, step.key, step.name, step.position, 'queued', step.input ? JSON.stringify(step.input) : null, step.attempt || 1]
    );
    return res.rows[0];
  },
  async updateStep(stepId: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      sets.push(`${k} = $${idx++}`);
      vals.push(typeof v === 'object' && v !== null && !(v instanceof Date) ? JSON.stringify(v) : v);
    }
    if (sets.length === 0) return null;
    vals.push(stepId);
    const res = await pool.query(`UPDATE workflow_steps SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    return res.rows[0];
  },
  async getRun(id: string) {
    const res = await pool.query('SELECT * FROM workflow_runs WHERE id = $1', [id]);
    return res.rows[0] || null;
  },
  async getRuns(limit = 50) {
    const res = await pool.query('SELECT * FROM workflow_runs ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
  },
  async getStepsForRun(runId: string) {
    const res = await pool.query('SELECT * FROM workflow_steps WHERE run_id = $1 ORDER BY position ASC', [runId]);
    return res.rows;
  },
  async getStepAttempts(stepId: string) {
    const res = await pool.query('SELECT * FROM step_attempts WHERE step_id = $1 ORDER BY attempt ASC', [stepId]);
    return res.rows;
  },
  async createStepAttempt(stepId: string, attempt: number, data: any) {
    const res = await pool.query(
      `INSERT INTO step_attempts (step_id, attempt, status, input, output, validation, error_code, error_message, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [stepId, attempt, data.status || 'running', data.input ? JSON.stringify(data.input) : null, data.output ? JSON.stringify(data.output) : null, data.validation ? JSON.stringify(data.validation) : null, data.error_code || null, data.error_message || null]
    );
    return res.rows[0];
  },
  async updateStepAttempt(attemptId: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      sets.push(`${k} = $${idx++}`);
      vals.push(typeof v === 'object' && v !== null && !(v instanceof Date) ? JSON.stringify(v) : v);
    }
    if (sets.length === 0) return null;
    vals.push(attemptId);
    const res = await pool.query(`UPDATE step_attempts SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    return res.rows[0];
  },
  async createIntegrationEvent(data: any) {
    const res = await pool.query(
      `INSERT INTO integration_events (run_id, step_id, provider, event_type, status, external_id, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.run_id || null, data.step_id || null, data.provider, data.event_type, data.status, data.external_id || null, data.details ? JSON.stringify(data.details) : null]
    );
    return res.rows[0];
  },
  async insertEvaluationResult(data: any) {
    const res = await pool.query(
      `INSERT INTO evaluation_results (run_id, dataset_name, case_id, passed, score, details)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [data.run_id || null, data.dataset_name, data.case_id, data.passed, data.score || null, data.details ? JSON.stringify(data.details) : null]
    );
    return res.rows[0];
  },
  async getEvaluationSummary() {
    const res = await pool.query(`SELECT dataset_name, COUNT(*) as total, SUM(CASE WHEN passed THEN 1 ELSE 0 END) as passed, MIN(created_at) as first_run, MAX(created_at) as last_run FROM evaluation_results GROUP BY dataset_name ORDER BY last_run DESC`);
    return res.rows;
  },
  async finalizeRun(runId: string, status: string, errorSummary?: string) {
    const res = await pool.query(`UPDATE workflow_runs SET status=$1, finished_at=NOW(), duration_ms=EXTRACT(EPOCH FROM (NOW()-started_at))*1000, error_summary=$2 WHERE id=$3 RETURNING *`, [status, errorSummary || null, runId]);
    return res.rows[0];
  }
};
