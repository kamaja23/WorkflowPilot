# WorkflowPilot --- AI Workflow Automation & Reliability Platform

> **Purpose:** This file is the product brief and implementation plan
> for an AI coding agent. Read it before making changes. Build a
> working, demonstrable MVP first; do not over-engineer or pretend
> integrations work when they have not been verified.

## 1. Product summary

**WorkflowPilot** helps teams automate multi-step business workflows
with AI while keeping the process observable, testable, and recoverable.

A user defines a workflow. WorkflowPilot runs its steps, records what
happened, validates outputs, and surfaces failures or steps that need
human approval. Instead of treating an AI agent's "done" message as
proof of success, the platform tracks actual step status and evidence.

### One-sentence pitch

> WorkflowPilot turns fragile AI automations into observable workflows
> that can be inspected, evaluated, retried, and escalated when they
> fail.

### Problem

Teams are experimenting with AI agents, but multi-step automations can
silently fail, return malformed results, skip required work, or make
decisions that need human review. Debugging often requires piecing
together prompts, logs, and external task trackers.

### Target users

Start with a narrow audience for the MVP: - Small engineering and
operations teams experimenting with AI automations. - Technical founders
who need to see whether an agent actually completed its work. - Teams
that want failed or uncertain runs converted into actionable follow-up
tasks.

This is a starting hypothesis, not a validated market claim. Interview
potential users before committing to a specific industry.

## 2. MVP goal

Deliver a web app where a user can:

1.  Create or select a sample workflow.
2.  Run it against a realistic sample task.
3.  Watch each step move through its lifecycle.
4.  Inspect each step's input, output, duration, and status.
5.  See validation results and a clear explanation when a step fails.
6.  Retry a failed step or mark a step as reviewed.
7.  Create a Jira issue for a failure or a human follow-up, if Jira
    credentials are configured.
8.  View run history and a basic reliability summary.

The MVP must have a useful demo path that works **without** external API
keys. Real integrations should activate when credentials are supplied;
otherwise, use clearly labeled mock adapters.

## 3. Product principles

-   **Observable by default:** Every run and step has a status,
    timestamps, and a structured result.
-   **Evidence over assertions:** A step is successful only when its
    output passes its configured checks.
-   **Human control:** High-impact actions require approval. Never
    perform destructive or external side effects without explicit
    configuration and confirmation.
-   **Safe retries:** Retrying a step must not blindly duplicate
    external actions. Use idempotency keys or clearly explain when an
    action may be repeated.
-   **Provider-independent core:** Keep the orchestration and workflow
    data model separate from any single LLM provider or external
    integration.
-   **Demo reliability:** Seed data and mock mode must make the app
    demonstrable on a clean setup.
-   **Honest integration status:** Do not claim a live integration works
    until it has been tested end to end.

## 4. Recommended sponsor technology use

The hackathon lists Supabase, Atlassian for Startups, and AutoHDR among
its partners. Supabase provides database, auth, storage, realtime, and
related backend services; Atlassian provides collaboration tools;
AutoHDR is focused on AI real-estate photo editing. Verify actual API
access and event-provided requirements before depending on a specific
feature.

### Required for the core demo

**Supabase** - Postgres database for workflows, runs, steps,
evaluations, and integration settings. - Supabase Auth if time allows;
otherwise implement a clearly labeled single-user demo mode and keep
authorization boundaries ready for Auth. - Realtime updates for run/step
status if practical. Polling is an acceptable MVP fallback. - Use
migrations checked into the repository.

**Atlassian Jira** - Optional but meaningful integration: create a Jira
issue from a failed run or a step that needs human intervention. - Use
the official REST API and credentials supplied by the user. - Keep Jira
calls behind an adapter and provide a mock adapter for local demos. -
Never hardcode tokens, project IDs, or secrets.

### Optional / stretch integration

**AutoHDR** - Investigate whether an official API, SDK, or
hackathon-provided access is available. - Do not scrape the website or
reverse-engineer undocumented endpoints. - Only build this integration
if access is confirmed and it fits a concrete workflow. - Possible
demonstration: a real-estate media workflow that submits property photos
for enhancement, records the result, validates expected outputs, and
escalates errors for review. - If access is unavailable, document the
limitation and keep the core WorkflowPilot demo independent of AutoHDR.

### Community / mentorship

Hook'em Hacks is a community partner rather than a required software
dependency. Use mentors and feedback to validate the user problem and
demo clarity.

## 5. Proposed demo workflow

Use this as the initial workflow template: **"Process a customer support
request."**

It is understandable to judges and can be simulated safely without
access to a real customer system.

### Input

A sample support request containing: - `ticket_id` -
`customer_message` - `priority` - `product_area`

### Steps

1.  **Classify request**
    -   Produce a structured category, urgency, and short rationale.
2.  **Draft response**
    -   Produce a proposed response; do not send it to a customer.
3.  **Validate response**
    -   Check required fields, length, prohibited promises, and whether
        the draft answers the request.
4.  **Route for review**
    -   If validation fails or confidence is below a configurable
        threshold, mark the step `needs_review`.
5.  **Escalate**
    -   If configured, create a Jira issue with the run link, failure
        reason, and relevant sanitized context.
6.  **Complete**
    -   Mark the workflow complete only if required steps passed or a
        human explicitly resolved the review state.

This workflow is a demonstration fixture, not a claim that WorkflowPilot
is already integrated with a support desk.

### Failure scenario to demonstrate

Seed a request that triggers a validation failure---for example, a draft
that promises an unsupported refund. Show WorkflowPilot catching it,
preserving the failed output, explaining the validation issue, and
creating or simulating a Jira follow-up.

## 6. Core user experience

Build a compact, polished interface with these views:

### A. Dashboard

-   Total runs.
-   Successful, failed, and needs-review counts.
-   Recent runs with workflow name, status, start time, and duration.
-   A clear "Run demo workflow" action.

### B. Workflow detail

-   Workflow description and ordered steps.
-   Required/optional step indicator.
-   Configuration for thresholds and validation rules where practical.
-   Run button.

### C. Run detail

-   Timeline or vertical step list.
-   Status for each step: `queued`, `running`, `succeeded`, `failed`,
    `needs_review`, `skipped`, or `cancelled`.
-   Start/end time and duration.
-   Expandable input, output, validation results, and error details.
-   Retry action for eligible failed steps.
-   Human-review action for `needs_review` steps.
-   Link to a Jira issue if one was created.

### D. Reliability / evaluation view

-   Run success rate over the demo dataset.
-   Failure categories and counts.
-   Validation pass rate.
-   Optional comparison of two prompt/workflow versions using the same
    fixed test cases.

Do not present a metric without showing its denominator and time/sample
scope.

## 7. Architecture

Keep the first version simple. Prefer a modular monolith over a
distributed system.

### Suggested components

-   **Frontend:** TypeScript with a modern React framework already
    familiar to the agent or present in the repository. If starting from
    scratch, choose a mainstream stack and explain the choice briefly.
-   **Backend:** Use Supabase/Postgres for persisted data. Put
    privileged integration calls and secret handling in server-side code
    or Supabase Edge Functions.
-   **Workflow runner:** A small server-side orchestration module that
    executes ordered steps, validates results, persists status
    transitions, and handles errors.
-   **LLM provider:** A thin provider interface. Use a configured
    provider when available and a deterministic mock provider for the
    no-key demo.
-   **Integrations:** Separate Jira and AutoHDR adapters with real and
    mock implementations.
-   **Evaluation:** Deterministic validators and a small fixed
    evaluation dataset committed to the repo.

### High-level flow

``` text
User starts a run
      |
      v
Workflow runner creates run + step records
      |
      v
Execute each step -> persist input/output/status/timing
      |
      v
Run deterministic validators
      |
      +---- pass --------------------> continue
      |
      +---- fail / uncertain --------> needs_review or failed
                                         |
                                         v
                               optional Jira issue
                                         |
                                         v
                                  user inspects run
```

### Important implementation boundaries

-   Do not run long workflow execution inside a browser request if it
    risks timing out. Use a server-side runner appropriate to the
    selected stack.
-   Keep secrets out of frontend bundles and database rows that are
    readable by ordinary users.
-   Validate all inputs at API boundaries.
-   Treat model output as untrusted data; parse structured output and
    validate it before use.
-   Do not allow the model to generate arbitrary SQL, shell commands, or
    unrestricted URLs for execution.
-   Record enough sanitized detail to debug a run, but avoid logging
    secrets or unnecessary personal data.

## 8. Data model

Create migrations for a minimal relational schema. Adapt names to the
chosen framework, but preserve these concepts.

### `workflows`

-   `id` UUID primary key
-   `name` text
-   `description` text
-   `version` integer
-   `definition` JSONB --- ordered step definitions and configuration
-   `created_at`, `updated_at` timestamps

### `workflow_runs`

-   `id` UUID primary key
-   `workflow_id` UUID foreign key
-   `workflow_version` integer
-   `status` text
-   `input` JSONB
-   `started_at`, `finished_at` timestamps
-   `duration_ms` integer nullable
-   `error_summary` text nullable
-   `created_at` timestamp

### `workflow_steps`

-   `id` UUID primary key
-   `run_id` UUID foreign key
-   `step_key` text
-   `step_name` text
-   `position` integer
-   `status` text
-   `input` JSONB nullable
-   `output` JSONB nullable
-   `validation` JSONB nullable
-   `error_code` text nullable
-   `error_message` text nullable
-   `attempt` integer default 1
-   `started_at`, `finished_at` timestamps nullable
-   `duration_ms` integer nullable
-   `created_at` timestamp

### `evaluation_results`

-   `id` UUID primary key
-   `run_id` UUID foreign key
-   `dataset_name` text
-   `case_id` text
-   `passed` boolean
-   `score` numeric nullable
-   `details` JSONB
-   `created_at` timestamp

### `integration_events`

-   `id` UUID primary key
-   `run_id` UUID nullable
-   `step_id` UUID nullable
-   `provider` text
-   `event_type` text
-   `status` text
-   `external_id` text nullable
-   `details` JSONB
-   `created_at` timestamp

Add indexes for run history and foreign keys. Use Row Level Security if
Supabase is exposed to client-side access. Do not rely on hiding UI
controls as authorization.

## 9. Workflow definition contract

Represent workflow steps as typed configuration rather than hard-coded
UI-only state. Example:

``` json
{
  "name": "Support Request Triage",
  "version": 1,
  "steps": [
    {
      "key": "classify",
      "type": "llm",
      "required": true,
      "config": {
        "output_schema": {
          "category": "string",
          "urgency": "low|medium|high",
          "rationale": "string"
        }
      }
    },
    {
      "key": "draft_response",
      "type": "llm",
      "required": true,
      "config": {
        "must_not_send_externally": true
      }
    },
    {
      "key": "validate",
      "type": "validator",
      "required": true,
      "config": {
        "rules": ["required_fields", "no_unsupported_promises"]
      }
    },
    {
      "key": "jira_escalation",
      "type": "integration",
      "required": false,
      "config": {
        "provider": "jira",
        "condition": "needs_review_or_failed"
      }
    }
  ]
}
```

Treat this as an illustrative contract. Adjust the schema to fit the
implementation, but add validation and tests. Never `eval` workflow
configuration or treat it as executable code.

## 10. API contract

Use consistent, documented endpoints or server actions. If REST
endpoints are used, a reasonable starting point is:

-   `GET /api/workflows` --- list workflows
-   `GET /api/workflows/:id` --- workflow detail
-   `POST /api/workflows/:id/runs` --- start a run
-   `GET /api/runs` --- recent runs
-   `GET /api/runs/:id` --- run and step details
-   `POST /api/runs/:id/retry` --- retry an eligible failed step or run
-   `POST /api/steps/:id/review` --- submit a human review decision
-   `POST /api/runs/:id/escalate` --- create a Jira issue or mock
    escalation
-   `GET /api/evaluations/summary` --- aggregate evaluation results

Document request/response types and error formats. These are proposed
routes, not a requirement to use REST if the chosen framework has a
better equivalent.

## 11. MLOps and reliability requirements

The MLOps component should be real, but appropriately small for a
hackathon.

### Required

-   A committed, reproducible set of at least 10 representative test
    cases.
-   Deterministic validators for schema compliance and workflow-specific
    rules.
-   A script or command that runs the evaluation dataset and reports
    pass/fail counts.
-   Persist evaluation results with workflow version and timestamp.
-   A visible run history with failures and error reasons.
-   A clear distinction between an LLM's self-reported confidence and
    measured validation results.

### Stretch

-   Compare two prompt or workflow versions against the same dataset.
-   Track latency and estimated token/cost data when available from the
    provider.
-   Add a simple regression alert when a new version performs worse than
    the baseline.
-   Add OpenTelemetry or a tracing provider only if it can be integrated
    without jeopardizing the MVP.

Do not claim statistically meaningful model quality from a tiny demo
dataset. Label it as a smoke-test/evaluation set.

## 12. Integration contracts

Create interfaces so external providers can be swapped or mocked.

### LLM provider interface

``` ts
interface LlmProvider {
  generateStructuredOutput<T>(
    input: unknown,
    schema: unknown
  ): Promise<{
    output: T;
    provider: string;
    model: string;
    latencyMs: number;
  }>;
}
```

### Jira integration interface

``` ts
interface IssueTracker {
  createIssue(input: {
    title: string;
    description: string;
    labels?: string[];
    idempotencyKey: string;
  }): Promise<{
    externalId: string;
    url?: string;
  }>;
}
```

### Image-processing integration interface (optional)

``` ts
interface ImageProcessor {
  process(input: {
    sourceImageUrl: string;
    options?: Record<string, unknown>;
  }): Promise<{
    outputImageUrl: string;
    provider: string;
    metadata?: Record<string, unknown>;
  }>;
}
```

The AutoHDR adapter should only be implemented against documented,
authorized API access. Provide a mock implementation if no official API
credentials or quick-start are available.

## 13. Security and privacy

-   Store API credentials in server-side environment variables or the
    platform's secret manager.
-   Commit `.env.example`, never real credentials.
-   Add `.env*` to `.gitignore` except `.env.example`.
-   Use least-privilege credentials.
-   Enforce authorization server-side and configure Supabase RLS if
    client access is enabled.
-   Redact secrets from logs and integration errors.
-   Avoid collecting real customer information for the demo; use
    synthetic sample data.
-   Add timeouts and bounded retries to provider calls.
-   Require explicit confirmation for actions with external side
    effects.
-   Make mock mode visually obvious so it cannot be mistaken for a live
    integration.

## 14. Development plan and priorities

### P0 --- must work for the demo

1.  Inspect the existing repository before choosing or replacing
    technologies.
2.  Write a concise implementation plan and identify unknowns.
3.  Build the core schema and migrations.
4.  Seed one workflow and synthetic input examples.
5.  Implement the server-side runner and step status transitions.
6.  Implement deterministic mock LLM/provider mode.
7.  Build dashboard and run-detail UI.
8.  Add validators and a repeatable evaluation script.
9.  Implement Jira adapter if credentials/docs are available; otherwise
    implement a clear mock adapter.
10. Add setup instructions and a short demo script.
11. Test the entire happy path and one failure/escalation path.

### P1 --- implement if the core path is stable

-   Supabase Auth and multi-user separation.
-   Realtime run updates.
-   Live LLM provider integration.
-   Jira issue links and richer issue formatting.
-   Retry with attempt history and idempotency.
-   Evaluation comparison view.

### P2 --- stretch only

-   AutoHDR integration, only after access is confirmed.
-   User-defined workflow editor.
-   Multiple workflow templates.
-   Notifications and scheduled runs.
-   Advanced tracing, billing, team workspaces, and production
    deployment hardening.

**Do not start P1/P2 work until the complete P0 demo path works.**

## 15. Acceptance criteria

The MVP is ready when all of the following are true:

-   [ ] A new developer can run it using the README instructions.
-   [ ] It works in mock mode without external API keys.
-   [ ] A user can start a sample workflow and see persisted run
    history.
-   [ ] Each step has an accurate status, timing, and inspectable
    output.
-   [ ] Invalid output is caught by a deterministic validator.
-   [ ] A failed/uncertain step becomes `failed` or `needs_review`, not
    falsely `succeeded`.
-   [ ] A user can retry an eligible step without losing the previous
    attempt history.
-   [ ] A failure can create a Jira issue in live mode or a clearly
    labeled simulated event in mock mode.
-   [ ] Evaluation results are reproducible and show their sample count.
-   [ ] No API secrets are committed or exposed to the browser.
-   [ ] The README explains setup, configuration, architecture,
    limitations, and how to run the demo.
-   [ ] There is a concise 2--3 minute demo flow with one success and
    one failure case.

## 16. Suggested repository structure

Adapt to the existing repository rather than forcing this exact layout.

``` text
workflowpilot/
├── README.md
├── PRODUCT_SPEC.md
├── .env.example
├── .gitignore
├── docs/
│   ├── architecture.md
│   ├── integrations.md
│   └── demo-script.md
├── migrations/
├── scripts/
│   └── evaluate.ts
├── src/
│   ├── app/                 # frontend routes/pages
│   ├── components/
│   ├── lib/
│   │   ├── workflows/
│   │   ├── providers/
│   │   ├── integrations/
│   │   ├── evaluation/
│   │   └── validation/
│   └── server/
└── tests/
    ├── unit/
    └── integration/
```

## 17. Environment variables

Create `.env.example` with placeholders only. Adjust names to the
selected framework.

``` dotenv
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM provider (optional in mock mode)
LLM_PROVIDER=mock
LLM_API_KEY=
LLM_MODEL=

# Jira (optional)
JIRA_BASE_URL=
JIRA_EMAIL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=

# Optional image integration
AUTOHDR_API_KEY=

# Runtime
WORKFLOWPILOT_DEMO_MODE=true
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, Jira credentials, or provider
secrets in client-side code. Use the appropriate public-key naming
convention for the chosen framework.

## 18. Demo script

Aim for a clear two-to-three-minute walkthrough:

1.  **Problem (15 seconds):** AI workflows can fail silently, and teams
    need a way to inspect and recover them.
2.  **Start a run (20 seconds):** Launch the sample support-triage
    workflow.
3.  **Show a successful run (30 seconds):** Walk through classification,
    draft, validation, and persisted outputs.
4.  **Show a failure (40 seconds):** Run the case with an unsupported
    promise; show the validator catching it.
5.  **Show recovery (30 seconds):** Inspect the failure, mark it for
    review or retry it, and show the Jira issue or mock escalation.
6.  **Show reliability (20 seconds):** Open the evaluation view and show
    the number of test cases and pass rate.
7.  **Close (15 seconds):** Explain who would use it and what you plan
    to validate next.

## 19. Startup direction after the hackathon

Do not build a generic "AI platform for everyone" before validating a
use case. Use the hackathon prototype to test the core value
proposition:

> Teams should be able to trust AI automations because they can see what
> happened, verify the result, and recover when something goes wrong.

After the demo: 1. Interview 5--10 people who operate multi-step
workflows. 2. Ask what breaks, how they discover failures, how much time
recovery takes, and what tools they already use. 3. Pick one workflow
and one buyer persona. 4. Measure time saved, failure detection speed,
recovery time, and how often human review is needed. 5. Explore
integrations only when target users confirm they matter. 6. Do not
assume users will pay until you have tested willingness to pay.

Potential future positioning: **reliability and observability for
AI-powered business workflows**. Treat this as a hypothesis to validate,
not a settled market.

## 20. Instructions to the coding agent

Follow these instructions in order:

1.  **Inspect first.** Review the repository, package manager,
    framework, current features, and existing conventions. Do not
    overwrite working code or reinitialize the project without a clear
    reason.
2.  **Report the plan.** Summarize the architecture, implementation
    steps, unknowns, and any decisions needed from the user. Keep the
    plan brief and actionable.
3.  **Verify sponsor integrations.** Check official docs and the
    hackathon quick-start material provided to the team. Do not guess
    API endpoints or invent AutoHDR API access.
4.  **Build in small vertical slices.** Start with a working mock-mode
    workflow end to end, then add persistence, UI, validation, and
    integrations.
5.  **Test as you go.** Add unit tests for status transitions,
    validators, retry behavior, and evaluation calculations. Run tests
    and lint/type checks where available.
6.  **Keep the demo runnable.** After each major change, ensure the
    setup instructions still work from a clean environment.
7.  **Document trade-offs.** If a requested integration cannot be
    verified or credentials are missing, implement a mock adapter and
    clearly state what remains to be configured.
8.  **Avoid scope creep.** Prioritize the acceptance criteria. Do not
    build a general-purpose visual workflow editor or distributed
    execution platform for the hackathon unless all P0 items are
    complete.
9.  **At completion, report:** implemented features, files changed,
    setup commands, environment variables, tests run and results, known
    limitations, and the exact steps to reproduce the demo.
10. **Do not claim completion without evidence.** State what was
    actually run and tested.

### First task

Start by inspecting the repository and then propose a concise
implementation plan. Once the plan is clear, implement **P0 only**, in
the smallest coherent increments. Ask the user only when a decision
blocks progress; otherwise choose a sensible default and document it.
