"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  Compass, Sparkles, Search, User, FolderGit2, BookOpen,
  Building2, Wrench, Lightbulb, ArrowRight, Loader2, AlertCircle,
  Tag, ShieldCheck, ChevronDown, ChevronUp, Clock, CheckCircle2,
  Zap, TerminalSquare,
} from "lucide-react";
import { agentService, DiscoveryResponse } from "@/services/agents";

const EXAMPLE_QUERIES = [
  "Who has worked on TinyML audio classification with ESP32?",
  "Find labs with equipment for VLSI circuit testing",
  "Which students solved GPS accuracy issues on mobile robots?",
  "Who can guide me on quantum error correction algorithms?",
];

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

  const handleDiscover = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    if (q) setQuery(q);
    setLoading(true);
    setError(null);
    setDiscovery(null);
    try {
      const res = await agentService.discover(finalQuery.trim());
      setDiscovery(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Agentic discovery failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-10 animate-fade-in">

      {/* ── HERO SECTION ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white"
        style={{ background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #1D4ED8 100%)" }}>
        {/* decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-orange-500/10 pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[11px] font-bold uppercase tracking-widest text-blue-100 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Agentic Campus Discovery Engine
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Find the right <span className="text-orange-400">person</span>,<br />
            project, or <span className="text-orange-400">resource</span> on campus.
          </h1>

          {/* Supporting copy */}
          <p className="text-blue-100 text-sm md:text-base max-w-xl leading-relaxed">
            Describe a technical problem in plain language. Specialized AI agents analyze your intent,
            search across people, projects, research, and facilities, then return evidence-backed matches.
          </p>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10 max-w-md">
          {[
            { value: "4", label: "AI Agents" },
            { value: "6", label: "Entity Types" },
            { value: "Real-time", label: "Evidence Ranking" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-extrabold text-white">{s.value}</p>
              <p className="text-[11px] text-blue-200 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH INPUT ── */}
      <div className="space-y-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleDiscover(); }}
          className="relative"
        >
          <div
            className="flex items-center bg-white border-2 border-slate-200 rounded-2xl shadow-card focus-within:border-blue-500 focus-within:shadow-blue transition-all"
            style={{ minHeight: 64 }}
          >
            <Compass className="w-5 h-5 text-blue-500 ml-5 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your campus problem or research need…"
              className="flex-1 bg-transparent px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none text-[15px]"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="m-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition shadow-blue text-[13px] shrink-0"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4 text-orange-300" />}
              Discover
            </button>
          </div>
        </form>

        {/* Example queries */}
        {!discovery && !loading && (
          <div className="flex flex-wrap gap-2">
            <span className="text-[12px] font-medium text-slate-400 flex items-center gap-1 mr-1">
              <Zap className="w-3.5 h-3.5 text-orange-400" /> Try:
            </span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleDiscover(q)}
                className="text-[12px] px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          {error}
        </div>
      )}

      {/* ── LOADING STATE ── */}
      {loading && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-5 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <TerminalSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">AI Agents Investigating…</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Query Understanding → People Discovery → Project & Knowledge → Facility Discovery
              </p>
            </div>
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin ml-auto shrink-0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-36 skeleton" />
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE (Initial) ── */}
      {!discovery && !loading && !error && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <Compass className="w-7 h-7 text-blue-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">Start an AI-powered investigation</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Describe your campus problem above and let our AI agents discover the right people, projects,
            labs, and previous solutions — all evidence-backed.
          </p>
        </div>
      )}

      {/* ── DISCOVERY RESULTS ── */}
      {discovery && !loading && (
        <div className="space-y-10 animate-fade-in">

          {/* SECTION 1: Query Understanding */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
                  Query Understanding
                </h2>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-mono">
                {discovery.query_understanding.intent}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              {discovery.query_understanding.domain.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Domains</p>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.query_understanding.domain.map((d, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[12px]">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {discovery.query_understanding.technologies.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.query_understanding.technologies.map((t, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-semibold text-[12px]">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {discovery.query_understanding.skills.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.query_understanding.skills.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium text-[12px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: People Candidates */}
          <section>
            <SectionHeader icon={User} iconColor="text-blue-600" iconBg="bg-blue-50" title="People Candidates" count={discovery.people.candidates.length} unit="person" />
            {discovery.people.candidates.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl text-sm text-slate-500 text-center">
                No public campus members with matching evidence found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {discovery.people.candidates.map((cand) => (
                  <div key={cand.user_id} className="bg-white border border-slate-200 hover:border-blue-200 rounded-2xl p-5 shadow-card card-interactive">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {cand.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-[15px]">{cand.display_name}</h3>
                          {cand.department && <p className="text-[12px] text-slate-500">{cand.department}</p>}
                        </div>
                      </div>
                      <Link href={`/profile/${cand.user_id}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700">
                        Profile <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    {cand.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {cand.matched_skills.map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">{sk}</span>
                        ))}
                      </div>
                    )}
                    {cand.evidence.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evidence</p>
                        {cand.evidence.slice(0, 2).map((ev, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{ev.snippet}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 3: Projects, Research, Solutions */}
          <section>
            <SectionHeader
              icon={FolderGit2} iconColor="text-indigo-600" iconBg="bg-indigo-50"
              title="Projects, Research & Previous Solutions"
              count={discovery.projects.projects.length + discovery.projects.research.length + discovery.projects.solutions.length}
              unit="record"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {discovery.projects.projects.map((proj) => (
                <KnowledgeCard key={proj.id} type="PROJECT" iconColor="text-indigo-600" typeIcon={FolderGit2}
                  title={proj.title} snippet={proj.snippet} href={`/projects/${proj.id}`} linkLabel="Explore" linkColor="text-indigo-600 hover:text-indigo-700" />
              ))}
              {discovery.projects.solutions.map((sol) => (
                <KnowledgeCard key={sol.id} type="PREVIOUS SOLUTION" iconColor="text-orange-600" typeIcon={Lightbulb}
                  title={sol.title} snippet={sol.snippet} href={`/solutions/${sol.id}`} linkLabel="View Solution" linkColor="text-orange-600 hover:text-orange-700" />
              ))}
              {discovery.projects.research.map((res) => (
                <KnowledgeCard key={res.id} type="RESEARCH PAPER" iconColor="text-emerald-600" typeIcon={BookOpen}
                  title={res.title} snippet={res.snippet} href={`/research/${res.id}`} linkLabel="Read Paper" linkColor="text-emerald-600 hover:text-emerald-700" />
              ))}
            </div>
          </section>

          {/* SECTION 4: Campus Hardware & Labs */}
          {(discovery.facilities.facilities.length > 0 || discovery.facilities.equipment.length > 0) && (
            <section>
              <SectionHeader icon={Building2} iconColor="text-amber-600" iconBg="bg-amber-50"
                title="Campus Labs & Equipment"
                count={discovery.facilities.facilities.length + discovery.facilities.equipment.length}
                unit="resource" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {discovery.facilities.facilities.map((fac) => (
                  <KnowledgeCard key={fac.id} type="LABORATORY" iconColor="text-amber-600" typeIcon={Building2}
                    title={fac.name} snippet={fac.snippet} href={`/facilities`} linkLabel="View Facility" linkColor="text-amber-600 hover:text-amber-700" />
                ))}
                {discovery.facilities.equipment.map((eq) => (
                  <KnowledgeCard key={eq.id} type="EQUIPMENT" iconColor="text-blue-600" typeIcon={Wrench}
                    title={eq.name} snippet={eq.snippet} href={`/facilities`} linkLabel="View Equipment" linkColor="text-blue-600 hover:text-blue-700" />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 5: Agent Traces */}
          <div className="border-t border-slate-200 pt-6">
            <button
              onClick={() => setShowTraces(!showTraces)}
              className="inline-flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-800 transition font-semibold"
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Agent Execution Traces ({discovery.traces.length})
              {showTraces ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showTraces && (
              <div className="mt-4 space-y-2">
                {discovery.traces.map((trace, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] font-mono">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-slate-900">{trace.agent_name}</span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-6">
                      <span>Tools: {trace.tools_called.length > 0 ? trace.tools_called.join(", ") : "—"}</span>
                      <span>{trace.duration_ms}ms</span>
                      <span className="font-bold text-emerald-700">{trace.status}</span>
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

// ── Reusable Section Header ──
function SectionHeader({
  icon: Icon, iconColor, iconBg, title, count, unit,
}: { icon: React.ElementType; iconColor: string; iconBg: string; title: string; count: number; unit: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
      </div>
      <span className="text-[12px] text-slate-500 font-medium">
        {count} {unit}{count !== 1 ? "s" : ""} discovered
      </span>
    </div>
  );
}

// ── Reusable Knowledge Card ──
function KnowledgeCard({
  type, iconColor, typeIcon: TypeIcon, title, snippet, href, linkLabel, linkColor,
}: {
  type: string; iconColor: string; typeIcon: React.ElementType;
  title: string; snippet: string; href: string; linkLabel: string; linkColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-card card-interactive hover:border-slate-300">
      <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${iconColor} uppercase tracking-wide`}>
        <TypeIcon className="w-3.5 h-3.5" />
        {type}
      </div>
      <h4 className="font-bold text-slate-900 text-[14px] line-clamp-2 leading-snug">{title}</h4>
      <p className="text-[13px] text-slate-600 line-clamp-3 leading-relaxed">{snippet}</p>
      <Link href={href} className={`inline-flex items-center gap-1 text-[12px] font-bold ${linkColor} mt-1`}>
        {linkLabel} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
