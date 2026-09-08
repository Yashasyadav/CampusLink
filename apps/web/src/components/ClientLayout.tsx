"use client";

import React, { useState, useEffect } from "react";
import { Layout } from "antd";
import { usePathname } from "next/navigation";
import AppSidebar from "./Sidebar";
import AppNavbar from "./Navbar";

const { Content } = Layout;

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  // Define routes where Navbar/Sidebar should be hidden
  const hideLayout = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout>
        <AppNavbar collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content style={{ margin: "24px 16px", padding: 24, background: "#f8fafc", borderRadius: "8px" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
