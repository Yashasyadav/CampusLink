"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi } from "@/lib/api-client";
import { ProfileData } from "@/types";
import { getOnboardingState } from "@/lib/onboarding-state";
import {
  CheckCircle2,
  FileText,
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Building2,
  GraduationCap,
  BookOpen,
} from "lucide-react";

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
  const searchParams = useSearchParams();

  // Read step from URL param if present, defaulting to 1
  const paramStep = searchParams.get("step");
  const [step, setStep] = useState<number>(paramStep ? parseInt(paramStep, 10) : 1);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState<number>(4);
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");

  // Load existing profile details and evaluate onboarding state
  useEffect(() => {
    fetchApi<ProfileData>("/api/v1/profiles/me", { credentials: "include" })
      .then((data) => {
        if (data) {
          setFullName(data.full_name || "");
          setDepartment(data.department || "");
          if (data.year) setYear(data.year);
          if (data.designation) setDesignation(data.designation);
          if (data.bio) setBio(data.bio);

          // Evaluate state to resolve initial step if not explicitly set in URL
          if (!paramStep) {
            const state = getOnboardingState(user, data);
            setStep(state.currentStep);
          }
        }
      })
      .catch(() => {});
  }, [user, paramStep]);

  // Explicit helper to navigate steps while updating URL
  const changeStep = (newStep: number) => {
    setStep(newStep);
    router.replace(`/onboarding?step=${newStep}`);
  };

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
      
      // Refresh auth user context without unmounting active view
      await refreshUser();
      
      // Explicitly advance to nextStep (Step 3)
      changeStep(nextStep);
    } catch (err) {
      alert("Failed to save profile information. Please try again.");
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
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> CampusLink AI Onboarding
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tell CampusLink what you care about
          </h1>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Build your campus expertise profile so the right people, projects, and university resources can find you.
          </p>
        </div>

        {/* Polished Stepper Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
            {steps.map((s) => {
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center space-y-1.5 relative z-10 bg-white px-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 ${
                      isCompleted
                        ? "bg-emerald-600 text-white shadow-sm"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:block ${
                      isCurrent ? "text-blue-600" : isCompleted ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Onboarding Card Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Branding Identity Column */}
          <div className="md:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white space-y-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Guided Setup — Step {step} of 5
              </span>
              <h3 className="text-xl font-extrabold leading-snug">
                {step === 1 && "Account Verification"}
                {step === 2 && "Personal & Academic Info"}
                {step === 3 && "Expertise & Knowledge"}
                {step === 4 && "Document Intelligence"}
                {step === 5 && "Setup Completed!"}
              </h3>
              <p className="text-blue-100 text-xs leading-relaxed">
                CampusLink matches verified academic skills with real campus project artifacts, equipment, and research.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-blue-500/40 text-xs">
              <div className="flex items-center gap-2 text-blue-100">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Privacy-aware data controls</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <Building2 className="w-4 h-4 text-blue-200" />
                <span>Campus-wide expertise search</span>
              </div>
            </div>
          </div>

          {/* Right Form Card Column */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            {/* Step 1: Account Verified */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Account Successfully Verified</h4>
                    <p className="text-xs text-emerald-700">
                      You are registered as <strong>{user?.email}</strong> ({user?.role}).
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p>Your authentication credentials are verified. Click below to enter your basic profile information.</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => changeStep(2)}
                    className="inline-flex items-center justify-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-600/20"
                  >
                    Continue to Profile Info <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Basic Profile Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Basic Profile Information</h3>
                  <p className="text-xs text-slate-500">Provide your campus details for expertise matching.</p>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Chen"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>

                  {user?.role === "STUDENT" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Academic Year
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Associate Professor"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Bio / Focus Area
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief summary of your academic or research focus..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    onClick={() => changeStep(1)}
                    className="inline-flex items-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                  </button>

                  <button
                    onClick={() => handleSaveProfile(3)}
                    disabled={saving || !fullName.trim() || !department.trim()}
                    className="inline-flex items-center justify-center py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save & Continue"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Expertise Overview */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 3: Expertise Overview</h3>
                  <p className="text-xs text-slate-500">
                    Skills and projects will be extracted automatically via resume parsing or added manually.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-800">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Automatic Skill Taxonomy Normalization</span>
                  </div>
                  <p className="text-blue-700 leading-relaxed">
                    CampusLink maps technical skills (e.g. Python, ESP32, React) across project contributions and research publications to build an evidence-backed expertise graph.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    onClick={() => changeStep(2)}
                    className="inline-flex items-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                  </button>
                  <button
                    onClick={() => changeStep(4)}
                    className="inline-flex items-center py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-blue-600/20"
                  >
                    Next Step: Resume <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Resume & Document Intelligence */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 4: Resume & Document Intelligence</h3>
                  <p className="text-xs text-slate-500">
                    Upload your PDF or DOCX resume for AI-powered skill extraction and project verification.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-indigo-900">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Gemini Document Intelligence Active</span>
                  </div>
                  <p className="text-indigo-700 leading-relaxed">
                    Upload your resume to automatically extract verified skills, research interests, and project experience.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    onClick={() => changeStep(3)}
                    className="inline-flex items-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                  </button>
                  <button
                    onClick={() => router.push("/onboarding/resume")}
                    className="inline-flex items-center py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-blue-600/20"
                  >
                    Upload & Process Resume <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Complete */}
            {step === 5 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Onboarding Completed!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your profile information has been saved. You can now discover campus expertise and manage your projects.
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => router.push("/discover")}
                    className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-blue-600/20"
                  >
                    Start Campus Discovery
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
