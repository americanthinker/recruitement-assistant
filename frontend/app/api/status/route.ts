// app/api/status/route.ts
// Next.js API route stub: GET /api/run/[runId]/status
// Thin SSE proxy — passes the SSE stream from FastAPI GET /run/{run_id}/status to the browser.
// No business logic lives here (SAD Section 7.3).
// Implementation by @integration.eng in Epic 4.
//
// NOTE: The SAD specifies this route lives at app/api/run/[runId]/status/route.ts
//   This file is a top-level stub placeholder. @frontend.eng will move it to the
//   correct dynamic route path during Epic 3 scaffolding.
//
// STUB ONLY — returns {} for now.

import { NextResponse } from "next/server";

export async function GET() {
  // TODO (@integration.eng): Proxy SSE stream from FastAPI GET /run/{run_id}/status.
  //   Use ReadableStream / EventSourceResponse passthrough.
  //   Reference: SAD Section 7.3, SAD Section 9.3.
  return NextResponse.json({});
}
