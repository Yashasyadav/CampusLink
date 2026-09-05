import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusLink AI — Agentic Expertise Discovery Platform",
  description: "Evidence-backed campus expertise, project matching, facility discovery, and faculty connections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface-dark text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
