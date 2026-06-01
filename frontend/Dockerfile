# frontend/Dockerfile
# Node.js 20 LTS Next.js 14+ frontend service for the Recruitment Assistant.
# Implementation details (npm install, build command, entrypoint) are finalized
# by @frontend.eng and @integration.eng in Epics 3 and 4.
#
# Runtime requirements (SAD Section 8.1):
#   - Node.js 20+ LTS
#   - 512MB RAM, 0.5 vCPU minimum
#
# TODO (@frontend.eng / @integration.eng): Replace placeholder steps with:
#   1. npm install (or npm ci for reproducible installs)
#   2. next build
#   3. CMD ["node", "server.js"] or ["npm", "start"]

FROM node:20-slim

WORKDIR /app

# TODO: Copy package.json and install dependencies
# COPY package.json .
# RUN npm ci

COPY . .

EXPOSE 3000

# TODO: Replace with: CMD ["npm", "start"]
CMD ["echo", "Frontend Dockerfile placeholder — implement in Epic 3/4"]
