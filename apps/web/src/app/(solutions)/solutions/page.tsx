"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ProblemSolution } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { ApiError } from "@/lib/api-client";
import { Lightbulb, Plus, Search, Bug, CheckCircle2, ArrowRight, X, BookOpen } from "lucide-react";
import { CardGridSkeleton, SolutionCardSkeleton } from "@/components/ui/skeletons";
import { ErrorState, EmptyState } from "@/components/ui/error-state";

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">{label}{required && " *"}</label>
      {children}
    </div>
  );
}

export default function SolutionsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SolutionsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SolutionsContent() {
  const [solutions, setSolutions] = useState<ProblemSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<ProblemSolution | null>(null);
  const [formData, setFormData] = useState({
    title: "", problem: "", symptoms: "", root_cause: "", solution: "",
    outcome: "", lessons_learned: "", domain: "", skills: "", technologies: "",
    status: "PUBLISHED", visibility: "PUBLIC",
  });

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getSolutions({ domain: domainFilter || undefined });
      setSolutions(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load solutions.";
      const status = err instanceof ApiError ? err.status : undefined;
      setError(msg);
      setErrorStatus(status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSolutions(); }, [domainFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeService.createSolution({
        title: formData.title, problem: formData.problem, symptoms: formData.symptoms || undefined,
        root_cause: formData.root_cause || undefined, solution: formData.solution,
        outcome: formData.outcome || undefined, lessons_learned: formData.lessons_learned || undefined,
        domain: formData.domain || undefined,
        skills: formData.skills.split(",").map((s) => ({ name: s.trim(), skill_id: "" })).filter((s) => s.name) as ProblemSolution["skills"],
        technologies: formData.technologies.split(",").map((t) => ({ name: t.trim(), normalized_name: t.trim().toLowerCase() })).filter((t) => t.name) as ProblemSolution["technologies"],
        status: formData.status as ProblemSolution["status"],
        visibility: formData.visibility as ProblemSolution["visibility"],
      });
      setIsModalOpen(false);
      fetchSolutions();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create solution.";
      alert(msg);
    }
  };

  const filtered = solutions.filter((s) =>
    (s.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.problem || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.domain || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-200 pb-7">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Problem / Solution Knowledge Base</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading…" : `${solutions.length} solution${solutions.length !== 1 ? "s" : ""} in repository`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl transition shadow-blue shrink-0"
        >
          <Plus className="w-4 h-4" /> Record Solution
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by title, problem description, or domain…"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-[13px] transition" />
        </div>
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition">
          <option value="">All Domains</option>
          <option value="IoT">IoT & Embedded</option>
          <option value="AI">AI / ML</option>
          <option value="Security">Security</option>
          <option value="Robotics">Robotics</option>
          <option value="Software">Software</option>
        </select>
      </div>

      {/* CONTENT */}
      {loading ? (
        <CardGridSkeleton count={6} Skeleton={SolutionCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchSolutions} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No solutions recorded yet"
          description="Be the first to document a problem and its solution for future students."
          action={{ label: "Record First Solution", onClick: () => setIsModalOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <SolutionCard key={s.id} solution={s} onView={() => setSelectedSolution(s)} />
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record Problem Solution</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Help future students by documenting your experience</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Title" required>
                <input required type="text" placeholder="Short, searchable title for this problem/solution"
                  value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Problem Description" required>
                <textarea required rows={3} placeholder="Describe the exact problem you encountered…"
                  value={formData.problem} onChange={(e) => setFormData({ ...formData, problem: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Symptoms Observed">
                <textarea rows={2} placeholder="What error messages or behaviors did you see?"
                  value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Root Cause">
                <input type="text" placeholder="What caused the problem?"
                  value={formData.root_cause} onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Solution" required>
                <textarea required rows={3} placeholder="Describe the exact steps to resolve the problem…"
                  value={formData.solution} onChange={(e) => setFormData({ ...formData, solution: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Outcome">
                  <input type="text" placeholder="What changed after applying the fix?"
                    value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Domain">
                  <input type="text" placeholder="e.g. IoT, AI, Security"
                    value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Technologies (comma-separated)">
                  <input type="text" placeholder="ESP32, MQTT, TensorFlow Lite"
                    value={formData.technologies} onChange={(e) => setFormData({ ...formData, technologies: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Skills (comma-separated)">
                  <input type="text" placeholder="Embedded Systems, Debugging"
                    value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[13px] transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[13px] shadow-blue transition">Record Solution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-600 uppercase tracking-wide mb-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Previous Solution
                  {selectedSolution.domain && <span className="ml-2 text-slate-400">· {selectedSolution.domain}</span>}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedSolution.title}</h2>
              </div>
              <button onClick={() => setSelectedSolution(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition shrink-0 ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-5 text-[13px]">
              <DetailBlock icon={Bug} label="Problem" color="text-rose-600" bg="bg-rose-50">{selectedSolution.problem}</DetailBlock>
              {selectedSolution.symptoms && <DetailBlock icon={Bug} label="Symptoms" color="text-amber-600" bg="bg-amber-50">{selectedSolution.symptoms}</DetailBlock>}
              {selectedSolution.root_cause && <DetailBlock icon={Bug} label="Root Cause" color="text-orange-600" bg="bg-orange-50">{selectedSolution.root_cause}</DetailBlock>}
              <DetailBlock icon={CheckCircle2} label="Solution" color="text-emerald-600" bg="bg-emerald-50">{selectedSolution.solution}</DetailBlock>
              {selectedSolution.outcome && <DetailBlock icon={ArrowRight} label="Outcome" color="text-blue-600" bg="bg-blue-50">{selectedSolution.outcome}</DetailBlock>}
              {selectedSolution.lessons_learned && <DetailBlock icon={BookOpen} label="Lessons Learned" color="text-indigo-600" bg="bg-indigo-50">{selectedSolution.lessons_learned}</DetailBlock>}
              {(selectedSolution.technologies.length > 0 || selectedSolution.skills.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {selectedSolution.technologies.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-medium">{t.name}</span>
                  ))}
                  {selectedSolution.skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 rounded-md border border-blue-200 font-medium">{s.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SolutionCard({ solution, onView }: { solution: ProblemSolution; onView: () => void }) {
  return (
    <div className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition-all card-interactive shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600 border border-orange-200 rounded-full">
            <Lightbulb className="w-3 h-3" /> Previous Solution
          </span>
          {solution.domain && (
            <span className="text-[11px] text-slate-500 font-medium">{solution.domain}</span>
          )}
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition mb-3 leading-snug">{solution.title}</h3>
        <div className="space-y-2 mb-4">
          <div>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Problem</p>
            <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">{solution.problem}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Solution</p>
            <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">{solution.solution}</p>
          </div>
        </div>
        {solution.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {solution.technologies.slice(0, 3).map((t, i) => (
              <span key={i} className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 font-medium rounded-md border border-slate-200">{t.name}</span>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 pt-3 flex justify-end">
        <button onClick={onView} className="text-blue-600 hover:text-blue-700 font-bold text-[12px] transition inline-flex items-center gap-1">
          View Full Solution <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function DetailBlock({ icon: Icon, label, color, bg, children }: {
  icon: React.ElementType; label: string; color: string; bg: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl p-4 ${bg} border border-slate-100`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${color} mb-2`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-slate-700 leading-relaxed">{children}</p>
    </div>
  );
}
