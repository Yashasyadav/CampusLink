"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  Search,
  User,
  FolderGit2,
  BookOpen,
  Building2,
  Wrench,
  Lightbulb,
  ArrowRight,
  Loader2,
  AlertCircle,
  Tag,
  Cpu,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { agentService, DiscoveryResponse } from "@/services/agents";

export default function AgenticDiscoveryPage() {
  const [query, setQuery] = useState("");
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTraces, setShowTraces] = useState(false);

  const handleDiscover = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await agentService.discover(query.trim());
      setDiscovery(res);
    } catch (err: any) {
      setError(err?.message || "Agentic discovery failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Phase 7 — Agentic Campus Discovery
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">
            Investigate a Campus Problem
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Describe your problem or technical obstacle. Specialized AI agents analyze query intent, discover evidence-backed people candidates, project artifacts, research papers, and campus hardware resources.
          </p>
        </div>

        {/* Discovery Input Form */}
        <form onSubmit={handleDiscover} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500/50 transition">
              <Compass className="w-6 h-6 text-indigo-400 ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What campus problem are you trying to solve? (e.g. My ESP32 TinyML audio model has poor accuracy...)"
                className="w-full bg-transparent px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none text-base md:text-lg"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span className="hidden md:inline">Discover</span>
              </button>
            </div>
          </div>
        </form>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-slate-800 rounded w-1/4" />
              <div className="flex gap-2">
                <div className="h-8 bg-slate-800 rounded-xl w-24" />
                <div className="h-8 bg-slate-800 rounded-xl w-24" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-40 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Initial Empty State */}
        {!discovery && !loading && (
          <div className="text-center py-16 space-y-4 bg-slate-900/30 border border-slate-800/40 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-200">Start an Agentic Discovery Investigation</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Example: <span className="text-indigo-400">"Who has worked on TinyML audio processing on ESP32?"</span> or{" "}
                <span className="text-purple-400">"What labs have equipment for cybersecurity testing?"</span>
              </p>
            </div>
          </div>
        )}

        {/* Discovery Results */}
        {discovery && !loading && (
          <div className="space-y-8">
            {/* 1. QUERY UNDERSTANDING SECTION */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Agentic Query Understanding
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
                  Intent: {discovery.query_understanding.intent}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {discovery.query_understanding.domain.length > 0 && (
                  <div>
                    <span className="text-slate-500 block mb-1">Academic & Tech Domains</span>
                    <div className="flex flex-wrap gap-1.5">
                      {discovery.query_understanding.domain.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {discovery.query_understanding.technologies.length > 0 && (
                  <div>
                    <span className="text-slate-500 block mb-1">Technologies & Hardware</span>
                    <div className="flex flex-wrap gap-1.5">
                      {discovery.query_understanding.technologies.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {discovery.query_understanding.skills.length > 0 && (
                  <div>
                    <span className="text-slate-500 block mb-1">Relevant Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {discovery.query_understanding.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. PEOPLE CANDIDATES SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> Evidence-Backed People Candidates
                </h2>
                <span className="text-xs text-slate-400">
                  {discovery.people.candidates.length} candidates discovered
                </span>
              </div>

              {discovery.people.candidates.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                  No public campus members with matching evidence found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discovery.people.candidates.map((cand) => (
                    <div
                      key={cand.user_id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-100 text-base">{cand.display_name}</h3>
                          {cand.department && <p className="text-slate-400 text-xs">{cand.department}</p>}
                        </div>
                        <Link
                          href={`/profile/${cand.user_id}`}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          View Profile <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {cand.matched_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {cand.matched_skills.map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Evidence pointers */}
                      {cand.evidence.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60 space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                            Evidence Pointers
                          </span>
                          {cand.evidence.map((ev, i) => (
                            <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{ev.snippet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. SIMILAR PROJECTS & KNOWLEDGE SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-purple-400" /> Projects, Research & Solutions
                </h2>
                <span className="text-xs text-slate-400">
                  {discovery.projects.projects.length + discovery.projects.research.length + discovery.projects.solutions.length} records discovered
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Projects */}
                {discovery.projects.projects.map((proj) => (
                  <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                      <FolderGit2 className="w-3.5 h-3.5" /> PROJECT
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{proj.title}</h4>
                    <p className="text-slate-400 line-clamp-3 leading-relaxed">{proj.snippet}</p>
                    <Link href={`/projects/${proj.id}`} className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 mt-1">
                      Explore Project <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}

                {/* Solutions */}
                {discovery.projects.solutions.map((sol) => (
                  <div key={sol.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                      <Lightbulb className="w-3.5 h-3.5" /> SOLUTION RECORD
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{sol.title}</h4>
                    <p className="text-slate-400 line-clamp-3 leading-relaxed">{sol.snippet}</p>
                    <Link href={`/solutions/${sol.id}`} className="text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 mt-1">
                      View Solution <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}

                {/* Research */}
                {discovery.projects.research.map((res) => (
                  <div key={res.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <BookOpen className="w-3.5 h-3.5" /> RESEARCH PAPER
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{res.title}</h4>
                    <p className="text-slate-400 line-clamp-3 leading-relaxed">{res.snippet}</p>
                    <Link href={`/research/${res.id}`} className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 mt-1">
                      Read Paper <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. CAMPUS RESOURCES SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" /> Campus Hardware Labs & Equipment
                </h2>
                <span className="text-xs text-slate-400">
                  {discovery.facilities.facilities.length + discovery.facilities.equipment.length} resources discovered
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discovery.facilities.facilities.map((fac) => (
                  <div key={fac.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Building2 className="w-3.5 h-3.5" /> LABORATORY
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm">{fac.name}</h4>
                    <p className="text-slate-400">{fac.snippet}</p>
                  </div>
                ))}

                {discovery.facilities.equipment.map((eq) => (
                  <div key={eq.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <Wrench className="w-3.5 h-3.5" /> EQUIPMENT
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm">{eq.name}</h4>
                    <p className="text-slate-400">{eq.snippet}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. AGENT EXECUTION TRACES */}
            <div className="border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowTraces(!showTraces)}
                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Agent Execution Traces</span>
                {showTraces ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTraces && (
                <div className="mt-4 space-y-2">
                  {discovery.traces.map((trace, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-slate-200">{trace.agent_name}</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-4">
                        <span>Tools: {trace.tools_called.length > 0 ? trace.tools_called.join(", ") : "None"}</span>
                        <span>Duration: {trace.duration_ms}ms</span>
                        <span className="text-emerald-400 font-semibold">{trace.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
