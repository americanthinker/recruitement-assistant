// app/api/run/route.ts
// Next.js API route stub: POST /api/run
// Thin proxy — forwards the request to the FastAPI backend POST /run.
// No business logic lives here (SAD Section 7.3).
// Implementation by @integration.eng in Epic 4.
//
// STUB ONLY — returns {} for now.

import { NextResponse } from "next/server";

export async function POST() {
  // TODO (@integration.eng): Forward POST body to FastAPI backend POST /run.
  //   Return {run_id} from backend response. Handle 409 Conflict (run already active).
  //   Reference: SAD Section 7.2, SAD Section 7.3.
  return NextResponse.json({});
}
