# backend/Dockerfile
# Python 3.12 FastAPI + CrewAI service with Selenium/Chrome for LinkedIn sourcing.
# Implementation details (Chrome install, uv sync, entrypoint command) are finalized
# by @backend.eng and @integration.eng in Epics 2 and 4.
#
# Runtime requirements (SAD Section 8.3):
#   - google-chrome-stable or chromium-browser (pinned version)
#   - webdriver-manager handles ChromeDriver version matching automatically
#   - Headless Chrome flags: --headless=new --no-sandbox --disable-dev-shm-usage
#       --disable-gpu --window-size=1920,1080
#
# TODO (@backend.eng / @integration.eng): Replace placeholder steps with:
#   1. Chrome/Chromium installation (apt-get or equivalent)
#   2. uv installation and dependency sync from pyproject.toml
#   3. Correct CMD to start uvicorn on port 8000

FROM python:3.12-slim

WORKDIR /app

# TODO: Install Chrome/Chromium and system dependencies

# TODO: Install uv and sync Python dependencies
# COPY pyproject.toml .
# RUN pip install uv && uv sync

COPY . .

EXPOSE 8000

# TODO: Replace with: CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["echo", "Backend Dockerfile placeholder — implement in Epic 2/4"]
