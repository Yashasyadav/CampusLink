"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi } from "@/lib/api-client";
import { ProfileData } from "@/types";
import { User, Shield, Eye, Lock, CheckCircle2, Save, LogOut, Loader2 } from "lucide-react";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Privacy states
  const [searchable, setSearchable] = useState(true);
  const [contactVisibility, setContactVisibility] = useState<"PUBLIC" | "CONNECTIONS_ONLY" | "PRIVATE">("CONNECTIONS_ONLY");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(true);

  useEffect(() => {
    fetchApi<ProfileData>("/api/v1/profiles/me", { credentials: "include" })
      .then((data) => {
        setProfile(data);
        if (data) {
          setSearchable(data.searchable);
          setContactVisibility(data.contact_visibility);
          setShowEmail(data.show_email);
          setShowPhone(data.show_phone);
          setShowSocialLinks(data.show_social_links);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdatePrivacy = async () => {
    try {
      setSaving(true);
      const updated = await fetchApi<ProfileData>("/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          searchable,
          contact_visibility: contactVisibility,
          show_email: showEmail,
          show_phone: showPhone,
          show_social_links: showSocialLinks,
        }),
        credentials: "include",
      });
      setProfile(updated);
      await refreshUser();
      alert("Privacy settings updated successfully.");
    } catch (err) {
      alert("Failed to update privacy settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-950 text-sky-400 border border-sky-800/50 text-2xl font-bold">
              {profile?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-50">{profile?.full_name || "Campus User"}</h1>
              <p className="text-sm text-slate-400">
                {user?.email} • <span className="text-sky-400 font-semibold">{user?.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 text-xs font-semibold uppercase tracking-wider rounded-xl transition border border-slate-700 hover:border-red-800/50"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>

        {/* Completion Progress Banner */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-200">Profile Completion Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                profile?.profile_completed
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                  : "bg-amber-950 text-amber-400 border border-amber-800/50"
              }`}
            >
              {profile?.profile_completed ? "Complete" : "Incomplete (Resume Step Pending)"}
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                profile?.profile_completed ? "bg-emerald-500 w-full" : "bg-sky-500 w-3/5"
              }`}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="md:col-span-2 space-y-6 bg-slate-900/80 p-8 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-50 border-b border-slate-800 pb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-sky-400" /> Academic Information
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase">Department</span>
                <span className="font-medium text-slate-200">{profile?.department || "Not set"}</span>
              </div>
              {user?.role === "STUDENT" && (
                <div>
                  <span className="block text-xs text-slate-500 font-semibold uppercase">Academic Year</span>
                  <span className="font-medium text-slate-200">Year {profile?.year || "Not set"}</span>
                </div>
              )}
              {user?.role === "FACULTY" && (
                <div>
                  <span className="block text-xs text-slate-500 font-semibold uppercase">Designation</span>
                  <span className="font-medium text-slate-200">{profile?.designation || "Not set"}</span>
                </div>
              )}
            </div>

            <div>
              <span className="block text-xs text-slate-500 font-semibold uppercase mb-1">Bio</span>
              <p className="text-sm text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 leading-relaxed">
                {profile?.bio || "No bio provided."}
              </p>
            </div>
          </div>

          {/* Privacy Controls Panel */}
          <div className="space-y-6 bg-slate-900/80 p-8 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-50 border-b border-slate-800 pb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-emerald-400" /> Privacy Controls
            </h2>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Searchable in Discovery</span>
                <input
                  type="checkbox"
                  checked={searchable}
                  onChange={(e) => setSearchable(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 h-4 w-4"
                />
              </label>

              <div className="space-y-1">
                <span className="block text-slate-400 font-medium">Contact Visibility</span>
                <select
                  value={contactVisibility}
                  onChange={(e: any) => setContactVisibility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="CONNECTIONS_ONLY">Connections Only</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Show Email Address</span>
                <input
                  type="checkbox"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Show Social Links</span>
                <input
                  type="checkbox"
                  checked={showSocialLinks}
                  onChange={(e) => setShowSocialLinks(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 h-4 w-4"
                />
              </label>
            </div>

            <button
              onClick={handleUpdatePrivacy}
              disabled={saving}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Privacy Settings
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
