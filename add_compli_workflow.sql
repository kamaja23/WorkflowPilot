INSERT INTO workflows (id, name, description, version, definition)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Compli Business Compliance Scan',
  'Analyze a business, map applicable regulations, generate findings, and create an actionable compliance plan.',
  1,
  '{
    "name": "Compli Business Compliance Scan",
    "version": 1,
    "steps": [
      {"key": "analyze_business", "name": "Analyze Business Profile", "type": "llm", "required": true, "position": 1, "config": {"output_schema": {"industry": "string", "business_type": "string", "risk_factors": ["string"], "rationale": "string"}}},
      {"key": "map_compliance", "name": "Map Compliance Requirements", "type": "llm", "required": true, "position": 2, "config": {"must_not_send_externally": true}},
      {"key": "generate_findings", "name": "Generate Findings", "type": "llm", "required": true, "position": 3, "config": {}},
      {"key": "validate_findings", "name": "Validate Findings", "type": "validator", "required": true, "position": 4, "config": {"rules": ["required_fields"]}},
      {"key": "create_action_plan", "name": "Create Action Plan", "type": "llm", "required": true, "position": 5, "config": {}},
      {"key": "complete", "name": "Complete", "type": "complete", "required": true, "position": 6, "config": {}}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
