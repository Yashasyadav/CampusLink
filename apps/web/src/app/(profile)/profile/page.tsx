"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi } from "@/lib/api-client";
import { ProfileData } from "@/types";
import {
  User, Shield, CheckCircle2, Save, LogOut, Loader2, Mail,
  MapPin, Briefcase, Github, Linkedin, Globe, Eye, EyeOff,
} from "lucide-react";
import { Button, Select, Switch, Popconfirm } from "antd";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { ResumeSection } from "@/components/resume/resume-section";

// ============================================================
// TOAST — minimal inline implementation (no external dep)
// ============================================================

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let _toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return { toasts, addToast };
}

// ============================================================
// PAGE EXPORT
// ============================================================

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

// ============================================================
// MAIN CONTENT
// ============================================================

function ProfileContent() {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast } = useToast();

  // Privacy state
  const [searchable, setSearchable] = useState(true);
  const [contactVisibility, setContactVisibility] = useState<"PUBLIC" | "CONNECTIONS_ONLY" | "PRIVATE">("CONNECTIONS_ONLY");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(true);

  useEffect(() => {
    fetchApi<ProfileData>("/api/v1/profiles/me", { credentials: "include" })
      .then((data) => {
        setProfile(data);
        setSearchable(data.searchable);
        setContactVisibility(data.contact_visibility);
        setShowEmail(data.show_email);
        setShowPhone(data.show_phone);
        setShowSocialLinks(data.show_social_links);
      })
      .catch(() => addToast("Could not load profile.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdatePrivacy = async () => {
    try {
      setSaving(true);
      const updated = await fetchApi<ProfileData>("/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          searchable, contact_visibility: contactVisibility,
          show_email: showEmail, show_phone: showPhone, show_social_links: showSocialLinks,
        }),
        credentials: "include",
      });
      setProfile(updated);
      await refreshUser();
      addToast("Privacy settings updated successfully.", "success");
    } catch {
      addToast("Failed to update privacy settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : user?.email.substring(0, 2).toUpperCase() || "CL";

  if (loading) {
    return (
      <AppShell>
        <ProfileSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ── Toast Container ── */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: "22rem" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-semibold shadow-xl animate-fade-in-up border ${
              t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : t.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.type === "success" ? "text-emerald-500" : t.type === "error" ? "text-rose-500" : "text-blue-500"}`} />
            {t.message}
          </div>
        ))}
      </div>

      <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-6 animate-fade-in" style={{ maxWidth: 1000 }}>

        {/* ── HERO HEADER ── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
          {/* Colorful top strip */}
          <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #2563EB 0%, #1D4ED8 50%, #F97316 100%)" }} />
          <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shrink-0 shadow-blue"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" }}
            >
              {initials}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{profile?.full_name || "Campus User"}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[13px] text-slate-500">{user?.email}</span>
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                  {user?.role}
                </span>
                {profile?.profile_completed && (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Profile
                  </span>
                )}
              </div>
              {profile?.bio && (
                <p className="text-[14px] text-slate-600 mt-3 leading-relaxed max-w-xl">{profile.bio}</p>
              )}
            </div>
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Popconfirm
                title="Sign Out"
                description="Are you sure you want to sign out?"
                onConfirm={logout}
                okText="Yes"
                cancelText="No"
                placement="bottomRight"
              >
                <Button danger icon={<LogOut className="w-3.5 h-3.5" />}>
                  Sign Out
                </Button>
              </Popconfirm>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT COLUMN — Academic Info + Social + Resume */}
          <div className="md:col-span-2 space-y-6">

            {/* Academic Info */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-[14px] font-bold text-slate-900">Academic Profile</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ProfileField icon={Briefcase} label="Department" value={profile?.department} />
                {user?.role === "STUDENT" && (
                  <ProfileField icon={User} label="Academic Year" value={profile?.year ? `Year ${profile.year}` : undefined} />
                )}
                {user?.role === "FACULTY" && (
                  <ProfileField icon={Briefcase} label="Designation" value={profile?.designation} />
                )}
                <ProfileField icon={MapPin} label="Location" value={profile?.location} />
                <ProfileField icon={Mail} label="Phone" value={profile?.phone} />
                {profile?.github_url && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GitHub</p>
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                      className="text-[13px] text-blue-600 hover:underline flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" />
                      {profile.github_url.replace("https://github.com/", "@")}
                    </a>
                  </div>
                )}
                {profile?.linkedin_url && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">LinkedIn</p>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="text-[13px] text-blue-600 hover:underline flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5" />
                      View Profile
                    </a>
                  </div>
                )}
                {profile?.portfolio_url && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio</p>
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                      className="text-[13px] text-blue-600 hover:underline flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Visit Site
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Resume Section */}
            <ResumeSection onToast={addToast} />
          </div>

          {/* RIGHT COLUMN — Privacy + Profile Completion */}
          <div className="space-y-6">
            {/* Profile Completion Card */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <h2 className="text-[14px] font-bold text-slate-900">Profile Status</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[12px] mb-2">
                    <span className="font-semibold text-slate-700">Completion</span>
                    <span className={`font-bold ${profile?.profile_completed ? "text-emerald-600" : "text-amber-600"}`}>
                      {profile?.profile_completed ? "100%" : "60%"}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${profile?.profile_completed ? "bg-emerald-500 w-full" : "bg-blue-500 w-3/5"}`}
                    />
                  </div>
                  {!profile?.profile_completed && (
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Upload and confirm your resume to complete your profile and become discoverable.
                    </p>
                  )}
                </div>

                {/* Check items */}
                {[
                  { label: "Profile info filled", done: !!profile?.full_name },
                  { label: "Resume uploaded", done: !!profile?.profile_completed },
                  { label: "AI extraction confirmed", done: !!profile?.profile_completed },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-[12px]">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-100" : "bg-slate-100"}`}>
                      <CheckCircle2 className={`w-3 h-3 ${item.done ? "text-emerald-600" : "text-slate-300"}`} />
                    </div>
                    <span className={item.done ? "text-slate-700 font-medium" : "text-slate-400"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy Controls */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <h2 className="text-[14px] font-bold text-slate-900">Privacy Controls</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Searchable toggle */}
                <Toggle
                  label="Searchable in Discovery"
                  description="AI agents can recommend you to others"
                  icon={searchable ? Eye : EyeOff}
                  checked={searchable}
                  onChange={setSearchable}
                />

                {/* Contact Visibility */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-slate-700">Contact Visibility</label>
                  <select
                    value={contactVisibility}
                    onChange={(e) => setContactVisibility(e.target.value as typeof contactVisibility)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="PUBLIC">Public — Anyone</option>
                    <option value="CONNECTIONS_ONLY">Connections Only</option>
                    <option value="PRIVATE">Private — Just Me</option>
                  </select>
                </div>

                <Toggle label="Show Email" description="Let others see your email" icon={showEmail ? Eye : EyeOff} checked={showEmail} onChange={setShowEmail} />
                <Toggle label="Show Social Links" description="Display GitHub, LinkedIn, Portfolio" icon={showSocialLinks ? Eye : EyeOff} checked={showSocialLinks} onChange={setShowSocialLinks} />

                <button
                  onClick={handleUpdatePrivacy}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition shadow-blue"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Privacy Settings
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Helpers ──

function ProfileField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-[14px] font-medium text-slate-800">{value || <span className="text-slate-400">Not set</span>}</p>
    </div>
  );
}

function Toggle({
  label, description, icon: Icon, checked, onChange,
}: { label: string; description: string; icon: React.ElementType; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${checked ? "bg-blue-50" : "bg-slate-100"}`}>
          <Icon className={`w-3.5 h-3.5 ${checked ? "text-blue-600" : "text-slate-400"}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 truncate">{label}</p>
          <p className="text-[11px] text-slate-400 leading-tight">{description}</p>
        </div>
      </div>
      {/* Toggle switch */}
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-blue-600" : "bg-slate-200"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </label>
  );
}
