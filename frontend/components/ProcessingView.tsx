// components/ProcessingView.tsx
// View 2: Four-stage progress indicator with SSE event consumption and elapsed timer.
// Rendered when Zustand runStore.status === 'running'.
// Implementation by @frontend.eng in Epic 3.
//
// STUB ONLY — no application logic here during the Setup epic.
// Reference: SAD Section 6.3, PRD Section 6 (View 2: Processing Status).

export default function ProcessingView() {
  // TODO (@frontend.eng): Implement:
  //   - StageIndicator x4 (stages: parse_jd, source_candidates, evaluate_candidates, format_shortlist)
  //     Each tile: pending -> active (spinner) -> done (checkmark) -> error (error icon + message)
  //   - ElapsedTimer (seconds since run start)
  //   - Cancel button dispatching POST /api/run/{runId}/cancel
  //   - SSE subscription via EventSource to GET /api/run/{runId}/status
  //   - assistant-ui AssistantRuntimeProvider for streaming SSE consumption (SAD Section 6.4)
  //   - Zustand store transitions on SSE events (stage_update, run_complete, run_error, run_cancelled)
  return <div>ProcessingView — stub. Implementation in Epic 3.</div>;
}
