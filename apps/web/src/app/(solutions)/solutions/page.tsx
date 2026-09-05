"use me";
"use client";

import React, { useState, useEffect } from "react";
import { ProblemSolution } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { Lightbulb, Plus, Search, Bug, CheckCircle2, AlertTriangle, Sparkles, Code2, BookOpenCheck } from "lucide-react";

export default function SolutionsPage() {
  const [solutions, setSolutions] = useState<ProblemSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<ProblemSolution | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    problem: "",
    symptoms: "",
    root_cause: "",
    solution: "",
    outcome: "",
    lessons_learned: "",
    domain: "",
    skills: "",
    technologies: "",
    status: "PUBLISHED",
    visibility: "PUBLIC",
  });

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const data = await knowledgeService.getSolutions({
        domain: domainFilter || undefined,
      });
      setSolutions(data.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load problem/solution records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, [domainFilter]);

  const handleCreateSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const techArray = formData.technologies.split(",").map((t) => t.trim()).filter(Boolean);
      const skillArray = formData.skills.split(",").map((s) => s.trim()).filter(Boolean);

      await knowledgeService.createSolution({
        title: formData.title,
        problem: formData.problem,
        symptoms: formData.symptoms,
        root_cause: formData.root_cause,
        solution: formData.solution,
        outcome: formData.outcome,
        lessons_learned: formData.lessons_learned,
        domain: formData.domain,
        skills: skillArray as any,
        technologies: techArray as any,
        status: formData.status as any,
        visibility: formData.visibility as any,
      });

      setIsModalOpen(false);
      setFormData({
        title: "",
        problem: "",
        symptoms: "",
        root_cause: "",
        solution: "",
        outcome: "",
        lessons_learned: "",
        domain: "",
        skills: "",
        technologies: "",
        status: "PUBLISHED",
        visibility: "PUBLIC",
      });
      fetchSolutions();
    } catch (err: any) {
      alert("Error submitting solution record: " + err.message);
    }
  };

  const filteredSolutions = solutions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.domain && s.domain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
              <Lightbulb className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-yellow-200 to-white bg-clip-text text-transparent">
                Institutional Problem / Solution Memory
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Verified technical solutions, root cause analyses, and engineering lessons learned from past campus projects.
              </p>
            </div>
          </div>

          <button
            id="add-solution-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded-xl transition shadow-lg shadow-amber-600/25"
          >
            <Plus className="w-5 h-5" />
            Record Solution
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
            <input
              id="search-solutions-input"
              type="text"
              placeholder="Search by bug symptoms, root cause, tech stack, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
          <input
            id="domain-solution-input"
            type="text"
            placeholder="Filter by Domain..."
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading problem & solution records...</div>
        ) : error ? (
          <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-xl">{error}</div>
        ) : filteredSolutions.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No problem/solution records found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSolutions.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-6 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.domain || "Engineering"}
                    </span>
                    <span className="text-xs text-slate-500">Author: {item.author_name || "Campus Engineer"}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 hover:text-amber-400 transition">
                    {item.title}
                  </h3>

                  {/* Problem & Solution snippets */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                        <Bug className="w-3.5 h-3.5" />
                        <span>Problem & Symptoms</span>
                      </div>
                      <p className="text-slate-300 line-clamp-2">{item.problem}</p>
                    </div>

                    <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Solution</span>
                      </div>
                      <p className="text-slate-300 line-clamp-2">{item.solution}</p>
                    </div>
                  </div>

                  {/* Technologies pills */}
                  {item.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.technologies.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-md">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                  {item.lessons_learned ? (
                    <span className="text-amber-300/80 line-clamp-1 italic">💡 {item.lessons_learned}</span>
                  ) : (
                    <span></span>
                  )}
                  <button
                    onClick={() => setSelectedSolution(item)}
                    className="text-amber-400 hover:text-amber-300 font-medium transition"
                  >
                    Read Full Record →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100">Record Institutional Problem & Solution</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Title / Issue Summary *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. ESP32 Wi-Fi Reconnection Socket Leak Fix"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Problem Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  placeholder="What broke or failed during execution?"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Observed Symptoms
                  </label>
                  <textarea
                    rows={2}
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="Log error messages, HTTP timeouts..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Root Cause Diagnosis
                  </label>
                  <textarea
                    rows={2}
                    value={formData.root_cause}
                    onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                    placeholder="Why did it happen under the hood?"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Verified Solution & Code Fix *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  placeholder="Exact steps or code snippet that resolved the problem..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Lessons Learned
                </label>
                <input
                  type="text"
                  value={formData.lessons_learned}
                  onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                  placeholder="Key takeaway for future developers..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="e.g. IoT & Embedded Systems"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Technologies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    placeholder="ESP32, FreeRTOS, C++"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg"
                >
                  Publish Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Record Modal */}
      {selectedSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  {selectedSolution.domain || "Institutional Memory"}
                </span>
                <h2 className="text-2xl font-bold text-slate-100">{selectedSolution.title}</h2>
              </div>
              <button onClick={() => setSelectedSolution(null)} className="text-slate-500 hover:text-slate-300">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-red-400 flex items-center gap-1.5">
                  <Bug className="w-4 h-4" /> Problem Statement
                </h4>
                <p className="text-slate-300 mt-1">{selectedSolution.problem}</p>
              </div>

              {selectedSolution.root_cause && (
                <div>
                  <h4 className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Root Cause Diagnosis
                  </h4>
                  <p className="text-slate-300 mt-1">{selectedSolution.root_cause}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Verified Solution
                </h4>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl mt-1 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                  {selectedSolution.solution}
                </div>
              </div>

              {selectedSolution.lessons_learned && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
                  <span className="font-semibold">💡 Lessons Learned: </span>
                  {selectedSolution.lessons_learned}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
