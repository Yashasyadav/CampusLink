"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

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

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500">
      <div className="flex items-center gap-3 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Resolving CampusLink session...</span>
      </div>
    </main>
  );
}
