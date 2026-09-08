"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu, Avatar, Dropdown, Tooltip, Popconfirm, type MenuProps } from "antd";
import {
  BookOutlined,
  BulbOutlined,
  CompassOutlined,
  FolderOpenOutlined,
  ProductOutlined,
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/use-auth";

const { Sider } = Layout;

export interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  onItemClick?: () => void;
  isMobile?: boolean;
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

export default function AppSidebar({
  collapsed,
  setCollapsed,
  onItemClick,
  isMobile = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "CL";
  const displayName = user?.email ? user.email.split("@")[0] : "User";

  const selectedKey =
    NAV_ITEMS.flatMap((group) => group.items).find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href || "/discover";

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      disabled: true,
      className: "cursor-default select-none pb-2 border-b border-slate-100",
      label: (
        <div className="py-1 px-1">
          <p className="text-[13px] font-semibold text-slate-900 truncate m-0 leading-tight">
            {displayName}
          </p>
          <p className="text-[11px] text-slate-400 truncate m-0 mt-0.5 leading-tight font-mono">
            {user?.email || "CampusLink Member"}
          </p>
          {user?.role && (
            <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 rounded">
              {user.role}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "profile",
      icon: <UserOutlined style={{ fontSize: 14 }} />,
      label: (
        <Link href="/profile" onClick={onItemClick} className="font-medium text-slate-700">
          My Profile
        </Link>
      ),
    },
    {
      key: "settings",
      icon: <SettingOutlined style={{ fontSize: 14 }} />,
      label: (
        <Link href="/profile" onClick={onItemClick} className="font-medium text-slate-700">
          Account Settings
        </Link>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      danger: true,
      icon: <LogoutOutlined style={{ fontSize: 14 }} />,
      label: (
        <Popconfirm
          title="Sign Out"
          description="Are you sure you want to sign out?"
          onConfirm={logout}
          onCancel={(e) => e?.stopPropagation()}
          okText="Yes"
          cancelText="No"
          placement={collapsed ? "right" : "top"}
        >
          <div
            className="flex items-center gap-2 text-rose-500 w-full font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Sign Out</span>
          </div>
        </Popconfirm>
      ),
    },
  ];

  // Menu items: in collapsed mode, hide group titles & badges to show neat icons only with tooltips
  const menuItems = collapsed
    ? NAV_ITEMS.flatMap((group) =>
        group.items.map((item) => {
          const Icon = item.icon;
          return {
            key: item.href,
            icon: <Icon style={{ fontSize: 17 }} />,
            label: (
              <Link href={item.href} onClick={onItemClick}>
                {item.label}
              </Link>
            ),
          };
        })
      )
    : NAV_ITEMS.map((group) => ({
        key: group.group,
        type: "group" as const,
        label: group.group,
        children: group.items.map((item) => {
          const Icon = item.icon;
          return {
            key: item.href,
            icon: <Icon />,
            label: (
              <Link href={item.href} onClick={onItemClick} className="campus-menu-link">
                <span>{item.label}</span>
                {item.badge && <span className="campus-ai-badge">{item.badge}</span>}
                {selectedKey === item.href && <span className="campus-active-dot" />}
              </Link>
            ),
          };
        }),
      }));

  const brand = (
    <Link href="/discover" className="campus-brand" onClick={onItemClick}>
      <Avatar
        size={44}
        src="/ksrct-logo.png"
        alt="KSRCT Logo"
        className="campus-brand-logo shrink-0"
      />
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
  );

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div
          className={`campus-sidebar-brand ${
            collapsed ? "flex justify-center px-0" : ""
          }`}
        >
          {collapsed ? (
            <Tooltip title="CampusLink AI" placement="right">
              <Link href="/discover" className="inline-flex justify-center items-center" onClick={onItemClick}>
                <Avatar
                  size={40}
                  src="/ksrct-logo.png"
                  alt="KSRCT Logo"
                  className="campus-brand-logo shrink-0"
                />
              </Link>
            </Tooltip>
          ) : (
            brand
          )}
        </div>

        <Menu
          className="campus-sidebar-menu"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          inlineCollapsed={collapsed}
        />
      </div>

      {user && (
        <div
          className={`campus-sidebar-user ${
            collapsed ? "flex justify-center p-3 border-t border-slate-100" : ""
          }`}
        >
          <Dropdown
            menu={{ items: userMenuItems }}
            placement={collapsed ? "topRight" : "topRight"}
            trigger={["click"]}
          >
            {collapsed ? (
              <Tooltip title={`${displayName} (${user.role?.toUpperCase() || "STUDENT"})`} placement="right">
                <button
                  className="campus-user-card justify-center p-0 cursor-pointer"
                  type="button"
                  aria-label="User menu"
                >
                  <Avatar size={36} className="campus-user-avatar">
                    {initials}
                  </Avatar>
                </button>
              </Tooltip>
            ) : (
              <button className="campus-user-card" type="button">
                <Avatar size={38} className="campus-user-avatar">
                  {initials}
                </Avatar>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13px] font-semibold text-slate-800">
                    {displayName}
                  </span>
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {user.role}
                  </span>
                </span>
              </button>
            )}
          </Dropdown>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return <div className="flex flex-col h-full bg-white">{sidebarContent}</div>;
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      collapsedWidth={80}
      width={250}
      theme="light"
      className="campus-sidebar hidden md:flex"
      style={{
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {sidebarContent}
    </Sider>
  );
}

export { AppSidebar };
