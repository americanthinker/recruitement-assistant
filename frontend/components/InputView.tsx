// components/InputView.tsx
// View 1: Job description input form with advanced options and ToS risk disclosure.
// Rendered when Zustand runStore.status === 'idle'.
// Implementation by @frontend.eng in Epic 3.
//
// STUB ONLY — no application logic here during the Setup epic.
// Reference: SAD Section 6.3, PRD Section 6 (View 1: Input Form).

export default function InputView() {
  // TODO (@frontend.eng): Implement:
  //   - JobDescriptionForm (freeform textarea, 100-10,000 chars, validation)
  //   - AdvancedOptions collapsible section (max_results, location, experience range, must-have skills)
  //   - TosDisclosure static notice + first-run modal (PRD P1-4)
  //   - FutureCapabilitiesNote (labeled section: ATS integration, outreach generation — planned, not available)
  //   - "Start Sourcing" submit button dispatching POST /api/run
  //   - Zustand store transition to status: 'running' on successful run start
  return <div>InputView — stub. Implementation in Epic 3.</div>;
}
