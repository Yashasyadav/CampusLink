"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ResearchItem } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { ApiError } from "@/lib/api-client";
import { BookOpen, Plus, Search, ExternalLink, UserCheck, X, CalendarDays } from "lucide-react";
import { CardGridSkeleton, ResearchCardSkeleton } from "@/components/ui/skeletons";
import { ErrorState, EmptyState } from "@/components/ui/error-state";

export default function ResearchPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ResearchContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ResearchContent() {
  const [researchList, setResearchList] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "", abstract: "", research_area: "",
    publication_type: "JOURNAL", publication_venue: "", doi: "",
    publication_url: "", status: "PUBLISHED", visibility: "PUBLIC",
  });

  const fetchResearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getResearch({ research_area: areaFilter || undefined });
      setResearchList(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load research publications.";
      const status = err instanceof ApiError ? err.status : undefined;
      setError(msg);
      setErrorStatus(status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResearch(); }, [areaFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeService.createResearch({
        title: formData.title,
        abstract: formData.abstract,
        research_area: formData.research_area,
        publication_type: formData.publication_type as ResearchItem["publication_type"],
        publication_venue: formData.publication_venue,
        doi: formData.doi || undefined,
        publication_url: formData.publication_url || undefined,
        status: formData.status as ResearchItem["status"],
        visibility: formData.visibility as ResearchItem["visibility"],
      });
      setIsModalOpen(false);
      fetchResearch();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create research.";
      alert(msg);
    }
  };

  const filtered = researchList.filter((r) =>
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.abstract || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.research_area || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-200 pb-7">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Research & Publications</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading…" : `${researchList.length} publication${researchList.length !== 1 ? "s" : ""} in repository`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl transition shadow-blue shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Publication
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by title, abstract, or research area…"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-[13px] transition" />
        </div>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition">
          <option value="">All Research Areas</option>
          <option value="AI/ML">AI & Machine Learning</option>
          <option value="Security">Cybersecurity</option>
          <option value="IoT">IoT & Embedded Systems</option>
          <option value="Quantum">Quantum Computing</option>
          <option value="Robotics">Robotics</option>
        </select>
      </div>

      {/* CONTENT */}
      {loading ? (
        <CardGridSkeleton count={6} Skeleton={ResearchCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchResearch} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title={searchQuery ? `No publications for "${searchQuery}"` : "No publications yet"}
          description="Be the first to add a research paper to the campus repository."
          action={{ label: "Add Publication", onClick: () => setIsModalOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => <ResearchCard key={r.id} item={r} />)}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add Research Publication</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Contribute to the campus knowledge repository</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Publication Title" required>
                <input required type="text" placeholder="Enter full publication title"
                  value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputCls} />
              </Field>
              <Field label="Abstract">
                <textarea rows={4} placeholder="Research abstract or summary…"
                  value={formData.abstract} onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Research Area">
                  <input type="text" placeholder="e.g. AI & Machine Learning"
                    value={formData.research_area} onChange={(e) => setFormData({ ...formData, research_area: e.target.value })}
                    className={inputCls} />
                </Field>
                <Field label="Publication Type">
                  <select value={formData.publication_type} onChange={(e) => setFormData({ ...formData, publication_type: e.target.value })} className={inputCls}>
                    <option value="JOURNAL">Journal Article</option>
                    <option value="CONFERENCE">Conference Paper</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="THESIS">Thesis / Dissertation</option>
                    <option value="PREPRINT">Preprint</option>
                    <option value="TECHNICAL_REPORT">Technical Report</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Publication Venue">
                  <input type="text" placeholder="e.g. IEEE TPAMI"
                    value={formData.publication_venue} onChange={(e) => setFormData({ ...formData, publication_venue: e.target.value })}
                    className={inputCls} />
                </Field>
                <Field label="DOI">
                  <input type="text" placeholder="10.1109/..."
                    value={formData.doi} onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                    className={inputCls} />
                </Field>
              </div>
              <Field label="Publication URL">
                <input type="url" placeholder="https://..."
                  value={formData.publication_url} onChange={(e) => setFormData({ ...formData, publication_url: e.target.value })}
                  className={inputCls} />
              </Field>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[13px] transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[13px] shadow-blue transition">Add Publication</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ResearchCard({ item }: { item: ResearchItem }) {
  const pubTypeColors: Record<string, string> = {
    JOURNAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CONFERENCE: "bg-blue-50 text-blue-700 border-blue-200",
    WORKSHOP: "bg-indigo-50 text-indigo-700 border-indigo-200",
    THESIS: "bg-purple-50 text-purple-700 border-purple-200",
    PREPRINT: "bg-amber-50 text-amber-700 border-amber-200",
    TECHNICAL_REPORT: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const typeClass = pubTypeColors[item.publication_type] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition-all card-interactive shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase ${typeClass}`}>
            {item.publication_type.replace("_", " ")}
          </span>
          {item.research_area && (
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[120px]">{item.research_area}</span>
          )}
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition mb-2 leading-snug line-clamp-2">{item.title}</h3>
        {item.abstract && <p className="text-slate-500 text-[13px] line-clamp-3 mb-4 leading-relaxed">{item.abstract}</p>}
        {item.publication_venue && (
          <p className="text-[12px] text-slate-500 italic mb-3">{item.publication_venue}</p>
        )}
        {item.authors.length > 0 && (
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-2">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>{item.authors.map((a) => a.full_name || "Unknown").join(", ")}</span>
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[12px] text-slate-500">
        <div className="flex items-center gap-1.5">
          {item.publication_date && (
            <>
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(item.publication_date).getFullYear()}</span>
            </>
          )}
        </div>
        {item.publication_url ? (
          <a href={item.publication_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold transition">
            Read Paper <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-slate-400">{item.status}</span>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">{label}{required && " *"}</label>
      {children}
    </div>
  );
}
