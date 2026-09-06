"use client";

import React from "react";

// ============================================================
// SKELETON PRIMITIVES
// ============================================================

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      style={{
        background: "linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

// ============================================================
// PROJECT CARD SKELETON
// ============================================================

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-card">
      <div className="flex items-start justify-between">
        <SkeletonBox className="h-6 w-20 rounded-full" />
        <SkeletonBox className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonBox className="h-5 w-3/4" />
      <div className="space-y-2">
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-5/6" />
        <SkeletonBox className="h-3.5 w-4/6" />
      </div>
      <div className="flex gap-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
        <SkeletonBox className="h-6 w-14 rounded-full" />
      </div>
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
        <SkeletonBox className="h-4 w-28" />
        <SkeletonBox className="h-4 w-20" />
      </div>
    </div>
  );
}

// ============================================================
// RESEARCH CARD SKELETON
// ============================================================

export function ResearchCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-card">
      <div className="flex items-start justify-between">
        <SkeletonBox className="h-6 w-24 rounded-full" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBox className="h-5 w-4/5" />
      <div className="space-y-2">
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-11/12" />
        <SkeletonBox className="h-3.5 w-3/4" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-6 w-6 rounded-full" />
        <SkeletonBox className="h-4 w-32" />
      </div>
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
        <SkeletonBox className="h-3.5 w-36" />
        <SkeletonBox className="h-4 w-16" />
      </div>
    </div>
  );
}

// ============================================================
// FACILITY CARD SKELETON
// ============================================================

export function FacilityCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-card">
      <div className="flex items-start justify-between">
        <SkeletonBox className="h-10 w-10 rounded-xl" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
      <SkeletonBox className="h-5 w-3/4" />
      <SkeletonBox className="h-4 w-1/2" />
      <div className="space-y-2">
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-4/5" />
      </div>
      <div className="flex gap-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
      <div className="border-t border-slate-100 pt-3">
        <SkeletonBox className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ============================================================
// SOLUTION CARD SKELETON
// ============================================================

export function SolutionCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-card">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-5 w-32 rounded-full" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBox className="h-5 w-4/5" />
      <div className="space-y-1.5">
        <SkeletonBox className="h-3.5 w-16" />
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-5/6" />
      </div>
      <div className="space-y-1.5">
        <SkeletonBox className="h-3.5 w-20" />
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-4/5" />
      </div>
      <div className="flex gap-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================
// SEARCH RESULT SKELETON
// ============================================================

export function SearchResultSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-card">
      <div className="flex items-start justify-between">
        <SkeletonBox className="h-5 w-20 rounded-full" />
        <SkeletonBox className="h-4 w-14" />
      </div>
      <SkeletonBox className="h-5 w-2/3" />
      <div className="space-y-1.5">
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-5/6" />
      </div>
      <div className="flex gap-2">
        <SkeletonBox className="h-6 w-14 rounded-full" />
        <SkeletonBox className="h-6 w-18 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================
// PROFILE SKELETON
// ============================================================

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6 md:p-10 animate-pulse">
      {/* Hero */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex items-center gap-6">
        <SkeletonBox className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <SkeletonBox className="h-8 w-48" />
          <SkeletonBox className="h-5 w-36" />
          <SkeletonBox className="h-4 w-64" />
        </div>
      </div>
      {/* Sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <SkeletonBox className="h-6 w-32" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CARD GRID SKELETON (generic)
// ============================================================

export function CardGridSkeleton({ count = 6, Skeleton = ProjectCardSkeleton }: {
  count?: number;
  Skeleton?: React.ComponentType;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================
// PAGE SKELETON (generic page-level)
// ============================================================

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} className={`h-24 w-full rounded-2xl ${i === 0 ? "h-32" : ""}`} />
      ))}
    </div>
  );
}
