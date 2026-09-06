"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (requireAdmin && user.role !== "ADMIN") {
        router.push("/discover");
      }
    }
  }, [loading, user, requireAdmin, router]);

  // Only render full-screen loading spinner when initial auth state is unknown AND user is null
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (requireAdmin && user.role !== "ADMIN")) {
    return null;
  }

  return <>{children}</>;
}
