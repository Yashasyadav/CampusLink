import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import { AntdProvider } from "@/components/antd-provider";
import "antd/dist/reset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusLink AI — Agentic Expertise Discovery Platform",
  description: "Evidence-backed campus expertise, project matching, facility discovery, and faculty connections.",
  icons: {
    icon: "/ksrct-logo.png",
    shortcut: "/ksrct-logo.png",
    apple: "/ksrct-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <AntdProvider>
          <AuthProvider>{children}</AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
