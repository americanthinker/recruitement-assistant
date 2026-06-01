# Product Requirements Document (PRD)
## Recruitment Assistant — AI-Powered Candidate Sourcing Tool

**Project:** Recruitment Assistant
**Persona:** @product-mgr
**Phase:** 1 — Define
**Date:** 2026-05-31
**Version:** 1.0
**MRD Reference:** `project-context/1.define/MRD.md` v1.1
**Runtime Target:** `AAMAD_TARGET_RUNTIME=crewai`

---

## 1. Executive Summary

### Problem Statement

A single hiring manager currently performs all LinkedIn candidate sourcing manually — a workflow that consumes an estimated 15–30 hours per open role (LinkedIn Talent Solutions Global Talent Trends Report, 2024). The manual workflow consists of: constructing Boolean search queries inside the LinkedIn Recruiter UI, reviewing profiles one by one, annotating candidates, and assembling a shortlist in a document or spreadsheet before handing off to the recruiting team. There is no automation layer in any part of this workflow today.

The quantified pain points are:

- **Time-to-shortlist:** 3–10 business days per role for a manual sourcing cycle. Sourcing consumes approximately 20–30% of the total time-to-hire median of 44 days (LinkedIn Global Talent Trends, 2024).
- **Cognitive load:** Boolean search construction requires the hiring manager to manually translate a natural-language job description into structured search syntax — a repeated, high-effort translation task that produces inconsistent coverage across runs.
- **Shortlist opacity:** Candidate selection from manual review is implicit and undocumented, making it impossible to audit why a candidate was included or excluded. The recruiting team that acts on the shortlist has no visibility into selection rationale.
- **No scalability:** For each new open role, the full manual cycle repeats. There is no reuse, no learning, and no parallelism.

The opportunity is entirely internal. This is not a commercial SaaS product — it is a personal productivity multiplier for a single hiring manager with no existing automation in their sourcing workflow.

### Solution Overview

The Recruitment Assistant is a standalone web application backed by a four-agent CrewAI crew that:

1. Accepts a job description as freeform text input
2. Parses the job description into structured search criteria via an LLM-powered parsing agent
3. Sources candidate profiles from LinkedIn using a Selenium browser automation agent authenticated via the `li_at` session cookie
4. Scores each candidate against the parsed job description criteria using an LLM-powered evaluation agent (Anthropic Claude, pinned to `claude-sonnet-4-6`)
5. Assembles and exports a ranked, annotated shortlist as a Markdown document via a formatting agent

Key differentiators versus the current manual workflow and versus commercial alternatives:

- **Natural language to search criteria translation:** No Boolean syntax construction by the hiring manager. The JD Parser Agent handles query construction from a raw job description paste.
- **Explainable, per-criterion scoring:** Every candidate receives a score with structured per-criterion pass/fail rationale bullets grounded in the job description. Hiring managers consistently flag "black box scoring" as the primary reason they distrust automated shortlists (LinkedIn Talent Connect Survey, 2024). This system is not a black box — every rank position is auditable.
- **End-to-end autonomous run:** Input is a job description. Output is a ready-to-use shortlist. No manual steps between input and shortlist delivery.
- **Organizational alignment:** The LLM layer runs on the organization's existing Anthropic Enterprise contract. No new vendor procurement, no additional data processing agreements, no new security review for the AI component.

Expected productivity outcomes (based on analogous recruiter automation deployments):

- 60–80% reduction in sourcing time per role
- Time-to-shortlist from 3–10 business days to under 15 minutes per run
- Shortlist acceptance rate target: >70% of shortlisted candidates retained by the hiring manager without manual removal

### Strategic Rationale

A four-agent sequential multi-agent architecture is the correct design for this problem because the workflow is a natural linear task chain with explicit data dependencies between stages: parsing must precede search, search must precede scoring, scoring must precede formatting. Sequential process mode in CrewAI produces deterministic, reproducible execution with explicit `Task.context` chaining — each agent receives only the structured output of the previous agent as its input. This design also isolates the highest-risk component (the Selenium browser automation sourcing tool) to a single agent with a bounded tool surface, minimizing blast radius if the LinkedIn UI changes or the session expires.

The multi-agent decomposition also provides a clear extension path: future agents (ATS integration, outreach draft generation, diversity signal analysis) can be added as new agents without restructuring the existing crew. A monolithic script would require full rewrite to accommodate any of these extensions.

The build case is strong: the hiring manager's time is the primary resource being optimized, the build surface is narrow (four agents, one custom tool, one web UI), and the only external dependency for the LLM layer is an Anthropic Enterprise API key that is assumed active under the organization's existing contract.

---

## 2. Market Context and User Analysis

### Target User Persona

**Persona: The Hands-On Hiring Manager**

This system has exactly one user at MVP.

| Attribute | Detail |
|---|---|
| Role | Hiring manager at a technology or knowledge-work organization |
| LinkedIn access | Active LinkedIn Recruiter seat |
| Technical comfort | Comfortable with web-based tools; not expected to interact with the CLI, configuration files, or environment variables directly beyond initial setup |
| Sourcing frequency | Multiple open roles concurrently; sourcing is a recurring weekly workflow activity |
| Current tooling | LinkedIn Recruiter UI (native, no automation); shortlist assembled manually in a doc or spreadsheet |
| Primary pain | Time spent on Boolean search construction and one-by-one profile review |
| Secondary pain | Inability to explain to the recruiting team why a candidate ranked where they did |
| Trust threshold | Will not forward a shortlist they have not reviewed; human review is non-negotiable |
| Adoption risk | Low — sole user, has agreed to use the tool, no training or change management overhead |

**Persona: The Recruiting Team Recipient (non-user, output consumer)**

The recruiting team does not interact with the system directly. They receive the shortlist as a Markdown export (via email, shared document, or file transfer) and handle all candidate outreach independently. Their only requirement is that the shortlist format is immediately usable without translation — name, title, company, score, rationale bullets, and a direct LinkedIn profile link per candidate.

### User Journey

**Phase 1 — Input (< 2 minutes)**
The hiring manager navigates to the web UI, pastes a job description into the input form, optionally adjusts structured override fields (target location, experience range, must-have skills emphasis), and submits the run.

**Phase 2 — Autonomous Processing (< 15 minutes target)**
The crew runs without user interaction. A processing status panel in the UI shows which agent is currently executing (Parsing, Searching, Scoring, Formatting). No action is required from the hiring manager during this phase — they can leave the page and return.

**Phase 3 — Review and Export (5–10 minutes)**
The hiring manager reviews the shortlist in the UI. Each candidate card displays: name, current title and company, location, match score, per-criterion rationale bullets, and a LinkedIn profile link. The hiring manager removes any candidates they deem unsuitable, optionally adds a brief note to the shortlist, and exports it as a Markdown file. The Markdown file is shared with the recruiting team.

### Adoption Barriers and Success Factors

**Adoption barriers (low overall):**
- Initial `li_at` cookie setup requires the hiring manager to extract a session cookie from browser developer tools. This is a one-time setup step documented in the README with step-by-step instructions. The cookie expires periodically and must be refreshed — this is the most likely ongoing friction point.
- Trust in AI scoring must be established through shortlist quality. If early shortlists surface clearly poor-fit candidates, the hiring manager will revert to manual review. The explainable per-criterion rationale is the primary trust-building mechanism.

**Success factors:**
- Shortlist quality (acceptance rate) must be demonstrably high from the first few runs to build hiring manager confidence.
- Run time must stay under the 15-minute target. Exceeding this erodes the "autonomous, hands-off" value proposition.
- The shortlist format must require zero reformatting before it reaches the recruiting team.

### Competitive Landscape (Internal Tool Frame)

No existing internal tool is being displaced. The baseline is fully manual LinkedIn Recruiter usage. Commercial alternatives exist (HireEZ, SeekOut, Beamery, Findem) but are not used internally and are not in scope for comparison at MVP. The relevant competitive reference point is the manual workflow, not a competing product.

For context: commercial recruiting automation platforms report 50–70% reduction in time-to-shortlist versus manual LinkedIn Recruiter usage. This system targets 60–80% reduction, which is consistent with that range given the additional benefit of eliminating Boolean search construction (a step commercial tools still require the recruiter to perform manually).

---

## 3. Technical Requirements and Architecture

### Runtime Specifications

| Parameter | Value |
|---|---|
| `AAMAD_TARGET_RUNTIME` | `crewai` |
| CrewAI process mode | Sequential |
| CrewAI version | Pinned in `pyproject.toml` (v0.80+ minimum) |
| LLM provider | Anthropic Claude via Anthropic Enterprise |
| LLM model | `claude-sonnet-4-6` (pinned in `config/agents.yaml`) |
| LLM temperature | 0.1 for evaluation and formatting tasks; 0.2 for JD parsing |
| Memory | `memory=False` (default; each run is stateless) |
| `max_iter` | <= 12 for all tasks (adapter rule) |
| `max_rpm` | Set at crew level for Anthropic token budget stability |
| `max_retry_limit` | >= 2 for all tasks (adapter rule) |
| Config externalization | All agent and task definitions in `config/agents.yaml` and `config/tasks.yaml` |
| LinkedIn sourcing | Selenium WebDriver + `li_at` session cookie browser automation |
| Authentication | `LI_AT` environment variable (cookie value); `ANTHROPIC_API_KEY` environment variable |
| Shortlist output | Markdown file artifact |
| Candidate PII persistence | None — profile data flows in-memory only; shortlist export is the sole persistent artifact |
| `CREWAI_STORAGE_DIR` | Set to project-scoped path if any run-level storage is used |

### Crew Composition and Task Chain

The crew consists of four agents executing in strict sequential order. Each agent receives the structured output of its predecessor via `Task.context` chaining. No agent has `allow_delegation=True` at MVP — delegation is not justified for this linear workflow.

```
JD Parser Agent
    → Task: parse_jd
    → Output: structured search criteria (JSON)
    |
    v
LinkedIn Sourcing Agent
    → Task: source_candidates
    → Input context: parse_jd output
    → Output: raw candidate profile list (JSON)
    |
    v
Evaluation/Scoring Agent
    → Task: evaluate_candidates
    → Input context: parse_jd output + source_candidates output
    → Output: scored candidate list with per-criterion rationale (JSON)
    |
    v
Shortlist Formatting Agent
    → Task: format_shortlist
    → Input context: evaluate_candidates output
    → Output: ranked shortlist Markdown document (file artifact)
```

### Core Agent Definitions

All agent definitions below are externalized to `config/agents.yaml`. The fields below define the full agent specification. The `config/tasks.yaml` entries reference these agents by `id`.

---

**Agent 1: JD Parser Agent**

```yaml
agent: jd_parser
role: "Job Description Analyst"
goal: >
  Parse a raw job description into a structured set of search criteria that the
  LinkedIn Sourcing Agent can use to execute a targeted candidate search. Extract
  required skills, preferred skills, minimum years of experience, seniority level,
  location constraints, role title keywords, and any explicit must-have or
  disqualifying conditions stated in the job description.
backstory: >
  You are a senior talent acquisition specialist with deep experience translating
  job descriptions into precise, Boolean-ready search criteria. You have extensive
  knowledge of skills taxonomies across engineering, GTM, operations, and business
  functions. You understand the difference between stated requirements and implied
  requirements, and you know that precision in search criteria directly determines
  the quality of candidates surfaced. Your output is always structured and machine-
  readable — downstream agents depend on it exactly as written.
tools: []
memory: false
allow_delegation: false
llm: claude-sonnet-4-6
temperature: 0.2
max_iter: 5
```

**Task: parse_jd**

```yaml
task: parse_jd
agent: jd_parser
description: >
  Parse the provided job description text into a structured JSON object containing
  the following fields: required_skills (list), preferred_skills (list),
  experience_min_years (integer), experience_max_years (integer or null),
  seniority_level (string: junior | mid | senior | staff | principal | manager |
  director), role_title_keywords (list), location (string or null),
  location_remote_ok (boolean), must_have_conditions (list of strings),
  disqualifying_conditions (list of strings). If a field cannot be determined from
  the job description, use null or an empty list as appropriate.
expected_output: >
  A valid JSON object with all specified fields. No markdown fences, no prose, no
  commentary — raw JSON only. Output saved to: output/parse_jd.json
task_id: parse_jd
output_file: output/parse_jd.json
max_iter: 5
max_execution_time: 120
```

---

**Agent 2: LinkedIn Sourcing Agent**

```yaml
agent: linkedin_sourcer
role: "LinkedIn Candidate Sourcer"
goal: >
  Search LinkedIn Recruiter for candidate profiles that match the structured search
  criteria produced by the JD Parser Agent. Retrieve candidate profiles up to the
  configured max_results ceiling and return structured profile data for each
  candidate retrieved. Operate the browser session safely: use deliberate inter-
  request delays, do not exceed the configured page load budget per run, and handle
  session expiry and navigation errors gracefully.
backstory: >
  You are a technical sourcing specialist who uses browser automation to search
  LinkedIn Recruiter at scale. You understand how LinkedIn's search interface works,
  how to construct effective search queries from structured criteria, and how to
  navigate profile pages to extract the data fields the evaluation agent needs. You
  treat the LinkedIn session cookie as a sensitive credential and never expose it in
  logs or outputs. You are disciplined about inter-request delays and session hygiene
  to minimize the risk of automated session detection.
tools:
  - linkedin_selenium_tool
memory: false
allow_delegation: false
llm: claude-sonnet-4-6
temperature: 0.1
max_iter: 10
```

**Task: source_candidates**

```yaml
task: source_candidates
agent: linkedin_sourcer
description: >
  Using the structured search criteria from the parse_jd task output, execute a
  LinkedIn Recruiter search via the linkedin_selenium_tool. Retrieve up to
  max_results candidate profiles (configurable; default 20). For each candidate,
  extract the following fields from their LinkedIn profile: full_name (string),
  current_title (string), current_company (string), location (string),
  linkedin_profile_url (string), years_of_experience_total (integer or null,
  estimated from work history), skills (list of strings from the Skills section),
  experience_history (list of objects: {title, company, start_date, end_date,
  is_current}), education (list of objects: {institution, degree, field_of_study}),
  open_to_work (boolean), summary_snippet (string, first 200 characters of the
  About section if present). Return all fields available from DOM scraping; set
  unavailable fields to null.
expected_output: >
  A valid JSON array of candidate profile objects, each containing the fields
  specified above. No markdown fences. Output saved to: output/source_candidates.json
task_id: source_candidates
context: [parse_jd]
output_file: output/source_candidates.json
max_iter: 10
max_execution_time: 600
```

**LinkedIn Selenium Tool Specification**

The `linkedin_selenium_tool` is a custom CrewAI tool — the only component that interacts with the browser session and the `li_at` cookie. It is bound exclusively to the LinkedIn Sourcing Agent and not exposed to any other agent.

Tool contract:

| Property | Value |
|---|---|
| Tool name | `linkedin_selenium_tool` |
| Input | Structured search criteria JSON (from `parse_jd` output) + `max_results` integer |
| Output | JSON array of candidate profile objects |
| Browser driver | Selenium WebDriver (Chrome/Chromium, headless) |
| Authentication | `li_at` cookie injected from `LI_AT` environment variable at tool initialization |
| Inter-request delay | Configurable; default 2–4 seconds between page navigations (randomized within range) |
| Session reuse | Single session per crew run; no cross-run session persistence |
| Cookie handling | `LI_AT` value loaded from env var at runtime; never logged, never written to any file or artifact |
| Max page loads per run | Configurable ceiling (default: max_results + 5 navigation steps for search pagination) |
| Failure handling | On Selenium exception (element not found, navigation timeout, session expiry): retry up to 2 times with exponential backoff, then halt with structured error output |
| LinkedIn UI change handling | If expected DOM selectors are not found, log selector names that failed (not cookie value), write a Diagnostic entry, and return a partial result rather than crashing |

Candidate profile fields extractable via Selenium from the LinkedIn Recruiter UI (subject to LinkedIn UI changes):

| Field | Source in LinkedIn UI | Reliability |
|---|---|---|
| `full_name` | Profile header | High |
| `current_title` | Profile header | High |
| `current_company` | Profile header | High |
| `location` | Profile header | High |
| `linkedin_profile_url` | Browser URL on profile page | High |
| `skills` | Skills section (visible tags) | Medium — section may be collapsed or absent |
| `experience_history` | Experience section | Medium — date parsing varies |
| `years_of_experience_total` | Computed from experience_history | Medium — derived field |
| `education` | Education section | Medium |
| `open_to_work` | Open To Work badge on profile photo | Low — not always displayed |
| `summary_snippet` | About section | Low — section may be absent |

Fields marked Medium or Low reliability must be set to `null` rather than fabricated if not found in the DOM. The evaluation agent is designed to score on available fields only.

---

**Agent 3: Evaluation/Scoring Agent**

```yaml
agent: evaluator
role: "Candidate Evaluation Specialist"
goal: >
  Score each candidate profile against the structured job description criteria
  produced by the JD Parser Agent. For every candidate, produce a numeric match
  score (0–100) and per-criterion pass/fail assessments with rationale bullets
  that directly reference the job description requirements and the candidate's
  profile data. Do not invent profile data — score only on evidence present in
  the profile. Flag when a field is null and a criterion cannot be assessed.
backstory: >
  You are a senior technical recruiter and talent assessor with expertise in
  structured candidate evaluation. You understand that a numeric score without
  rationale is useless — hiring managers need to see exactly why a candidate ranked
  where they did. You are rigorous about grounding every assessment in specific
  evidence from the candidate's profile and specific criteria from the job
  description. You flag uncertainty rather than fabricating evidence. Your output
  is the foundation of the hiring manager's trust in this system.
tools: []
memory: false
allow_delegation: false
llm: claude-sonnet-4-6
temperature: 0.1
max_iter: 8
```

**Task: evaluate_candidates**

```yaml
task: evaluate_candidates
agent: evaluator
description: >
  For each candidate in the source_candidates output, evaluate the candidate against
  the criteria in the parse_jd output. Produce a scored candidate object for each
  candidate with the following fields: full_name, current_title, current_company,
  location, linkedin_profile_url, open_to_work, match_score (integer 0-100),
  score_rationale (object with one entry per criterion from parse_jd: criterion_name,
  result (pass | partial | fail | cannot_assess), evidence (string citing specific
  profile data), and notes (string, optional)). Score weighting: required_skills
  criteria carry 2x weight of preferred_skills criteria. must_have_conditions that
  are not met result in automatic disqualification (match_score capped at 30).
  disqualifying_conditions that are present result in automatic disqualification
  (match_score set to 0). Set match_score to null if fewer than 3 criteria can be
  assessed due to missing profile data, and flag the candidate as data_insufficient.
expected_output: >
  A valid JSON array of scored candidate objects with all specified fields.
  No markdown fences. Output saved to: output/evaluate_candidates.json.
  Guardrail: each scored candidate object must include match_score and at least
  one score_rationale entry. Any object missing these fields fails validation
  and triggers a Diagnostic.
task_id: evaluate_candidates
context: [parse_jd, source_candidates]
output_file: output/evaluate_candidates.json
guardrail: validate_scored_candidate_schema
max_iter: 8
max_execution_time: 300
```

Scoring rubric for the evaluation agent (embedded in task instructions):

| Score Range | Interpretation |
|---|---|
| 85–100 | Strong match — meets all required criteria, most preferred criteria |
| 70–84 | Good match — meets all required criteria, some preferred criteria |
| 55–69 | Partial match — meets most required criteria, notable gaps |
| 30–54 | Weak match — meets some required criteria, significant gaps |
| 1–29 | Poor match — meets few criteria; include only if disqualification rules not triggered |
| 0 | Auto-disqualified — disqualifying condition present |

---

**Agent 4: Shortlist Formatting Agent**

```yaml
agent: formatter
role: "Shortlist Document Author"
goal: >
  Assemble the scored and ranked candidate evaluation results into a structured,
  readable Markdown shortlist document that the hiring manager can review directly
  and forward to the recruiting team without any reformatting. The document must be
  ranked by match_score descending, include all required fields per candidate, and
  follow the required Markdown heading structure exactly.
backstory: >
  You are a technical writer and recruiting operations specialist. You know that the
  shortlist document is the product the recruiting team will act on. It must be clear,
  complete, and require zero additional work from the hiring manager or the recruiting
  team. You format rigorously, you rank correctly, and you never omit a required field.
  Your output goes directly to the hiring manager's screen and then to the recruiting
  team — there is no intermediate editing step between your output and its use.
tools:
  - file_write_tool
memory: false
allow_delegation: false
llm: claude-sonnet-4-6
temperature: 0.1
max_iter: 5
```

**Task: format_shortlist**

```yaml
task: format_shortlist
agent: formatter
description: >
  Using the scored candidate list from evaluate_candidates output, produce a ranked
  Markdown shortlist document. Sort candidates by match_score descending. Exclude
  candidates with match_score of 0 (auto-disqualified). Include candidates with
  data_insufficient flag at the end of the document in a separate section. The
  Markdown document must use the following heading structure exactly:

  # Candidate Shortlist: [Role Title from JD]
  **Generated:** [timestamp]
  **Role:** [role_title_keywords joined as string]
  **Criteria:** [required_skills and preferred_skills summary]
  **Total candidates evaluated:** [count]
  **Shortlisted candidates:** [count of candidates with match_score >= 55]

  ## Ranked Candidates

  ### [Rank]. [Full Name] — Score: [match_score]/100
  **Current Role:** [current_title] at [current_company]
  **Location:** [location]
  **Open to Work:** [Yes | No | Unknown]
  **LinkedIn:** [linkedin_profile_url]

  #### Match Rationale
  | Criterion | Result | Evidence |
  |---|---|---|
  | [criterion_name] | [pass/partial/fail/cannot_assess] | [evidence] |

  ---

  ## Candidates with Insufficient Profile Data
  [List of data_insufficient candidates with name, profile URL, and note]

  ---

  ## Notes
  [Placeholder for hiring manager annotations — leave blank]

expected_output: >
  A valid Markdown file following the heading structure above exactly. Output saved
  to: output/shortlist.md. Guardrail: validate that required headings are present
  before writing. If any required heading is missing, write a Diagnostic and halt.
task_id: format_shortlist
context: [evaluate_candidates]
output_file: output/shortlist.md
guardrail: validate_shortlist_headings
max_iter: 5
max_execution_time: 60
human_input: false
```

### Integration Requirements

| Component | Specification |
|---|---|
| LinkedIn integration | Selenium WebDriver + `li_at` cookie. No official API at MVP. Cookie value from `LI_AT` env var exclusively. |
| Anthropic API | Anthropic Enterprise endpoint. API key from `ANTHROPIC_API_KEY` env var. |
| Web framework | FastAPI (Python) or Flask — lightweight, single-user, no auth layer required at MVP |
| Frontend | Single-page HTML/JavaScript — no frontend framework required; vanilla JS sufficient |
| File storage | Local filesystem for output artifacts (`output/` directory, gitignored) |
| Logging | Structured JSON log per crew run: run_id, jd_hash, candidates_retrieved, candidates_scored, shortlist_size, total_duration_seconds, errors, retries |
| Secrets | `.env` file (gitignored); `.env.example` provided with all required keys |

Required environment variables:

```
ANTHROPIC_API_KEY=<Anthropic Enterprise API key>
LI_AT=<LinkedIn li_at session cookie value>
```

Optional environment variables:

```
MAX_RESULTS=20                  # Candidates to retrieve per run (default: 20)
INTER_REQUEST_DELAY_MIN=2       # Min seconds between Selenium page loads (default: 2)
INTER_REQUEST_DELAY_MAX=4       # Max seconds between Selenium page loads (default: 4)
CREWAI_STORAGE_DIR=.crewai_storage  # Project-scoped storage path if used
LOG_DIR=logs                    # Directory for run logs
```

### Infrastructure Specifications

| Parameter | Specification |
|---|---|
| Deployment target | Local machine or private cloud VM (not publicly accessible) |
| Compute | 2 vCPU, 4GB RAM minimum (standard developer laptop or small cloud VM is sufficient) |
| Browser runtime | Chrome/Chromium with ChromeDriver (matching version); managed via `webdriver-manager` |
| Python version | Pinned in `.python-version` |
| Package management | `uv` (per project existing tooling; `pyproject.toml` + `uv.lock`) |
| Network access | Outbound to `linkedin.com` (Selenium) and `api.anthropic.com` (LLM) |
| Multi-user | Not supported at MVP — single-user access only |
| High availability | Not required — single user, local or private cloud |
| SSL/TLS | Not required for local deployment; required if deployed to private cloud instance accessible over network |

---

## 4. Functional Requirements

### P0 — Core Features (Must Have for MVP)

**P0-1: Job Description Input**

User story: As the hiring manager, I can paste a raw job description into a text area on the web UI and submit it to start a sourcing run, so that I never have to manually construct a Boolean search query.

Acceptance criteria:
- The input form accepts freeform text (minimum 100 characters; maximum 10,000 characters)
- The form includes optional structured override fields: location filter (text), minimum years of experience (integer), maximum years of experience (integer), must-have skills (comma-separated text). These fields augment — they do not replace — the JD parsing agent's output
- Submitting the form initiates the crew run and transitions the UI to the processing status view
- The submitted job description text is not persisted server-side after the run completes

**P0-2: Autonomous Crew Execution**

User story: As the hiring manager, I can submit a job description and walk away while the system searches and scores candidates autonomously, so that I do not have to monitor or intervene during the sourcing process.

Acceptance criteria:
- The four-agent crew (JD Parser, LinkedIn Sourcer, Evaluator, Formatter) executes in sequential order without user intervention
- Each task completes before the next begins (`Task.context` chaining enforced)
- The system handles Selenium-level failures (navigation timeout, element not found, session expiry) with retry logic (max_retry_limit >= 2) before halting
- The system halts with a structured error message visible in the UI if any task fails after retries are exhausted
- Total run duration target: < 15 minutes for a 20-candidate run

**P0-3: Processing Status Display**

User story: As the hiring manager, I can see which stage of the sourcing process is currently running, so that I know the system is working and I can estimate when it will complete.

Acceptance criteria:
- The processing status view displays four stages: Parsing JD, Searching LinkedIn, Scoring Candidates, Generating Shortlist
- The currently active stage is visually highlighted (e.g., spinner or active state indicator)
- Completed stages are marked as done
- If the run fails, the failed stage is marked with an error indicator and a brief error message is displayed
- The UI does not require the page to be open continuously — the run completes server-side; if the user returns to the page after the run completes, the shortlist is available

**P0-4: Ranked Shortlist Display**

User story: As the hiring manager, I can view the ranked candidate shortlist in the web UI with each candidate's score, per-criterion rationale, and LinkedIn profile link, so that I can make an informed review decision for each candidate.

Acceptance criteria:
- The shortlist view displays candidates ranked by `match_score` descending
- Each candidate card displays: full name, current title, current company, location, open to work status, match score (0–100), LinkedIn profile URL (clickable link), and a rationale table with one row per criterion (criterion name, result, evidence)
- Auto-disqualified candidates (score = 0) are not displayed in the main shortlist
- Candidates with `data_insufficient` flag are displayed in a separate section at the bottom of the shortlist with a note explaining the flag
- The shortlist displays a run summary at the top: role title, criteria summary, total candidates evaluated, shortlisted candidate count, run timestamp

**P0-5: Candidate Removal**

User story: As the hiring manager, I can remove individual candidates from the shortlist before exporting it, so that I can apply my own judgment before the shortlist reaches the recruiting team.

Acceptance criteria:
- Each candidate card includes a "Remove" action (button or link)
- Removing a candidate removes them from the shortlist view immediately without a page reload
- Removed candidates are not included in the exported shortlist Markdown document
- There is no undo for removal in MVP — a page refresh reloads the full shortlist from the `output/shortlist.md` artifact

**P0-6: Shortlist Export**

User story: As the hiring manager, I can export the shortlist as a Markdown file, so that I can share it with the recruiting team immediately without reformatting.

Acceptance criteria:
- An "Export Shortlist" button is available on the shortlist view
- Clicking the button triggers a download of `shortlist.md` with the current shortlist content (including any removals made in the UI)
- The exported Markdown follows the heading structure defined in the `format_shortlist` task specification exactly
- The export file is not stored server-side after download in MVP

**P0-7: Environment Secrets Configuration**

User story: As the system operator (hiring manager or technical setup person), I can configure required secrets via environment variables so that no credentials are embedded in code or configuration files.

Acceptance criteria:
- `.env.example` is provided with all required and optional environment variable names and comments
- `.env` is gitignored
- The application fails fast with a clear error message if `ANTHROPIC_API_KEY` or `LI_AT` is not set in the environment at startup
- The `LI_AT` cookie value is never written to any log file, artifact, or standard output
- Setup README includes step-by-step instructions for extracting the `li_at` cookie from the browser (referencing the approach documented in `crewai-recruitment-example.md`)

### P1 — Enhanced Features (Target for MVP, Deferrable if Needed)

**P1-1: Run History Summary**

User story: As the hiring manager, I can see a summary of previous runs (role title, timestamp, candidate count, run duration) in the web UI, so that I can track sourcing activity across roles.

Acceptance criteria:
- Run summary entries are written to a structured JSON log file after each completed run
- The UI displays a run history table showing: run ID, job description title (extracted from JD or user-provided label), timestamp, candidates retrieved, candidates shortlisted, run duration
- No candidate PII is stored in the run history log — only aggregate counts and metadata

**P1-2: Configurable Search Parameters via UI**

User story: As the hiring manager, I can adjust the candidate retrieval ceiling (max_results) and search filters (location, experience range) from the web UI without editing environment variables or code, so that I can tune the search scope for each role.

Acceptance criteria:
- The input form exposes: max_results (integer slider or text input, range 5–50, default 20), location filter (text input), experience range (min years, max years integer inputs), must-have skills emphasis (comma-separated text input)
- These values override the environment variable defaults for the current run only
- Validation: max_results must be between 5 and 50; experience values must be non-negative integers

**P1-3: Shortlist Annotation**

User story: As the hiring manager, I can add a brief note to the shortlist before exporting it, so that I can provide context to the recruiting team about the search criteria or any caveats.

Acceptance criteria:
- A text area labeled "Notes for recruiting team" is available on the shortlist view
- Notes entered are included in the exported Markdown under the `## Notes` section
- Notes are not persisted server-side — they apply to the current export session only

**P1-4: LinkedIn ToS Risk Acknowledgment**

User story: As the hiring manager, I am shown a clear risk disclosure about the LinkedIn Terms of Service implications of the Selenium-based sourcing approach before I use the tool for the first time, so that I have given informed consent before running the system.

Acceptance criteria:
- On first run submission (or on every run if preferred), a modal or prominent notice is displayed before execution begins, summarizing: the Selenium/cookie approach is used because the official LinkedIn Recruiter API is not available; this approach may violate LinkedIn's Terms of Service; the risk of automated session detection and account action is accepted by the user
- The user must actively acknowledge the notice (checkbox or "I understand" button) before the run proceeds
- The acknowledgment is recorded in the run log

**P1-5: Agent Progress Polling**

User story: As the hiring manager, I can see live progress within the current stage (e.g., "Sourced 12 of 20 candidates") so that I have more granular visibility into long-running stages.

Acceptance criteria:
- The backend exposes a status polling endpoint that the frontend can query every 10 seconds
- The status endpoint returns: current_stage, stage_detail (e.g., candidate count progress for the sourcing stage), elapsed_time_seconds
- The frontend displays stage detail text below the active stage indicator

### P2 — Future Features (Backlog, Not MVP Scope)

**P2-1: ATS Integration**

Export the shortlist directly to a supported ATS (Greenhouse, Lever, or Workday) via API, eliminating the manual file-transfer step for the recruiting team.

Deferral rationale: Requires ATS API credentials, data field mapping, and additional security review. No immediate blocker without it. Candidate handoff via Markdown export is sufficient for MVP.

**P2-2: Outreach Draft Generation**

Generate a personalized outreach message draft for each shortlisted candidate, pre-populated with role and company details.

Deferral rationale: Out of scope per user decision. The recruiting team handles all candidate outreach.

**P2-3: Multi-User Access and Role Management**

Support multiple hiring managers as separate users, each with their own run history, shortlists, and LinkedIn sessions.

Deferral rationale: Single-user at MVP. Multi-user requires session isolation, access control, and per-user secret management — not justified for current scope.

**P2-4: Batch Multi-Role Sourcing**

Accept multiple job descriptions and run the crew for each in sequence, producing separate shortlists per role in a single session.

Deferral rationale: Single-role per run is sufficient for MVP. Batch mode requires queue management and result isolation logic.

**P2-5: Diversity Signal Analysis**

Analyze shortlisted candidates for diversity signals and surface a composition summary to the hiring manager.

Deferral rationale: Requires careful legal review before implementation. Not pursued until legal guidance is obtained.

**P2-6: Candidate Talent Pool / Database**

Persist candidate profile data across runs to build a searchable internal talent pool.

Deferral rationale: PII retention concerns. Deferred until an organizational data handling policy covering LinkedIn-sourced candidate data is defined and approved.

**P2-7: LinkedIn Recruiter API Migration**

Replace the Selenium/`li_at` cookie sourcing mechanism with the official LinkedIn Recruiter API once credentials are procured.

Deferral rationale: Official LinkedIn Recruiter API credentials are not available at MVP. This migration eliminates the LinkedIn ToS risk and Selenium fragility — it is the highest-priority future work item. Initiation depends on procurement through the LinkedIn partner program. The sourcing agent tool surface is designed to be replaceable without restructuring the crew.

**P2-8: PDF Export**

Export the shortlist as a formatted PDF in addition to Markdown.

Deferral rationale: Markdown is sufficient for MVP. PDF adds a rendering dependency (e.g., WeasyPrint or Playwright-based export) that is not justified for the single-user case.

---

## 5. Non-Functional Requirements

### Performance Requirements

| Metric | Target | Notes |
|---|---|---|
| Time-to-shortlist (end-to-end) | < 15 minutes for a 20-candidate run | Dominated by Selenium inter-request delays; tunable via `INTER_REQUEST_DELAY_MIN/MAX` |
| JD parsing task duration | < 30 seconds | LLM-bound; no external I/O |
| LinkedIn sourcing task duration | < 480 seconds (8 minutes) for 20 candidates | Browser-automation-bound with deliberate delays |
| Candidate evaluation task duration | < 180 seconds for 20 candidates | LLM-bound; scales linearly with candidate count |
| Shortlist formatting task duration | < 30 seconds | LLM + file write; fast |
| UI response time | < 500ms for all non-run-initiating interactions | Status polling, removal, export |

### Security and Compliance

| Requirement | Specification |
|---|---|
| Secret management | `ANTHROPIC_API_KEY` and `LI_AT` loaded from environment variables exclusively; never embedded in code, config YAML, artifacts, or logs |
| `li_at` cookie handling | Never logged, never written to any file; treated with same sensitivity as an API key |
| Candidate PII | Flows in-memory only during crew run; not persisted to any database; shortlist export file treated as sensitive |
| `.env` file | Gitignored at project root; never committed |
| LinkedIn ToS | Selenium-based sourcing explicitly violates LinkedIn ToS; risk is accepted for MVP and documented in MRD Risk Assessment; hiring manager must be informed before first use (P1-4) |
| Data handling policy | No organizational data handling policy has been specified. This must be reviewed before the tool is extended beyond the single hiring manager user. |
| Access control | No authentication layer required at MVP — single-user local or private cloud deployment. If deployed to any network-accessible endpoint, basic HTTP auth must be added before deployment. |
| GDPR/regulatory compliance | Not assessed for MVP scope (single internal user). Must be reviewed before any expansion to multiple users or organizations. |

### Scalability and Reliability

| Requirement | Specification |
|---|---|
| Concurrent users | 1 (MVP) |
| Concurrent crew runs | 1 at a time — sequential runs only; no queue management at MVP |
| Fault tolerance | Selenium failures retry up to 2 times per task; LLM failures retry up to 2 times; after retries exhausted, halt with structured error and diagnostic |
| Recovery | Manual restart of crew run is the recovery path for any failure; no automated recovery or run resumption at MVP |
| Selenium selector breakage | Partial result returned rather than crash; Diagnostic written; hiring manager notified via UI |
| Uptime | Not formally required — single-user internal tool; downtime during maintenance is acceptable |

---

## 6. User Experience Design

### Interface Requirements

The web UI is a single-page application (SPA-lite) with three sequential views: Input, Processing, and Shortlist. Navigation between views is driven by run state — the user does not manually navigate between them.

**View 1: Input Form**
- Full-width text area for job description paste (label: "Job Description", placeholder: "Paste the full job description here...")
- Collapsible "Advanced Options" section containing: max results slider (5–50, default 20), location filter text input, experience range (min/max year inputs), must-have skills text input (comma-separated)
- "Start Sourcing" button (primary action)
- LinkedIn ToS risk disclosure notice displayed below the form (static text, visible at all times; modal acknowledgment on first run per P1-4)
- "Future capabilities" note (labeled clearly as planned, not available): ATS integration, outreach generation

**View 2: Processing Status**
- Four-stage progress indicator: Parsing JD > Searching LinkedIn > Scoring Candidates > Generating Shortlist
- Currently active stage: highlighted with spinner
- Completed stages: checkmark
- Failed stage: error icon with brief error message
- Elapsed time counter
- "Cancel run" action (halts the crew run server-side; returns user to Input view)

**View 3: Shortlist Review**
- Run summary header: role title, criteria summary, total candidates evaluated, shortlisted count, run timestamp
- Ranked candidate cards (sorted by match_score descending), each containing:
  - Rank number and name (H3-level heading)
  - Score badge (color-coded: green 85+, blue 70–84, yellow 55–69, orange 30–54, red < 30)
  - Current title, company, location, open to work status
  - LinkedIn profile link (opens in new tab)
  - Expandable rationale table (criterion, result, evidence)
  - "Remove" button (removes candidate from current shortlist session)
- "Candidates with Insufficient Profile Data" section at bottom (collapsed by default)
- "Notes for recruiting team" text area (maps to P1-3)
- "Export Shortlist" button (downloads `shortlist.md`)
- "Start New Run" link (returns to Input view)

**Accessibility:** HTML semantic structure, keyboard navigation support for all interactive elements, sufficient color contrast for score badges. Screen reader compatibility is not formally tested at MVP but is not intentionally broken.

**Responsive design:** Optimized for desktop/laptop browser. Mobile optimization is not required for MVP (hiring manager uses a work laptop).

### Agent Interaction Design

The hiring manager does not interact directly with individual agents — the crew runs autonomously. However, agent behavior is made visible through the UI in the following ways:

| Agent | Visible Signal to User |
|---|---|
| JD Parser | "Parsing JD" stage indicator becomes active; completes in seconds |
| LinkedIn Sourcer | "Searching LinkedIn" stage active; candidate count progress displayed (P1-5) |
| Evaluator | "Scoring Candidates" stage active; candidate count progress displayed |
| Formatter | "Generating Shortlist" stage active; completes in seconds |

**Failure transparency:** If a stage fails, the error message displayed in the UI cites the stage name and a plain-language description of the failure (e.g., "LinkedIn search failed: session expired. Please update your LI_AT cookie and retry."). Technical stack traces are written to the run log but not displayed in the UI.

**Explainability:** The rationale table on each candidate card is the primary explainability surface. Every score is backed by evidence from the profile and criteria from the job description. The hiring manager can see exactly why a candidate ranked where they did before deciding to keep or remove them.

---

## 7. Success Metrics and KPIs

### Productivity Metrics (Primary)

| Metric | Definition | Target (MVP) | Measurement Method |
|---|---|---|---|
| Time-to-shortlist | Minutes from JD submission to shortlist available for hiring manager review | < 15 minutes per run | Logged: run start timestamp to format_shortlist task completion timestamp |
| Shortlist acceptance rate | Percentage of shortlisted candidates retained by the hiring manager after review (not removed before export) | > 70% | Logged: candidates in exported shortlist vs. candidates in initial shortlist |
| Sourcing coverage | Candidates retrieved per run as a percentage of configured max_results | >= 80% | Logged: candidates_retrieved / max_results per run |
| Run success rate | Percentage of crew runs completing without an unrecovered error | > 95% | Logged: successful_runs / total_runs across all runs |

### Technical Metrics

| Metric | Definition | Target |
|---|---|---|
| JD parse accuracy | Percentage of required fields correctly extracted from a test JD set | > 90% (assessed during QA) |
| Candidate scoring consistency | Same candidate profile scored within ±5 points across two identical runs | Required for determinism validation (assessed during QA) |
| Selenium selector success rate | Percentage of profile page loads where all high-reliability fields are successfully extracted | > 90% per field per run |
| Token usage per run | Total Anthropic API tokens consumed per 20-candidate run | < 20,000 tokens (budget control; logged per run) |

### Operational Metrics

| Metric | Definition | Target |
|---|---|---|
| Shortlist edit rate | Percentage of shortlists where the hiring manager removes at least one candidate | Track only — no hard target at MVP; used to identify scoring quality issues |
| LinkedIn session refresh frequency | How often the `li_at` cookie must be refreshed due to expiry | Track — informs cookie rotation guidance in documentation |
| Selenium breakage incidents | Number of sourcing failures attributable to LinkedIn UI changes | Track — triggers maintenance response when any incident occurs |

---

## 8. Implementation Strategy

### Development Phases (AAMAD Phase 2 Epics)

The build follows the AAMAD modular development workflow: each epic executes in a fresh context session, references prior epic outputs via specific file references, and produces a self-contained testable module before the next epic begins.

**Epic 1: Setup** (@project.mgr, output: `docs/setup.md`)

Scope:
- Python environment setup and dependency installation (CrewAI, Selenium, webdriver-manager, FastAPI or Flask, python-dotenv)
- `config/agents.yaml` and `config/tasks.yaml` skeletons with all four agent and task stubs
- `.env.example` with `ANTHROPIC_API_KEY`, `LI_AT`, and all optional variables
- `output/` directory created and gitignored
- Project README with: tool description, setup steps, `li_at` cookie extraction instructions, `AAMAD_TARGET_RUNTIME` environment variable set to `crewai`
- Smoke test: `crew.kickoff()` with stub agents executes without errors

**Epic 2: Backend — Crew Implementation** (@backend.eng, output: `docs/backend.md`)

Scope:
- Full `config/agents.yaml` with all four agent definitions (role, goal, backstory, tools, memory, delegation, llm, temperature, max_iter)
- Full `config/tasks.yaml` with all four task definitions (description, expected_output, context chaining, output_file paths, max_iter, max_execution_time, guardrail references)
- `crew.py` implementing the CrewAI sequential crew, loading config from YAML, setting max_rpm at crew level
- `linkedin_selenium_tool.py` implementing the custom CrewAI tool: `li_at` cookie injection from env var, Selenium WebDriver initialization, search query construction from structured criteria, profile page navigation and DOM field extraction, inter-request delay with randomization, retry logic (max_retry_limit >= 2), partial result handling on selector failure
- `guardrails.py` implementing `validate_scored_candidate_schema` and `validate_shortlist_headings` guardrail functions
- Run logging: structured JSON log entry written to `LOG_DIR` after each crew run
- Validation: `crew.kickoff()` with a test job description produces valid `output/shortlist.md`

**Epic 3: Frontend** (@frontend.eng, output: `docs/frontend.md`)

Scope:
- Single-page web UI: Input form view, Processing status view, Shortlist review view
- Input form: job description text area, advanced options section, "Start Sourcing" button, ToS risk disclosure notice
- Processing status: four-stage indicator, elapsed time counter, cancel action
- Shortlist view: run summary header, ranked candidate cards with score badges, expandable rationale tables, remove action, notes text area, export button
- "Future capabilities" labeled section per AAMAD epics-index rule
- Validation: all three views render correctly in a modern desktop browser

**Epic 4: Integration** (@integration.eng, output: `docs/integration.md`)

Scope:
- FastAPI (or Flask) backend API endpoints:
  - `POST /run` — accepts JD text and optional parameters; initiates crew run; returns run_id
  - `GET /run/{run_id}/status` — returns current stage, stage detail, elapsed time
  - `GET /run/{run_id}/shortlist` — returns shortlist JSON for UI rendering
  - `POST /run/{run_id}/remove/{candidate_index}` — removes a candidate from the current session shortlist
  - `GET /run/{run_id}/export` — returns `shortlist.md` file download
- Frontend wired to backend API endpoints
- End-to-end validation: submit a real JD, receive a shortlist, export Markdown — full workflow functional

**Epic 5: QA** (@qa.eng, output: `docs/qa.md`)

Scope:
- Unit tests: JD parsing output schema validation (required fields present, types correct); Selenium tool field extraction against a static HTML fixture mimicking a LinkedIn profile page; shortlist heading structure validation
- Integration tests: crew run with a fixed test JD produces a shortlist matching the expected output schema; scoring is consistent across two identical runs (±5 points)
- End-to-end smoke test: full workflow from JD input to Markdown export with a real LinkedIn session (requires valid `li_at` cookie in test environment)
- Failure scenario tests: Selenium session expiry handled gracefully; missing optional profile fields handled gracefully; malformed JD input handled gracefully
- KPI baseline: record time-to-shortlist, shortlist acceptance rate baseline, and sourcing coverage for three test runs

### Resource Requirements

| Resource | Specification |
|---|---|
| Build personas | AAMAD agents: @project.mgr, @backend.eng, @frontend.eng, @integration.eng, @qa.eng |
| Human operator | Hiring manager (or technical delegate) for: `li_at` cookie extraction and `.env` setup; QA smoke test with live LinkedIn session |
| External dependencies (must be confirmed before kickoff) | (1) Anthropic Enterprise API key active and accessible; (2) `li_at` LinkedIn session cookie extractable from hiring manager's active session; (3) Python environment with pip/uv installable |
| Infrastructure | Developer laptop or private cloud VM (2 vCPU, 4GB RAM); Chrome/Chromium installed |
| Third-party costs | Anthropic Enterprise API token usage (estimated < $0.50 per 20-candidate run at claude-sonnet pricing; confirm with Anthropic Enterprise billing) |

### Risk Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| LinkedIn ToS enforcement (account ban from Selenium automation) | High | Inter-request delays; minimal page loads per run; cookie rotation; hiring manager informed and consented; LinkedIn Recruiter API migration is the resolution path |
| Selenium selector breakage from LinkedIn UI changes | Medium | Partial result handling (null fields rather than crash); Diagnostic written to log; smoke test detectable; manual sourcing as fallback between maintenance cycles |
| Shortlist quality insufficient to build hiring manager trust | High | Per-criterion rationale on every candidate; `Task.guardrail` on evaluation output to enforce rationale completeness; QA acceptance rate baseline measurement before production use |
| Run time exceeds 15-minute target | Medium | Per-task `max_execution_time` controls; configurable inter-request delay parameters; UI progress indicator to reassure user; max_results ceiling tunable |
| `li_at` cookie expiry mid-run | Medium | Sourcing tool detects session expiry exception; halts with clear user-facing message ("Session expired — please update LI_AT cookie and retry"); no partial or corrupt results |
| Anthropic model behavior drift from model updates | Low | Model version pinned to `claude-sonnet-4-6` in `config/agents.yaml`; smoke test after any model version change |
| CrewAI version breaking changes | Low | Version pinned in `pyproject.toml`; upgrade tested against smoke test before adoption |

---

## 9. Launch and Deployment Strategy

### Pre-Launch Checklist (Go/No-Go Gates)

| Gate | Status | Action Required |
|---|---|---|
| Anthropic Enterprise API key | Required — assumed active | Confirm key is provisioned and accessible; record model (`claude-sonnet-4-6`) availability |
| `li_at` LinkedIn session cookie | Required | Hiring manager extracts cookie from active LinkedIn session per README instructions; validates cookie by running a test search in the Selenium tool |
| Python environment and dependencies | Required | Setup epic smoke test passes: `crew.kickoff()` with stub agents executes without errors |
| End-to-end test run | Required | Integration epic validation: one full run from JD input to Markdown export completes successfully with live LinkedIn session |
| Hiring manager ToS risk acknowledgment | Required | Hiring manager has read and acknowledged the LinkedIn ToS risk disclosure (per P1-4) before first production use |

### Deployment Plan

**Step 1 — Local deployment (MVP)**
The system runs on the hiring manager's work laptop or a dedicated private cloud VM they control. No hosting infrastructure, no domain, no SSL required for local-only access. The hiring manager starts the FastAPI/Flask server manually before use and stops it when done.

**Step 2 — Private cloud deployment (optional MVP extension)**
If the hiring manager prefers browser access from multiple devices, the system can be deployed to a private cloud VM (e.g., a small AWS EC2, GCP Compute Engine, or DigitalOcean Droplet instance) accessible only to the hiring manager via IP allowlisting or a VPN. Basic HTTP authentication must be added to the web server before this deployment. SSL/TLS (via Let's Encrypt or equivalent) is required for any non-localhost access.

**Step 3 — LinkedIn Recruiter API migration (future)**
When official LinkedIn Recruiter API credentials are obtained, the `linkedin_selenium_tool` is replaced with an API client tool. The agent definition, task contract, and output schema remain unchanged. Only the tool implementation changes. This migration eliminates the ToS risk and Selenium fragility and is the highest-priority future work item.

### Rollout Plan

**Phase 1 (Days 1–7 after build): Supervised initial runs**
The hiring manager runs the system for 3–5 active open roles under light supervision (a technical colleague available to address issues). Each run is logged. Time-to-shortlist and shortlist acceptance rate are recorded for each run. Any Selenium failures or shortlist quality issues are triaged immediately.

**Phase 2 (Days 8–30): Independent use**
The hiring manager uses the system independently for all active sourcing needs. Run logs are reviewed weekly to track KPIs. Selenium breakage incidents trigger maintenance response within 1 business day.

**Phase 3 (Month 2+): Assessment and backlog prioritization**
At the 30-day mark, review: time-to-shortlist trend, shortlist acceptance rate, LinkedIn session refresh frequency, and any Selenium breakage incidents. Use this data to prioritize backlog items (P2 features) and evaluate whether the LinkedIn Recruiter API credential procurement should be escalated.

### Success Criteria at Launch

| Criterion | Target |
|---|---|
| Time-to-shortlist | < 15 minutes in >= 3 of first 5 production runs |
| Shortlist acceptance rate | > 70% in >= 3 of first 5 production runs |
| Run success rate | >= 4 of first 5 production runs complete without an unrecovered error |
| Hiring manager qualitative assessment | Hiring manager reports the shortlist format is immediately usable by the recruiting team without reformatting |

---

## Sources

- MRD v1.1: `project-context/1.define/MRD.md` (primary research foundation for all PRD decisions)
- LinkedIn Talent Solutions Global Talent Trends Report, 2024 (sourcing time benchmarks, time-to-hire median)
- LinkedIn Talent Connect Survey Data, 2024 (recruiter feedback on AI scoring interpretability)
- Beamery, SeekOut, HireEZ product documentation and case studies, 2023–2025 (time-to-shortlist reduction benchmarks)
- CrewAI Framework Documentation, v0.80+, 2025 (agent/task YAML schema, process modes, Task.context, Task.guardrail, execution controls)
- Anthropic Claude Documentation and Enterprise API Reference, 2025 (model capabilities, token budget, model pinning)
- AAMAD Core Rules: `.claude/rules/aamad-core.md` (artifact structure, traceability, output contracts)
- AAMAD CrewAI Adapter Rules: `.claude/rules/adapter-crewai.md` (CrewAI-specific implementation constraints)
- AAMAD Adapter Registry Rules: `.claude/rules/adapter-registry.md` (AAMAD_TARGET_RUNTIME selection and resolution)
- AAMAD Development Workflow Rules: `.claude/rules/development-workflow.md` (modular epic structure and context management)
- AAMAD Epics Index: `.claude/rules/epics-index.md` (epic-to-persona mapping)
- CrewAI Recruitment Example Reference: `crewai-recruitment-example.md` (Selenium + `li_at` cookie sourcing approach; disclaimer applies)

---

## Assumptions

1. The MRD v1.1 findings are accepted as the authoritative research foundation. No assumptions in this PRD contradict or override the MRD without explicit documentation.
2. `AAMAD_TARGET_RUNTIME=crewai` is confirmed. All agent and task definitions in this PRD are authored for the CrewAI adapter.
3. The LLM is Anthropic Claude via Anthropic Enterprise, model pinned to `claude-sonnet-4-6`. This model is assumed available under the organization's Anthropic Enterprise contract. If a different model is designated by the Enterprise contract, `config/agents.yaml` must be updated accordingly before build kickoff.
4. The Selenium + `li_at` cookie sourcing mechanism is the MVP integration approach. This is a workaround for the absence of official LinkedIn Recruiter API credentials. The LinkedIn ToS risk is accepted and documented. The hiring manager must be informed and must acknowledge this risk before first use.
5. Candidate profile fields defined in the Sourcing Agent's task (`source_candidates`) reflect what is realistically extractable from the LinkedIn Recruiter UI via Selenium DOM scraping. Fields marked as Medium or Low reliability in the field availability table may not be available for all candidate profiles; the evaluation agent is designed to handle null fields gracefully.
6. The hiring manager's open roles span typical technology/knowledge-work role types (engineering, product, GTM, operations). The JD Parser Agent and Evaluation Agent are not pre-tuned to any specific skills taxonomy — they reason from the job description provided. If the hiring manager sources for highly specialized or non-standard role types, the evaluation agent may require prompt tuning during QA.
7. The recruiting team receiving shortlists has no direct system interaction and requires no onboarding. Their only input to the design is that the shortlist format must be immediately usable without reformatting — satisfied by the Markdown export with structured headings.
8. No organizational data handling policy governing LinkedIn-sourced candidate profile data has been specified. This assumption must be revisited before the tool is extended beyond the single hiring manager user.
9. The deployment target is local or private cloud — no public-facing URL, no enterprise SSO, no formal security review required for MVP scope. This assumption is invalidated if deployment scope changes.
10. Per-run Anthropic API token costs are estimated at < $0.50 for a 20-candidate run at claude-sonnet-4-6 pricing. Actual cost depends on the organization's Enterprise contract pricing tier. Token usage is logged per run for monitoring.

---

## Open Questions

1. **Anthropic Enterprise model availability:** Is `claude-sonnet-4-6` specifically available and designated as the production model under the organization's Anthropic Enterprise contract, or is there a different model slug to use? This must be confirmed before `config/agents.yaml` is written in the Setup epic. (MRD Open Question #7, unresolved.)

2. **`li_at` cookie refresh frequency:** How long does the `li_at` cookie remain valid in the hiring manager's organization's LinkedIn environment? (LinkedIn session cookies typically expire after 1 year but can be invalidated earlier by session management or security policy.) This determines how often the hiring manager must refresh the cookie and informs the operational runbook.

3. **Organizational data handling policy:** Is there an existing organizational policy governing how LinkedIn candidate profile data may be used, stored, or processed by internal tools? If yes, this must be reviewed before MVP deployment. (MRD Open Question #6, unresolved.)

4. **Hiring manager's preferred run time budget:** Is a < 15 minute target acceptable, or does the hiring manager have a preference for a shorter window (e.g., 5–10 minutes) that would require tradeoffs in candidate volume or scoring depth? (MRD Open Question #5, unresolved.) The current inter-request delay defaults (2–4 seconds) and max_results default (20) are tuned to the 15-minute target.

5. **FastAPI vs. Flask preference:** No preference was specified for the web framework. FastAPI is recommended for its async support and automatic API schema generation, which simplifies the status polling endpoint (P1-5). This will be confirmed with the backend engineering persona during the Setup epic.

6. **LinkedIn Recruiter API credential procurement status:** Has any action been taken to initiate procurement of official LinkedIn Recruiter API credentials through the LinkedIn partner program? The timeline for credential availability determines when the Selenium-to-API migration (P2-7) can be planned. (MRD Open Question #1 resolved the MVP sourcing approach; this question tracks the migration timeline.)

---

## Audit

| Field | Value |
|---|---|
| Timestamp | 2026-05-31 |
| Persona ID | @product-mgr |
| Action | PRD authoring — Phase 1 Define |
| Template Used | `.claude/templates/prd-template.md` (AAMAD PRD template, all 9 sections) |
| MRD Reference | `project-context/1.define/MRD.md` v1.1 — all PRD decisions trace to MRD findings |
| Runtime Target Resolved | `AAMAD_TARGET_RUNTIME=crewai` (confirmed in MRD; recorded per adapter-registry rules) |
| LLM Resolved | Anthropic Claude via Anthropic Enterprise; model pinned to `claude-sonnet-4-6`; temperature 0.1 for evaluation and formatting tasks, 0.2 for JD parsing |
| LinkedIn Integration | Selenium WebDriver + `li_at` session cookie browser automation. Official LinkedIn Recruiter API credentials not available at MVP. `LI_AT` environment variable is the authentication mechanism. ToS risk documented and accepted. LinkedIn Recruiter API migration is a named future work item (P2-7). |
| Agent Definitions Authored | JD Parser Agent, LinkedIn Sourcing Agent, Evaluation/Scoring Agent, Shortlist Formatting Agent — all four defined in full (role, goal, backstory, tools, memory, delegation, llm, temperature, max_iter, max_execution_time) |
| Scope Decisions | Candidate profile field depth: determined based on Selenium DOM extractability from LinkedIn Recruiter UI (8 field categories; reliability classified per field). Role type coverage: general (engineering, GTM, operations, product) — JD-driven, no pre-tuned taxonomy. |
| Commercial Template Adaptation | Section 7 (Success Metrics) reframed from revenue/market share targets to productivity metrics (time-to-shortlist, shortlist acceptance rate, sourcing coverage, run success rate) per internal productivity tool context. Section 9 (Launch Strategy) reframed from go-to-market/pricing to supervised rollout and deployment plan. |
| Prompt Trace | Omitted — this artifact is a human-directed PRD synthesis authored by the product manager persona with full MRD context provided as explicit input. No high-risk autonomous LLM generation. |
| Output Path | `/Users/chris.sanchez/projects/recruitment-assistant/project-context/1.define/PRD.md` |
| Handoff Status | Ready for Phase 2 build kickoff. All 5 AAMAD epics defined with persona assignments and output artifacts. Go/No-Go gates documented. Open Questions requiring resolution before kickoff identified. |
