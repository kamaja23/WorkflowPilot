# WorkflowPilot

WorkflowPilot turns fragile AI automations into observable workflows that can be inspected, evaluated, retried, and escalated when they fail. This MVP is a modular monolith (Next.js 15 + TypeScript) with a server-side runner, deterministic mock mode (no API keys required), Postgres persistence, validation, retry/review, and mock Jira escalation.

## Features (P0)
- **Observable runs**: Each run and step has status, timestamps, duration, inputs/outputs, validation results
- **Deterministic mock mode**: Works without external API keys; mock LLM and mock Jira adapter are clearly labeled
- **Validation**: Catches unsupported promises (e.g., refund promises) and other rule violations
- **Retry & review**: Retry failed steps (preserving attempt history in `step_attempts`), approve/reject `needs_review` steps
- **Mock escalation**: Creates simulated Jira issues with idempotency keys and records `integration_events`
- **Evaluation**: Committed dataset (>=12 cases), `npm run evaluate` reports pass/fail with sample count and time scope
- **UI**: Dashboard, Workflow detail, Run detail (timeline + expandables + actions), Reliability/Evaluations view with MOCK banner

## Quick Start (Local Docker)
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start Postgres + PostgREST**
   ```bash
   docker compose up -d
   ```
3. **Configure environment** (optional for mock mode)
   ```bash
   cp .env.example .env.local
   # Defaults work for local Docker (mock mode enabled)
   ```
4. **Run migrations** (auto-applied by Postgres init from `./migrations/`, or use `npm run setup`)
   ```bash
   npm run setup
   ```
5. **Start the dev server**
   ```bash
   npm run dev
   ```
6. **Open** http://localhost:3000

## Environment Variables
See `.env.example`. Key vars:
- `DATABASE_URL` - Postgres connection (default points to local Docker on 54322)
- `LLM_PROVIDER` - `mock` (default) or `openai`
- `JIRA_*` - Only needed for live Jira; mock adapter is used by default
- `WORKFLOWPILOT_DEMO_MODE` - Shows MOCK banner when `true` (default)

## Architecture
- **Frontend/Backend**: Next.js 15 App Router modular monolith. Route handlers in `src/app/api/*` host REST API and call the server-side runner in `src/lib/runner/runner.ts`.
- **Persistence**: Postgres 15 via `pg`. Schema in `migrations/` with `workflows`, `workflow_runs`, `workflow_steps`, `step_attempts`, `evaluation_results`, `integration_events`. RLS enabled (permissive for local demo).
- **Providers/Adapters**: Interface-based (`LlmProvider`, `IssueTracker`) with deterministic mocks. Real providers can be added without changing the runner.
- **Validation**: Deterministic rules in `src/lib/validation/` catch invalid outputs before marking success.
- **Runner**: Executes steps in order, persists status/timing/input/output/validation, creates attempt history on retry, records integration events.

## Testing & Evaluation
```bash
# Run unit tests
npm test

# Typecheck and lint
npm run typecheck
npm run lint

# Run evaluation script (shows sample count + pass/fail + time scope)
npm run evaluate
```

## Demo Script (2-3 minutes)
1. **Problem (15s)**: AI workflows fail silently - need observability and recoverability.
2. **Start a run (20s)**: From Dashboard, click "Run demo workflow" (success case).
3. **Show success (30s)**: Open the run detail, walk through classify → draft → validate → complete. Show persisted inputs/outputs and timings.
4. **Show failure (40s)**: Click "Run failure case" (refund request). Watch validate catch the unsupported promise, route to review/failed state.
5. **Show recovery (30s)**: In run detail, click Retry or Review (Approve/Reject). Show mock escalation creates a simulated Jira event (clearly labeled).
6. **Show reliability (20s)**: Go to Reliability view, show evaluation dataset count, pass rate, and time scope.
7. **Close (15s)**: Highlight mock mode, attempt history preservation, and extensibility via provider interfaces.

## Limitations
- **P0 only**: No Supabase Auth, no realtime subscriptions (polling used on run detail), no live LLM/Jira, no AutoHDR (no confirmed API access).
- **Single-user demo**: RLS is permissive for local development.
- **Mock by default**: Live integrations require explicit credentials and testing.
- **Simplified retry**: For MVP, retry path is demonstrated with attempt history preserved.

## Notes
- Workflow definitions are JSON config (never `eval`'d). All external calls are server-side.
- `step_attempts` table preserves full retry history as confirmed.
- Mock mode is clearly indicated by the banner and "mocked/simulated" labels in outputs.
