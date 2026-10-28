-- WorkflowPilot initial schema
-- Tables: workflows, workflow_runs, workflow_steps, step_attempts, evaluation_results, integration_events
-- Includes FKs, indexes, RLS policies

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- workflows
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  definition JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- workflow_runs
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  input JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  error_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id_created ON workflow_runs(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);

-- workflow_steps
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  step_name TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','needs_review','skipped','cancelled')),
  input JSONB,
  output JSONB,
  validation JSONB,
  error_code TEXT,
  error_message TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_run_id_position ON workflow_steps(run_id, position);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);

-- step_attempts (preserve full retry history)
CREATE TABLE IF NOT EXISTS step_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','needs_review','skipped','cancelled')),
  input JSONB,
  output JSONB,
  validation JSONB,
  error_code TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_attempts_step_id_attempt ON step_attempts(step_id, attempt);

-- evaluation_results
CREATE TABLE IF NOT EXISTS evaluation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES workflow_runs(id) ON DELETE SET NULL,
  dataset_name TEXT NOT NULL,
  case_id TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  score NUMERIC,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_results_run_id ON evaluation_results(run_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_dataset ON evaluation_results(dataset_name, created_at DESC);

-- integration_events
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES workflow_runs(id) ON DELETE SET NULL,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  external_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_events_run_id ON integration_events(run_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_provider ON integration_events(provider);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

-- Demo policies (single-user P0): allow all for demo role/service; permissive for local dev
CREATE POLICY IF NOT EXISTS "Allow all for workflows (demo)" ON workflows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for workflow_runs (demo)" ON workflow_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for workflow_steps (demo)" ON workflow_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for step_attempts (demo)" ON step_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for evaluation_results (demo)" ON evaluation_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for integration_events (demo)" ON integration_events FOR ALL USING (true) WITH CHECK (true);
