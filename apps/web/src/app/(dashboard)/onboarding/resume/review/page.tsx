"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { fetchApi, ApiError } from "@/lib/api-client";
import { CheckCircle2, AlertCircle, Sparkles, Loader2, ArrowRight, Trash2, Edit3, ShieldCheck } from "lucide-react";

interface ExtractionData {
  personal_information?: {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
    portfolio_url?: string;
    github_url?: string;
    linkedin_url?: string;
  };
  skills?: Array<{
    name: string;
    category?: string;
    proficiency?: string;
    evidence?: string;
    confidence: number;
    provenance?: string;
    selected?: boolean;
  }>;
  projects?: Array<{
    title: string;
    description?: string;
    problem_statement?: string;
    technologies?: string[];
    outcomes?: string;
    repository_url?: string;
    selected?: boolean;
  }>;
  summary?: {
    generated_summary?: string;
    is_ai_generated?: boolean;
  };
}

export default function ExtractionReviewPage() {
  return (
    <ProtectedRoute>
      <ExtractionReviewContent />
    </ProtectedRoute>
  );
}

function ExtractionReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc_id");

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const [overallConfidence, setOverallConfidence] = useState<number>(0.95);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [bioSummary, setBioSummary] = useState("");

  const [skills, setSkills] = useState<Array<any>>([]);
  const [projects, setProjects] = useState<Array<any>>([]);

  useEffect(() => {
    if (!docId) {
      setError("No document ID provided.");
      setLoading(false);
      return;
    }

    fetchApi<{ extracted_data: ExtractionData; confidence: number }>(
      `/api/v1/documents/resume/${docId}/extraction`,
      { credentials: "include" }
    )
      .then((res) => {
        const data = res.extracted_data || {};
        setExtraction(data);
        setOverallConfidence(res.confidence || 0.95);

        const p = data.personal_information || {};
        setFullName(p.full_name || "");
        setPhone(p.phone || "");
        setLocation(p.location || "");
        setGithubUrl(p.github_url || "");
        setLinkedinUrl(p.linkedin_url || "");
        setPortfolioUrl(p.portfolio_url || "");

        setBioSummary(data.summary?.generated_summary || "");

        // Initialize skills with selection flags
        const sList = (data.skills || []).map((s) => ({ ...s, selected: true }));
        setSkills(sList);

        // Initialize projects with selection flags
        const pList = (data.projects || []).map((proj) => ({ ...proj, selected: true }));
        setProjects(pList);

        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load extraction payload.");
        setLoading(false);
      });
  }, [docId]);

  const toggleSkill = (index: number) => {
    const updated = [...skills];
    updated[index].selected = !updated[index].selected;
    setSkills(updated);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const toggleProject = (index: number) => {
    const updated = [...projects];
    updated[index].selected = !updated[index].selected;
    setProjects(updated);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!docId) return;

    try {
      setConfirming(true);
      setError(null);

      const confirmedPayload = {
        personal_information: {
          full_name: fullName,
          phone,
          location,
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          portfolio_url: portfolioUrl,
          bio: bioSummary,
        },
        skills: skills.filter((s) => s.selected),
        projects: projects.filter((p) => p.selected),
        summary: {
          generated_summary: bioSummary,
          is_ai_generated: true,
        },
      };

      await fetchApi(`/api/v1/documents/resume/${docId}/confirm`, {
        method: "POST",
        body: JSON.stringify(confirmedPayload),
        credentials: "include",
      });

      setConfirming(false);
      router.push("/profile");
    } catch (err) {
      setConfirming(false);
      setError(err instanceof ApiError ? err.message : "Failed to confirm extraction.");
    }
  };

  const renderConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          High confidence
        </span>
      );
    } else if (confidence >= 0.6) {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Medium confidence
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        Needs review
      </span>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading extraction results...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Resume Extraction Review</h1>
            <p className="text-sm text-slate-500 mt-1">
              Review and confirm AI-extracted details before applying them to your CampusLink profile.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-medium">Overall Confidence:</span>
            {renderConfidenceBadge(overallConfidence)}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Personal Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <ShieldCheck className="w-5 h-5 text-blue-600 mr-2" /> Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">GitHub URL</label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI Generated Summary */}
        {bioSummary && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Sparkles className="w-5 h-5 text-blue-600 mr-2" /> Candidate Summary
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                AI-Generated Candidate Summary
              </span>
            </div>
            <textarea
              rows={3}
              value={bioSummary}
              onChange={(e) => setBioSummary(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>
        )}

        {/* Section 3: Extracted Skills */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Extracted Skills</h2>
            <span className="text-xs text-slate-500">{skills.filter((s) => s.selected).length} selected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills.map((skill, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl border transition flex items-center justify-between ${
                  skill.selected
                    ? "bg-slate-50 border-blue-300"
                    : "bg-white border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={skill.selected}
                    onChange={() => toggleSkill(index)}
                    className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{skill.name}</p>
                    {skill.evidence && (
                      <p className="text-xs text-slate-500 truncate max-w-xs">&quot;{skill.evidence}&quot;</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {renderConfidenceBadge(skill.confidence || 0.9)}
                  <button
                    onClick={() => removeSkill(index)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Extracted Projects */}
        {projects.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Extracted Projects</h2>
              <span className="text-xs text-slate-500">{projects.filter((p) => p.selected).length} selected</span>
            </div>

            <div className="space-y-3">
              {projects.map((proj, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition space-y-2 ${
                    proj.selected
                      ? "bg-slate-50 border-blue-300"
                      : "bg-white border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={proj.selected}
                        onChange={() => toggleProject(index)}
                        className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300"
                      />
                      <span className="text-sm font-bold text-slate-900">{proj.title}</span>
                    </div>
                    <button
                      onClick={() => removeProject(index)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {proj.description && <p className="text-xs text-slate-600 pl-7">{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Confirmation Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            onClick={() => router.push("/onboarding/resume")}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
          >
            Re-upload Resume
          </button>

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Apply to Profile
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
