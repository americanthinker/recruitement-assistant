import type { NextConfig } from "next";

// Next.js 14+ App Router configuration for the Recruitment Assistant frontend.
// Extended by @frontend.eng and @integration.eng in Epics 3 and 4.
const nextConfig: NextConfig = {
  // TODO (@integration.eng): Configure API proxy rewrites so Next.js API routes
  //   forward requests to the FastAPI backend (SAD Section 7.3).
  //   The FastAPI backend runs on NEXT_PUBLIC_API_BASE_URL (default: http://localhost:8000).
};

export default nextConfig;
