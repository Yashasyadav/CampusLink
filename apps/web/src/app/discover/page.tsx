"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
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
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { agentService, DiscoveryResponse } from "@/services/agents";

export default function DiscoverPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DiscoverContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DiscoverContent() {
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
    <div className="p-6 md:p-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Phase 7 — Agentic Campus Discovery
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
          Investigate a Campus Problem
        </h1>
        <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
          Describe your problem or technical obstacle. Specialized AI agents analyze query intent, discover evidence-backed people candidates, project artifacts, research papers, and campus hardware resources.
        </p>
      </div>

      {/* Discovery Hero Search Container */}
      <form onSubmit={handleDiscover} className="space-y-4">
        <div className="relative group">
          <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-2 shadow-lg focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition">
            <Compass className="w-6 h-6 text-blue-600 ml-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What campus problem are you trying to solve? (e.g. My ESP32 TinyML audio model has poor accuracy...)"
              className="w-full bg-transparent px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none text-sm md:text-base"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition shadow-md shadow-blue-600/20 shrink-0 text-xs md:text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
              <span>Discover</span>
            </button>
          </div>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="flex gap-2">
              <div className="h-7 bg-slate-200 rounded-xl w-24" />
              <div className="h-7 bg-slate-200 rounded-xl w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-36 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Initial Empty State */}
      {!discovery && !loading && (
        <div className="text-center py-16 space-y-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Start an Agentic Discovery Investigation</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Try queries like: <span className="text-blue-600 font-semibold">"Who has worked on TinyML audio processing on ESP32?"</span> or{" "}
              <span className="text-orange-600 font-semibold">"What labs have equipment for cybersecurity testing?"</span>
            </p>
          </div>
        </div>
      )}

      {/* Discovery Results */}
      {discovery && !loading && (
        <div className="space-y-8">
          {/* 1. QUERY UNDERSTANDING SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" /> Agentic Query Understanding
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 font-mono font-semibold">
                Intent: {discovery.query_understanding.intent}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {discovery.query_understanding.domain.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Academic & Tech Domains</span>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.query_understanding.domain.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {discovery.query_understanding.technologies.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Technologies & Hardware</span>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.query_understanding.technologies.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {discovery.query_understanding.skills.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Relevant Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.query_understanding.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-medium">
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
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> Evidence-Backed People Candidates
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {discovery.people.candidates.length} candidates discovered
              </span>
            </div>

            {discovery.people.candidates.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                No public campus members with matching evidence found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discovery.people.candidates.map((cand) => (
                  <div
                    key={cand.user_id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{cand.display_name}</h3>
                        {cand.department && <p className="text-slate-500 text-xs">{cand.department}</p>}
                      </div>
                      <Link
                        href={`/profile/${cand.user_id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        View Profile <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {cand.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {cand.matched_skills.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {cand.evidence.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Evidence Pointers
                        </span>
                        {cand.evidence.map((ev, i) => (
                          <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
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
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-indigo-600" /> Projects, Research & Solutions
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {discovery.projects.projects.length + discovery.projects.research.length + discovery.projects.solutions.length} records discovered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Projects */}
              {discovery.projects.projects.map((proj) => (
                <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                    <FolderGit2 className="w-3.5 h-3.5" /> PROJECT
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{proj.title}</h4>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">{proj.snippet}</p>
                  <Link href={`/projects/${proj.id}`} className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1 mt-1">
                    Explore Project <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}

              {/* Solutions */}
              {discovery.projects.solutions.map((sol) => (
                <div key={sol.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                    <Lightbulb className="w-3.5 h-3.5" /> PREVIOUS SOLUTION
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{sol.title}</h4>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">{sol.snippet}</p>
                  <Link href={`/solutions/${sol.id}`} className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1 mt-1">
                    View Solution <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}

              {/* Research */}
              {discovery.projects.research.map((res) => (
                <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <BookOpen className="w-3.5 h-3.5" /> RESEARCH PAPER
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{res.title}</h4>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">{res.snippet}</p>
                  <Link href={`/research/${res.id}`} className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 mt-1">
                    Read Paper <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 4. CAMPUS RESOURCES SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" /> Campus Hardware Labs & Equipment
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {discovery.facilities.facilities.length + discovery.facilities.equipment.length} resources discovered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discovery.facilities.facilities.map((fac) => (
                <div key={fac.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-sm">
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                    <Building2 className="w-3.5 h-3.5" /> LABORATORY
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{fac.name}</h4>
                  <p className="text-slate-600">{fac.snippet}</p>
                </div>
              ))}

              {discovery.facilities.equipment.map((eq) => (
                <div key={eq.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-sm">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                    <Wrench className="w-3.5 h-3.5" /> EQUIPMENT
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{eq.name}</h4>
                  <p className="text-slate-600">{eq.snippet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. AGENT EXECUTION TRACES */}
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowTraces(!showTraces)}
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition font-medium"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>View Agent Execution Traces</span>
              {showTraces ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTraces && (
              <div className="mt-4 space-y-2">
                {discovery.traces.map((trace, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900">{trace.agent_name}</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-4">
                      <span>Tools: {trace.tools_called.length > 0 ? trace.tools_called.join(", ") : "None"}</span>
                      <span>Duration: {trace.duration_ms}ms</span>
                      <span className="text-emerald-700 font-bold">{trace.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
