// components/ShortlistView.tsx
// View 3: Ranked candidate cards, export, and annotation.
// Rendered when Zustand runStore.status === 'complete'.
// Implementation by @frontend.eng in Epic 3.
//
// STUB ONLY — no application logic here during the Setup epic.
// Reference: SAD Section 6.3, PRD Section 6 (View 3: Shortlist Review).

export default function ShortlistView() {
  // TODO (@frontend.eng): Implement:
  //   - RunSummaryHeader (role title, criteria summary, total evaluated, shortlisted count, timestamp)
  //   - CandidateCard x N (ranked by match_score descending):
  //       ScoreBadge (green 85+, blue 70-84, yellow 55-69, orange 30-54, red <30)
  //       Full name, current title/company, location, open-to-work, LinkedIn URL
  //       Expandable rationale table (criterion | result | evidence)
  //       Remove button dispatching POST /api/run/{runId}/remove/{idx} (optimistic UI)
  //   - InsufficientDataSection (collapsed by default)
  //   - NotesTextArea (freeform, included in export, PRD P1-3)
  //   - ExportButton (GET /api/run/{runId}/export -> downloads shortlist.md)
  //   - "Start New Run" link resetting Zustand store to idle
  return <div>ShortlistView — stub. Implementation in Epic 3.</div>;
}
