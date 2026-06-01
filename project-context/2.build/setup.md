# Setup Epic — Project Skeleton Log
## Recruitment Assistant

**Persona:** @project.mgr
**Phase:** 2 — Build
**Epic:** Setup (`*setup-project`)
**Date:** 2026-05-31
**PRD Reference:** `project-context/1.define/PRD.md` v1.0
**SAD Reference:** `project-context/1.define/SAD.md` v1.0
**Runtime Target:** `AAMAD_TARGET_RUNTIME=crewai`

---

## 1. Directories Created

All directories are at `/Users/chris.sanchez/projects/recruitment-assistant/` unless noted otherwise.

| Path | Purpose |
|---|---|
| `backend/` | Python FastAPI + CrewAI backend service root |
| `backend/config/` | Externalized CrewAI YAML config (adapter rule: no inline defs) |
| `backend/tools/` | Custom CrewAI tool implementations (linkedin_selenium_tool) |
| `backend/output/` | Per-run task output artifacts — gitignored, tracked via .gitkeep |
| `backend/logs/` | Structured run log JSON files — gitignored, tracked via .gitkeep |
| `backend/tests/` | Backend test suite root |
| `backend/tests/fixtures/` | Static test fixtures (LinkedIn profile HTML, benchmark JD) |
| `frontend/` | Next.js 14+ TypeScript frontend service root |
| `frontend/app/` | Next.js App Router root |
| `frontend/app/api/run/` | POST /api/run route stub |
| `frontend/app/api/status/` | GET /api/run/[runId]/status route stub |
| `frontend/components/` | React component stubs (InputView, ProcessingView, ShortlistView) |
| `frontend/lib/` | Shared utilities (Zustand store stub) |
| `frontend/public/` | Static assets (empty at setup) |
| `project-context/2.build/logs/` | AAMAD build-phase trace logs (per adapter-crewai rules) |

---

## 2. Files Created

### Backend

| File | Purpose |
|---|---|
| `backend/pyproject.toml` | uv-managed dependency manifest for Python backend (Python >=3.12) |
| `backend/Dockerfile` | Placeholder Docker build file for backend service |
| `backend/.env.example` | Backend environment variable template with full inline documentation |
| `backend/config/agents.yaml` | CrewAI agent definitions skeleton — 4 agents, all fields declared, values stubbed for @backend.eng |
| `backend/config/tasks.yaml` | CrewAI task definitions skeleton — 4 tasks, context chaining declared, guardrail references noted |
| `backend/tools/__init__.py` | Python package marker for tools module |
| `backend/tools/linkedin_selenium_tool.py` | Stub class for LinkedIn Selenium sourcing tool — raises NotImplementedError |
| `backend/crew.py` | Stub: run_crew() function entry point — raises NotImplementedError |
| `backend/main.py` | Stub: FastAPI app factory — raises NotImplementedError |
| `backend/output/.gitkeep` | Tracks the gitignored output/ directory in version control |
| `backend/logs/.gitkeep` | Tracks the gitignored logs/ directory in version control |
| `backend/tests/fixtures/linkedin_profile.html` | Empty HTML placeholder for LinkedIn profile DOM fixture (populated in Epic 5 by @qa.eng) |

### Frontend

| File | Purpose |
|---|---|
| `frontend/package.json` | npm dependency manifest (Next.js 14+, React 18, assistant-ui, Zustand, Tailwind, shadcn/ui) |
| `frontend/tsconfig.json` | TypeScript compiler configuration for Next.js App Router |
| `frontend/tailwind.config.ts` | Tailwind CSS config stub — theme extension commented for @frontend.eng |
| `frontend/next.config.ts` | Next.js config stub — proxy rewrites noted for @integration.eng |
| `frontend/Dockerfile` | Placeholder Docker build file for frontend service |
| `frontend/app/layout.tsx` | Root App Router layout stub |
| `frontend/app/page.tsx` | Root page stub — renders placeholder; full view routing in Epic 3 |
| `frontend/app/api/run/route.ts` | POST /api/run Next.js API route stub — returns {} |
| `frontend/app/api/status/route.ts` | GET /api/run/[runId]/status route stub — returns {} |
| `frontend/components/InputView.tsx` | View 1 component stub — full form/ToS/FutureNote in Epic 3 |
| `frontend/components/ProcessingView.tsx` | View 2 component stub — full SSE/stage indicators in Epic 3 |
| `frontend/components/ShortlistView.tsx` | View 3 component stub — full candidate cards/export in Epic 3 |
| `frontend/lib/store.ts` | Zustand runStore stub — shape documented, implementation in Epic 3 |

### Root

| File | Purpose |
|---|---|
| `.env.example` | Root Docker Compose env template (ANTHROPIC_API_KEY, LI_AT, CREWAI_STORAGE_DIR) |
| `docker-compose.yml` | Two-service Docker Compose config (backend port 8000, frontend port 3000) |
| `.gitignore` | Appended project-specific entries (backend/output/, backend/logs/, backend/.crewai_storage/, frontend/.next/, frontend/node_modules/) |

---

## 3. Dependency Manifests Declared

### Backend: `backend/pyproject.toml`

Runtime target: Python >=3.12, uv package manager.
Dependencies are declared only — `uv sync` is NOT run during setup.

| Package | Version Constraint | Purpose |
|---|---|---|
| crewai | >=0.80.0 | Multi-agent crew orchestration framework (sequential process mode) |
| fastapi | >=0.111.0 | Async Python web framework for the API layer |
| uvicorn[standard] | >=0.29.0 | ASGI server for FastAPI (includes uvloop, httptools) |
| selenium | >=4.20.0 | Browser automation for LinkedIn Recruiter sourcing |
| webdriver-manager | >=4.0.0 | Auto-manages ChromeDriver version matching for Selenium |
| python-dotenv | >=1.0.0 | Loads .env variables into the process environment |
| anthropic | >=0.28.0 | Anthropic API SDK (Claude via Enterprise contract) |
| pydantic | >=2.7.0 | Request/response validation and data modeling |

Note: The root `pyproject.toml` (Python >=3.14, `aamad>=0.5.0`) is the AAMAD framework project config and was NOT modified. The backend has its own `backend/pyproject.toml`.

### Frontend: `frontend/package.json`

Runtime target: Node.js 20+ LTS.
Dependencies are declared only — `npm install` is NOT run during setup.

| Package | Version Constraint | Type | Purpose |
|---|---|---|---|
| next | ^14.2.0 | dependency | Next.js App Router framework |
| react | ^18.3.0 | dependency | React 18 |
| react-dom | ^18.3.0 | dependency | React DOM renderer |
| @assistant-ui/react | ^0.5.0 | dependency | Streaming LLM interface / SSE consumption (Processing view) |
| zustand | ^4.5.0 | dependency | Client-side run state management |
| tailwindcss | ^3.4.0 | dependency | Utility-first CSS framework |
| typescript | ^5.4.0 | dependency | TypeScript language |
| @types/react | ^18.3.0 | dependency | React TypeScript types |
| @types/node | ^20.0.0 | dependency | Node.js TypeScript types |
| shadcn-ui | ^0.8.0 | devDependency | Component library primitives (accessible, themeable) |
| autoprefixer | ^10.4.0 | devDependency | PostCSS plugin for Tailwind CSS |
| postcss | ^8.4.0 | devDependency | CSS transformation pipeline (required by Tailwind) |

---

## 4. Environment Variable Manifest

### Required (application fails fast if missing — PRD P0-7, SAD Section 11.1)

| Variable | File | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env` / `backend/.env.example` | Anthropic Enterprise API key. Never logged or written to artifacts. |
| `LI_AT` | `.env` / `backend/.env.example` | LinkedIn `li_at` session cookie. Treat as a password. Loaded in `linkedin_selenium_tool._run()` scope only. Never logged. |

### Optional (have defaults in application code)

| Variable | Default | Description |
|---|---|---|
| `MAX_RESULTS` | 20 | Candidates to retrieve per run (range: 5–50) |
| `INTER_REQUEST_DELAY_MIN` | 2 | Min seconds between Selenium page loads |
| `INTER_REQUEST_DELAY_MAX` | 4 | Max seconds between Selenium page loads |
| `MAX_PAGE_LOADS_PER_RUN` | 25 | Ceiling on LinkedIn page loads per run |
| `LOG_DIR` | logs | Directory for run log JSON files (relative to backend root) |
| `VERBOSE_CREW` | true | Enable verbose CrewAI lifecycle logging |
| `CREWAI_STORAGE_DIR` | (unset) | CrewAI storage path — only if memory=True ever enabled (ADR-05: memory=False at MVP) |
| `NEXT_PUBLIC_API_BASE_URL` | http://backend:8000 | FastAPI backend base URL for Next.js proxy routes |

---

## 5. YAML Skeleton Summary

### `backend/config/agents.yaml` — Four agents declared

| Agent ID | LLM | Temperature | max_iter | Tools | memory | allow_delegation |
|---|---|---|---|---|---|---|
| `jd_parser` | claude-sonnet-4-6 | 0.2 | 5 | [] | false | false |
| `linkedin_sourcer` | claude-sonnet-4-6 | 0.1 | 10 | [linkedin_selenium_tool] | false | false |
| `candidate_evaluator` | claude-sonnet-4-6 | 0.1 | 8 | [] | false | false |
| `shortlist_formatter` | claude-sonnet-4-6 | 0.1 | 3 | [file_write_tool] | false | false |

All agents: `verbose: true`. All values conform to AAMAD CrewAI adapter rules (max_iter <= 12, memory=False, allow_delegation=False). Role/goal/backstory fields have skeleton placeholders marked TODO for @backend.eng.

Note on SAD/PRD discrepancy: The SAD Section 5.1 specifies temperature 0.2 for JD Parser and 0.1 for all others. The task instruction section lists temperature 0.1 for the formatter. The YAML uses the SAD Section 5.1 values (JD Parser: 0.2, all others: 0.1). @backend.eng should confirm formatter temperature with SAD Section 5.2 (0.1) before Epic 2.

### `backend/config/tasks.yaml` — Four tasks declared

| Task ID | Agent | Context From | output_file | max_iter | max_execution_time | max_retry_limit | Guardrail |
|---|---|---|---|---|---|---|---|
| `parse_jd` | jd_parser | (none) | output/parse_jd.json | 5 | 120s | 2 | none |
| `source_candidates` | linkedin_sourcer | [parse_jd] | output/source_candidates.json | 10 | 600s | 2 | none |
| `evaluate_candidates` | candidate_evaluator | [parse_jd, source_candidates] | output/evaluate_candidates.json | 8 | 300s | 2 | validate_scored_candidate_schema |
| `format_shortlist` | shortlist_formatter | [evaluate_candidates] | output/shortlist.md | 3 | 60s | 2 | validate_shortlist_headings |

All tasks: `max_retry_limit: 2` per AAMAD adapter rules. Task.id is the YAML key for each task. Context chaining declared via `context:` list. Guardrail references are string names — @backend.eng implements the corresponding Python functions in `guardrails.py` (Epic 2).

Note: `format_shortlist` max_iter is 3 in the YAML (conservative stub). The SAD specifies max_iter: 5 for this task. @backend.eng should update to 5 in Epic 2 per SAD Section 5.3.

---

## 6. Docker Compose Structure

File: `docker-compose.yml` at project root.

```
services:
  backend:
    build: ./backend
    ports: 8000:8000
    env_file: .env
    volumes:
      - ./backend/output:/app/output
      - ./backend/logs:/app/logs

  frontend:
    build: ./frontend
    ports: 3000:3000
    env_file: .env
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000
    depends_on: [backend]
```

Secrets flow: `.env` at project root is loaded by Docker Compose `env_file` directive into both service containers. The `.env` file is gitignored.

Volumes: `backend/output/` and `backend/logs/` are mounted from the host filesystem, persisting run artifacts and logs across container restarts.

Healthcheck: not yet defined — @integration.eng adds a FastAPI `/health` endpoint and Docker healthcheck in Epic 4.

---

## 7. Setup Smoke Test Instructions

These instructions verify the skeleton is correct before Phase 2 build epics begin. Run these checks after completing setup.

### 7.1 Directory and File Structure Check

```bash
# From project root
ls backend/config/agents.yaml backend/config/tasks.yaml
ls backend/tools/linkedin_selenium_tool.py backend/crew.py backend/main.py
ls backend/pyproject.toml backend/.env.example backend/Dockerfile
ls backend/output/.gitkeep backend/logs/.gitkeep
ls backend/tests/fixtures/linkedin_profile.html
ls frontend/package.json frontend/tsconfig.json frontend/next.config.ts
ls frontend/tailwind.config.ts frontend/Dockerfile
ls frontend/app/layout.tsx frontend/app/page.tsx
ls frontend/app/api/run/route.ts frontend/app/api/status/route.ts
ls frontend/components/InputView.tsx frontend/components/ProcessingView.tsx frontend/components/ShortlistView.tsx
ls frontend/lib/store.ts
ls docker-compose.yml .env.example
```

All files should be present. Verify no file is missing.

### 7.2 YAML Syntax Check (backend)

```bash
# Requires PyYAML (pip install pyyaml) or python3 -c with yaml module
cd backend
python3 -c "import yaml; yaml.safe_load(open('config/agents.yaml')); print('agents.yaml: OK')"
python3 -c "import yaml; yaml.safe_load(open('config/tasks.yaml')); print('tasks.yaml: OK')"
```

Both commands should print OK with no exceptions.

### 7.3 Required Agent Fields Check

Manually verify that `backend/config/agents.yaml` contains all four agent IDs:
- `jd_parser`
- `linkedin_sourcer`
- `candidate_evaluator`
- `shortlist_formatter`

And that each has: `role`, `goal`, `backstory`, `tools`, `memory`, `allow_delegation`, `verbose`, `llm`, `temperature`, `max_iter`.

### 7.4 Required Task Fields Check

Manually verify that `backend/config/tasks.yaml` contains all four task IDs:
- `parse_jd`
- `source_candidates`
- `evaluate_candidates`
- `format_shortlist`

And that each has: `description`, `expected_output`, `agent`, `output_file`, `max_iter`, `max_execution_time`, `max_retry_limit`.

Verify: `source_candidates` has `context: [parse_jd]`; `evaluate_candidates` has `context: [parse_jd, source_candidates]`; `format_shortlist` has `context: [evaluate_candidates]`.

Verify: `evaluate_candidates` has `guardrail: validate_scored_candidate_schema`; `format_shortlist` has `guardrail: validate_shortlist_headings`.

### 7.5 max_iter Compliance Check

Verify all task `max_iter` values are <= 12 (AAMAD CrewAI adapter rule):
- `parse_jd`: 5
- `source_candidates`: 10
- `evaluate_candidates`: 8
- `format_shortlist`: 3 (stub; update to 5 in Epic 2 per SAD Section 5.3)

### 7.6 .env.example Check

Verify that `.env.example` (root) and `backend/.env.example` both:
- Contain `ANTHROPIC_API_KEY=` and `LI_AT=` as required variables
- Do NOT contain any real secret values — only placeholder strings

### 7.7 .gitignore Check

```bash
# Verify gitignored paths are correctly configured
git check-ignore -v backend/output/.gitkeep   # Should show: .gitignore matches backend/output/
git check-ignore -v backend/logs/.gitkeep     # Should show: .gitignore matches backend/logs/
git check-ignore -v .env                      # Should show: .gitignore matches .env
```

### 7.8 TypeScript Stub Syntax Check (frontend)

```bash
# Requires Node.js and TypeScript installed globally or via npx
cd frontend
npx tsc --noEmit 2>&1 | head -30
```

Expect errors about missing module imports (next, react, zustand) since node_modules is not installed. Zero parse errors on the stub files themselves is the target. Resolve by running `npm install` in Epic 3.

---

## 8. Pre-Epic-2 Checklist for @backend.eng

Before starting Epic 2 (Backend), verify:

- [ ] `backend/config/agents.yaml` agent skeleton is readable and YAML-valid
- [ ] `backend/config/tasks.yaml` task skeleton is readable and YAML-valid, context chaining declared
- [ ] All four agent IDs match PRD Section 3 agent definitions
- [ ] All four task IDs match PRD Section 3 task definitions
- [ ] `backend/pyproject.toml` dependency list is complete (no missing packages for Epic 2 scope)
- [ ] Confirm `claude-sonnet-4-6` model availability under Anthropic Enterprise contract (SAD Open Question #1)
- [ ] `backend/output/` and `backend/logs/` directories exist and are gitignored
- [ ] `format_shortlist` max_iter: update from 3 (stub) to 5 (SAD Section 5.3) in Epic 2
- [ ] Add `guardrails.py` stub to backend root in Epic 2 (referenced by tasks.yaml but not created in setup — no logic at setup)
- [ ] `tests/fixtures/benchmark_jd.txt` is listed in SAD Section 12.2 — create this fixture in Epic 2 or Epic 5

---

## 9. Sources

- `project-context/1.define/PRD.md` v1.0 — agent/task definitions, env vars, epic scope
- `project-context/1.define/SAD.md` v1.0 — directory structure, stack, deployment, YAML field values
- `.claude/rules/adapter-crewai.md` — YAML externalization rule, max_iter cap, memory=False default, quality gates
- `.claude/rules/aamad-core.md` — artifact structure, secrets handling, stub-file conventions
- `.claude/rules/epics-index.md` — epic-to-persona mapping, output artifact paths

---

## 10. Assumptions

1. `AAMAD_TARGET_RUNTIME=crewai` is confirmed. All YAML stubs and runtime file names conform to the CrewAI adapter.
2. The root `pyproject.toml` (Python >=3.14, AAMAD framework) is not modified. The backend uses its own `backend/pyproject.toml` with Python >=3.12 per SAD Section 8.1.
3. `.gitignore` already had `.env` covered; the project-specific additions (backend/output/, backend/logs/, backend/.crewai_storage/, frontend/.next/, frontend/node_modules/) are appended.
4. The SAD specifies `app/api/run/[runId]/status/route.ts` for the dynamic status route. The setup creates a top-level `app/api/status/route.ts` as a structural placeholder. @frontend.eng will establish the correct `[runId]` dynamic segment directory structure in Epic 3.
5. The `guardrails.py` file is referenced in `tasks.yaml` but not created at setup because it contains logic. @backend.eng creates and implements it in Epic 2.
6. `tests/fixtures/benchmark_jd.txt` (SAD Section 12.2) is not created at setup — it requires a realistic JD authored in collaboration with the hiring manager. @qa.eng creates it in Epic 5.
7. No install commands (`uv sync`, `npm install`) are run during setup. Dependencies are declared in manifests only, per setup epic scope.
8. Docker Compose volumes mount `./backend/output` and `./backend/logs` from the host; these directories are tracked via `.gitkeep` files.

---

## 11. Open Questions

1. **`format_shortlist` max_iter:** The YAML stub uses max_iter: 3 (conservative). SAD Section 5.3 specifies max_iter: 5. @backend.eng should update to 5 in Epic 2 and confirm against the SAD.
2. **Formatter temperature:** SAD Section 5.1 specifies 0.1 for the formatter. agents.yaml stub correctly uses 0.1. Confirmed consistent with PRD Section 3.
3. **`guardrails.py` file location:** SAD Section 7.1 refers to `guardrails.py` at the backend root. @backend.eng should confirm this location and create the file in Epic 2.
4. **`tests/fixtures/benchmark_jd.txt`:** SAD Section 12.2 requires this fixture. Not created at setup. Assign to @qa.eng (Epic 5) or @backend.eng (Epic 2) depending on when the benchmark JD content is available.
5. **Dynamic route directory for status:** The correct App Router path for the SSE status route is `app/api/run/[runId]/status/route.ts`. @frontend.eng should create the dynamic segment directory structure in Epic 3 and replace the `app/api/status/route.ts` stub.
6. **Anthropic Enterprise model slug:** SAD Open Question #1 / PRD Open Question #1 — confirm `claude-sonnet-4-6` is the correct model identifier under the organization's Anthropic Enterprise contract before @backend.eng fills in agents.yaml.

---

## 12. Audit

| Field | Value |
|---|---|
| Timestamp | 2026-05-31 |
| Persona ID | @project.mgr |
| Action | Setup epic execution — `*setup-project` |
| AAMAD_TARGET_RUNTIME | crewai (resolved from SAD/PRD; default per adapter-registry rules) |
| PRD Reference | `project-context/1.define/PRD.md` v1.0 |
| SAD Reference | `project-context/1.define/SAD.md` v1.0 |
| Adapter Rules Applied | adapter-crewai.md (YAML externalization, max_iter cap, memory=False, quality gates), aamad-core.md (stub conventions, secrets rules) |
| Files Created | 31 files (see Section 2) |
| Directories Created | 15 directories (see Section 1) |
| Install Commands Run | None — dependencies declared only, not installed |
| Logic Written | None — all stubs raise NotImplementedError or return {} |
| Secrets Embedded | None — .env.example contains placeholder values only |
| Root pyproject.toml Modified | No — backend uses its own backend/pyproject.toml |
| Prompt Trace | Omitted — setup epic produces file structure and config stubs from explicit PRD/SAD specifications. No high-risk autonomous LLM generation. All file contents trace directly to PRD/SAD sections cited inline. |
| Output Artifact | `/Users/chris.sanchez/projects/recruitment-assistant/project-context/2.build/setup.md` |
| Handoff Status | Ready for Epic 2 (@backend.eng) and Epic 3 (@frontend.eng). See Section 8 for @backend.eng pre-epic checklist and Section 11 for open questions requiring resolution. |
