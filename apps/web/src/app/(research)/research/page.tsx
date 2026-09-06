"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ResearchItem } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { BookOpen, Plus, Search, ExternalLink, UserCheck, X } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    research_area: "",
    publication_type: "JOURNAL",
    publication_venue: "",
    doi: "",
    publication_url: "",
    status: "PUBLISHED",
    visibility: "PUBLIC",
  });

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const data = await knowledgeService.getResearch({
        research_area: areaFilter || undefined,
      });
      setResearchList(data.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load research items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, [areaFilter]);

  const handleCreateResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeService.createResearch({
        title: formData.title,
        abstract: formData.abstract,
        research_area: formData.research_area,
        publication_type: formData.publication_type as any,
        publication_venue: formData.publication_venue,
        doi: formData.doi,
        publication_url: formData.publication_url,
        status: formData.status as any,
        visibility: formData.visibility as any,
      });

      setIsModalOpen(false);
      setFormData({
        title: "",
        abstract: "",
        research_area: "",
        publication_type: "JOURNAL",
        publication_venue: "",
        doi: "",
        publication_url: "",
        status: "PUBLISHED",
        visibility: "PUBLIC",
      });
      fetchResearch();
    } catch (err: any) {
      alert("Error submitting research: " + err.message);
    }
  };

  const filteredResearch = researchList.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.abstract && r.abstract.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.research_area && r.research_area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Research & Publications
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Discover faculty papers, peer-reviewed journals, and technical reports across campus.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Publication</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search research papers by title, author, venue, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 text-xs transition"
          />
        </div>
        <input
          type="text"
          placeholder="Filter by Research Area..."
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition"
        />
      </div>

      {/* List of Research Cards */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs font-medium">Loading research publications...</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">{error}</div>
      ) : filteredResearch.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-sm">No research publications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResearch.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {item.publication_type}
                    </span>
                    {item.research_area && (
                      <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {item.research_area}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500">
                      Venue: {item.publication_venue || "Institutional Press"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition">
                    {item.title}
                  </h3>

                  {item.abstract && (
                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">{item.abstract}</p>
                  )}

                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Authors:{" "}
                      {item.authors.length > 0
                        ? item.authors.map((a) => a.full_name || a.email).join(", ")
                        : item.owner_name || "Faculty Researcher"}
                    </span>
                  </div>
                </div>

                {item.doi && (
                  <a
                    href={item.publication_url || `https://doi.org/${item.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition"
                  >
                    <span>DOI Link</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Submit Research Publication</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResearch} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Publication Title *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Energy-Efficient Routing in Swarm Robotics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Publication Type
                  </label>
                  <select
                    value={formData.publication_type}
                    onChange={(e) => setFormData({ ...formData, publication_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    <option value="JOURNAL">Journal</option>
                    <option value="CONFERENCE">Conference</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="THESIS">Thesis</option>
                    <option value="PREPRINT">Preprint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Research Area
                  </label>
                  <input
                    type="text"
                    value={formData.research_area}
                    onChange={(e) => setFormData({ ...formData, research_area: e.target.value })}
                    placeholder="e.g. Robotics & Autonomous Networks"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Abstract
                </label>
                <textarea
                  rows={3}
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Abstract summary..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  Submit Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
