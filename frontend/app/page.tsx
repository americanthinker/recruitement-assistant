// app/page.tsx
// Root page — renders InputView by default when run.status === 'idle'.
// View transitions (Input -> Processing -> Shortlist) are driven by Zustand runStore.
// Implementation by @frontend.eng in Epic 3.
//
// STUB ONLY — no application logic here during the Setup epic.

export default function Home() {
  // TODO (@frontend.eng): Import and render InputView. Connect to Zustand runStore
  //   to switch between InputView, ProcessingView, and ShortlistView based on run.status.
  //   Reference: SAD Section 6.3, PRD Section 6.
  return (
    <main>
      <p>Recruitment Assistant — stub page. Implementation in Epic 3.</p>
    </main>
  );
}
