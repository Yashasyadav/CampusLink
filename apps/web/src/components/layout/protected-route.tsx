"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SessionSplash } from "@/components/ui/session-splash";

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

  // Render branded splash screen while initial auth state is resolving
  if (loading && !user) {
    return <SessionSplash message="Verifying campus credentials…" />;
  }

  if (!user || (requireAdmin && user.role !== "ADMIN")) {
    return null;
  }

  return <>{children}</>;
}
