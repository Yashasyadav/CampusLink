"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layout,
  Input,
  Button,
  Avatar,
  Badge,
  Dropdown,
  Tooltip,
  Popconfirm,
  type MenuProps,
  type InputRef,
} from "antd";
import {
  SearchOutlined,
  CompassOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/use-auth";

const { Header } = Layout;

export interface AppNavbarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  onMobileMenuToggle?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function AppNavbar({
  collapsed,
  setCollapsed,
  onMobileMenuToggle,
  className = "",
  style = {},
}: AppNavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [quickSearch, setQuickSearch] = useState("");
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<InputRef>(null);

  // Platform detection for keyboard shortcut
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator?.userAgent || ""));
  }, []);

  // Global Command/Ctrl + K shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
    setQuickSearch("");
  };

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "CL";
  const displayName = user?.email ? user.email.split("@")[0] : "User";

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-meta",
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
            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 rounded-md border border-blue-100/60">
              {user.role}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "profile",
      icon: <UserOutlined style={{ fontSize: 14, color: "#64748b" }} />,
      label: (
        <Link href="/profile" className="font-medium text-slate-700 text-[13px]">
          My Profile
        </Link>
      ),
    },
    {
      key: "settings",
      icon: <SettingOutlined style={{ fontSize: 14, color: "#64748b" }} />,
      label: (
        <Link href="/profile" className="font-medium text-slate-700 text-[13px]">
          Account Settings
        </Link>
      ),
    },
    {
      type: "divider",
      className: "my-1",
    },
    {
      key: "logout",
      danger: true,
      icon: <LogoutOutlined style={{ fontSize: 14 }} />,
      label: (
        <Popconfirm
          title="Sign Out"
          description="Are you sure you want to sign out of CampusLink?"
          onConfirm={logout}
          onCancel={(e) => e?.stopPropagation()}
          okText="Sign Out"
          cancelText="Cancel"
          placement="bottomRight"
          okButtonProps={{ danger: true, size: "small" }}
          cancelButtonProps={{ size: "small" }}
        >
          <span
            className="w-full inline-block font-medium text-[13px]"
            onClick={(e) => e.stopPropagation()}
          >
            Sign Out
          </span>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Header
      className={`campus-navbar-header ${className}`}
      style={{
        height: 64,
        lineHeight: "normal",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 0,
        zIndex: 20,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}
    >
      {/* Left side: Optional sidebar trigger & Spotlight Search */}
      <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xl">
        {setCollapsed !== undefined && (
          <Tooltip
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            placement="bottom"
            arrow={{ pointAtCenter: true }}
          >
            <Button
              type="text"
              shape="circle"
              icon={
                collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 17, color: "#475569" }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 17, color: "#475569" }} />
                )
              }
              onClick={() => setCollapsed(!collapsed)}
              className="campus-collapse-btn flex items-center justify-center transition-all duration-200"
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                padding: 0,
                border: "none",
                background: "transparent",
              }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            />
          </Tooltip>
        )}

        <form
          onSubmit={handleQuickSearch}
          className="relative w-full max-w-[380px] min-w-[200px]"
        >
          <Input
            ref={searchInputRef}
            prefix={
              <SearchOutlined
                style={{ color: "#8c8c8c", fontSize: 14, marginRight: 6 }}
              />
            }
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search campus knowledge..."
            className="campus-spotlight-search"
            suffix={
              <span className="flex items-center gap-1 select-none pointer-events-none">
                <kbd className="campus-search-kbd">
                  {isMac ? "⌘K" : "Ctrl K"}
                </kbd>
              </span>
            }
          />
        </form>
      </div>

      {/* Right side: Action items, Notifications, and User Profile */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Discover Button */}
        <Button
          type="primary"
          icon={<CompassOutlined style={{ fontSize: 15 }} />}
          onClick={() => router.push("/discover")}
          className="campus-discover-btn hidden sm:inline-flex"
        >
          Discover
        </Button>

        {/* Notifications Icon Button */}
        <Tooltip title="Notifications" placement="bottom" arrow={{ pointAtCenter: true }}>
          <button
            type="button"
            className="campus-icon-btn"
            aria-label="Notifications"
          >
            <Badge dot offset={[-2, 2]} color="#2563eb">
              <BellOutlined style={{ fontSize: 16, color: "#64748b" }} />
            </Badge>
          </button>
        </Tooltip>

        {/* User Profile Pill / Dropdown */}
        {user ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={["click"]}
            overlayClassName="campus-user-dropdown-overlay"
          >
            <button
              type="button"
              className="campus-profile-chip"
              aria-label="User menu"
            >
              <Avatar size={28} className="campus-profile-avatar">
                {initials}
              </Avatar>
              <span className="campus-profile-name hidden sm:inline-block">
                {displayName}
              </span>
              <DownOutlined style={{ fontSize: 9, color: "#8c8c8c" }} />
            </button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            onClick={() => router.push("/login")}
            className="campus-signin-btn"
          >
            Sign In
          </Button>
        )}
      </div>
    </Header>
  );
}

export { AppNavbar };
