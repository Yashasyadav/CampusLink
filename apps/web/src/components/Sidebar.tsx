"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu } from "antd";
import {
  BookOutlined,
  BulbOutlined,
  CompassOutlined,
  FolderOpenOutlined,
  ProductOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NAV_ITEMS = [
  {
    group: "Discover",
    items: [
      { label: "Discover", href: "/discover", icon: CompassOutlined, badge: "AI" },
      { label: "Search Knowledge", href: "/search", icon: SearchOutlined },
    ],
  },
  {
    group: "Campus Resources",
    items: [
      { label: "Projects", href: "/projects", icon: FolderOpenOutlined },
      { label: "Research", href: "/research", icon: BookOutlined },
      { label: "Facilities & Equipment", href: "/facilities", icon: ProductOutlined },
      { label: "Solutions", href: "/solutions", icon: BulbOutlined },
    ],
  },
  {
    group: "Account",
    items: [{ label: "My Profile", href: "/profile", icon: UserOutlined }],
  },
];

export default function AppSidebar({ collapsed, setCollapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const selectedKey =
    NAV_ITEMS.flatMap((group) => group.items).find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href || "/discover";

  const menuItems = NAV_ITEMS.map((group) => ({
    key: group.group,
    type: "group" as const,
    label: group.group,
    children: group.items.map((item) => {
      const Icon = item.icon;
      return {
        key: item.href,
        icon: <Icon />,
        label: (
          <Link href={item.href} className="campus-menu-link">
            <span>{item.label}</span>
            {item.badge && <span className="campus-ai-badge">{item.badge}</span>}
            {selectedKey === item.href && <span className="campus-active-dot" />}
          </Link>
        ),
      };
    }),
  }));

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      theme="light"
      width={310}
      className="campus-sidebar"
      breakpoint="lg"
    >
      <div className="campus-sidebar-brand">
        <Link href="/discover" className="campus-brand">
          <span className="campus-brand-mark campus-brand-logo">
            <img src="/ksrct-logo.png" alt="KSRCT Logo" />
          </span>
          {!collapsed && (
            <span className="campus-brand-copy">
              <span className="campus-brand-name">
                CampusLink <span className="text-orange-500">AI</span>
              </span>
              <span className="campus-brand-subtitle">
                Knowledge Platform
              </span>
            </span>
          )}
        </Link>
      </div>
      <Menu
        className="campus-sidebar-menu"
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
      />
    </Sider>
  );
}
