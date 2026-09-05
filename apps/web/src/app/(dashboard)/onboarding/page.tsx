"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi } from "@/lib/api-client";
import { ProfileData } from "@/types";
import { CheckCircle2, FileText, User, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}

function OnboardingContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState<number>(4);
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    fetchApi<ProfileData>("/api/v1/profiles/me", { credentials: "include" })
      .then((data) => {
        if (data) {
          setFullName(data.full_name || "");
          setDepartment(data.department || "");
          if (data.year) setYear(data.year);
          if (data.designation) setDesignation(data.designation);
          if (data.bio) setBio(data.bio);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (nextStep: number) => {
    try {
      setSaving(true);
      await fetchApi<ProfileData>("/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName,
          department,
          year: user?.role === "STUDENT" ? Number(year) : undefined,
          designation: user?.role === "FACULTY" ? designation : undefined,
          bio,
        }),
        credentials: "include",
      });
      await refreshUser();
      setStep(nextStep);
    } catch (err) {
      alert("Failed to save profile information.");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, title: "Account" },
    { num: 2, title: "Profile" },
    { num: 3, title: "Expertise" },
    { num: 4, title: "Resume" },
    { num: 5, title: "Complete" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center space-x-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition ${
                  step === s.num
                    ? "bg-sky-500 text-white ring-4 ring-sky-500/20"
                    : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  step === s.num ? "text-sky-400" : "text-slate-500"
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Account Overview */}
        {step === 1 && (
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-50">Step 1: Account Verified</h2>
              <p className="text-sm text-slate-400">
                You are registered as <span className="text-sky-400 font-medium">{user?.email}</span> ({user?.role}).
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="flex items-center py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl transition"
            >
              Continue to Profile Info <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}

        {/* Step 2: Basic Profile Information */}
        {step === 2 && (
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-50">Step 2: Basic Profile Information</h2>
              <p className="text-sm text-slate-400">Provide your campus details for expertise matching.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {user?.role === "STUDENT" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Junior)</option>
                    <option value={4}>Year 4 (Senior)</option>
                  </select>
                </div>
              )}

              {user?.role === "FACULTY" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Associate Professor"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Bio / Focus Area
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary of your academic or research focus..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleSaveProfile(3)}
                disabled={saving}
                className="flex items-center py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save & Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Expertise & Skills Placeholder */}
        {step === 3 && (
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-50">Step 3: Expertise Overview</h2>
              <p className="text-sm text-slate-400">
                Skills and projects will be extracted automatically in Phase 4 via document parsing or added manually.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
              <div className="flex items-center space-x-2 text-sky-400 text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Skill Taxonomy Matching</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                CampusLink normalizes technical skills (e.g. Python, ESP32, React) across project contributions and research publications.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl"
              >
                Next Step: Resume <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Resume & Document Intelligence */}
        {step === 4 && (
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-50">Step 4: Resume & Document Intelligence</h2>
              <p className="text-sm text-slate-400">
                Upload your PDF or DOCX resume for AI-powered skill extraction and project verification.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-sky-800/40 bg-sky-950/20 space-y-3 text-sky-200 text-sm">
              <div className="flex items-center space-x-2 font-semibold text-sky-400">
                <FileText className="w-5 h-5" />
                <span>Gemini Document Intelligence Active</span>
              </div>
              <p className="text-xs text-sky-300/80 leading-relaxed">
                Upload your PDF or DOCX resume to automatically discover skills, research areas, and project experience with explicit evidence provenance.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => router.push("/onboarding/resume")}
                className="flex items-center py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl"
              >
                Upload & Process Resume <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Onboarding Complete */}
        {step === 5 && (
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-50">Onboarding Completed!</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Your profile information has been saved. You can manage privacy settings and view your profile status.
              </p>
            </div>
            <div className="pt-4 flex justify-center space-x-4">
              <button
                onClick={() => router.push("/profile")}
                className="py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl transition"
              >
                View Profile Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
