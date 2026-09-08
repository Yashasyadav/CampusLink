"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Avatar,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Input,
  Layout,
  Menu as AntMenu,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  BellOutlined,
  BookOutlined,
  BulbOutlined,
  CompassOutlined,
  DownOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProductOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Content, Header, Sider } = Layout;

interface AppShellProps {
  children: React.ReactNode;
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

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "CL";
  const displayName = user?.email ? user.email.split("@")[0] : "User";
  const selectedKey =
    NAV_ITEMS.flatMap((group) => group.items).find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href || "/discover";

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
    setQuickSearch("");
  };

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
          <Link href={item.href} onClick={() => setMobileOpen(false)} className="campus-menu-link">
            <span>{item.label}</span>
            {item.badge && <span className="campus-ai-badge">{item.badge}</span>}
            {selectedKey === item.href && <span className="campus-active-dot" />}
          </Link>
        ),
      };
    }),
  }));

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: <Link href="/profile">My Profile</Link>,
      },
      {
        key: "logout",
        label: (
          <Popconfirm
            title="Sign Out"
            description="Are you sure you want to sign out?"
            onConfirm={logout}
            onCancel={(e) => e?.stopPropagation()}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <div 
              className="flex items-center gap-2 text-rose-500 w-full font-medium" 
              onClick={(e) => e.stopPropagation()}
            >
              <LogoutOutlined />
              <span>Sign Out</span>
            </div>
          </Popconfirm>
        ),
      },
    ],
  };

  const brand = (
    <Link href="/discover" className="campus-brand" onClick={() => setMobileOpen(false)}>
      <span className="campus-brand-mark campus-brand-logo">
        <img src="/ksrct-logo.png" alt="KSRCT Logo" />
      </span>
      <span className="campus-brand-copy">
        <span className="campus-brand-name">
          CampusLink <span className="text-orange-500">AI</span>
        </span>
        <span className="campus-brand-subtitle">
          Knowledge Platform
        </span>
      </span>
    </Link>
  );

  const sidebar = (
    <>
      <div className="campus-sidebar-brand">{brand}</div>
      <AntMenu
        className="campus-sidebar-menu"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
      />
      {user && (
        <div className="campus-sidebar-user">
          <Dropdown menu={userMenu} placement="topRight" trigger={["click"]}>
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
          </Dropdown>
        </div>
      )}
    </>
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
            itemBorderRadius: 14,
            itemColor: "#334155",
            itemHeight: 48,
            itemHoverBg: "#f8fafc",
            itemHoverColor: "#0f172a",
            itemSelectedBg: "#eff6ff",
            itemSelectedColor: "#1d4ed8",
          },
        },
      }}
    >
      <Layout className="min-h-screen bg-slate-50 text-slate-900">
        <Sider
          width={250}
          theme="light"
          trigger={null}
          className="campus-sidebar hidden md:flex"
        >
          {sidebar}
        </Sider>

        <Layout className="min-w-0 bg-slate-50">
          <Header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between sticky top-0 z-20">
            <form onSubmit={handleQuickSearch} style={{ width: 360 }}>
              <Input
                prefix={<SearchOutlined className="text-slate-400" />}
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search campus knowledge..."
                className="campus-header-search"
                size="large"
                style={{ borderRadius: '8px' }}
              />
            </form>

            <div className="flex items-center gap-4">
              <Button 
                type="primary" 
                icon={<CompassOutlined />} 
                onClick={() => router.push('/discover')}
                size="large"
                className="hidden lg:inline-flex shadow-blue font-semibold"
                style={{ borderRadius: '10px' }}
              >
                Discover
              </Button>

              <Tooltip title="Notifications">
                <Button type="text" shape="circle" size="large" icon={<BellOutlined />} />
              </Tooltip>

              {user && (
                <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
                  <Button type="text" size="large" style={{ borderRadius: '10px', height: 'auto', padding: '4px 12px' }}>
                    <div className="flex items-center gap-2">
                      <Avatar size={28} className="campus-user-avatar text-[11px] bg-indigo-50 text-blue-600 font-bold border border-blue-100">
                        {initials}
                      </Avatar>
                      <span className="max-w-[120px] truncate font-semibold text-slate-700">{displayName}</span>
                      <DownOutlined className="text-[10px] text-slate-400" />
                    </div>
                  </Button>
                </Dropdown>
              )}
            </div>
          </Header>

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
            width={250}
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            closeIcon={null}
            styles={{ body: { padding: 0 }, header: { display: "none" } }}
          >
            {sidebar}
          </Drawer>

          <Content className="flex-1 min-w-0">{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
