"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import AppNavbar from "@/components/Navbar";
import AppSidebar from "@/components/Sidebar";
import {
  Avatar,
  Badge,
  Button,
  ConfigProvider,
  Divider,
  Drawer,
  Dropdown,
  Layout,
  Menu as AntMenu,
  Tag,
  Tooltip,
  Typography,
  Popconfirm,
} from "antd";
import {
  BookOutlined,
  BulbOutlined,
  CompassOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoreOutlined,
  ProductOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Content, Sider } = Layout;
const { Text } = Typography;

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const brand = (
    <Link href="/discover" className="campus-brand" onClick={() => setMobileOpen(false)}>
      <Avatar
        size={44}
        src="/ksrct-logo.png"
        alt="KSRCT Logo"
        className="campus-brand-logo shrink-0"
      />
      <span className="campus-brand-copy">
        <Text className="campus-brand-name">
          CampusLink <span className="campus-brand-ai">AI</span>
        </Text>
        <Text className="campus-brand-subtitle">
          Knowledge Platform
        </Text>
      </span>
    </Link>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 12,
          fontFamily: "inherit",
        },
        components: {
          Menu: {
            itemBg: "#ffffff",
            itemBorderRadius: 10,
            itemColor: "#475569",
            itemHeight: 44,
            itemHoverBg: "#f1f5f9",
            itemHoverColor: "#0f172a",
            itemSelectedBg: "#eff6ff",
            itemSelectedColor: "#1d4ed8",
          },
        },
      }}
    >
      <Layout className="min-h-screen bg-slate-50 text-slate-900">
        <AppSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <Layout className="min-w-0 bg-slate-50">
          <AppNavbar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            onMobileMenuToggle={() => setMobileOpen(true)}
            className="hidden md:flex"
          />

          <div className="campus-mobile-header md:hidden flex items-center justify-between px-4 bg-white border-b border-slate-200 sticky top-0 z-30">
            {brand}
            <Button
              type="text"
              shape="circle"
              onClick={() => setMobileOpen(true)}
              icon={<MenuOutlined />}
            />
          </div>

          <Drawer
            className="campus-sidebar-drawer md:hidden"
            placement="left"
            size={272}
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            closeIcon={null}
            styles={{ body: { padding: 0 }, header: { display: "none" } }}
          >
            <AppSidebar
              collapsed={false}
              isMobile
              onItemClick={() => setMobileOpen(false)}
            />
          </Drawer>

          <Content className="flex-1 min-w-0">{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
