"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
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
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 text-2xl font-bold">
              {profile?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile?.full_name || "Campus User"}</h1>
              <p className="text-sm text-slate-500">
                {user?.email} • <span className="text-blue-600 font-semibold">{user?.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-xl transition border border-slate-200 hover:border-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>

        {/* Completion Progress Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">Profile Completion Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                profile?.profile_completed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {profile?.profile_completed ? "Complete" : "Incomplete (Resume Step Pending)"}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                profile?.profile_completed ? "bg-emerald-500 w-full" : "bg-blue-500 w-3/5"
              }`}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" /> Academic Information
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-400 font-semibold uppercase">Department</span>
                <span className="font-medium text-slate-800">{profile?.department || "Not set"}</span>
              </div>
              {user?.role === "STUDENT" && (
                <div>
                  <span className="block text-xs text-slate-400 font-semibold uppercase">Academic Year</span>
                  <span className="font-medium text-slate-800">Year {profile?.year || "Not set"}</span>
                </div>
              )}
              {user?.role === "FACULTY" && (
                <div>
                  <span className="block text-xs text-slate-400 font-semibold uppercase">Designation</span>
                  <span className="font-medium text-slate-800">{profile?.designation || "Not set"}</span>
                </div>
              )}
            </div>

            <div>
              <span className="block text-xs text-slate-400 font-semibold uppercase mb-1">Bio</span>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {profile?.bio || "No bio provided."}
              </p>
            </div>
          </div>

          {/* Privacy Controls Panel */}
          <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-emerald-600" /> Privacy Controls
            </h2>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Searchable in Discovery</span>
                <input
                  type="checkbox"
                  checked={searchable}
                  onChange={(e) => setSearchable(e.target.checked)}
                  className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>

              <div className="space-y-1">
                <span className="block text-slate-600 font-medium">Contact Visibility</span>
                <select
                  value={contactVisibility}
                  onChange={(e: any) => setContactVisibility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="CONNECTIONS_ONLY">Connections Only</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Show Email Address</span>
                <input
                  type="checkbox"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Show Social Links</span>
                <input
                  type="checkbox"
                  checked={showSocialLinks}
                  onChange={(e) => setShowSocialLinks(e.target.checked)}
                  className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>
            </div>

            <button
              onClick={handleUpdatePrivacy}
              disabled={saving}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Privacy Settings
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
