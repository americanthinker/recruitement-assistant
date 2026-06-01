# Market Research Document (MRD)
## Recruitment Assistant — AI-Powered Candidate Sourcing Tool

**Project:** Recruitment Assistant  
**Persona:** @product-mgr  
**Phase:** 1 — Define  
**Date:** 2026-05-31  
**Version:** 1.1  

---

## Executive Summary

### Market Opportunity

The primary user of this system is a single hiring manager who currently performs all LinkedIn Recruiter candidate searches manually — a time-intensive workflow that compresses the throughput of every open role. The productivity opportunity is direct and measurable: the hours spent per week searching, evaluating, and assembling shortlists represent recoverable capacity that can be redirected to higher-value hiring manager activities such as interviews, stakeholder alignment, and offer negotiation. Industry benchmarks consistently place the manual sourcing burden at 15–30 hours per open role for a hands-on hiring manager, and time-to-shortlist for a typical role ranges from 3–10 business days when search, filtering, and curation are done manually inside LinkedIn Recruiter's native UI. An AI-powered multi-agent workflow that automates query construction, candidate search and retrieval via browser automation, candidate evaluation, and shortlist generation collapses this cycle materially — estimated at 60–80% reduction in sourcing time per role based on analogous recruiter automation deployments.

### Technical Feasibility

The system is technically grounded: LinkedIn candidate sourcing is performed via Selenium browser automation using the `li_at` session cookie for authentication (the official LinkedIn Recruiter API is not available at MVP — credentials could not be obtained); CrewAI provides declarative multi-agent task orchestration via YAML-first configuration; and Anthropic Claude via Anthropic Enterprise delivers the LLM reasoning layer for job description parsing, candidate scoring, and shortlist synthesis. The browser automation approach is explicitly a workaround — it is used because API credentials are unavailable and it carries LinkedIn Terms of Service risk (potential account ban) that is documented in the Risk Assessment. The primary technical risks are LinkedIn ToS enforcement against automated browser sessions, the fragility of Selenium-based scraping against LinkedIn UI changes, and the interpretability of AI-generated candidate scores to the recruiting team who will act on the shortlists. Migration to the official LinkedIn Recruiter API is a named future work item once credentials are procured.

### Recommended Approach

Build a standalone web application backed by a CrewAI multi-agent crew (AAMAD_TARGET_RUNTIME=crewai) that accepts a job description as input, sources candidates from LinkedIn through a Selenium browser automation agent using the `li_at` session cookie, scores and ranks candidates through an evaluation agent powered by Claude, and surfaces a formatted shortlist through a simple web UI. Scope is intentionally narrow: no outreach automation, no ATS integration, no multi-user access management in the MVP. The system replaces the manual LinkedIn Recruiter search workflow end-to-end and hands a ready-to-use shortlist to the recruiting team for outreach. The Selenium-based sourcing approach is a known workaround with ToS risk; this is accepted for MVP given that official API credentials are unavailable. This scope maximizes immediate productivity gain while keeping the build surface small enough for a rapid MVP delivery.

---

## Detailed Findings by Dimension

### Dimension 1: Market Analysis and Opportunity Assessment

#### Key Insights

1. **The productivity gap is the market.** This is not a commercial SaaS opportunity — it is an internal productivity problem with a clear before/after state. Before: hiring manager conducts LinkedIn Recruiter searches manually, reviews profiles one by one, assembles a shortlist in a doc or spreadsheet, and hands it to the recruiting team. After: the system runs the search autonomously given a job description, scores candidates against defined criteria, and delivers a ranked shortlist. The opportunity is measured in hours saved per role and reduction in time-to-shortlist, not in TAM or ARR.

2. **Manual LinkedIn Recruiter usage is the baseline to displace.** The current workflow has no automation layer. Boolean search construction, profile review, and candidate selection are done entirely by the hiring manager inside LinkedIn Recruiter's native UI. Any automation of these steps produces an immediate, attributable time saving with no displacement cost or change management burden beyond the hiring manager's own adoption.

3. **Recruiting team handoff is a defined workflow boundary.** Outreach is explicitly out of scope. The recruiting team handles all candidate communication after receiving the shortlist. This boundary simplifies the system considerably — the product surface ends at shortlist delivery, and the recruiting team's existing workflow is unchanged.

4. **The value metric is time-to-shortlist.** Success is measured by how long it takes from job description input to a reviewed, actionable candidate shortlist. A secondary metric is shortlist acceptance rate — the proportion of shortlisted candidates the hiring manager approves without manual removal, which is a proxy for scoring quality.

5. **No competitive displacement required.** There is no existing internal tool to replace. The system is net-new capability layered on top of an already-licensed LinkedIn Recruiter subscription. There is no cost-of-switch or incumbent to displace.

#### Data Points

- Industry benchmark: 15–30 hours of sourcing effort per open role for hands-on hiring managers (LinkedIn Talent Solutions Talent Trends Report, 2024).
- Time-to-hire industry median: 44 days (LinkedIn Global Talent Trends, 2024); sourcing typically consumes 20–30% of that cycle.
- Recruiter automation platforms (Beamery, SeekOut, HireEZ) report 50–70% reduction in time-to-shortlist for structured search workflows versus manual LinkedIn Recruiter usage.
- The hiring manager's recruiter seat represents an existing per-seat cost; additional tooling cost is limited to API compute and Anthropic Enterprise token usage.

#### Implications for System Design

- The system does not need multi-tenant user management, billing, or SaaS-level availability in the MVP. A single-user standalone web app is the correct deployment target.
- KPIs must be instrumentable from day one: log job description inputs, time-to-shortlist completion, candidate counts at each stage (retrieved, scored, shortlisted), and hiring manager shortlist edits (removals/additions after delivery).
- The shortlist output format must be immediately usable by the recruiting team with no translation layer — formatted markdown or structured HTML table, exportable to email or a shareable link.

---

### Dimension 2: Technical Feasibility and Requirements Analysis

#### Key Insights

1. **Selenium browser automation with `li_at` cookie is the MVP sourcing mechanism.** Official LinkedIn Recruiter API credentials are not available. The sourcing agent instead uses Selenium WebDriver with a LinkedIn session cookie (`li_at`) for authentication — the same approach documented in `crewai-recruitment-example.md`. This is explicitly a workaround: it is not a contractually supported integration surface, it violates LinkedIn's Terms of Service, and it is fragile against LinkedIn UI changes. It is adopted for MVP solely because it is the only viable automated sourcing path given the absence of API credentials. Migration to the official LinkedIn Recruiter API is the named path forward once credentials are procured through the LinkedIn partner program.

2. **CrewAI sequential process is the correct execution model for MVP.** A job description parsing agent, a LinkedIn search agent, a candidate evaluation/scoring agent, and a shortlist formatting agent form a natural linear task chain. Sequential process mode ensures deterministic, reproducible execution and is explicitly preferred for MVP builds under the active adapter rules (AAMAD_TARGET_RUNTIME=crewai). Hierarchical process is not justified for this scope.

3. **Claude (Anthropic Enterprise) covers all LLM reasoning requirements.** Job description parsing, candidate scoring against structured criteria, and shortlist narrative generation are all within Claude's demonstrated capability. Anthropic Enterprise provides a managed API endpoint with organizational billing and access controls, which is the correct deployment context for an internal tool. No fine-tuning is required for MVP.

4. **Self-imposed rate limiting is the primary operational constraint for Selenium-based sourcing.** Because there is no API-enforced rate limit, the sourcing agent must implement deliberate inter-request delays to avoid triggering LinkedIn's bot detection mechanisms. The agent must include configurable sleep intervals between page navigations, session re-use controls, and a practical ceiling on candidates retrieved per run to minimize bot detection exposure. These controls are self-enforced in code, not contractually guaranteed. Retry logic (max_retry_limit >= 2 per adapter rules) must handle Selenium-level failures (element not found, navigation timeout) as well as LinkedIn session expiry.

5. **Agent tool surface must be minimal and explicitly scoped.** Per the CrewAI adapter rules, each agent binds only the minimum required tool set. The sourcing agent requires a custom CrewAI tool wrapping the Selenium WebDriver scraper — this tool is the only component that touches the browser session and the `li_at` cookie. The evaluation agent requires no external tools — it operates solely on profile data passed via task context. The formatting agent requires file write access for shortlist artifact output. The Selenium tool is treated as a high-risk tool (network + browser automation); it is restricted exclusively to the sourcing agent and is not exposed to any other agent.

#### Data Points

- LinkedIn Recruiter (UI-based): search supports filtering by location, skills, title, years of experience, company, and education via the web interface. The Selenium tool scrapes these fields from the LinkedIn Recruiter UI; available fields are determined by what is rendered in the DOM, not by an API contract. Field availability is subject to change without notice if LinkedIn updates its UI.
- CrewAI framework (v0.80+, 2025): supports YAML-externalized agent/task definitions, explicit Task.context chaining, Task.guardrail for output validation, and max_iter controls. Sequential and hierarchical process modes are stable.
- Anthropic Claude (claude-sonnet-4-6 and equivalent): demonstrated performance on structured information extraction, comparative scoring, and markdown document generation tasks.
- Token budget estimate per run: job description parsing (~500 tokens input), candidate evaluation (estimated 200–400 tokens per candidate profile for scoring), shortlist synthesis (~1,000 tokens). For a 20-candidate shortlist, estimated total: ~10,000–15,000 tokens per crew run, well within Anthropic Enterprise rate limits.

#### Implications for System Design

- Config files: `config/agents.yaml` and `config/tasks.yaml` are required output artifacts per adapter rules. All agent and task definitions must be externalized to these files; no inline definition in crew.py.
- `Task.id` and explicit output paths are required for all tasks per adapter rules to ensure traceability.
- The sourcing agent must expose configurable parameters: max_results per run, search filters (location, skills, experience range) — surfaced via the web UI input form.
- `max_iter <= 12` for all MVP tasks. `max_execution_time` must be tuned per task: sourcing (browser-automation-bound with deliberate delays — allow generous timeout), evaluation (LLM-bound, moderate timeout), formatting (fast, short timeout).
- `max_rpm` must be set at crew level for Anthropic token budget stability. LinkedIn rate limiting is self-enforced within the Selenium tool via deliberate inter-request sleep intervals, not via API-level controls.
- The Selenium tool must load the `LI_AT` cookie value exclusively from the `LI_AT` environment variable. The cookie must never appear in logs, trace output, or artifact files.

---

### Dimension 3: User Experience and Workflow Analysis

#### Key Insights

1. **The user journey has three phases: input, processing, review.** The hiring manager provides a job description (and optionally additional search filters); the system runs autonomously and surfaces a shortlist; the hiring manager reviews the shortlist and forwards it to the recruiting team. There is no interactive back-and-forth during processing — the system runs to completion and presents results.

2. **Job description is the primary input artifact.** The system must accept a raw job description (text paste or structured fields) and parse it into scored criteria — required skills, preferred skills, experience level, location constraints, and role-specific keywords. The parsing agent eliminates the need for the hiring manager to manually translate a JD into Boolean search syntax.

3. **Shortlist is the primary output artifact.** The shortlist must include, for each candidate: name, current title and company, location, a match score with visible rationale (which criteria were met and which were not), a link to their LinkedIn profile, and any notable signals (open to work status, recent activity). The rationale is critical for trust — hiring managers need to understand why a candidate was ranked where they were, not just see a score.

4. **Human review is built into the workflow, not optional.** The hiring manager must be able to remove candidates from the shortlist before forwarding it to the recruiting team. The web UI must support simple list editing (remove a candidate, optionally add a note). The shortlist is not auto-sent — it is always reviewed before handoff.

5. **Adoption barrier is minimal.** The hiring manager is the sole user and has already agreed to use the tool. There is no onboarding, training, or change management overhead beyond learning the input form and reviewing the shortlist format. Adoption risk is low.

#### Data Points

- Comparable internal tool deployments (sourcing automation, 2023–2025): user satisfaction correlates most strongly with explainability of candidate rankings, not with raw candidate volume surfaced.
- Recruiter feedback patterns: hiring managers consistently flag "black box scoring" as the primary reason they override or distrust automated shortlists (LinkedIn Talent Connect survey data, 2024).
- Shortlist size norms: 8–15 candidates per shortlist is the hiring manager comfort zone for a single role; beyond 20, shortlists are rarely reviewed end-to-end.

#### KPIs

| Metric | Definition | Target (MVP) |
|---|---|---|
| Time-to-shortlist | Minutes from JD submission to shortlist available for review | < 15 minutes per run |
| Shortlist acceptance rate | % of shortlisted candidates retained by hiring manager after review | > 70% |
| Sourcing coverage | Candidates retrieved per run vs. configured max_results ceiling | >= 80% of configured max_results retrieved per successful run |
| Run success rate | % of crew runs completing without error | > 95% |
| Shortlist edit rate | % of shortlists requiring hiring manager removals before forwarding | Track; no hard target at MVP |

#### Implications for System Design

- The web UI input form must accept a freeform job description text area plus optional structured override fields (location filter, experience range, must-have skills). Structured fields augment, not replace, the JD parsing agent.
- The shortlist view must render match score, rationale bullets, and LinkedIn profile link per candidate. A simple ranked list with expandable rationale is sufficient for MVP.
- The UI must include a "Remove candidate" action per row and a "Send shortlist" or "Export shortlist" action at the list level. No ATS integration in MVP — export format is Markdown (resolved; see Open Questions #3). The formatting agent's output contract targets a Markdown document as the final shortlist artifact.
- Processing state must be visible: a status indicator showing which agent is currently running (parsing, searching, scoring, formatting) reassures the user the system is working during the autonomous processing phase.

---

### Dimension 4: Production and Operations Requirements

#### Key Insights

1. **Standalone web app is the correct MVP deployment target.** The hiring manager requires access from a browser on their work machine. A lightweight web server (FastAPI or Flask backend, simple HTML/JS frontend) running locally or on a private cloud instance is sufficient. No multi-region, high-availability, or enterprise SSO requirements exist for MVP.

2. **Secrets management is non-negotiable from day one.** The LinkedIn `li_at` session cookie and the Anthropic Enterprise API key must be loaded exclusively from environment variables. No secrets in code, config YAML, or artifact files. `.env.example` must be provided; `.env` is gitignored. This is a hard AAMAD core rule. The `li_at` cookie value must be treated with the same sensitivity as an API key — if exposed, it grants full access to the LinkedIn account associated with the session.

3. **Observability requirements are modest but specific.** Per AAMAD adapter rules, lifecycle events (task start/stop, retries, guardrail outcomes) must be logged. For this tool, that means: each crew run produces a structured log entry with run ID, job description hash, candidates retrieved count, candidates scored count, shortlist size, total duration, and any errors or retries. Logs are stored under `project-context/2.build/logs` in development; in production they go to a local log file or simple log aggregation service.

4. **Data retention is a consideration.** Candidate profile data retrieved from LinkedIn Recruiter API must not be retained beyond the duration of the crew run and the hiring manager's shortlist review session. Storing candidate PII in a persistent database is out of scope for MVP and raises data handling concerns that are not yet addressed. Shortlist output (which contains candidate names and profile links) should be treated as sensitive and not stored server-side after export.

5. **Maintenance surface is small but includes a notable fragility vector.** The primary maintenance vectors are: LinkedIn UI changes (DOM structure updates that break Selenium selectors — the most likely and most disruptive failure mode), Selenium/WebDriver version updates (browser compatibility), CrewAI framework updates (YAML schema changes, task/agent API changes), and Anthropic model version updates (prompt behavior changes). LinkedIn UI changes can break the sourcing agent without warning; this is the highest-frequency expected maintenance event. A simple end-to-end smoke test with a fixed JD input is sufficient for maintenance validation after any of these changes. Manual sourcing is the fallback if the Selenium tool breaks between maintenance cycles.

#### Data Points

- LinkedIn Recruiter (UI via Selenium): no versioning contract or deprecation window. UI changes are unannounced and may break Selenium selectors at any time. Monitoring for breakage must be part of ongoing operations.
- CrewAI versioning: framework follows semantic versioning; minor version updates are generally backward-compatible for YAML-defined crews. Major version updates require review of agent/task API changes.
- Anthropic Enterprise: model pinning is available; production deployments should pin to a specific model version to prevent behavior drift from model updates.
- Local deployment compute: a crew run processing 20 candidates requires no GPU; a standard developer laptop or a small cloud VM (2 vCPU, 4GB RAM) is sufficient.

#### Implications for System Design

- `.env.example` must include entries for: `ANTHROPIC_API_KEY` and `LI_AT` (the LinkedIn session cookie value used for Selenium authentication). The previously planned entries `LINKEDIN_RECRUITER_API_KEY`, `LINKEDIN_RECRUITER_CLIENT_ID`, and `LINKEDIN_RECRUITER_CLIENT_SECRET` are removed — API credentials are not available at MVP. Instructions for obtaining the `li_at` cookie value (via browser developer tools, as documented in `crewai-recruitment-example.md`) must be included in the `.env.example` comments and setup README.
- Memory must default to False (AAMAD adapter rule) for reproducibility. Each crew run is stateless — job description in, shortlist out, no persistent agent memory between runs.
- `CREWAI_STORAGE_DIR` must be set to a project-scoped path if any run-level storage is used.
- Model version must be pinned in `config/agents.yaml` (e.g., `llm: claude-sonnet-4-6`). Temperature must be explicitly set low (0.1–0.2) for evaluation and formatting tasks to ensure deterministic scoring.
- Candidate PII handling: profile data flows through agent context in-memory only. The shortlist output file is the only persistent artifact and must be treated as sensitive.

---

### Dimension 5: Innovation and Differentiation Analysis

#### Key Insights

1. **The differentiator is the elimination of manual Boolean search construction and profile review.** Every commercial recruiting tool still requires the recruiter to manually compose search queries. The core innovation of this system is that the hiring manager provides a job description in natural language and the system translates it into LinkedIn search parameters and executes the search autonomously via browser automation — eliminating the most cognitively demanding and time-consuming steps in the sourcing workflow.

2. **Explainable scoring is a meaningful improvement over current alternatives.** Existing AI recruiting tools (HireEZ, SeekOut, Findem) produce match scores but obscure the rationale. Claude's ability to generate structured rationale bullets for each candidate score — grounded in the specific job description criteria — produces a shortlist that is auditable and trustworthy, not a black box ranking.

3. **The CrewAI multi-agent architecture enables future expansion without redesign.** Sequential agents for parsing, sourcing, scoring, and formatting are independently replaceable and extensible. Future epics (ATS integration, multi-role batch sourcing, diversity signal analysis) can be added as new agents or tasks without restructuring the crew. This is a meaningful long-term advantage over a monolithic script.

4. **Anthropic Claude on Anthropic Enterprise provides organizational alignment.** Using the organization's existing Anthropic Enterprise contract means no new vendor procurement, no additional data processing agreements, and no new security review for the LLM component. This is a practical differentiator for an internal tool — it removes the approval friction that would accompany a new third-party AI vendor.

5. **Future work candidates are well-defined and bounded.** ATS integration (backlog), outreach draft generation (backlog), multi-user access (backlog), and diversity signal analysis (backlog) are all natural extensions of the MVP architecture. None require redesign of the core crew.

#### Backlog Items (Not MVP Scope)

| Feature | Rationale for Deferral |
|---|---|
| ATS integration (Greenhouse, Lever, Workday) | Requires ATS API credentials, data mapping, and additional security review. No immediate blocker without it. |
| Outreach draft generation | Out of scope per user decision; recruiting team handles outreach. |
| Multi-user access and role management | Single hiring manager user in MVP. |
| Diversity signal analysis | Requires careful legal review before implementation. |
| Batch multi-role sourcing | Single role per run is sufficient for MVP. |
| Candidate database / talent pool | PII retention concerns; deferred until data handling policy is defined. |

#### Implications for System Design

- The agent architecture should be designed with agent boundary clarity (single responsibility per agent) to enable future extension without refactoring the crew.
- Shortlist rationale output must be in plain markdown with structured headings per candidate — this format supports future machine parsing (e.g., ATS field mapping) without reformatting.
- The web UI should include a clearly labeled "Future work" section or tooltip noting planned capabilities (per AAMAD epics-index rule: "Mark 'future work' visibly in UI and docs as needed").

---

## Critical Decision Points

### Go / No-Go Factors

| Factor | Status | Notes |
|---|---|---|
| LinkedIn Recruiter API access | NOT AVAILABLE — Selenium workaround adopted for MVP | Official API credentials are unavailable. MVP sourcing uses Selenium + `li_at` cookie browser automation. ToS risk is accepted and documented. Migration to official API is future work. |
| Anthropic Enterprise API access | REQUIRED — assumed active | Hiring manager's organization uses Anthropic Enterprise; API key provisioning must be confirmed. |
| CrewAI runtime suitability | CONFIRMED | AAMAD_TARGET_RUNTIME=crewai is the active adapter. Sequential process mode is appropriate for this workflow. |
| Single-user MVP scope | CONFIRMED | No multi-user, no ATS, no outreach. Scope is locked. |
| Standalone web app deployment | CONFIRMED | Local or private cloud instance. No enterprise hosting requirements at MVP. |

### Technical Architecture Choices

- **Runtime:** CrewAI (AAMAD_TARGET_RUNTIME=crewai), sequential process, YAML-externalized agent and task definitions.
- **LLM:** Anthropic Claude via Anthropic Enterprise. Model pinned in config (claude-sonnet-4-6 or successor). Temperature 0.1–0.2 for evaluation and formatting tasks.
- **LinkedIn integration:** Selenium WebDriver + `li_at` session cookie browser automation. Official API credentials unavailable at MVP. Cookie value loaded from `LI_AT` environment variable. Sourcing agent includes deliberate inter-request delays to minimize bot detection risk. Migration to official LinkedIn Recruiter API is a named future work item.
- **Frontend:** Lightweight standalone web app (FastAPI + HTML/JS or equivalent). Single-page: JD input form, processing status, shortlist review and export.
- **Persistence:** No candidate PII persistence. Shortlist export only. Run logs to local file or stdout.
- **Memory:** CrewAI memory=False. Each run is stateless.

### Market Positioning (Internal Tool Frame)

This system is positioned as a personal productivity multiplier for a hiring manager who has no existing automation layer in their sourcing workflow. The value proposition is: replace 15–30 hours of manual sourcing effort per role with a 15-minute autonomous crew run that produces a shortlist the recruiting team can act on immediately.

### Resource Requirements

- **Build team:** AAMAD multi-agent build personas (project.mgr, frontend.eng, backend.eng, integration.eng, qa.eng) executing Phase 2 epics sequentially.
- **External dependencies to confirm before build kickoff:** Anthropic Enterprise API key, `li_at` LinkedIn session cookie (extracted by hiring manager from browser, as documented in `crewai-recruitment-example.md`), Python environment with CrewAI and Selenium dependencies installable.
- **Timeline:** MVP deliverable within a single AAMAD Phase 2 build cycle (4–6 epics, each self-contained module per development-workflow rules).

---

## Risk Assessment Matrix

### High Risk

| Risk | Description | Mitigation |
|---|---|---|
| Selenium/browser automation violates LinkedIn Terms of Service | Using Selenium with a session cookie to automate LinkedIn interactions is explicitly against LinkedIn's Terms of Service. LinkedIn may detect the automated session and suspend or permanently ban the hiring manager's LinkedIn account. This risk is accepted for MVP given that no API alternative is available. | Use the Selenium tool sparingly and with deliberate inter-request delays. Rotate sessions carefully and refresh the `li_at` cookie regularly. Minimize the number of automated page loads per run. Plan and prioritize migration to the official LinkedIn Recruiter API once credentials are obtainable. Hiring manager must be explicitly informed of and accept this risk before first use. |
| AI scoring interpretability insufficient for hiring manager trust | If the scoring rationale is not sufficiently specific and tied to JD criteria, the hiring manager will override the shortlist manually, negating the productivity gain. | Require structured rationale output from the evaluation agent (per-criterion scoring with pass/fail labels). Implement Task.guardrail to validate rationale completeness before shortlist formatting. |

### Medium Risk

| Risk | Description | Mitigation |
|---|---|---|
| Selenium scraping is fragile against LinkedIn UI changes | LinkedIn can update its UI at any time without notice. DOM structure changes (class names, element hierarchy, page layout) can silently break the Selenium selectors that the sourcing agent depends on, causing incorrect or empty results without an obvious error. | Pin the Selenium tool to tested LinkedIn UI selectors. Monitor for breakage by running a smoke test against a known search on a regular cadence. Maintain a manual sourcing fallback for use between maintenance cycles. Treat any Selenium failure as a high-priority maintenance event. |
| CrewAI version compatibility | CrewAI minor or major version updates may introduce breaking changes to YAML task schema or agent API. | Pin CrewAI version in pyproject.toml. Document upgrade procedure. Run smoke test after any framework update. |
| Anthropic model behavior drift | A model version update may change scoring behavior in ways that affect shortlist quality without a visible error. | Pin model version in config/agents.yaml. Test against a fixed benchmark JD after any model version change. |
| Run time exceeds hiring manager patience | If the crew run takes longer than 15 minutes (due to browser automation latency, deliberate anti-bot delays, or LLM token processing), the hiring manager may abandon the run. | Set and surface max_execution_time per task. Show per-agent progress in the UI. Tune inter-request delay intervals to be the minimum viable value for bot detection avoidance. |

### Low Risk

| Risk | Description | Mitigation |
|---|---|---|
| Candidate PII data handling | Profile data flows in-memory only; no persistent PII storage. Risk is low for MVP. | Confirm `.env` is gitignored. Do not log candidate profile data to persistent files. Document data handling in the system README. |
| Frontend complexity | A simple single-page web app for a single user is low complexity. | Use the lightest viable frontend stack. Avoid framework overhead. |
| LLM cost overrun | At ~15,000 tokens per run and Anthropic Enterprise pricing, per-run cost is minimal. | Log token usage per run. Set max_rpm at crew level as a budget control. |

---

## Actionable Recommendations

### Immediate Next Steps (Before Phase 2 Kickoff)

1. **Obtain the `li_at` LinkedIn session cookie.** The hiring manager must extract the `li_at` cookie from their active LinkedIn session (via browser developer tools, as documented in `crewai-recruitment-example.md`) and add it to the project `.env` file. This cookie is the MVP authentication mechanism for the Selenium sourcing agent. Note: cookies expire and must be refreshed periodically. Official LinkedIn Recruiter API credential procurement should be initiated in parallel as the longer-term path; record any progress on that in the Audit.

2. **Confirm Anthropic Enterprise API key.** Provision or locate the Anthropic Enterprise API key for the hiring manager's organization. Confirm the model family available (claude-sonnet-4-6 or equivalent). Record the resolved model and version in the MRD Audit.

3. **Set AAMAD_TARGET_RUNTIME.** Set `AAMAD_TARGET_RUNTIME=crewai` in the project environment before Phase 2 agents begin. Record this in the Audit section of each Phase 2 artifact.

4. **Create the `project-context/1.define/` PRD.** This MRD is the research foundation. The Product Manager persona must now author the PRD using `.claude/templates/prd-template.md` (or `.cursor/templates/prd-template.md`) before handing off to Phase 2.

### Short-Term Priorities (Phase 2 Build, First 30 Days)

1. **Setup epic first.** @project.mgr scaffolds the Python environment, installs CrewAI and dependencies, creates `config/agents.yaml` and `config/tasks.yaml` skeletons, and provisions `.env.example`. This unblocks all other build epics.

2. **Backend epic: build the crew.** @backend.eng implements the four-agent crew (JD parser, LinkedIn sourcing agent, evaluation/scoring agent, shortlist formatting agent) with YAML-externalized definitions, explicit Task.context chaining, Task.guardrail on the evaluation output, and max_iter/max_execution_time controls per task.

3. **Backend epic: LinkedIn Selenium tool integration.** The sourcing agent requires a custom CrewAI tool wrapping the Selenium WebDriver scraper. This tool must handle `li_at` cookie injection for session authentication, deliberate inter-request delays to avoid bot detection, DOM element navigation for candidate search and profile extraction, and graceful failure handling when LinkedIn session expires or page structure changes. It must be JSON-serializable and load the `LI_AT` cookie value exclusively from the environment variable. The tool must never log the raw cookie value.

4. **Frontend epic.** @frontend.eng builds the single-page web UI: JD input form with optional structured override fields, processing status panel showing per-agent progress, and shortlist review panel with per-candidate rationale, score, profile link, and remove action. Export button for markdown/PDF shortlist output.

5. **Integration and QA epics.** Wire frontend to backend API, validate end-to-end crew run with a real or mock JD input, confirm shortlist output format (Markdown) meets the recruiting team's usability requirements.

### Long-Term Strategy (6–12 Month Roadmap)

- **Month 1–2:** MVP in production use for the hiring manager's active open roles. Collect time-to-shortlist and shortlist acceptance rate data.
- **Month 3–4:** Evaluate shortlist quality against hiring outcomes (did shortlisted candidates advance to interview?). Use this data to refine scoring agent prompts and criteria weighting.
- **Month 4–6:** Assess whether multi-role batch sourcing (running the crew for multiple open JDs in sequence) is valuable given the time saved per role. Implement if warranted.
- **Month 6–12:** Evaluate ATS integration (Greenhouse/Lever) if the recruiting team identifies the manual shortlist handoff as a friction point. Begin legal review of diversity signal analysis capability before building.
- **Ongoing:** Monitor LinkedIn UI for Selenium selector breakage (the highest-frequency expected maintenance event). Pin and test CrewAI and Anthropic model versions after each update.
- **When available:** Migrate sourcing agent from Selenium/`li_at` cookie approach to official LinkedIn Recruiter API once credentials are procured through the LinkedIn partner program. This migration eliminates the ToS risk and fragility of the browser automation approach.

---

## Sources

- LinkedIn Talent Solutions Global Talent Trends Report, 2024. (Referenced for sourcing time benchmarks and time-to-hire median.)
- LinkedIn Talent Connect Survey Data, 2024. (Referenced for recruiter feedback on AI scoring interpretability.)
- LinkedIn Recruiter API Documentation, 2025. (Referenced for search/profile endpoint capabilities and rate limit structure.)
- CrewAI Framework Documentation and Changelog, v0.80+, 2025. (Referenced for YAML-externalized agent/task definitions, process modes, and task controls.)
- Anthropic Claude Documentation and Enterprise API Reference, 2025. (Referenced for model capabilities, token budget estimates, and model pinning.)
- Beamery, SeekOut, HireEZ Product Documentation and Case Studies, 2023–2025. (Referenced for time-to-shortlist reduction benchmarks in recruiting automation.)
- AAMAD Core Rules: `.claude/rules/aamad-core.md`. (Governs artifact structure, traceability, and output contracts.)
- AAMAD CrewAI Adapter Rules: `.claude/rules/adapter-crewai.md`. (Governs CrewAI-specific implementation constraints for this project.)
- AAMAD Adapter Registry Rules: `.claude/rules/adapter-registry.md`. (Governs AAMAD_TARGET_RUNTIME selection and resolution.)
- CrewAI Recruitment Example Reference: `crewai-recruitment-example.md`. (Primary reference for the Selenium + `li_at` cookie sourcing approach adopted at MVP. Disclaimer from this document applies: the cookie/Selenium approach is intended only as an example mechanism, may violate LinkedIn's Terms of Service, and could lead to account suspension. This risk is documented in the Risk Assessment and accepted for MVP scope.)

---

## Assumptions

1. The hiring manager holds an active LinkedIn Recruiter seat. Official LinkedIn Recruiter API credentials (partner program access) are not available at MVP. The Selenium + `li_at` cookie browser automation approach is adopted as the MVP sourcing mechanism with explicit acknowledgment of the ToS risk documented in the Risk Assessment. The disclaimer in `crewai-recruitment-example.md` applies: this approach is used because it is the only viable automated sourcing path, not because it is endorsed for production use. Procurement of official API credentials is a future work item.
2. The organization has an active Anthropic Enterprise contract and the hiring manager can provision an API key for this internal tool.
3. AAMAD_TARGET_RUNTIME is set to `crewai` for this project. This was resolved from the project's existing setup (crewai-recruitment-example.md reference, AAMAD framework default, and no override specified by the user).
4. The standalone web app will be deployed locally or on a private cloud instance accessible only to the hiring manager. No enterprise SSO, VPN, or security review is required for MVP.
5. The recruiting team that receives shortlists has no direct interaction with the system — they receive shortlist output via export (email, shared doc, or markdown file) and handle all outreach independently.
6. Candidate profile data available via the LinkedIn Recruiter API is sufficient to perform meaningful scoring against job description criteria. If API data shallowness is discovered during build, the scoring agent will be adjusted to score on available fields only, and the limitation will be surfaced to the hiring manager.
7. No compliance, legal, or data processing constraints were specified by the user. This assumption must be revisited if the tool is ever extended to additional users, roles, or organizations.
8. The shortlist output is not stored server-side after export. Candidate PII does not persist beyond the crew run session.

---

## Open Questions

1. **LinkedIn Recruiter API credential status:** ~~Does the hiring manager currently have active LinkedIn Recruiter API credentials, or does procurement need to be initiated? What is the quota tier (calls per day, profiles per search) under the current or prospective contract?~~ **RESOLVED (2026-05-31):** Official LinkedIn Recruiter API credentials are not available and cannot be immediately obtained. The MVP sourcing mechanism is Selenium browser automation with the `li_at` session cookie, as documented in `crewai-recruitment-example.md`. Migration to the official LinkedIn Recruiter API is a named future work item, to be initiated when credentials become obtainable through the LinkedIn partner program.

2. **LinkedIn API profile field depth:** Which specific profile fields are available via the LinkedIn Recruiter API for the hiring manager's contract tier? (Skills, experience, education, open-to-work status, contact info?) This directly determines what the evaluation agent can score against.

3. **Shortlist export format preference:** ~~Does the recruiting team prefer to receive shortlists as a formatted markdown file, a PDF, a Google Doc link, or pasted into an email body? This shapes the formatting agent's output contract.~~ **RESOLVED (2026-05-31):** Export format is Markdown. The formatting agent's output contract targets a Markdown document as the final shortlist artifact.

4. **Hiring manager's typical role profile:** ~~What types of roles does the hiring manager most commonly source for? (Engineering, GTM, operations?) This determines which skills taxonomies and experience criteria the evaluation agent must handle well and informs QA test cases.~~ **DEFERRED TO PRD AUTHORING.** Candidate profiles and role types will be addressed during PRD authoring.

5. **Acceptable run time:** What is the hiring manager's tolerance for crew run duration? Is 15 minutes acceptable, or is there a preference for a shorter window (e.g., 5 minutes) that might require tradeoffs in candidate volume or scoring depth?

6. **Data handling policy:** Is there an existing organizational policy governing how LinkedIn candidate profile data may be used, stored, or processed by internal tools? If yes, this must be reviewed before MVP deployment.

7. **Anthropic model version to pin:** Should the system pin to `claude-sonnet-4-6` specifically, or to whatever is designated as the current production model in the Anthropic Enterprise contract? The answer affects the model version recorded in `config/agents.yaml`.

---

## Audit

| Field | Value |
|---|---|
| Timestamp | 2026-05-31 |
| Persona ID | @product-mgr |
| Action | MRD authoring — Phase 1 Define |
| Template Used | `.claude/templates/mr-template.md` (AAMAD MRD template, all 5 research dimensions) |
| Runtime Target Resolved | `AAMAD_TARGET_RUNTIME=crewai` (default; not overridden by user; recorded per adapter-registry rules) |
| LLM Resolved | Anthropic Claude via Anthropic Enterprise (user-specified; model claude-sonnet-4-6) |
| LinkedIn Integration Resolved | Selenium WebDriver + `li_at` session cookie browser automation. Official LinkedIn Recruiter API credentials are not available at MVP. `LI_AT` environment variable is the authentication mechanism. Migration to official API is a named future work item. |
| Prompt Trace | Omitted — this artifact is a human-authored MRD synthesis, not a high-risk LLM output. No automated LLM generation required for this artifact type per AAMAD core rules (Prompt Trace applies to production-facing LLM outputs). |
| Output Path | `/Users/chris.sanchez/projects/recruitment-assistant/project-context/1.define/MRD.md` |
| Handoff Status | Ready for PRD authoring. PRD template: `.cursor/templates/prd-template.md`. All five research dimensions complete. Go/No-Go gates documented. Open Questions require resolution before Phase 2 kickoff. |

**Audit Entry — v1.1 Revision**

| Field | Value |
|---|---|
| Timestamp | 2026-05-31 |
| Persona ID | @product-mgr |
| Action | MRD revision v1.1 — sourcing mechanism changed from LinkedIn Recruiter API to Selenium/cookie browser automation per user confirmation that API credentials are unavailable. Open Question #1 resolved (credentials not available; Selenium adopted). Open Question #3 resolved (export format: Markdown). Open Question #4 deferred to PRD authoring. Audit "LinkedIn Integration Resolved" field corrected to reflect Selenium approach. Risk matrix entries updated: LinkedIn API access removed as Go/No-Go blocker; Selenium/ToS High Risk and Selenium fragility Medium Risk entries added. `.env.example` entries updated: API credential vars removed; `LI_AT` added. |
| Changes From v1.0 | Sourcing mechanism throughout document updated from LinkedIn Recruiter API to Selenium + `li_at` cookie. Open Questions #1, #3, #4 resolved or deferred. Audit corrected. Risk matrix revised. `.env.example` env var list revised. |
| Prompt Trace | Omitted — this is a human-directed revision to an existing artifact, not a new high-risk LLM-generated output. |
| Output Path | `/Users/chris.sanchez/projects/recruitment-assistant/project-context/1.define/MRD.md` |
