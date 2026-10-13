import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Date Crew — Matchmaker OS",
  description: "A thoughtful workspace for human matchmakers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
