# main.py
# FastAPI application entrypoint for the Recruitment Assistant backend service.
# Exposes HTTP and SSE endpoints consumed by the Next.js frontend.
#
# STUB ONLY — implementation is added by @backend.eng / @integration.eng in Epics 2 and 4.
# Do NOT add application logic here during the Setup epic.
#
# API surface (SAD Section 7.2, PRD Section 3):
#   POST   /run                          — start a new crew run
#   GET    /run/{run_id}/status          — SSE stream of per-agent progress events
#   GET    /run/{run_id}/shortlist       — shortlist JSON for UI rendering
#   POST   /run/{run_id}/remove/{idx}    — remove a candidate from session shortlist
#   GET    /run/{run_id}/export          — download shortlist.md
#   POST   /run/{run_id}/cancel          — cancel an in-progress run
#
# Startup: validate ANTHROPIC_API_KEY and LI_AT present; fail fast if missing (PRD P0-7).


def create_app():
    """
    Stub: Create and configure the FastAPI application instance.
    Implementation by @integration.eng (Epic 4).
    """
    # TODO (@integration.eng): Implement FastAPI app with all endpoints,
    #   run state manager, SSE emitter, CORS config, and startup secret validation.
    raise NotImplementedError("create_app() is not implemented. See Epic 4.")
