// app/layout.tsx
// Root layout: fonts, global styles, and providers for the Recruitment Assistant frontend.
// Implementation by @frontend.eng in Epic 3.
//
// STUB ONLY — no application logic here during the Setup epic.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recruitment Assistant",
  description: "AI-powered candidate sourcing tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO (@frontend.eng): Add global fonts, Tailwind base styles, and
  //   AssistantRuntimeProvider wrapper (SAD Section 6.4 / assistant-ui integration).
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
