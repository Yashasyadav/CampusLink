"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SessionSplash } from "@/components/ui/session-splash";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    } else if (!user.profile_completed) {
      router.replace("/onboarding");
    } else {
      router.replace("/discover");
    }
  }, [user, loading, router]);

  return <SessionSplash message="Resolving CampusLink session…" />;
}
