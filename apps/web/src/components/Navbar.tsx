"use client";

import React from "react";
import { Layout, Button, Avatar, Dropdown, Popconfirm } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/use-auth";

const { Header } = Layout;

interface AppNavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function AppNavbar({ collapsed, setCollapsed }: AppNavbarProps) {
  const { user, logout } = useAuth();

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profile",
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
            placement="bottomRight"
          >
            <div 
              className="flex items-center gap-2 text-rose-500 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <LogoutOutlined />
              <span>Logout</span>
            </div>
          </Popconfirm>
        ),
      },
    ],
  };

  return (
    <Header className="bg-white px-4 flex items-center justify-between border-b border-slate-200 shadow-sm transition-all" style={{ padding: 0 }}>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: '16px',
          width: 64,
          height: 64,
        }}
        className="hover:text-blue-600"
      />
      <div className="flex items-center gap-4 pr-6">
        {user ? (
          <Dropdown menu={userMenu} placement="bottomRight" arrow>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition">
              <span className="text-sm font-medium hidden sm:inline">{user?.email || "User"}</span>
              <Avatar icon={<UserOutlined />} className="bg-blue-600" />
            </div>
          </Dropdown>
        ) : (
          <div className="flex gap-2">
            <Button type="primary" href="/login">Login</Button>
          </div>
        )}
      </div>
    </Header>
  );
}
