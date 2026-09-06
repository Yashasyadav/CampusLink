"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Compass,
  Search,
  FolderGit2,
  BookOpen,
  User,
  Building2,
  Lightbulb,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Bell,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    group: "Discover",
    items: [
      { label: "Discover", href: "/discover", icon: Compass, badge: "AI" },
      { label: "Search Knowledge", href: "/search", icon: Search },
    ],
  },
  {
    group: "Campus Resources",
    items: [
      { label: "Projects", href: "/projects", icon: FolderGit2 },
      { label: "Research", href: "/research", icon: BookOpen },
      { label: "Facilities & Equipment", href: "/facilities", icon: Building2 },
      { label: "Solutions", href: "/solutions", icon: Lightbulb },
    ],
  },
  {
    group: "Account",
    items: [
      { label: "My Profile", href: "/profile", icon: User },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
    setQuickSearch("");
  };

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "CL";
  const displayName = user?.email ? user.email.split("@")[0] : "User";

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* ================================================================
          SIDEBAR — DESKTOP
          ================================================================ */}
      <aside
        className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen z-30"
        style={{ boxShadow: "1px 0 0 0 #E2E8F0" }}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Link href="/discover" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-blue shrink-0 transition group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" }}
            >
              <Sparkles className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </div>
            <div className="leading-none">
              <span className="font-extrabold text-[15px] text-slate-900 tracking-tight block">
                CampusLink <span className="text-orange-500">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Knowledge Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href + "/"));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
                        ${isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide bg-orange-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        {user && (
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition cursor-default group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{user.role}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ================================================================
          MAIN CONTENT AREA
          ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Header Bar (Desktop) ── */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between sticky top-0 z-20">
          {/* Quick Search */}
          <form onSubmit={handleQuickSearch} className="relative" style={{ width: 360 }}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search campus knowledge…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-400 focus:bg-white transition"
            />
          </form>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Discover CTA */}
            <Link
              href="/discover"
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition shadow-blue"
            >
              <Compass className="w-3.5 h-3.5" />
              Discover
            </Link>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
              <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </button>

            {/* User Menu */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[13px] font-medium text-slate-700 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-fade-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[11px] text-slate-500">Signed in as</p>
                      <p className="text-[13px] font-bold text-slate-900 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                        {user.role}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-rose-600 hover:bg-rose-50 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Mobile Top Bar ── */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <Link href="/discover" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-[15px] text-slate-900">
              CampusLink <span className="text-orange-500">AI</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Mobile Nav Drawer ── */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-14 bg-white z-20 flex flex-col overflow-y-auto">
            <div className="p-4 space-y-5">
              {NAV_ITEMS.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
                    {group.group}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                            isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                          {item.label}
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-orange-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {user && (
              <div className="mt-auto p-4 border-t border-slate-100">
                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Page Content ── */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
