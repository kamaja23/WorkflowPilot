-- Seed workflow: Support Request Triage
INSERT INTO workflows (id, name, description, version, definition)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Process a customer support request',
  'Classify, draft, validate, route for review, and optionally escalate support requests.',
  1,
  '{
    "name": "Support Request Triage",
    "version": 1,
    "steps": [
      {"key": "classify", "name": "Classify request", "type": "llm", "required": true, "position": 1, "config": {"output_schema": {"category": "string", "urgency": "low|medium|high", "rationale": "string"}}},
      {"key": "draft_response", "name": "Draft response", "type": "llm", "required": true, "position": 2, "config": {"must_not_send_externally": true}},
      {"key": "validate", "name": "Validate response", "type": "validator", "required": true, "position": 3, "config": {"rules": ["required_fields", "min_length", "no_unsupported_promises", "answers_request"]}},
      {"key": "route_for_review", "name": "Route for review", "type": "route", "required": false, "position": 4, "config": {"threshold": 0.6}},
      {"key": "jira_escalation", "name": "Escalate (Jira)", "type": "integration", "required": false, "position": 5, "config": {"provider": "jira", "condition": "needs_review_or_failed"}},
      {"key": "complete", "name": "Complete", "type": "complete", "required": true, "position": 6, "config": {}}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed evaluation dataset (>=12 cases)
-- We store as reference in comments; evaluate script uses dataset in code too
-- This is just for traceability
INSERT INTO evaluation_results (dataset_name, case_id, passed, score, details)
VALUES 
  ('support_triage_smoke_v1', 'seed_case_good_billing', true, 1.0, '{"note": "seed marker"}'),
  ('support_triage_smoke_v1', 'seed_case_bad_refund', false, 0.0, '{"note": "seed marker - triggers refund promise"}')
ON CONFLICT DO NOTHING;
