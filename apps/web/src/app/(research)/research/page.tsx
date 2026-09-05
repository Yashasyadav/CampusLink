"use me";
"use client";

import React, { useState, useEffect } from "react";
import { ResearchItem } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { BookOpen, Plus, Search, ExternalLink, Award, UserCheck, Layers } from "lucide-react";

export default function ResearchPage() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-300 to-white bg-clip-text text-transparent">
                Research & Publications
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Discover faculty papers, peer-reviewed journals, and technical reports across campus.
              </p>
            </div>
          </div>

          <button
            id="add-research-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition shadow-lg shadow-purple-600/25"
          >
            <Plus className="w-5 h-5" />
            Submit Publication
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
            <input
              id="search-research-input"
              type="text"
              placeholder="Search research papers by title, author, venue, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          <input
            id="area-filter-input"
            type="text"
            placeholder="Filter by Research Area..."
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* List of Research Cards */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading research publications...</div>
        ) : error ? (
          <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-xl">{error}</div>
        ) : filteredResearch.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No research publications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResearch.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-6 transition"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {item.publication_type}
                      </span>
                      {item.research_area && (
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300">
                          {item.research_area}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        Venue: {item.publication_venue || "Institutional Press"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 hover:text-purple-400 transition">
                      {item.title}
                    </h3>

                    {item.abstract && (
                      <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{item.abstract}</p>
                    )}

                    {/* Authors List */}
                    <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                      <UserCheck className="w-4 h-4 text-purple-400" />
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                    >
                      <span>DOI Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100">Submit Research Publication</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Publication Title *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Energy-Efficient Routing in Swarm Robotics"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Publication Type
                  </label>
                  <select
                    value={formData.publication_type}
                    onChange={(e) => setFormData({ ...formData, publication_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="JOURNAL">Journal</option>
                    <option value="CONFERENCE">Conference</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="THESIS">Thesis</option>
                    <option value="PREPRINT">Preprint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Research Area
                  </label>
                  <input
                    type="text"
                    value={formData.research_area}
                    onChange={(e) => setFormData({ ...formData, research_area: e.target.value })}
                    placeholder="e.g. Robotics & Autonomous Networks"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Venue / Journal Name
                </label>
                <input
                  type="text"
                  value={formData.publication_venue}
                  onChange={(e) => setFormData({ ...formData, publication_venue: e.target.value })}
                  placeholder="e.g. IEEE Transactions on Robotics"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Abstract
                </label>
                <textarea
                  rows={3}
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Abstract summary..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    DOI Identifier
                  </label>
                  <input
                    type="text"
                    value={formData.doi}
                    onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                    placeholder="10.1000/182"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Publication URL
                  </label>
                  <input
                    type="text"
                    value={formData.publication_url}
                    onChange={(e) => setFormData({ ...formData, publication_url: e.target.value })}
                    placeholder="https://doi.org/..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg"
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
