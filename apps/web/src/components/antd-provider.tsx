"use client";
"use client";

import React from "react";
import { App, ConfigProvider } from "antd";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563eb",
          colorInfo: "#2563eb",
          colorSuccess: "#16a34a",
          colorWarning: "#f59e0b",
          colorError: "#dc2626",
          colorTextBase: "#0f172a",
          colorBgBase: "#f8fafc",
          colorBorder: "#e2e8f0",
          borderRadius: 10,
          fontFamily: "inherit",
          controlHeight: 40,
          controlHeightLG: 48,
        },
        components: {
          Button: {
            borderRadius: 10,
            fontWeight: 700,
            primaryShadow: "0 4px 14px 0 rgb(37 99 235 / 0.22)",
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: "0 1px 3px 0 rgb(15 23 42 / 0.08)",
          },
          Input: {
            borderRadius: 10,
            activeBorderColor: "#2563eb",
            hoverBorderColor: "#93c5fd",
          },
          Select: {
            borderRadius: 10,
            optionSelectedBg: "#eff6ff",
          },
          Modal: {
            borderRadiusLG: 18,
            titleFontSize: 18,
          },
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
          Table: {
            borderColor: "#e2e8f0",
            headerBg: "#f8fafc",
            headerColor: "#475569",
            rowHoverBg: "#f8fafc",
          },
          Tag: {
            borderRadiusSM: 999,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
