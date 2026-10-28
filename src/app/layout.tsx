import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Date Crew — Matchmaker OS",
  description: "A thoughtful workspace for human matchmakers.",
  // Internal tool: keep it out of search indexes even if the URL leaks.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
