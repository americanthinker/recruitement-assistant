# linkedin_selenium_tool.py
# Custom CrewAI tool: LinkedIn Recruiter browser automation via Selenium + li_at session cookie.
# Bound exclusively to the linkedin_sourcer agent — not exposed to any other agent.
#
# STUB ONLY — implementation is added by @backend.eng in Epic 2.
# Do NOT add application logic here during the Setup epic.
#
# Security note (AAMAD Core + SAD Section 11):
#   - LI_AT cookie value is loaded from os.environ["LI_AT"] inside _run() scope only.
#   - It must NEVER be assigned to an instance variable, class variable, logged, or written to any artifact.
#   - Only the first 4 characters may be referenced for debug purposes (not recommended).
#
# Tool contract (PRD Section 3 / SAD Section 7.1):
#   Input:  {"search_criteria": <parse_jd output JSON>, "max_results": int}
#   Output: JSON array of candidate profile objects


class LinkedInSeleniumTool:
    """Stub for the LinkedIn Selenium sourcing tool. Implementation by @backend.eng (Epic 2)."""

    name: str = "linkedin_selenium_tool"
    description: str = (
        "Search LinkedIn Recruiter for candidate profiles matching structured search criteria. "
        "Uses Selenium WebDriver with li_at session cookie authentication. "
        "Returns a JSON array of candidate profile objects."
    )

    def _run(self, search_criteria: dict, max_results: int = 20) -> list:
        # TODO (@backend.eng): Implement full Selenium tool per SAD Section 7.1 and PRD Section 3.
        raise NotImplementedError("LinkedInSeleniumTool._run() is not implemented. See Epic 2.")
