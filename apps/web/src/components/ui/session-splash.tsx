"use client";

import React from "react";
import Image from "next/image";
import { ShieldCheck, Sparkles } from "lucide-react";

interface SessionSplashProps {
  message?: string;
  subtitle?: string;
}

export function SessionSplash({
  message = "Resolving CampusLink session…",
  subtitle = "Knowledge & Intelligence Platform",
}: SessionSplashProps) {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-50/70 px-4 select-none">
      {/* Ambient background aura glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-400/15 via-indigo-400/10 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/2 h-[420px] w-[580px] -translate-x-1/2 rounded-full bg-gradient-to-t from-sky-400/10 via-blue-500/5 to-transparent blur-3xl"
        aria-hidden="true"
      />

      {/* High-tech micro-grid backdrop overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
        aria-hidden="true"
      />

      {/* Main glassmorphic branding card */}
      <div className="relative z-10 flex w-full max-w-[360px] flex-col items-center rounded-3xl border border-white/80 bg-white/85 p-8 text-center shadow-[0_20px_50px_-15px_rgba(37,99,235,0.12)] backdrop-blur-xl transition-all duration-300">
        {/* Animated Brand Emblem */}
        <div className="relative mb-5 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 opacity-35 blur-lg animate-pulse"
            aria-hidden="true"
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white p-3 shadow-md ring-4 ring-blue-50">
            {/* Using native img for robust asset loading in splash state */}
            <img
              src="/ksrct-logo.png"
              alt="CampusLink Logo"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Brand Title */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            CampusLink
          </span>
          <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-xs font-black uppercase tracking-wider text-orange-500 ring-1 ring-orange-500/20">
            AI
          </span>
        </div>

        {/* Tagline */}
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {subtitle}
        </p>

        {/* Indeterminate Gradient Progress Bar */}
        <div className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="campus-splash-progress h-full w-1/2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500" />
        </div>

        {/* Status Message with Live Pulsing Dot */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[12.5px] font-medium text-slate-600">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
          </span>
          <span className="truncate">{message}</span>
        </div>

        {/* Institutional Trust Badge */}
        <div className="mt-6 flex w-full items-center justify-center gap-1.5 border-t border-slate-100/90 pt-4 text-[11px] font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Institutional Single Sign-On</span>
        </div>
      </div>
    </main>
  );
}
