# System Architecture Document (SAD) — MVP
## Recruitment Assistant — AI-Powered Candidate Sourcing Tool

**Project:** Recruitment Assistant
**Persona:** @system.arch
**Phase:** 1 — Define
**Date:** 2026-05-31
**Version:** 1.0 (MVP)
**PRD Reference:** `project-context/1.define/PRD.md` v1.0
**MRD Reference:** `project-context/1.define/MRD.md` v1.1
**Runtime Target:** `AAMAD_TARGET_RUNTIME=crewai`
**SAD Variant:** MVP (lean views; complex NFRs and non-essential components deferred)

---

## Table of Contents

1. Stakeholders and Concerns
2. MVP Scope Boundary — Inclusions and Explicit Exclusions
3. Architectural Principles and Decisions (ADRs)
4. Logical View — System Component Architecture
5. Multi-Agent System Specification (CrewAI)
6. Frontend Architecture
7. Backend and API Layer Architecture
8. Deployment Architecture
9. Data Flow and Integration Architecture
10. Performance and Scalability
11. Security Architecture
12. Testing and Quality Assurance
13. MVP Launch and Rollout
14. Future Work (Deferred Capabilities)
15. Sources
16. Assumptions
17. Open Questions
18. Audit

---

## 1. Stakeholders and Concerns

This section identifies all parties with a stake in the system and documents their primary architectural concerns. This SAD is aligned to ISO/IEC/IEEE 42010 stakeholder-concern analysis adapted for MVP scope.

### 1.1 Stakeholders

| Stakeholder | Role | Primary Concern |
|---|---|---|
| Hiring Manager | Sole end user; submits JDs; reviews shortlists | Time-to-shortlist < 15 min; shortlist quality (>70% acceptance rate); explainable candidate scores; tool reliability |
| Recruiting Team | Output consumer; receives Markdown shortlist; no direct system interaction | Shortlist format immediately usable; no reformatting required; clear per-candidate rationale |
| Technical Operator | Handles environment setup, secret provisioning, maintenance | Straightforward setup; clear `.env.example`; observable failures; minimal maintenance surface |
| AAMAD Build Personas | @backend.eng, @frontend.eng, @integration.eng, @qa.eng, @project.mgr | Unambiguous component boundaries; traceable requirements; testable module interfaces |
| System Architect (@system.arch) | Authors and owns this SAD | Architectural consistency; traceability to PRD/MRD; decision rationale captured |

### 1.2 Architectural Concerns by Viewpoint

| Concern | Stakeholders Affected | Addressed In |
|---|---|---|
| End-to-end latency (JD → shortlist < 15 min) | Hiring Manager | Section 10 |
| Shortlist scoring explainability | Hiring Manager, Recruiting Team | Section 5 (Evaluation Agent), Section 6 (Shortlist View) |
| LinkedIn session credential safety | Hiring Manager, Operator | Section 11 |
| Selenium fragility against LinkedIn UI changes | Operator, Hiring Manager | Section 5, Section 11, Section 12 |
| LinkedIn ToS risk from browser automation | Hiring Manager, Operator | ADR-02, Section 11 |
| Deterministic, reproducible crew runs | AAMAD Build Personas | ADR-05, Section 5 |
| Candidate PII non-persistence | Operator, Hiring Manager | Section 11 |
| Single-user, no authentication at MVP | Hiring Manager, Operator | ADR-06, Section 8 |
| Modularity for future extension | AAMAD Build Personas | Section 4, Section 14 |
| Secrets never embedded in code or artifacts | All | Section 11, ADR-04 |

---

## 2. MVP Scope Boundary — Inclusions and Explicit Exclusions

### 2.1 MVP Inclusions

The following capabilities are in scope for this SAD and must be delivered in Phase 2:

- Four-agent sequential CrewAI crew: JD Parser, LinkedIn Sourcing, Evaluation/Scoring, Shortlist Formatting
- Custom `linkedin_selenium_tool` (Selenium WebDriver + `li_at` cookie authentication)
- Next.js 14+ frontend with three views: Input, Processing, Shortlist
- assistant-ui streaming interface for per-agent progress
- FastAPI Python backend bridging the web UI to the CrewAI service
- Server-Sent Events (SSE) streaming of per-agent progress events to the frontend
- Structured Markdown shortlist export
- Run logging to local files (no database)
- Environment variable secrets management (`.env`, `.env.example`)
- Desktop-optimized responsive layout

### 2.2 Explicit Exclusions (Deferred to Future Work)

The following are explicitly out of MVP scope. They are documented in Section 14 with deferral rationale.

| Excluded Capability | Deferral Reason |
|---|---|
| LinkedIn Recruiter API (official) | Credentials not obtainable at MVP |
| ATS integration (Greenhouse, Lever, Workday) | Requires ATS API credentials and data mapping; future P2 |
| Outreach draft generation | Out of scope per user decision; recruiting team handles outreach |
| Multi-user access and role management | Single-user MVP; multi-user requires auth and session isolation |
| Candidate talent pool / persistent database | PII retention concerns; data handling policy not yet defined |
| Batch multi-role sourcing | Single role per run is sufficient; queue management deferred |
| Diversity signal analysis | Requires legal review before implementation |
| PDF export | Markdown is sufficient; PDF rendering dependency not justified |
| Mobile-optimized UI | Hiring manager uses desktop; mobile deferred |
| Enterprise SSO / authentication layer | Single user, local/private-cloud deployment; no auth required at MVP |
| High availability / multi-region deployment | Single-user internal tool; HA not required at MVP |
| PostgreSQL or persistent relational database | SQLite or file-based logging sufficient; DB migration deferred |
| Candidate PII persistence beyond crew run session | Data handling policy required first |

### 2.3 MVP Assumptions

See Section 16 (Assumptions) for the full list. Key assumptions that bound this architecture:

1. One active user at a time; one concurrent crew run at a time.
2. Anthropic Enterprise API key is available; model is `claude-sonnet-4-6`.
3. LinkedIn `li_at` cookie is extractable by the hiring manager from their active browser session.
4. Deployment is local or private cloud VM; no public-facing URL without additional basic auth.
5. No organizational data handling policy constraints have been specified for MVP scope.

---

## 3. Architectural Principles and Decisions (ADRs)

### 3.1 MVP Architectural Principles

**P1 — Minimal viable surface.** Implement only what is required to deliver the JD-to-shortlist workflow end to end. No speculative components. Every component exists to serve a named user story in the PRD.

**P2 — Determinism and reproducibility.** Crew runs must produce consistent outputs for the same input. Memory disabled globally. Temperature pinned low (0.1–0.2). Sequential process mode enforced.

**P3 — Single responsibility per agent.** Each of the four agents owns one discrete step in the pipeline. No agent delegates to another. Tool surfaces are minimized to exactly what each agent requires.

**P4 — Secrets never in artifacts.** `ANTHROPIC_API_KEY` and `LI_AT` flow exclusively through environment variables. Neither value appears in logs, config YAMLs, trace outputs, or any file artifact at any time.

**P5 — Fail explicitly and visibly.** On any agent failure after retries are exhausted, the system halts with a structured error, writes a Diagnostic entry, and surfaces a plain-language error message in the UI. Partial results are returned rather than silent failures where possible.

**P6 — Linear task dependency chain enforced by design.** Task.context chaining in CrewAI ensures each agent receives only its predecessor's output. No agent can run before its predecessor completes. This is not enforced by process orchestration logic in application code — it is declared in the task graph.

**P7 — Replaceable tool surface for highest-risk component.** The `linkedin_selenium_tool` is the only component that touches the browser session and LinkedIn. It is isolated behind a well-defined JSON-serializable tool contract. Replacing it with a LinkedIn Recruiter API client in a future milestone requires no changes to the agent definitions, task graph, or crew orchestration.

### 3.2 Architectural Decision Records

**ADR-01: Sequential vs. Hierarchical CrewAI Process Mode**

- Decision: Sequential process mode.
- Rationale: The four-agent pipeline (parse → source → evaluate → format) is a strict linear dependency chain. Each step requires the complete output of its predecessor. Sequential mode enforces this deterministically via `Task.context` chaining. Hierarchical mode introduces a manager agent and delegation overhead that is not justified for a four-step linear workflow. Hierarchical mode also reduces reproducibility by introducing non-deterministic routing decisions. Sequential mode is explicitly preferred for MVP builds under the active CrewAI adapter rules.
- Consequences: All agents execute in fixed order. No parallel agent execution at MVP. If a step fails, subsequent steps do not run.
- PRD Reference: PRD Section 3 (Runtime Specifications), PRD Section 3 (Crew Composition).
- Future Work: Hierarchical mode may be justified if parallel sourcing lanes (multiple LinkedIn search strategies) are added in a future milestone.

**ADR-02: Selenium + `li_at` Cookie vs. Official LinkedIn Recruiter API**

- Decision: Selenium WebDriver with `li_at` session cookie browser automation.
- Rationale: Official LinkedIn Recruiter API credentials are not available and cannot be obtained at MVP. The Selenium approach using the `li_at` cookie is the only viable automated sourcing path. This approach violates LinkedIn's Terms of Service and carries account suspension risk. This risk is accepted for MVP, documented in the MRD Risk Assessment, and must be disclosed to the hiring manager before first use. The tool contract is designed so that the Selenium implementation is replaceable with an API client without restructuring the crew.
- Consequences: Sourcing agent is the highest-maintenance component. LinkedIn UI changes can break DOM selectors without warning. Bot detection mitigation (inter-request delays, session hygiene) must be self-enforced in the tool. `li_at` cookie expiry requires periodic manual refresh by the hiring manager.
- PRD Reference: PRD Section 3 (LinkedIn Selenium Tool Specification), PRD P1-4 (ToS Risk Acknowledgment).
- MRD Reference: MRD Risk Assessment (High Risk: Selenium/ToS).
- Migration Path: ADR superseded when official LinkedIn Recruiter API credentials are procured (PRD P2-7).

**ADR-03: Next.js 14+ with assistant-ui vs. Simpler Flask/Jinja or Vanilla HTML UI**

- Decision: Next.js 14+ with App Router, TypeScript, Tailwind CSS, shadcn/ui, Zustand, and assistant-ui.
- Rationale: The PRD specifies this stack explicitly (PRD Section 3, Integration Requirements note re: frontend framework). assistant-ui provides a production-grade streaming LLM interface with built-in SSE/WebSocket handling, which is required for the Processing Status view (per-agent progress streaming). The App Router pattern (React Server Components + Client Components) provides a clean boundary between static layout and dynamic interactive views. shadcn/ui components provide accessible, themeable primitives without a full component library dependency. The alternative (vanilla HTML/JS or Flask/Jinja) would require building streaming event handling and state management from scratch, producing a more fragile result for comparable development effort.
- Consequences: Introduces a Node.js/TypeScript build surface alongside the Python CrewAI service. Two language runtimes must be managed. The frontend runs as a Next.js app; the CrewAI orchestration runs as a Python service. An API bridge layer (Next.js API routes proxying to the Python FastAPI service) is required.
- PRD Reference: PRD Section 3 (Integration Requirements — Frontend), PRD Section 6 (UX Design).

**ADR-04: No Persistent Database at MVP**

- Decision: No database. Run logs written to local JSON files. Shortlist exported as Markdown file. No candidate PII retained server-side.
- Rationale: The MVP serves a single user running at most a few sourcing runs per week. No cross-run query, history aggregation, or search is required at MVP. Candidate PII persistence raises data handling concerns not yet resolved by organizational policy (MRD Open Question #6, PRD Open Question #3). File-based logging is sufficient for the operational metrics defined in PRD Section 7. The output directory (`output/`) and log directory (`logs/`) are local filesystem paths, gitignored.
- Consequences: Run history (P1-1) is limited to what can be parsed from local log files. No server-side state between browser sessions — the shortlist is lost if the server restarts or the page is refreshed after a run. No disaster recovery for output artifacts.
- PRD Reference: PRD Section 3 (Infrastructure Specifications — File Storage), PRD P0-5 (Candidate Removal — undo via page refresh).
- Future Work: SQLite-backed run history, then PostgreSQL migration path, when multi-run analytics or multi-user access is introduced.

**ADR-05: Memory=False for All Agents**

- Decision: `memory=False` for all four CrewAI agents.
- Rationale: Each crew run is fully stateless — job description in, shortlist out. There is no beneficial cross-run state for any agent. Enabling memory introduces a persistent storage dependency (`CREWAI_STORAGE_DIR`), increases the risk of cross-run state bleed, and reduces reproducibility. The AAMAD CrewAI adapter rules default memory to False for reproducibility. If `memory=True` is ever justified in a future milestone, the adapter rules require constraining scope to the current epic, redacting secrets, and persisting logs to `project-context/2.build/logs`.
- Consequences: Each crew run starts from a clean state. The evaluation agent cannot learn from prior runs without memory. Scoring consistency is a property of the LLM + low temperature, not of persistent memory.
- PRD Reference: PRD Section 3 (Runtime Specifications — Memory).

**ADR-06: No Authentication at MVP**

- Decision: No authentication layer for the MVP web UI.
- Rationale: There is exactly one user (the hiring manager) and one deployment target (local machine or private cloud VM accessible only to the hiring manager). An authentication layer adds complexity with no security benefit in this access model. If the system is ever deployed to any network-accessible endpoint beyond the hiring manager's private VM, basic HTTP authentication must be added before that deployment — this is a hard gate documented in the PRD.
- Consequences: Any process with access to the server's port can submit a crew run. This is acceptable for local deployment only. The constraint is: if the deployment scope changes, authentication must be added before that change goes live.
- PRD Reference: PRD Section 5 (Security and Compliance — Access Control).
- Future Work: NextAuth.js integration (PRD P2-3 prerequisite) when multi-user access is introduced.

**ADR-07: FastAPI as the Python Backend Service**

- Decision: FastAPI (Python) as the backend service layer bridging the Next.js frontend to the CrewAI crew.
- Rationale: FastAPI's async support is well-suited for SSE streaming of per-agent progress events. Its automatic OpenAPI schema generation simplifies integration testing. The alternative (Flask) requires additional async extensions for streaming and lacks automatic schema generation. FastAPI is the recommended choice over Flask per PRD Open Question #5 analysis. CrewAI is a Python framework; a Python backend service is the natural host.
- Consequences: Two services run at MVP: the Next.js frontend (Node.js) and the FastAPI backend (Python). Docker Compose is the deployment mechanism that manages both processes with shared environment.

**ADR-08: Server-Sent Events (SSE) for Progress Streaming**

- Decision: Server-Sent Events (SSE) over WebSockets for per-agent progress streaming from backend to frontend.
- Rationale: Per-agent progress updates are unidirectional (server to client). SSE is simpler to implement and operate than WebSockets for unidirectional streaming — no upgrade handshake, no bidirectional protocol, native HTTP/1.1 and HTTP/2 support. FastAPI has native SSE support (`EventSourceResponse`). assistant-ui has native SSE consumption support. WebSockets are not required for this use case and add operational complexity without benefit.
- Consequences: The status polling endpoint (`GET /run/{run_id}/status`) returns SSE events, not a JSON snapshot. The frontend uses EventSource for consumption. Cancel functionality requires a separate `POST /run/{run_id}/cancel` endpoint (SSE is unidirectional, so the cancel signal cannot travel over the SSE channel).

---

## 4. Logical View — System Component Architecture

### 4.1 Primary Presentation

The system consists of three logical tiers: a Next.js frontend, a FastAPI Python backend, and the CrewAI agent crew with its tool dependencies.

```
+--------------------------------------------------+
|              HIRING MANAGER BROWSER               |
|  Next.js 14+ Frontend (TypeScript, App Router)   |
|  +-----------+  +------------+  +-------------+  |
|  | Input View |  | Processing |  | Shortlist   |  |
|  | (JD Form)  |  | View (SSE) |  | View (Cards)|  |
|  +-----------+  +------------+  +-------------+  |
|  Zustand State | assistant-ui | shadcn/ui         |
+---------------------+----------------------------+
                       | HTTP / SSE
                       v
+--------------------------------------------------+
|         FastAPI Python Backend Service            |
|  POST /run          GET /run/{id}/status (SSE)   |
|  GET /run/{id}/shortlist                         |
|  POST /run/{id}/remove/{idx}                     |
|  GET /run/{id}/export                            |
|  POST /run/{id}/cancel                           |
|  Run State Manager | SSE Event Emitter           |
+---------------------+----------------------------+
                       | Python function call
                       v
+--------------------------------------------------+
|           CrewAI Sequential Crew                  |
|  config/agents.yaml    config/tasks.yaml          |
|                                                  |
|  [1] JD Parser Agent                             |
|      Task: parse_jd → output/parse_jd.json       |
|                  |                               |
|  [2] LinkedIn Sourcing Agent                     |
|      Task: source_candidates                     |
|      Tool: linkedin_selenium_tool                |
|      → output/source_candidates.json            |
|                  |                               |
|  [3] Evaluation/Scoring Agent                    |
|      Task: evaluate_candidates                   |
|      Guardrail: validate_scored_candidate_schema |
|      → output/evaluate_candidates.json          |
|                  |                               |
|  [4] Shortlist Formatting Agent                  |
|      Task: format_shortlist                      |
|      Guardrail: validate_shortlist_headings      |
|      Tool: file_write_tool                       |
|      → output/shortlist.md                      |
+---------------------+----------------------------+
          |                         |
          v                         v
+------------------+    +---------------------+
| Selenium/Chrome  |    | Anthropic Claude API |
| linkedin.com     |    | api.anthropic.com    |
| (li_at cookie)   |    | claude-sonnet-4-6    |
+------------------+    +---------------------+
```

### 4.2 Element Catalog

| Component | Technology | Responsibility | Inputs | Outputs |
|---|---|---|---|---|
| Next.js Frontend | Next.js 14+, TypeScript, Tailwind, shadcn/ui, Zustand, assistant-ui | Renders three views; manages run state client-side; streams SSE progress; exports shortlist | User JD input, SSE events, shortlist JSON | POST /run, SSE subscription, shortlist.md download |
| FastAPI Backend | Python, FastAPI, python-dotenv, uvicorn | Exposes HTTP API; manages run lifecycle; bridges UI to CrewAI; emits SSE events; writes run logs | HTTP requests, crew run events | SSE event stream, JSON responses, run log files |
| CrewAI Crew | Python, CrewAI v0.80+, crew.py | Orchestrates four-agent sequential execution; task context chaining; guardrail enforcement | JD text, max_results, filter overrides | output/*.json, output/shortlist.md |
| JD Parser Agent | Claude via CrewAI | Parses raw JD text to structured criteria JSON | JD text | parse_jd.json |
| LinkedIn Sourcing Agent | Claude + linkedin_selenium_tool via CrewAI | Searches LinkedIn; extracts candidate profiles | parse_jd.json + max_results | source_candidates.json |
| linkedin_selenium_tool | Python, Selenium, WebDriver Manager | Browser automation; li_at cookie auth; DOM field extraction | Structured search criteria, LI_AT env var | JSON array of candidate profiles |
| Evaluation/Scoring Agent | Claude via CrewAI | Scores each candidate against JD criteria; produces per-criterion rationale | parse_jd.json + source_candidates.json | evaluate_candidates.json |
| Shortlist Formatting Agent | Claude + file_write_tool via CrewAI | Assembles ranked Markdown shortlist | evaluate_candidates.json | output/shortlist.md |
| guardrails.py | Python | Validates scored candidate schema; validates shortlist headings; writes Diagnostic on failure | Agent output JSON/Markdown | Pass/fail result; Diagnostic entry on failure |
| Run Logger | Python (JSON) | Writes structured run log entry after each crew run | Run metadata (run_id, JD hash, counts, duration, errors) | logs/{run_id}.json |
| output/ directory | Local filesystem | Stores per-run intermediate JSON artifacts and final shortlist.md | CrewAI task outputs | parse_jd.json, source_candidates.json, evaluate_candidates.json, shortlist.md |

### 4.3 Rationale

The three-tier separation (browser frontend / FastAPI service / CrewAI crew) provides clean boundaries for the AAMAD build personas: @frontend.eng owns the Next.js tier, @backend.eng owns the CrewAI crew and tool, @integration.eng owns the FastAPI API layer and the wiring between tiers. Each tier is independently testable and replaceable. The FastAPI service is the sole point of coordination — it holds run state in memory for the duration of a run and emits SSE events as the crew progresses.

The choice to keep intermediate JSON artifacts on the local filesystem (`output/`) provides a simple debugging surface: any build persona can inspect the output of each task without running the full crew. These files are gitignored and treated as ephemeral.

---

## 5. Multi-Agent System Specification (CrewAI)

### 5.1 Crew Configuration

| Parameter | Value | Rationale |
|---|---|---|
| Process mode | Sequential | ADR-01: deterministic linear task dependency chain |
| Memory | False (all agents) | ADR-05: reproducibility; stateless runs |
| Verbose | True (development); configurable via env var for production | Lifecycle events captured for Trace Log |
| max_rpm | Set at crew level (recommended: 10 RPM for MVP) | Anthropic token budget stability; tunable |
| Config externalization | config/agents.yaml + config/tasks.yaml | AAMAD CrewAI adapter rule: all definitions externalized |
| LLM | claude-sonnet-4-6 (pinned in config/agents.yaml) | PRD Section 3: model pinning for behavior stability |
| Temperature | 0.2 (JD Parser); 0.1 (Sourcing, Evaluation, Formatting) | Low temperature for deterministic scoring; slightly higher for JD parsing to handle diverse JD writing styles |

### 5.2 Agent Definitions (Summary — Full Definitions in config/agents.yaml)

**Agent 1: JD Parser (`jd_parser`)**

| Field | Value |
|---|---|
| Role | Job Description Analyst |
| Tools | None (pure LLM reasoning) |
| Memory | False |
| allow_delegation | False |
| LLM | claude-sonnet-4-6 |
| Temperature | 0.2 |
| max_iter | 5 |
| Purpose | Extract structured search criteria (required skills, preferred skills, experience range, seniority level, location, role keywords, must-have and disqualifying conditions) from raw JD text |

**Agent 2: LinkedIn Sourcer (`linkedin_sourcer`)**

| Field | Value |
|---|---|
| Role | LinkedIn Candidate Sourcer |
| Tools | linkedin_selenium_tool (exclusive; not exposed to any other agent) |
| Memory | False |
| allow_delegation | False |
| LLM | claude-sonnet-4-6 |
| Temperature | 0.1 |
| max_iter | 10 |
| Purpose | Execute LinkedIn Recruiter search; extract candidate profiles up to max_results ceiling |

**Agent 3: Evaluator (`evaluator`)**

| Field | Value |
|---|---|
| Role | Candidate Evaluation Specialist |
| Tools | None (pure LLM reasoning on task context) |
| Memory | False |
| allow_delegation | False |
| LLM | claude-sonnet-4-6 |
| Temperature | 0.1 |
| max_iter | 8 |
| Purpose | Score each candidate (0–100) against JD criteria; produce per-criterion pass/fail rationale; apply disqualification rules; flag data_insufficient candidates |

**Agent 4: Formatter (`formatter`)**

| Field | Value |
|---|---|
| Role | Shortlist Document Author |
| Tools | file_write_tool |
| Memory | False |
| allow_delegation | False |
| LLM | claude-sonnet-4-6 |
| Temperature | 0.1 |
| max_iter | 5 |
| Purpose | Assemble ranked Markdown shortlist; enforce required heading structure; write output/shortlist.md |

### 5.3 Task Definitions (Summary — Full Definitions in config/tasks.yaml)

| Task ID | Agent | Context From | Output File | max_iter | max_execution_time | Guardrail |
|---|---|---|---|---|---|---|
| parse_jd | jd_parser | (none — receives raw JD from crew kickoff input) | output/parse_jd.json | 5 | 120s | None |
| source_candidates | linkedin_sourcer | parse_jd | output/source_candidates.json | 10 | 600s | None |
| evaluate_candidates | evaluator | parse_jd, source_candidates | output/evaluate_candidates.json | 8 | 300s | validate_scored_candidate_schema |
| format_shortlist | formatter | evaluate_candidates | output/shortlist.md | 5 | 60s | validate_shortlist_headings |

**Task context chaining:** Each task's `context` field lists predecessor task IDs. CrewAI resolves these at runtime and passes the predecessor's `output` as context to the next task. This is declared in `config/tasks.yaml`; no application code orchestration is required.

### 5.4 Guardrail Specifications

**Guardrail: validate_scored_candidate_schema**

Applied to: `evaluate_candidates` task output.

Validation rules:
- Output is a valid JSON array.
- Each element contains `full_name` (string), `match_score` (integer 0–100 or null with `data_insufficient: true`), and `score_rationale` (array with at least one entry).
- Each `score_rationale` entry contains `criterion_name`, `result` (one of: pass, partial, fail, cannot_assess), and `evidence` (non-empty string).
- Candidates with `disqualifying_conditions` triggered must have `match_score = 0`.
- Candidates with `must_have_conditions` not met must have `match_score <= 30`.

On failure: write Diagnostic entry to `logs/{run_id}_diagnostic.json`; halt crew run; surface error in UI.

**Guardrail: validate_shortlist_headings**

Applied to: `format_shortlist` task output.

Validation rules:
- Output file contains all required Markdown headings: `# Candidate Shortlist:`, `## Ranked Candidates`, `## Candidates with Insufficient Profile Data`, `## Notes`.
- At least one `### [Rank]. [Name] — Score:` heading present if `shortlisted_count > 0`.
- `#### Match Rationale` section present for each ranked candidate.

On failure: write Diagnostic entry; halt; surface error in UI.

### 5.5 Scoring Rubric (Embedded in evaluate_candidates Task Instructions)

| Score Range | Interpretation |
|---|---|
| 85–100 | Strong match — meets all required criteria, most preferred criteria |
| 70–84 | Good match — meets all required criteria, some preferred criteria |
| 55–69 | Partial match — meets most required criteria, notable gaps |
| 30–54 | Weak match — meets some required criteria, significant gaps |
| 1–29 | Poor match — meets few criteria |
| 0 | Auto-disqualified — disqualifying condition present |
| null | Data insufficient — fewer than 3 criteria assessable |

Scoring weights: required_skills criteria carry 2x weight of preferred_skills criteria.

### 5.6 CrewAI Execution Controls (Per Adapter Rules)

| Control | Value | Justification |
|---|---|---|
| max_iter (all tasks) | <= 12 (per-task values in Section 5.3) | AAMAD CrewAI adapter rule: max_iter <= 12 for MVP |
| max_execution_time (per task) | See Section 5.3 | Sourcing is browser-automation-bound; generous timeout (600s); others are LLM-bound |
| max_retry_limit | >= 2 (all tasks) | AAMAD CrewAI adapter rule; sourcing retries on Selenium exceptions |
| max_rpm | 10 (crew level) | Anthropic API token budget stability; tunable |
| Task.id | Required for all tasks | AAMAD adapter rule: required for traceability |
| output_file | Required for all tasks | Explicit artifact path; enables debugging and audit |

---

## 6. Frontend Architecture

### 6.1 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 14+ (App Router) |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 3+ |
| Component library | shadcn/ui | Latest compatible |
| LLM/streaming interface | assistant-ui | Latest compatible |
| Client state management | Zustand | 4+ |
| HTTP client | Native fetch / EventSource | Browser-native |

### 6.2 App Router Directory Structure

```
src/
  app/
    layout.tsx              # Root layout: fonts, global styles, providers
    page.tsx                # Root page — renders InputView by default
    api/
      run/
        route.ts            # POST /api/run — proxies to FastAPI POST /run
      run/[runId]/
        status/
          route.ts          # GET /api/run/[runId]/status — SSE proxy to FastAPI
        shortlist/
          route.ts          # GET /api/run/[runId]/shortlist
        remove/[idx]/
          route.ts          # POST /api/run/[runId]/remove/[idx]
        export/
          route.ts          # GET /api/run/[runId]/export
        cancel/
          route.ts          # POST /api/run/[runId]/cancel
  components/
    views/
      InputView.tsx         # View 1: JD text area + advanced options + submit
      ProcessingView.tsx    # View 2: four-stage progress indicator + SSE consumer
      ShortlistView.tsx     # View 3: ranked candidate cards + export
    input/
      JobDescriptionForm.tsx
      AdvancedOptions.tsx
      TosDisclosure.tsx
    processing/
      StageIndicator.tsx    # Individual stage tile (pending/active/done/error)
      ElapsedTimer.tsx
    shortlist/
      RunSummaryHeader.tsx
      CandidateCard.tsx     # Expandable rationale table + remove button
      ScoreBadge.tsx        # Color-coded score badge
      InsufficientDataSection.tsx
      NotesTextArea.tsx
      ExportButton.tsx
    common/
      FutureCapabilitiesNote.tsx  # Labeled future-work notice per AAMAD epics-index rule
      ErrorBanner.tsx
  store/
    runStore.ts             # Zustand store: run state, view transitions, shortlist mutations
  lib/
    api.ts                  # Typed API client functions (wraps fetch calls to /api/*)
    sse.ts                  # EventSource wrapper for SSE consumption
    types.ts                # Shared TypeScript types (RunState, Candidate, ScoreRationale, etc.)
```

### 6.3 View Architecture

**View 1: Input View (`InputView.tsx`)**

State: idle (no active run). Rendered by Zustand `runStore` when `run.status === 'idle'`.

Components:
- `JobDescriptionForm` — freeform text area (100–10,000 chars), validation, submit handler
- `AdvancedOptions` — collapsible section: max_results (5–50, default 20), location, experience range, must-have skills
- `TosDisclosure` — static LinkedIn ToS risk notice (always visible); first-run modal acknowledgment (P1-4)
- `FutureCapabilitiesNote` — labeled section noting ATS integration and outreach generation as planned future capabilities

On submit: dispatches `POST /api/run`, receives `run_id`, transitions Zustand store to `status: 'running'`, renders ProcessingView.

**View 2: Processing View (`ProcessingView.tsx`)**

State: active run. Rendered when `run.status === 'running'`.

Components:
- `StageIndicator` (x4) — stages: Parsing JD, Searching LinkedIn, Scoring Candidates, Generating Shortlist. Each tile cycles through: pending → active (spinner) → done (checkmark) → error (error icon + message).
- `ElapsedTimer` — seconds elapsed since run start
- Cancel button — dispatches `POST /api/run/{runId}/cancel`; transitions to idle on confirmation

SSE integration: subscribes to `GET /api/run/{runId}/status` SSE stream via `EventSource`. Events drive stage transitions in Zustand store. On SSE connection error or run completion event, transitions to shortlist view (on success) or error state (on failure).

SSE Event Schema (emitted by FastAPI backend):

```
event: stage_update
data: {"stage": "source_candidates", "status": "active", "detail": "Sourced 8 of 20 candidates", "elapsed_seconds": 42}

event: run_complete
data: {"run_id": "abc123", "status": "success", "shortlist_count": 14, "elapsed_seconds": 487}

event: run_error
data: {"run_id": "abc123", "stage": "source_candidates", "error": "LinkedIn session expired. Please update LI_AT cookie.", "elapsed_seconds": 120}
```

Stage names map directly to CrewAI task IDs: `parse_jd`, `source_candidates`, `evaluate_candidates`, `format_shortlist`.

**View 3: Shortlist View (`ShortlistView.tsx`)**

State: run complete. Rendered when `run.status === 'complete'`.

Components:
- `RunSummaryHeader` — role title, criteria summary, total evaluated, shortlisted count, run timestamp
- `CandidateCard` (x N, ranked by match_score descending):
  - `ScoreBadge` — color-coded: green (85+), blue (70–84), yellow (55–69), orange (30–54), red (< 30)
  - Full name, current title at company, location, open-to-work status
  - LinkedIn profile link (opens new tab)
  - Expandable rationale table: criterion | result | evidence (one row per criterion)
  - "Remove" button — dispatches `POST /api/run/{runId}/remove/{candidateIndex}`; updates local Zustand state; candidate removed from view without page reload
- `InsufficientDataSection` — collapsed by default; lists data_insufficient candidates with profile URL and flag explanation
- `NotesTextArea` — freeform text area for hiring manager annotations; included in export
- `ExportButton` — triggers `GET /api/run/{runId}/export` file download (`shortlist.md`)
- "Start New Run" link — resets Zustand store to idle state; returns to InputView

### 6.4 assistant-ui Integration

assistant-ui is used for the streaming SSE consumption layer in the Processing view and for the chat-style interaction model if a conversational interface is added in a future milestone. For MVP, the primary use is the streaming event handling infrastructure provided by assistant-ui's runtime primitives.

The assistant-ui `AssistantRuntimeProvider` wraps the Processing and Shortlist views. Per-agent progress events from the SSE stream are delivered as message-style updates through the assistant-ui runtime, enabling the stage indicator tiles to update reactively without custom streaming boilerplate.

### 6.5 State Management (Zustand)

`runStore` fields:

| Field | Type | Description |
|---|---|---|
| status | 'idle' \| 'running' \| 'complete' \| 'error' | Controls view rendering |
| runId | string \| null | Current run identifier |
| currentStage | string \| null | Currently active CrewAI task ID |
| stageStatus | Record<string, 'pending' \| 'active' \| 'done' \| 'error'> | Per-stage state |
| stageDetail | Record<string, string> | Per-stage detail text |
| elapsedSeconds | number | Seconds since run start |
| shortlist | Candidate[] | Shortlist candidates (after removal, mutated in place) |
| runSummary | RunSummary \| null | Role title, counts, timestamp |
| errorMessage | string \| null | User-facing error message |

Shortlist removal is a client-side Zustand mutation. The `POST /api/run/{runId}/remove/{idx}` call persists the removal to the backend session state (for accurate export). The client-side store updates immediately on button click without waiting for the API response (optimistic UI).

### 6.6 Deferred Frontend Capabilities

- Mobile-optimized layout (deferred — desktop only at MVP)
- Screen reader full compliance (semantic HTML and keyboard navigation implemented; formal screen reader testing not performed at MVP)
- PDF export (deferred — Markdown sufficient)
- User authentication UI (deferred — no auth at MVP)
- Run history dashboard (P1-1 — deferred; may be added as a simple table if log parsing is straightforward during Integration epic)

---

## 7. Backend and API Layer Architecture

### 7.1 Python Service Layer

**Entry Point: `crew.py`**

Responsibilities:
- Load agent and task definitions from `config/agents.yaml` and `config/tasks.yaml`
- Instantiate the CrewAI sequential crew with `max_rpm` set at crew level
- Expose `run_crew(jd_text, max_results, filters)` function called by the FastAPI layer
- Emit progress events via a callback or event queue consumed by the SSE emitter in FastAPI
- Write structured run log JSON to `logs/{run_id}.json` after crew completion or failure

**Configuration Files:**

`config/agents.yaml` — all four agent definitions (role, goal, backstory, tools, memory, allow_delegation, llm, temperature, max_iter).

`config/tasks.yaml` — all four task definitions (description, expected_output, context, output_file, max_iter, max_execution_time, guardrail, task_id).

No inline agent or task definitions in `crew.py` — all externalized per AAMAD CrewAI adapter rule.

**Tool: `linkedin_selenium_tool.py`**

This is the highest-risk, highest-maintenance component. Its design requirements:

| Property | Specification |
|---|---|
| Tool name | `linkedin_selenium_tool` |
| Input schema | `{"search_criteria": <parse_jd output JSON>, "max_results": integer}` |
| Output schema | JSON array of candidate profile objects |
| Authentication | `li_at` cookie value loaded from `LI_AT` env var at tool initialization; never stored in instance variables accessible to logs |
| Driver | Chrome/Chromium headless via `webdriver-manager` (auto-manages ChromeDriver version) |
| Inter-request delay | Randomized sleep between page navigations: `random.uniform(INTER_REQUEST_DELAY_MIN, INTER_REQUEST_DELAY_MAX)` — env var controlled, defaults 2–4 seconds |
| Session scope | Single Selenium session per crew run; session initialized at tool init; closed (driver.quit()) in try/finally after all profiles retrieved |
| Cookie injection | Session cookie set via `driver.add_cookie({"name": "li_at", "value": os.environ["LI_AT"]})` after initial navigation to linkedin.com |
| Retry logic | On Selenium exception: exponential backoff, max 2 retries per page load; on session expiry (redirect to login page detected): halt with structured error dict `{"error": "session_expired", "message": "..."}` |
| Selector failure | On missing expected DOM element: set that field to null for the candidate; log selector name (not cookie value) to diagnostic; continue with remaining fields |
| Partial result | If fewer than max_results profiles retrieved due to failures: return partial array with `{"partial": true, "retrieved_count": N}` metadata field |
| Security | `LI_AT` value never written to log files, stdout, or any artifact; log only the first 4 characters if a debug reference is ever needed (not recommended) |
| Max page loads | `max_results + 5` navigation steps ceiling per run (configurable) |

**Guardrails: `guardrails.py`**

Contains two exported functions: `validate_scored_candidate_schema(output)` and `validate_shortlist_headings(output)`. Both return `(True, None)` on pass or `(False, diagnostic_message)` on failure. Registered as `Task.guardrail` in the respective task definitions. On failure, the crew halts and the diagnostic message is passed to the FastAPI layer for UI display.

**Run Logger**

After each crew run (success or failure), a JSON log entry is written to `logs/{run_id}.json`:

```json
{
  "run_id": "string",
  "timestamp_start": "ISO8601",
  "timestamp_end": "ISO8601",
  "duration_seconds": 0,
  "jd_hash": "sha256 of jd_text",
  "max_results_configured": 0,
  "candidates_retrieved": 0,
  "candidates_scored": 0,
  "shortlist_count": 0,
  "token_usage_estimate": 0,
  "status": "success | failure",
  "failure_stage": "string | null",
  "failure_message": "string | null",
  "retries": 0,
  "tos_acknowledgment_recorded": true
}
```

No candidate PII (names, URLs, profile data) is written to the run log. JD text is stored only as a SHA-256 hash.

### 7.2 FastAPI API Layer

**Service:** `api.py` (or `main.py`) — FastAPI application.

**Startup checks:** On startup, validate that `ANTHROPIC_API_KEY` and `LI_AT` are present in the environment. Fail fast with a clear error message if either is missing.

**Endpoints:**

| Method | Path | Description | Request Body | Response |
|---|---|---|---|---|
| POST | /run | Start a new crew run | `{jd_text, max_results, location, exp_min, exp_max, must_have_skills, tos_acknowledged}` | `{run_id}` |
| GET | /run/{run_id}/status | SSE stream of progress events | (none) | SSE event stream |
| GET | /run/{run_id}/shortlist | Get shortlist JSON for UI rendering | (none) | JSON array of candidates + run summary |
| POST | /run/{run_id}/remove/{candidate_index} | Remove a candidate from session shortlist | (none) | `{status: "ok"}` |
| GET | /run/{run_id}/export | Download shortlist.md (applying session removals) | (none) | `shortlist.md` file download |
| POST | /run/{run_id}/cancel | Cancel an in-progress run | (none) | `{status: "cancelled"}` |

**Run State Manager:** In-memory dict keyed by `run_id` (UUID4). Holds: current stage, stage detail, shortlist (mutated by remove calls), status (running/complete/error/cancelled). Scoped to the server process lifetime — no persistence. One run active at a time (enforced by a mutex: if a run is already active, `POST /run` returns 409 Conflict with a clear error message).

**SSE Emitter:** The `/run/{run_id}/status` endpoint returns a `StreamingResponse` (FastAPI `EventSourceResponse`). The crew run executes in a background thread (not blocking the event loop). A queue bridges the crew thread to the SSE emitter coroutine. Stage lifecycle events are enqueued by crew step callbacks and dequeued by the SSE emitter.

**CORS:** In development, CORS is permissive (Next.js dev server on localhost:3000). In production (same-host deployment via Docker Compose), CORS is restricted to the same origin.

**Input validation:** JD text: 100–10,000 chars. max_results: 5–50. Experience values: non-negative integers. All inputs sanitized (strip control characters; no HTML injection concern given no HTML rendering of JD text server-side).

### 7.3 Next.js API Routes as Proxy Layer

The Next.js API routes under `src/app/api/` are thin proxies that forward requests from the browser to the FastAPI backend. This keeps the FastAPI service non-public (binding only to localhost or Docker internal network) while the Next.js server acts as the single public-facing endpoint.

The proxy routes handle:
- Request forwarding with appropriate headers
- SSE passthrough (the `/api/run/[runId]/status` route forwards the SSE stream from FastAPI to the browser)
- Error normalization (FastAPI HTTP errors mapped to Next.js JSON error responses)

No business logic lives in the Next.js API routes — they are pure proxies.

### 7.4 Secrets Management

Required environment variables (must be set before application start):

```
ANTHROPIC_API_KEY=<Anthropic Enterprise API key>
LI_AT=<LinkedIn li_at session cookie value>
```

Optional environment variables:

```
MAX_RESULTS=20
INTER_REQUEST_DELAY_MIN=2
INTER_REQUEST_DELAY_MAX=4
CREWAI_STORAGE_DIR=.crewai_storage
LOG_DIR=logs
VERBOSE_CREW=true
MAX_PAGE_LOADS_PER_RUN=25
```

`.env` file: gitignored at project root. Never committed.

`.env.example`: committed. Contains all variable names with placeholder values and inline comments explaining each variable, including step-by-step instructions for extracting the `li_at` cookie from the browser (referencing the approach documented in `crewai-recruitment-example.md`).

The `LI_AT` value is consumed once at tool initialization in `linkedin_selenium_tool.py` and stored in a local variable within the `_run` method scope. It is never assigned to an instance variable, class variable, or any structure that could be serialized to a log or artifact.

---

## 8. Deployment Architecture

### 8.1 MVP Deployment Target: Local or Private Cloud VM with Docker Compose

The MVP is deployed as two co-located services managed by Docker Compose:
- `frontend` service: Next.js app (Node.js 20+, port 3000)
- `backend` service: FastAPI app (Python 3.12+, port 8000)

Both services share a `docker-compose.yml` at the project root. Environment variables are loaded from `.env` via Docker Compose's `env_file` directive.

```
docker-compose.yml
  services:
    frontend:
      build: ./frontend
      ports: ["3000:3000"]
      environment:
        - NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
      depends_on: [backend]

    backend:
      build: ./backend
      ports: ["8000:8000"]
      env_file: .env
      volumes:
        - ./output:/app/output
        - ./logs:/app/logs
```

The `output/` and `logs/` directories are mounted as volumes from the host filesystem, ensuring run artifacts and logs persist across container restarts.

**Local deployment:** Hiring manager runs `docker compose up` on their work laptop. Access via `http://localhost:3000`. No network exposure.

**Private cloud VM deployment (optional):** Same Docker Compose on a private cloud VM (AWS EC2, GCP Compute Engine, or DigitalOcean Droplet). Access restricted to the hiring manager's IP via VM firewall rules or VPN. Basic HTTP authentication must be added to the Next.js server (via nginx reverse proxy with htpasswd or Next.js middleware) before any network-accessible deployment. TLS via Let's Encrypt or equivalent is required.

### 8.2 Process Requirements

| Component | Runtime | Minimum Resources |
|---|---|---|
| Next.js frontend | Node.js 20+ LTS | 512MB RAM, 0.5 vCPU |
| FastAPI backend | Python 3.12+, uvicorn | 1GB RAM, 1 vCPU |
| Selenium/Chrome | Chrome/Chromium headless | 1GB RAM, 1 vCPU (peak during sourcing) |
| Total (single host) | | 2 vCPU, 4GB RAM minimum |

ChromeDriver version must match the installed Chrome version. `webdriver-manager` handles this automatically in the backend Docker image.

### 8.3 Browser Runtime (Selenium)

Chrome/Chromium runs headless inside the backend Docker container. The backend Dockerfile installs:
- `google-chrome-stable` or `chromium-browser` (pinned version)
- `webdriver-manager` Python package (manages ChromeDriver download and version matching)

Headless Chrome flags for container environment:
```
--headless=new
--no-sandbox
--disable-dev-shm-usage
--disable-gpu
--window-size=1920,1080
```

### 8.4 Future Deployment Path (Deferred)

- Container orchestration (Kubernetes or ECS): deferred until multi-user or high-availability requirements emerge
- CI/CD pipeline (GitHub Actions): deferred to post-MVP; manual `docker compose up` is sufficient for single-user
- Managed cloud database: deferred per ADR-04
- Multi-region: not applicable for single-user internal tool

---

## 9. Data Flow and Integration Architecture

### 9.1 End-to-End Request Flow

```
[Hiring Manager] submits JD text via browser
    |
    | POST /api/run (Next.js proxy)
    v
[Next.js API Route] forwards to FastAPI
    |
    | POST /run (FastAPI)
    v
[FastAPI] validates input; generates run_id; starts crew in background thread
    |
    | responds immediately with {run_id}
    v
[Browser] transitions to Processing view; subscribes to SSE stream
    |
    | GET /api/run/{runId}/status → SSE stream
    v
[FastAPI SSE emitter] emits stage_update events as crew progresses
    |
    +-- stage: parse_jd active
    |       |
    |       v
    |   [JD Parser Agent] receives JD text via crew kickoff input
    |   Claude call: parse JD → structured criteria JSON
    |   writes output/parse_jd.json
    |   FastAPI emits: stage_update{parse_jd, done}
    |
    +-- stage: source_candidates active
    |       |
    |       v
    |   [LinkedIn Sourcing Agent] receives parse_jd output via Task.context
    |   linkedin_selenium_tool: inject li_at cookie; navigate LinkedIn Recruiter
    |   For each candidate (up to max_results):
    |       - Navigate to search results; click profile
    |       - Extract DOM fields (name, title, company, location, skills, etc.)
    |       - Random sleep (2–4s) between page loads
    |       - Append candidate profile object to array
    |   writes output/source_candidates.json
    |   FastAPI emits: stage_update{source_candidates, done, retrieved=N}
    |
    +-- stage: evaluate_candidates active
    |       |
    |       v
    |   [Evaluation Agent] receives parse_jd + source_candidates output via Task.context
    |   For each candidate: Claude call → match_score + score_rationale
    |   Guardrail: validate_scored_candidate_schema → pass or Diagnostic + halt
    |   writes output/evaluate_candidates.json
    |   FastAPI emits: stage_update{evaluate_candidates, done}
    |
    +-- stage: format_shortlist active
            |
            v
        [Formatting Agent] receives evaluate_candidates output via Task.context
        Claude call → ranked Markdown document (required heading structure)
        Guardrail: validate_shortlist_headings → pass or Diagnostic + halt
        file_write_tool: writes output/shortlist.md
        FastAPI emits: run_complete{run_id, success, shortlist_count=N}

[Browser] receives run_complete event; transitions to Shortlist view
    |
    | GET /api/run/{runId}/shortlist
    v
[FastAPI] parses output/shortlist.md → returns JSON candidate array + run summary
    |
    v
[Browser] renders CandidateCard components; hiring manager reviews
    |
    | [Optional] POST /api/run/{runId}/remove/{idx} → removes candidates
    |
    | GET /api/run/{runId}/export → downloads shortlist.md
    v
[Hiring Manager] shares shortlist.md with recruiting team
```

### 9.2 Selenium Session Lifecycle

1. **Initialization:** At `linkedin_selenium_tool._run()` start, initialize Chrome WebDriver with headless flags. Navigate to `https://linkedin.com`. Inject `li_at` cookie via `driver.add_cookie()`. Reload page to activate session.
2. **Session validation:** After cookie injection, verify that the page does not redirect to `/login`. If redirected, raise `SessionExpiredError` with message: "LinkedIn session expired. Please update your LI_AT cookie and retry."
3. **Search execution:** Navigate to LinkedIn Recruiter search URL constructed from `search_criteria` parameters (title keywords, location, skills, experience range). Extract search result URLs.
4. **Profile extraction:** For each candidate URL, navigate to profile page. Extract DOM fields per the field catalog in PRD Section 3 (LinkedIn Selenium Tool Specification). Apply per-field null fallback on selector failure.
5. **Inter-request delay:** After each page navigation, `time.sleep(random.uniform(delay_min, delay_max))`.
6. **Teardown:** In `try/finally`: `driver.quit()` — ensures browser process is killed even on exception. No cross-run session reuse.

### 9.3 SSE Event Schema

All SSE events use the following format (FastAPI EventSourceResponse):

```
event: stage_update
data: {
  "run_id": "string",
  "stage": "parse_jd | source_candidates | evaluate_candidates | format_shortlist",
  "status": "active | done | error",
  "detail": "string (human-readable progress detail)",
  "elapsed_seconds": integer
}

event: run_complete
data: {
  "run_id": "string",
  "status": "success",
  "shortlist_count": integer,
  "total_evaluated": integer,
  "elapsed_seconds": integer
}

event: run_error
data: {
  "run_id": "string",
  "stage": "string | null",
  "error": "string (user-facing, no stack trace, no secrets)",
  "elapsed_seconds": integer
}

event: run_cancelled
data: {
  "run_id": "string",
  "elapsed_seconds": integer
}
```

### 9.4 Output Artifact Paths

| Artifact | Path | Retention |
|---|---|---|
| JD parsing output | `output/parse_jd.json` | Overwritten on next run |
| Sourcing output | `output/source_candidates.json` | Overwritten on next run |
| Evaluation output | `output/evaluate_candidates.json` | Overwritten on next run |
| Shortlist Markdown | `output/shortlist.md` | Overwritten on next run |
| Run log | `logs/{run_id}.json` | Retained (no PII; aggregate metrics only) |
| Diagnostic log | `logs/{run_id}_diagnostic.json` | Retained on guardrail/error only |

`output/` is gitignored. `logs/` is gitignored. No candidate PII persists to any file beyond the session (shortlist.md is the sole artifact containing candidate data, and it is not retained server-side after export per PRD P0-6).

---

## 10. Performance and Scalability

### 10.1 Per-Task Time Budgets

| Task | Time Budget | Bound By | Tuning Lever |
|---|---|---|---|
| parse_jd | < 30 seconds | LLM (Claude) | Temperature, max_iter |
| source_candidates | < 480 seconds (8 min) | Selenium inter-request delays | INTER_REQUEST_DELAY_MIN/MAX, MAX_RESULTS |
| evaluate_candidates | < 180 seconds (3 min) | LLM (Claude), scales with candidate count | MAX_RESULTS ceiling, max_iter |
| format_shortlist | < 30 seconds | LLM + file write | max_iter |
| Total end-to-end | < 720 seconds (12 min) | Dominated by sourcing | All above |

Target: < 15 minutes end-to-end for a 20-candidate run. The 12-minute task budget sum leaves a 3-minute margin for API overhead, SSE event propagation, and startup.

### 10.2 Token Budget

| Task | Estimated Token Usage | Notes |
|---|---|---|
| parse_jd | ~500 tokens (input) + ~300 tokens (output) | Single Claude call |
| source_candidates | ~200 tokens (tool invocation overhead) | No direct Claude LLM token usage; Claude used only for tool parameter construction |
| evaluate_candidates | ~300 tokens input + ~200 tokens output per candidate × 20 | ~10,000 tokens for 20 candidates |
| format_shortlist | ~10,000 tokens (input: scored candidates) + ~2,000 tokens (output: Markdown) | Large context input |
| Total per run | ~15,000–20,000 tokens | Well within Anthropic Enterprise rate limits |

`max_rpm` set at 10 RPM at crew level. Token usage logged per run for monitoring.

### 10.3 Concurrency Model

Single-user, single-run-at-a-time for MVP. The FastAPI backend enforces a global mutex: if a crew run is already active, `POST /run` returns 409 Conflict. No queue management, no worker pool, no parallelism at MVP.

The concurrent user model is 1. There is no horizontal scaling requirement for MVP. The resource sizing (2 vCPU, 4GB RAM) is sufficient for a single run of up to 50 candidates with Selenium + Claude evaluation.

### 10.4 Bot Detection Mitigation

The following measures are self-enforced in `linkedin_selenium_tool.py` to reduce automated session detection risk:

| Measure | Implementation |
|---|---|
| Randomized inter-request delay | `random.uniform(INTER_REQUEST_DELAY_MIN, INTER_REQUEST_DELAY_MAX)` between every page navigation |
| User-agent string | Use default Chrome headless user-agent (matching a real browser); do not override with a custom string that LinkedIn flags |
| Max page loads per run ceiling | `MAX_PAGE_LOADS_PER_RUN` env var (default: max_results + 5); prevents runaway navigation |
| Single session per run | No session reuse across runs; each run starts a fresh browser instance |
| No parallel page loads | All navigations are sequential; no concurrent tab opening |
| Session expiry detection | Redirect to /login detected immediately; run halted with clear user-facing error |

These measures reduce but do not eliminate ToS risk. See ADR-02 and Section 11.

### 10.5 Scalability (Deferred)

The following scalability capabilities are explicitly deferred to future milestones:

- Horizontal scaling (multiple workers, load balancer): deferred until multi-user
- Database read replicas or sharding: deferred; no database at MVP
- CDN for static asset delivery: deferred; single-user local deployment
- Background job queue (Celery, Redis Queue): deferred; FastAPI background thread sufficient for single-user

---

## 11. Security Architecture

### 11.1 Secret Management

| Secret | Environment Variable | Handling |
|---|---|---|
| Anthropic Enterprise API key | `ANTHROPIC_API_KEY` | Loaded by CrewAI framework from env var; never written to any file, log, or artifact |
| LinkedIn `li_at` session cookie | `LI_AT` | Loaded in `linkedin_selenium_tool._run()` from `os.environ["LI_AT"]`; injected as browser cookie; never written to log, stdout, or any artifact |

Both secrets are defined in `.env` (gitignored). `.env.example` provides all variable names with placeholder values. Application startup fails fast with a clear, non-secret error message if either variable is missing.

The `li_at` cookie value has the same sensitivity as an API key: it grants full access to the LinkedIn account associated with the session. Exposure (e.g., accidental log write) must be treated as a security incident requiring immediate cookie invalidation (logout from LinkedIn on the affected device) and refresh.

### 11.2 Candidate PII Handling

| Data | Storage | Handling |
|---|---|---|
| Candidate profile data (name, title, company, location, URL) | In-memory only during crew run | Flows through CrewAI task context chain; written to `output/evaluate_candidates.json` and `output/shortlist.md` as intermediate artifacts |
| `output/shortlist.md` | Local filesystem (ephemeral) | Gitignored; treated as sensitive; not retained server-side after export; hiring manager is responsible for handling the exported file appropriately |
| Run log | `logs/{run_id}.json` | Contains only aggregate counts and JD hash; no candidate PII |

No candidate profile data is written to any database, external service, or persistent server-side store. The intermediate JSON files in `output/` are overwritten on the next run. The shortlist Markdown file is the sole artifact containing candidate data, and it is the hiring manager's responsibility after export.

### 11.3 Input Sanitization

JD text input is sanitized before passing to the crew: control characters stripped, length validated (100–10,000 chars). The JD text is passed to the Claude LLM as a prompt string — not rendered as HTML — so XSS is not a concern at the backend. The Next.js frontend uses React's default HTML escaping for any user-provided text rendered to the DOM.

No SQL injection risk (no database at MVP). No shell injection risk (JD text is not passed to any shell command).

### 11.4 Network Security

For local deployment: only localhost:3000 (Next.js) and localhost:8000 (FastAPI) are bound. No public exposure.

For private cloud VM deployment: VM firewall rules restrict inbound traffic to the hiring manager's IP or VPN. Basic HTTP authentication (nginx htpasswd or Next.js middleware) required before any network-accessible deployment. TLS required for any non-localhost access.

The Selenium tool makes outbound connections to `linkedin.com` only. The FastAPI backend makes outbound connections to `api.anthropic.com` only. No other outbound network access.

### 11.5 GDPR and Regulatory Compliance

Not formally assessed for MVP scope (single internal user, no organizational data handling policy specified). This assessment must be conducted before the tool is extended to multiple users or organizations.

The data minimization principle is partially satisfied by design: candidate profile data is not retained beyond the crew run session (except in the exported shortlist file, which is under the hiring manager's control).

---

## 12. Testing and Quality Assurance

### 12.1 Testing Strategy (MVP)

The MVP testing strategy follows the AAMAD development workflow module structure. Tests are organized by build epic, not by test type, to align with the modular development sessions.

**Module 1 (Epic 2 — Backend): Crew and Agent Validation**

- Smoke test: `crew.kickoff()` with a fixed benchmark JD executes without exception and produces `output/shortlist.md` with all required headings.
- JD parsing output schema validation: assert all required fields present in `parse_jd.json`; assert types correct (list for skills, integer for experience values, boolean for `location_remote_ok`).
- Evaluation output schema validation: `validate_scored_candidate_schema()` passes for a known valid scored candidate array; fails for a known invalid array (missing rationale).
- Shortlist heading validation: `validate_shortlist_headings()` passes for a valid Markdown; fails for one missing a required heading.

**Module 2 (Epic 2 — Backend): Selenium Tool Validation**

- Static HTML fixture test: create a static HTML file mimicking the LinkedIn profile page DOM structure (with real field selectors). Assert that `linkedin_selenium_tool` correctly extracts `full_name`, `current_title`, `current_company`, `location`, `linkedin_profile_url` from the fixture.
- Selector failure handling: assert that when a Medium/Low-reliability field selector is absent, the field is set to `null` rather than raising an exception.
- Session expiry handling: mock the browser redirect to `/login`; assert that the tool raises `SessionExpiredError` with the correct user-facing message.
- Cookie handling: assert that `LI_AT` value is not present in any log output produced during a test tool run (log capture assertion).

**Module 3 (Epic 3 — Frontend): View Validation**

- All three views render without JavaScript errors in a modern desktop browser (Chrome/Firefox).
- Input form validation: assert that submitting with JD text < 100 chars shows an inline validation error. Assert that max_results slider enforces 5–50 range.
- ScoreBadge color mapping: assert correct badge color class for each score range boundary (85, 70, 55, 30, 0).
- CandidateCard remove: assert that clicking Remove removes the card from the DOM and dispatches the correct API call.
- SSE event handling: mock SSE events; assert that stage indicators transition correctly (pending → active → done).

**Module 4 (Epic 5 — QA): End-to-End and Integration Tests**

- End-to-end smoke test: submit a fixed benchmark JD via the web UI; confirm shortlist renders in the browser; confirm export downloads a valid Markdown file. Requires a valid `li_at` cookie in the test environment.
- Scoring consistency: run the same benchmark JD twice; assert that each candidate's `match_score` differs by no more than ±5 points across the two runs.
- API contract tests: assert that all five FastAPI endpoints return the correct HTTP status and response schema for both happy-path and error-path inputs.
- Failure scenario: simulate Selenium session expiry mid-run; assert that the UI displays the correct user-facing error message and returns to a recoverable state.

### 12.2 Benchmark Job Description

A fixed benchmark JD is defined during the Setup epic and stored in `tests/fixtures/benchmark_jd.txt`. This JD is used for:
- Post-setup smoke test
- Post-Selenium-update regression test
- Post-model-version-update behavior validation
- Scoring consistency test (two identical runs)
- QA acceptance rate baseline measurement (3 test runs)

The benchmark JD should be a realistic, moderately complex job description for a role type common to the hiring manager's workflow (e.g., senior software engineer, product manager).

### 12.3 Selenium Selector Regression Testing

Selenium DOM selectors are maintained in a constants file (`linkedin_selenium_tool.py` or a separate `selectors.py`). After any LinkedIn UI change is detected, the selector update is validated against the static HTML fixture before deployment. The static HTML fixture in `tests/fixtures/linkedin_profile.html` is updated to match the new DOM structure as part of the maintenance response.

### 12.4 Quality Gates (Per AAMAD CrewAI Adapter Rules)

- All required template headings validated before final artifact write (enforced by `validate_shortlist_headings` guardrail).
- `validate_scored_candidate_schema` guardrail enforced on evaluation output.
- `Task.id` and explicit `output_file` required for all tasks (verified during Setup epic scaffolding).
- Machine-ingested output sections (JSON task outputs) must not be wrapped in code fences — validated by schema parsing.
- `max_iter <= 12` for all tasks (verified in `config/tasks.yaml` review).

---

## 13. MVP Launch and Rollout

### 13.1 Go/No-Go Gates

All five gates must be met before the first production run:

| Gate | Verification Method |
|---|---|
| Anthropic Enterprise API key active and accessible | `config/agents.yaml` references `claude-sonnet-4-6`; test API call returns 200 |
| `li_at` LinkedIn session cookie extractable and valid | Hiring manager extracts cookie per README instructions; Selenium tool validates session (no /login redirect) |
| Python environment and dependencies installable | Setup epic smoke test: `crew.kickoff()` with stub agents exits without error |
| End-to-end test run complete | Integration epic validation: one full run from JD input to Markdown export with live LinkedIn session |
| Hiring manager ToS risk acknowledgment recorded | P1-4 acknowledgment modal completed; `tos_acknowledgment_recorded: true` in first run log |

### 13.2 Supervised Rollout Plan (Days 1–30)

**Phase 1 — Days 1–7: Supervised Initial Runs**

The hiring manager runs the system for 3–5 active open roles with a technical colleague available to address issues. Each run is logged. Metrics collected for each run: time-to-shortlist, shortlist acceptance rate (candidates retained after review), sourcing coverage (candidates_retrieved / max_results). Any Selenium failures or shortlist quality issues are triaged within the same business day.

**Phase 2 — Days 8–30: Independent Use**

The hiring manager uses the system independently for all active sourcing needs. Run logs are reviewed weekly. Selenium breakage incidents (sourcing failure attributable to LinkedIn UI changes) trigger a maintenance response within 1 business day. Manual sourcing is the fallback during any maintenance window.

**Phase 3 — Month 2+: Assessment and Backlog Prioritization**

At the 30-day mark: review time-to-shortlist trend, shortlist acceptance rate, LinkedIn session refresh frequency, and Selenium breakage incident count. Use this data to prioritize P2 backlog items and evaluate whether LinkedIn Recruiter API credential procurement should be escalated.

### 13.3 Launch Success Criteria

| Criterion | Target |
|---|---|
| Time-to-shortlist | < 15 minutes in >= 3 of first 5 production runs |
| Shortlist acceptance rate | > 70% in >= 3 of first 5 production runs |
| Run success rate | >= 4 of 5 first production runs complete without unrecovered error |
| Hiring manager qualitative assessment | Shortlist format immediately usable by recruiting team; no reformatting required |

### 13.4 Operational Runbook (MVP)

| Event | Response |
|---|---|
| `li_at` cookie expired | Hiring manager extracts new cookie from browser per README; updates `.env`; restarts backend service |
| Selenium selector failure (LinkedIn UI change) | Operator identifies failing selectors from Diagnostic log; updates `selectors.py` against new LinkedIn DOM; validates with static HTML fixture; restarts backend |
| Anthropic API key expired or rate-limited | Operator re-provisions key in `.env`; restarts backend; verify with smoke test |
| CrewAI version update available | Pin new version in `pyproject.toml`; run smoke test against benchmark JD; deploy only if smoke test passes |
| Model version change needed | Update `llm` field in `config/agents.yaml`; run scoring consistency test; deploy |

---

## 14. Future Work (Deferred Capabilities)

All items below are explicitly out of MVP scope. They are listed here to preserve architectural intent and ensure the MVP design does not foreclose these extensions.

### 14.1 LinkedIn Recruiter API Migration (Highest Priority)

**P2-7.** Replace `linkedin_selenium_tool` with an official LinkedIn Recruiter API client. The tool contract (JSON-serializable input/output, same candidate profile schema) is designed to be a drop-in replacement. Agent definitions, task graph, and crew orchestration remain unchanged. This migration eliminates the LinkedIn ToS risk and Selenium fragility entirely. Initiation depends on procurement of official API credentials through the LinkedIn partner program.

**Architectural impact:** Minimal. Only `linkedin_selenium_tool.py` changes. The `LI_AT` env var is replaced by `LINKEDIN_RECRUITER_API_KEY`. `chrome` and `webdriver-manager` dependencies are removed from the backend Dockerfile.

### 14.2 ATS Integration (P2-1)

Export shortlist directly to Greenhouse, Lever, or Workday via their respective APIs. Architecturally, this adds a fifth agent (ATS Export Agent) to the crew or adds an optional post-crew API call from the FastAPI layer. Requires ATS API credentials, field mapping between the shortlist schema and the ATS candidate model, and additional security review.

### 14.3 Multi-User Access (P2-3)

Support multiple hiring managers as separate users with isolated run histories and LinkedIn sessions. Architecturally, this requires: NextAuth.js integration (ADR-06 superseded), per-user session isolation in the FastAPI run state manager, per-user `li_at` cookie management (each user provides their own), and a database (SQLite initially, PostgreSQL for concurrency) for run history. This is a significant scope expansion.

### 14.4 Candidate Talent Pool / Database (P2-6)

Persist candidate profiles across runs to build a searchable internal talent pool. Requires an organizational data handling policy covering LinkedIn-sourced candidate PII, a database schema for candidate storage, and a deduplication strategy (same candidate appearing in multiple runs). Architecturally, this supersedes ADR-04 and adds a PostgreSQL service to the Docker Compose stack.

### 14.5 Batch Multi-Role Sourcing (P2-4)

Accept multiple JDs and run the crew for each in sequence. Architecturally, this requires a job queue (Redis Queue or Celery) managed by the FastAPI layer, per-run result isolation, and a UI view for multi-run status tracking.

### 14.6 Outreach Draft Generation (P2-2)

A fifth agent that generates personalized outreach message drafts for shortlisted candidates. Architecturally, this extends the task graph after `format_shortlist` with a new task and agent. Tool surface: none (pure LLM). Output: per-candidate outreach draft appended to the shortlist document.

### 14.7 Diversity Signal Analysis (P2-5)

Requires legal review before implementation. Not architecturally described here to avoid creating implementation pressure before the legal review is complete.

### 14.8 PDF Export (P2-8)

Add a PDF rendering step after `format_shortlist` using WeasyPrint or a Playwright-based rendering approach. Architecturally, this is an additional file write step in the formatting agent or a post-crew rendering call in the FastAPI export endpoint.

### 14.9 CI/CD Pipeline

GitHub Actions workflow for automated Docker image build, smoke test against benchmark JD, and deployment to private cloud VM. Deferred to post-MVP once the deployment target is stabilized. Manual `docker compose up` is sufficient for the single-user MVP.

---

## 15. Sources

- MRD v1.1: `project-context/1.define/MRD.md` — primary market and technical research foundation
- PRD v1.0: `project-context/1.define/PRD.md` — all functional requirements, agent definitions, task specifications, and rollout plan
- AAMAD Core Rules: `.claude/rules/aamad-core.md` — artifact structure, agent contracts, traceability requirements
- AAMAD CrewAI Adapter Rules: `.claude/rules/adapter-crewai.md` — CrewAI-specific implementation constraints (process mode, memory, max_iter, guardrails, YAML externalization)
- AAMAD Adapter Registry Rules: `.claude/rules/adapter-registry.md` — AAMAD_TARGET_RUNTIME selection and resolution
- AAMAD Epics Index: `.claude/rules/epics-index.md` — epic-to-persona mapping and output artifact paths
- AAMAD Development Workflow Rules: `.claude/rules/development-workflow.md` — modular development module structure
- SAD Template: `.claude/templates/sad-template.md` (AAMAD MVP SAD template, Next.js + assistant-ui variant)
- CrewAI Framework Documentation v0.80+, 2025 — sequential process mode, YAML externalization, Task.context, Task.guardrail, execution controls
- Anthropic Claude Documentation and Enterprise API Reference, 2025 — model capabilities, token budgets, model pinning
- LinkedIn Talent Solutions Global Talent Trends Report, 2024 — sourcing time benchmarks, time-to-hire median (via MRD)
- CrewAI Recruitment Example Reference: `crewai-recruitment-example.md` — Selenium + `li_at` cookie sourcing approach (disclaimer: example mechanism; may violate LinkedIn ToS; account suspension risk accepted for MVP)
- ISO/IEC/IEEE 42010:2022 — Systems and software engineering architecture description (structural alignment for stakeholders, viewpoints, rationale)
- SEI Views and Beyond, 2nd edition — primary presentation, element catalog, and rationale practices for architecture views

---

## 16. Assumptions

1. `AAMAD_TARGET_RUNTIME=crewai` is confirmed. All agent and task definitions are authored for the CrewAI adapter. Sequential process mode is the resolved execution model.
2. The LLM is Anthropic Claude via Anthropic Enterprise, model pinned to `claude-sonnet-4-6`. This model is assumed available under the organization's Anthropic Enterprise contract. If a different model slug is required, `config/agents.yaml` must be updated before the Backend epic begins.
3. The Selenium + `li_at` cookie sourcing mechanism is the MVP integration approach. The LinkedIn ToS risk is accepted and documented in the MRD Risk Assessment (High Risk). The hiring manager must acknowledge this risk before first use (PRD P1-4).
4. Deployment is local machine or private cloud VM accessible only to the hiring manager. No public-facing URL, no enterprise SSO, no formal security review required for MVP scope. If deployment scope changes, basic HTTP authentication and TLS must be added before that deployment.
5. One concurrent user and one concurrent crew run at a time. The 409 Conflict response on `POST /run` during an active run is the concurrency control mechanism.
6. No organizational data handling policy has been specified. This assumption must be revisited before the tool is extended beyond the single hiring manager user (PRD Open Question #3).
7. The hiring manager's open roles are typical technology/knowledge-work role types. The JD Parser and Evaluation agents are not pre-tuned to any specific skills taxonomy.
8. Chrome/Chromium is installable in the backend Docker image. `webdriver-manager` successfully manages ChromeDriver version matching.
9. The recruiting team receives shortlists as Markdown exports and requires no direct system interaction. The Markdown heading structure defined in `format_shortlist` task specification is sufficient for their use without reformatting.
10. Per-run Anthropic API token costs are estimated at < $0.50 for a 20-candidate run at `claude-sonnet-4-6` pricing under the organization's Enterprise contract. Actual cost depends on the Enterprise pricing tier; token usage is logged per run for monitoring.
11. The `li_at` cookie provides access to LinkedIn Recruiter features (candidate search, profile access). If the cookie is scoped to a standard LinkedIn session without Recruiter access, the Selenium tool will not be able to access Recruiter-specific search filters and the sourcing quality will degrade.
12. Python 3.12+ is installable in the backend Docker image. `uv` is available for package management per the project's existing tooling (`pyproject.toml` + `uv.lock`).

---

## 17. Open Questions

1. **Anthropic Enterprise model availability:** Is `claude-sonnet-4-6` specifically designated as the production model under the organization's Anthropic Enterprise contract, or is a different model slug required? This must be confirmed before `config/agents.yaml` is written in the Setup epic. (PRD Open Question #1.)

2. **`li_at` cookie session duration:** How long does the `li_at` cookie remain valid in the hiring manager's LinkedIn environment? Standard LinkedIn session cookies are valid for up to 1 year but can be invalidated earlier by security policy or session management. The answer determines how often the hiring manager must refresh the cookie and informs the operational runbook guidance.

3. **Organizational data handling policy:** Is there an existing organizational policy governing how LinkedIn candidate profile data may be used, stored, or processed by internal tools? This must be reviewed before the tool is extended beyond the single hiring manager user. (PRD Open Question #3; MRD Open Question #6.)

4. **Hiring manager acceptable run time:** Is the < 15-minute target acceptable, or is there a preference for a shorter window (5–10 minutes) that would require tradeoffs in max_results or scoring depth? The current inter-request delay defaults (2–4 seconds) and max_results default (20) are calibrated to the 15-minute target.

5. **LinkedIn Recruiter API credential procurement status:** Has any action been taken to initiate procurement of official LinkedIn Recruiter API credentials through the LinkedIn partner program? The LinkedIn Recruiter API migration (P2-7) is the highest-priority future work item, and its timeline depends on procurement progress. (PRD Open Question #6.)

6. **`li_at` cookie Recruiter access scope:** Does the hiring manager's LinkedIn session cookie (`li_at`) provide access to LinkedIn Recruiter-specific search features (Recruiter Lite or Recruiter), or only to standard LinkedIn search? Recruiter access determines the search filter depth and candidate pool size available to the Selenium tool. If only standard LinkedIn search is available, the sourcing agent's search query construction and field extraction logic may need adjustment.

---

## 18. Audit

| Field | Value |
|---|---|
| Timestamp | 2026-05-31 |
| Persona ID | @system.arch |
| Action | SAD authoring — Phase 1 Define, MVP variant (`*create-sad --mvp`) |
| Template Used | `.claude/templates/sad-template.md` (AAMAD MVP SAD template, Next.js + assistant-ui variant) |
| SAD Variant | MVP — lean views; complex NFRs, HA, CI/CD, database, multi-user, and non-MVP features deferred with explicit rationale |
| PRD Reference | `project-context/1.define/PRD.md` v1.0 — all architectural decisions trace to PRD sections |
| MRD Reference | `project-context/1.define/MRD.md` v1.1 — market context, risk assessment, and technical feasibility referenced |
| Runtime Target Resolved | `AAMAD_TARGET_RUNTIME=crewai` — default; confirmed in PRD and MRD Audit; no override specified; recorded per adapter-registry rules |
| LLM Resolved | Anthropic Claude via Anthropic Enterprise; model pinned to `claude-sonnet-4-6`; temperature 0.2 (JD Parser), 0.1 (all other agents) |
| Process Mode Resolved | Sequential (ADR-01); sequential process is deterministic and matches linear 4-step task dependency chain |
| Memory Resolved | `memory=False` for all agents (ADR-05); stateless runs; reproducibility |
| LinkedIn Integration Resolved | Selenium WebDriver + `li_at` session cookie browser automation (ADR-02); official LinkedIn Recruiter API credentials unavailable at MVP; `LI_AT` env var is the authentication mechanism; ToS risk accepted and documented |
| ADRs Recorded | ADR-01 through ADR-08 — all with decision, rationale, consequences, PRD reference, and future work path |
| Deferred Capabilities | Sections 2.2 and 14 enumerate all explicit exclusions and deferred capabilities with deferral rationale |
| Prompt Trace | Omitted — this SAD is authored by @system.arch from explicit PRD/MRD inputs in a directed synthesis session. It is not a high-risk autonomous LLM output requiring independent Prompt Trace capture. The PRD and MRD that ground all decisions are themselves Phase 1 Define artifacts with their own Audit entries. |
| ISO/IEC/IEEE 42010 Alignment | Stakeholders and concerns documented (Section 1); viewpoints addressed per section (logical, process/runtime, deployment, data flow); rationale and correspondence rules recorded in ADRs |
| SEI Views and Beyond Alignment | Each view (Sections 4–9) follows primary presentation, element catalog, and rationale/analysis structure |
| Output Path | `/Users/chris.sanchez/projects/recruitment-assistant/project-context/1.define/SAD.md` |
| Handoff Status | Ready for Phase 2 build kickoff. All five AAMAD build epics (Setup, Backend, Frontend, Integration, QA) have sufficient architectural specification in this SAD to begin implementation. Go/No-Go gates restated in Section 13.1. Open Questions in Section 17 should be resolved before or during the Setup epic. |
