# crew.py
# CrewAI sequential crew entrypoint for the Recruitment Assistant.
# Loads all agent and task definitions from config/agents.yaml and config/tasks.yaml.
# No agent or task definitions are inlined here — all externalized per AAMAD CrewAI adapter rules.
#
# STUB ONLY — implementation is added by @backend.eng in Epic 2.
# Do NOT add application logic here during the Setup epic.
#
# Crew configuration (SAD Section 5.1, PRD Section 3):
#   Process mode:      Sequential (ADR-01)
#   Memory:            False for all agents (ADR-05)
#   max_rpm:           10 (set at crew level for Anthropic token budget stability)
#   Config files:      config/agents.yaml, config/tasks.yaml
#   LLM:               claude-sonnet-4-6 (pinned in agents.yaml)


def run_crew(jd_text: str, max_results: int = 20, filters: dict = None):
    """
    Stub: Instantiate and kick off the CrewAI sequential crew.
    Called by the FastAPI layer (main.py) for each sourcing run.
    Implementation by @backend.eng (Epic 2).
    """
    # TODO (@backend.eng): Implement crew instantiation, YAML config loading,
    #   event queue setup for SSE emission, and crew.kickoff() invocation.
    raise NotImplementedError("run_crew() is not implemented. See Epic 2.")
