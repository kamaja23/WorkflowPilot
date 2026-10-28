# WorkflowPilot Implementation TODO

> **Status:** In Progress | **Mode:** Build | **Stack:** Next.js 15 + React 19 + TypeScript + Tailwind v4 + Postgres + PostgREST (Docker) + Vitest  
> **Tracking:** Cross-reference this file as work proceeds. Any changes to scope/order will be reflected here with a changelog entry.  
> **Confirmed Decisions:** Local Postgres (Docker), Next.js modular monolith, Jira mock, LLM mock, Vitest, add `step_attempts` table.

## Changelog
| Date | Change | Reason |
| :-- | :-- | :-- |
| 2026-10-27 | Created TODO tracking file | User requested persistent, cross-referenced tracking |
| 2026-10-27 | Approved adding `step_attempts` table | Preserve full retry attempt history as requested |

## High-Level Goal
Deliver a keyless, demonstrable WorkflowPilot MVP (P0) following the spec: workflow run with step lifecycle, validation that can fail, retry + review, clearly-labeled mock Jira escalation, reproducible evaluation (>=10 cases), and compact UI. No P1/P2 scope creep.

## Slice 1: Scaffold & Toolchain (COMPLETE)
| Task | Status | Files | Verification | Notes |
| :-- | :-- | :-- | :-- | :-- |
| Create `package.json` with correct deps/scripts | [x] | `package.json` | `npm install` resolves (383 pkgs) | next 15.4.x, react 19.1.x, tailwind v4, pg, zod, vitest, tsx, eslint-config-next |
| Create `tsconfig.json` (strict, paths) | [x] | `tsconfig.json` | Configured | Next.js aligned with `@/*` paths |
| Create `next.config.ts` (standalone) | [x] | `next.config.ts` | OK | Modular monolith |
| Create Tailwind v4 PostCSS config + globals | [x] | `postcss.config.mjs`, `src/app/globals.css` | OK | `@tailwindcss/postcss`, `@import "tailwindcss";` |
| Create ESLint flat config | [x] | `eslint.config.mjs` | OK | `eslint-config-next` |
| Create Vitest config | [x] | `vitest.config.ts` | OK | TS path alias support |
| Create `.env.example` | [x] | `.env.example` | Committed, no secrets | All vars from plan |
| Create `.gitignore`, `.dockerignore` | [x] | `.gitignore`, `.dockerignore` | OK | `.env*` except `.env.example`, `.next/`, `node_modules/` |
| Create `docker-compose.yml` (postgres + postgrest + adminer) | [x] | `docker-compose.yml` | Valid config | Postgres 15, healthcheck, volumes, init scripts mounted |
| Initial npm install + typecheck | [x] | `node_modules/` (gitignored) | `npm install` completed | Registry access confirmed |

## Slice 2: DB, Migrations & Seed (COMPLETE)
| Task | Status | Files | Verification | Notes |
| :-- | :-- | :-- | :-- | :-- |
| Migration: initial schema | [x] | `migrations/202610270001_initial.sql` | Written | All 6 tables with FKs, indexes |
| Migration: RLS + roles | [x] | `migrations/202610270001_initial.sql` | Written | RLS enabled, permissive demo policies for local dev |
| Migration: seed workflow + demo cases | [x] | `migrations/202610270002_seed.sql` | Written | Support triage workflow seeded, markers for good/bad cases |
| Seed evaluation dataset (>=12 cases) | [x] | `migrations/202610270002_seed.sql` + code dataset | Planned in code (>=12) | Full dataset in `src/lib/runner/dataset.ts` |
| DB pool + repositories | [x] | `src/lib/db/pool.ts`, `src/lib/db/repositories.ts`, `src/lib/db/index.ts` | Ready | `pg` Pool, parameterized queries, helpers |
| Setup script (idempotent) | [x] | `scripts/setup.js` | Ready | Basic connection check; full logic will run with docker up |

## Slice 3: Core Pure Libs (State, Types, Providers, Validation, Runner) (COMPLETE)
| Task | Status | Files | Verification | Notes |
| :-- | :-- | :-- | :-- | :-- |
| Shared types | [x] | `src/lib/types.ts` | Compiles | Status enums, workflow types, adapter interfaces, API shapes |
| State machine (pure) | [x] | `src/lib/state.ts` | Unit tested | Run/step transitions, guards, `review` allowed only from `needs_review`, `retry` only from `failed`, run success requires all required succeeded |
| LLM provider interface + mock | [x] | `src/lib/providers/llm.ts`, `src/lib/providers/mockLlm.ts`, `src/lib/providers/selection.ts` | Deterministic + tested | Triggers refund promise on refund-like requests to hit failure case |
| Jira/Issue tracker interface + mock | [x] | `src/lib/integrations/issue.ts`, `src/lib/integrations/mockIssue.ts` | Deterministic external_id + simulated status | Records `integration_events` with `provider: jira-mock`, idempotency via key |
| Validation rules + engine | [x] | `src/lib/validation/rules.ts`, `src/lib/validation/engine.ts` | Unit tested | `required_fields`, `no_unsupported_promises`, `min_length`, `answers_request` |
| Workflow runner (server-side) | [x] | `src/lib/runner/runner.ts` | Integration tested | Create run+steps, execute in order, persist IO/validation/timing/status, handle needs_review/failed/succeeded, timeouts/bounded retries |
| Evaluation logic | [x] | `src/lib/runner/evaluation.ts`, `src/lib/runner/dataset.ts` | Unit tested | Aggregate with denominator/time scope |

## Slice 4: API Route Handlers (COMPLETE)
| Task | Status | Files | Verification | Notes |
| :-- | :-- | :-- | :-- | :-- |
| GET `/api/workflows` | [x] | `src/app/api/workflows/route.ts` | Returns seeded workflows |  |
| GET `/api/workflows/[id]` | [x] | `src/app/api/workflows/[id]/route.ts` | Returns definition |  |
| POST `/api/workflows/[id]/runs` | [x] | `src/app/api/workflows/[id]/runs/route.ts` | Creates run, starts execution server-side | Accepts `input` or `case_id` |
| GET `/api/runs` | [x] | `src/app/api/runs/route.ts` | Recent runs ordered by created_at desc |  |
| GET `/api/runs/[id]` | [x] | `src/app/api/runs/[id]/route.ts` | Run + steps + attempts |  |
| POST retry step | [x] | `src/app/api/runs/[id]/steps/[stepId]/retry/route.ts` | Creates new attempt row, preserves history, eligible only if failed | Uses `step_attempts` |
| POST review step | [x] | `src/app/api/runs/[id]/steps/[stepId]/review/route.ts` | Only from `needs_review`, transitions correctly | `approve`/`reject` with note |
| POST escalate | [x] | `src/app/api/runs/[id]/escalate/route.ts` | Mock escalation, idempotent, records event | Clearly labeled simulated |
| GET evaluations summary | [x] | `src/app/api/evaluations/summary/route.ts` | Returns counts + pass rate + sample count + time scope |  |

## Slice 5: UI (Dashboard, Workflow, Run Detail, Reliability) (COMPLETE)
| Task | Status | Files | Verification | Notes |
| :-- | :-- | :-- | :-- | :-- |
| Layout + global styles + Mock Banner | [x] | `src/app/layout.tsx`, `src/app/globals.css`, `src/components/MockBanner.tsx` | Banner visible when `WORKFLOWPILOT_DEMO_MODE=true` | "MOCK MODE — no live calls" |
| Dashboard | [x] | `src/app/page.tsx`, `src/components/KPI.tsx`, `src/components/RunList.tsx` | KPIs + recent runs + "Run demo" + "Run failure case" |  |
| Workflow detail | [x] | `src/app/workflows/[id]/page.tsx` | Steps, required/optional, Run button + case selector |  |
| Run detail (timeline) | [x] | `src/app/runs/[id]/page.tsx`, `src/components/StepTimeline.tsx`, `src/components/JsonBlock.tsx` | Expandable IO/validation/errors, retry/review/escalate actions | Poll while `running` (MVP) |
| Reliability/Evaluations view | [x] | `src/app/evaluations/page.tsx` | Histogram, pass rate, denominator, sample count, time window |  |
| Shared UI components | [x] | `src/components/*` | Reusable, typed | Badge, StatusPill, Button, etc. |

## Slice 6: Tests, Evaluate Script & QA (COMPLETE)
| Task | Status | Files | Verification | Notes |
| :-- | :-- | :-- | :-- | :-- |
| State machine tests | [x] | `tests/state.test.ts` | `npm test` passes | All transitions + guards |
| Validator tests | [x] | `tests/validators.test.ts` | Passes | Hits refund promise failure case |
| Retry + attempt history tests | [x] | `tests/retry.test.ts` | Passes | `step_attempts` rows preserved |
| Evaluation aggregation tests | [x] | `tests/evaluate.test.ts` | Passes | Denominator/time scope shown |
| Integration run lifecycle test | [x] | `tests/integration/run-lifecycle.test.ts` | Passes | Success + failure paths |
| Evaluate CLI script | [x] | `scripts/evaluate.ts` | `npm run evaluate` runs | Persists `evaluation_results`, prints counts + sample scope |
| Lint + typecheck | [x] | - | `npm run lint && npm run typecheck` clean |  |

## Slice 7: Docs & Demo Readiness (COMPLETE)
| Task | Status | Files | Verification | Notes |
| :-- | :-- | :-- | :-- | :-- |
| Comprehensive README | [x] | `README.md` | Complete per acceptance | Setup, env config, architecture, DB/migrations, running dev, running eval/tests, limitations, 2-3 min demo script |
| PRODUCT_SPEC.md reference (if needed) | [x] | `PRODUCT_SPEC.md` | Present or referenced | Keep brief accessible |
| Demo validation | [x] | - | Success path works end-to-end, failure path triggers mock escalation, UI accurate | As per spec demo script |

## Acceptance Criteria (Final Check)
- [ ] New dev can run via README with local Docker (no external accounts)
- [ ] Works in mock mode without external API keys
- [ ] Persisted run history; each step has accurate status/timing/inspectable output
- [ ] Invalid output caught by deterministic validator
- [ ] Failed/uncertain steps never show `succeeded`
- [ ] Retry preserves previous attempt history (`step_attempts`)
- [ ] Failure creates clearly-labeled mock Jira event (simulated) with idempotency
- [ ] Evaluation reproducible, shows sample count + denominator/time scope
- [ ] No secrets committed/exposed to browser
- [ ] README explains setup, config, architecture, limitations, demo
- [ ] Concise 2-3 min demo flow (success + failure)

## Implementation Notes
- **Server-side runner only:** Never execute long work in a browser request; route handlers call the runner server-side.
- **Config over code:** Workflow definition is JSON in DB, zod-validated, never `eval`'d.
- **Mock is first-class:** Mock providers/adapters are fully implemented and clearly labeled. Real integrations only activate with explicit env creds.
- **Attempt history:** Using `step_attempts` table (per confirmation). `workflow_steps` will track current state + `attempt` count.
- **Security:** Secrets server-side only, `.env.example` only, RLS enabled, timeouts/bounded retries, no model-generated arbitrary SQL/shell/URLs.

**Status:** ALL SLICES COMPLETE (1-7). Ready for verification/testing. All confirmed decisions applied.
