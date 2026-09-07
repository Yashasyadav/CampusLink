"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  Compass, Sparkles, User, FolderGit2, BookOpen,
  Building2, ArrowRight, Loader2, AlertCircle,
  Tag, ShieldCheck, ChevronDown, ChevronUp, Zap,
  TerminalSquare, Layers, Network, CheckCircle2,
  HelpCircle, ExternalLink, Lightbulb, Wrench,
  ThumbsUp, ThumbsDown
} from "lucide-react";
import { matchingApi } from "@/lib/api/matching";
import { feedbackApi, FeedbackType } from "@/lib/api/feedback";
import { MatchingAnalyzeResponse, MatchingResult, HelpChain } from "@/types/matching";

const EXAMPLE_QUERIES = [
  "My ESP32 microphone works, but my TinyML keyword detection model has poor accuracy. I don't know whether the problem is the microphone, preprocessing, or ML model.",
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
  const [matchingData, setMatchingData] = useState<MatchingAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTraces, setShowTraces] = useState(false);

  const handleDiscover = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    if (q) setQuery(q);
    setLoading(true);
    setError(null);
    setMatchingData(null);
    try {
      const res = await matchingApi.analyze(finalQuery.trim());
      setMatchingData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CampusLink discovery failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-10 animate-fade-in">

      {/* ── HERO / QUERY BAR ── */}
      <div
        className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${
          matchingData ? "p-6 md:p-8" : "p-8 md:p-12"
        } text-white`}
        style={{ background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #1D4ED8 100%)" }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-orange-500/10 pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[11px] font-bold uppercase tracking-widest text-blue-100 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Phase 8 — Matching & Explanation Intelligence
          </div>

          <h1 className={`font-extrabold tracking-tight text-white mb-3 ${matchingData ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"}`}>
            Turn campus knowledge into your next <span className="text-orange-400">breakthrough</span>.
          </h1>

          {!matchingData && (
            <p className="text-blue-100 text-sm md:text-base max-w-xl leading-relaxed mb-6">
              Describe a technical problem. CampusLink identifies top candidates, explains why they match, surfaces supporting evidence, and maps potential help chains.
            </p>
          )}
        </div>

        {/* Search input form */}
        <div className="relative z-10 mt-4">
          <form onSubmit={(e) => { e.preventDefault(); handleDiscover(); }}>
            <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-xl border border-white/20">
              <Compass className="w-5 h-5 text-blue-600 ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your campus problem or research need…"
                className="flex-1 bg-transparent px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none text-[15px] font-medium"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl transition shadow-blue text-[13px] shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-orange-300" />}
                Discover
              </button>
            </div>
          </form>

          {!matchingData && !loading && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[12px] font-medium text-blue-200 flex items-center gap-1 mr-1">
                <Zap className="w-3.5 h-3.5 text-orange-400" /> Try:
              </span>
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleDiscover(q)}
                  className="text-[12px] px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-blue-100 hover:bg-white/20 transition line-clamp-1 max-w-xs text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ERROR DISPLAY ── */}
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
              <p className="text-sm font-bold text-blue-900">CampusLink AI Investigating & Matching…</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Query Understanding → Candidate Scoring → Evidence Aggregation → Explanation Agent
              </p>
            </div>
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin ml-auto shrink-0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-40 skeleton" />
            ))}
          </div>
        </div>
      )}

      {/* ── MATCHING RESULTS ── */}
      {matchingData && !loading && (
        <div className="space-y-10 animate-fade-in">

          {/* AI UNDERSTANDING SECTION */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI Understanding</h2>
                  <p className="text-xs text-slate-500">Normalized problem summary & extracted matching dimensions</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                {matchingData.understanding.intent}
              </span>
            </div>

            {matchingData.understanding.problem_summary && (
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-800">
                <span className="font-bold text-blue-900">Core Issue Summary: </span>
                {matchingData.understanding.problem_summary}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[13px]">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Domains</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchingData.understanding.domain.length > 0 ? (
                    matchingData.understanding.domain.map((d, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">{d}</span>
                    ))
                  ) : <span className="text-slate-400 italic">General Campus</span>}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technologies</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchingData.understanding.technologies.length > 0 ? (
                    matchingData.understanding.technologies.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-semibold">{t}</span>
                    ))
                  ) : <span className="text-slate-400 italic">None specified</span>}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchingData.understanding.skills.length > 0 ? (
                    matchingData.understanding.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium">{s}</span>
                    ))
                  ) : <span className="text-slate-400 italic">None specified</span>}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Diagnostic Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {(matchingData.understanding.diagnostic_areas && matchingData.understanding.diagnostic_areas.length > 0) ? (
                    matchingData.understanding.diagnostic_areas.map((da, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-medium">{da}</span>
                    ))
                  ) : <span className="text-slate-400 italic">General Investigation</span>}
                </div>
              </div>
            </div>
          </section>

          {/* POTENTIAL EXPERTISE CHAIN SECTION */}
          {matchingData.help_chain && (
            <HelpChainSection helpChain={matchingData.help_chain} />
          )}

          {/* PEOPLE WHO CAN HELP */}
          <section>
            <SectionHeader icon={User} iconColor="text-blue-600" iconBg="bg-blue-50" title="People Who Can Help" count={matchingData.top_people.length} />
            {matchingData.top_people.length === 0 ? (
              <EmptyCategoryMessage message="No public campus members with matching evidence found for this query." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {matchingData.top_people.map((item) => (
                  <CandidateCard key={item.candidate_id} item={item} href={`/profile/${item.candidate_id}`} actionLabel="View Profile" />
                ))}
              </div>
            )}
          </section>

          {/* TOP PREVIOUS SOLUTIONS */}
          <section>
            <SectionHeader icon={Lightbulb} iconColor="text-orange-500" iconBg="bg-orange-50" title="Top Previous Solutions" count={matchingData.top_solutions.length} />
            {matchingData.top_solutions.length === 0 ? (
              <EmptyCategoryMessage message="No previous solution records matching your exact problem symptoms found yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {matchingData.top_solutions.map((item) => (
                  <CandidateCard key={item.candidate_id} item={item} href={`/solutions`} actionLabel="View Solution" isSolution />
                ))}
              </div>
            )}
          </section>

          {/* TOP PROJECTS */}
          <section>
            <SectionHeader icon={FolderGit2} iconColor="text-indigo-600" iconBg="bg-indigo-50" title="Top Projects" count={matchingData.top_projects.length} />
            {matchingData.top_projects.length === 0 ? (
              <EmptyCategoryMessage message="No matching campus projects indexed yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {matchingData.top_projects.map((item) => (
                  <CandidateCard key={item.candidate_id} item={item} href={`/projects/${item.candidate_id}`} actionLabel="View Project" />
                ))}
              </div>
            )}
          </section>

          {/* RELEVANT RESEARCH & FACILITIES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <SectionHeader icon={BookOpen} iconColor="text-emerald-600" iconBg="bg-emerald-50" title="Relevant Research" count={matchingData.research.length} />
              {matchingData.research.length === 0 ? (
                <EmptyCategoryMessage message="No relevant research publications found." />
              ) : (
                <div className="space-y-4 mt-4">
                  {matchingData.research.map((item) => (
                    <CandidateCard key={item.candidate_id} item={item} href={`/research`} actionLabel="View Paper" />
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeader icon={Building2} iconColor="text-purple-600" iconBg="bg-purple-50" title="Relevant Facilities & Hardware" count={matchingData.facilities.length} />
              {matchingData.facilities.length === 0 ? (
                <EmptyCategoryMessage message="No matching laboratories or hardware facilities found." />
              ) : (
                <div className="space-y-4 mt-4">
                  {matchingData.facilities.map((item) => (
                    <CandidateCard key={item.candidate_id} item={item} href={`/facilities/${item.candidate_id}`} actionLabel="View Facility" />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* AGENT TRACE TOGGLE */}
          {matchingData.traces.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowTraces(!showTraces)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
              >
                <TerminalSquare className="w-4 h-4 text-blue-600" />
                {showTraces ? "Hide Execution Traces" : "Show Agent Execution Traces"}
                {showTraces ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTraces && (
                <div className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-2">
                  {matchingData.traces.map((tr, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-800 pb-1.5 last:border-0">
                      <span>✓ {tr.agent_name}</span>
                      <span className="text-slate-400">{tr.duration_ms}ms • {tr.result_count} items</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

{/* ── HELP CHAIN COMPONENT ── */}
function HelpChainSection({ helpChain }: { helpChain: HelpChain }) {
  const isSingle = helpChain.is_single_candidate_sufficient;
  return (
    <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white">
            {isSingle ? "Best Single-Person Match" : "Potential Expertise Chain"}
          </h2>
          <p className="text-xs text-blue-200">
            {isSingle ? "Primary expert covering core technical requirements" : "Multi-domain capability coverage across campus experts"}
          </p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold">
          {isSingle ? "Best Single Match" : `${helpChain.nodes.length}-Person Chain`}
        </span>
      </div>

      <p className="text-xs md:text-sm text-blue-100 mb-6 max-w-2xl leading-relaxed">
        {helpChain.explanation}
      </p>

      {/* Nodes Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="bg-white/10 border border-white/15 rounded-xl p-4 text-center">
          <p className="text-[11px] font-bold text-orange-400 uppercase">Input Problem</p>
          <p className="text-xs font-semibold text-white mt-1 line-clamp-2">Your Natural Language Issue</p>
        </div>

        {helpChain.nodes.map((node, idx) => (
          <div key={node.candidate_id} className="relative flex items-center gap-3">
            <div className="hidden md:block w-4 h-0.5 bg-blue-400/40 -ml-4" />
            <div className="w-full bg-white/10 border border-white/20 rounded-xl p-4 hover:border-orange-400/50 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-blue-300 uppercase">Step {node.step_number}</span>
                <span className="text-[10px] font-bold text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full">{node.focus_area}</span>
              </div>
              <p className="text-sm font-bold text-white">{node.candidate_name}</p>
              <p className="text-[11px] text-blue-200 mt-1 line-clamp-1">{node.reason}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 text-[11px] text-blue-300/80 italic">
        * POTENTIAL EXPERTISE CHAIN: CampusLink identified potential capability overlap. This does not represent a confirmed collaboration agreement.
      </div>
    </section>
  );
}

{/* ── CANDIDATE CARD COMPONENT ── */}
function CandidateCard({ item, href, actionLabel, isSolution = false }: { item: MatchingResult; href: string; actionLabel: string; isSolution?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackType | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const scorePercent = Math.round(item.relevance_score * 100);
  const recId = item.recommendation_id || item.recommendation_event_id;

  const handleFeedbackSubmit = async (type: FeedbackType, textComment?: string) => {
    if (!recId) return;
    setSubmitting(true);
    try {
      await feedbackApi.submitFeedback(recId, {
        feedback_type: type,
        comment: textComment || comment,
      });
      setSubmittedFeedback(type);
      setShowFeedbackModal(false);
      setFeedbackMsg("Feedback saved!");
    } catch (err: unknown) {
      setFeedbackMsg("Failed to save feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all shadow-card hover:shadow-card-hover flex flex-col justify-between ${isSolution ? 'border-orange-200 bg-orange-50/20' : 'border-slate-200'}`}>
      
      <div>
        {/* Card Header & Relevance Bar */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                scorePercent >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                scorePercent >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {item.relevance_level}
              </span>
              {item.help_type && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {item.help_type.replace(/_/g, " ")}
                </span>
              )}
              {item.supporting_evidence.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Grounded ({item.supporting_evidence.length})
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
            {item.subtitle && <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>}
          </div>

          {/* Score indicator */}
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
              <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div className="bg-brand-600 h-full rounded-full" style={{ width: `${scorePercent}%` }} />
              </div>
              <span>{scorePercent}%</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Relevance</p>
          </div>
        </div>

        {/* Primary explanation summary */}
        <p className="text-xs text-slate-700 leading-relaxed mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-normal">
          {item.explanation}
        </p>

        {/* Matched badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.matched_skills.slice(0, 4).map((sk, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">{sk}</span>
          ))}
          {item.matched_technologies.slice(0, 4).map((tc, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">{tc}</span>
          ))}
        </div>

        {/* Expandable Why This Match drawer */}
        <div className="border-t border-slate-100 pt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600 hover:text-brand-600 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
            Why this match?
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 pt-2 text-xs border-t border-slate-100">
              {item.strengths.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Key Strengths</p>
                  <ul className="space-y-1 text-slate-700">
                    {item.strengths.map((str, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.person_evidence_graph && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Evidence Graph</p>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                      {item.person_evidence_graph.evidence_count || item.evidence_count || 0} Sources
                    </span>
                  </div>
                  {item.person_evidence_graph.projects?.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Projects: </span>
                      {item.person_evidence_graph.projects.map((p: any) => p.title).join(", ")}
                    </div>
                  )}
                  {item.person_evidence_graph.solutions?.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Past Solutions: </span>
                      {item.person_evidence_graph.solutions.map((s: any) => s.title).join(", ")}
                    </div>
                  )}
                  {item.person_evidence_graph.research?.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Research: </span>
                      {item.person_evidence_graph.research.map((r: any) => r.title).join(", ")}
                    </div>
                  )}
                  {item.person_evidence_graph.facilities?.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Labs: </span>
                      {item.person_evidence_graph.facilities.map((f: any) => f.name).join(", ")}
                    </div>
                  )}
                </div>
              )}

              {item.supporting_evidence.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Supporting Evidence</p>
                  <div className="space-y-2">
                    {item.supporting_evidence.map((ev, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-0.5">
                          <span>[{ev.source_type}] {ev.source_title}</span>
                          <span className="text-emerald-600 font-mono text-[10px]">{Math.round(ev.relevance * 100)}% match</span>
                        </div>
                        <p className="line-clamp-2 italic">{ev.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer & Feedback Controls */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Feedback buttons */}
          {recId ? (
            <div className="flex items-center gap-1.5 relative">
              {submittedFeedback ? (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {submittedFeedback === "HELPFUL" ? "Helpful" : submittedFeedback.replace(/_/g, " ")}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => handleFeedbackSubmit("HELPFUL")}
                    disabled={submitting}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 transition inline-flex items-center gap-1"
                    title="Mark recommendation as helpful"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Helpful
                  </button>
                  <button
                    onClick={() => setShowFeedbackModal(!showFeedbackModal)}
                    disabled={submitting}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 transition inline-flex items-center gap-1"
                    title="Provide detailed feedback"
                  >
                    <ThumbsDown className="w-3 h-3" />
                    Not helpful
                  </button>
                </>
              )}

              {/* Feedback reason dropdown modal */}
              {showFeedbackModal && (
                <div className="absolute bottom-9 left-0 w-64 bg-white border border-slate-200 rounded-xl p-3 shadow-xl z-20 space-y-2 text-xs">
                  <p className="font-bold text-slate-800">Why was this recommendation unhelpful?</p>
                  <div className="space-y-1">
                    {[
                      { type: "NOT_HELPFUL", label: "Not Relevant" },
                      { type: "WRONG_MATCH", label: "Wrong Skills / Domain" },
                      { type: "INSUFFICIENT_EVIDENCE", label: "Weak Evidence" },
                      { type: "OUTDATED", label: "Outdated Profile" },
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        onClick={() => {
                          setFeedbackType(opt.type as FeedbackType);
                          handleFeedbackSubmit(opt.type as FeedbackType);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 text-slate-700 transition font-medium"
                      >
                        • {opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Optional comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] text-slate-800 focus:outline-none focus:border-brand-500"
                  />
                  <div className="flex justify-end gap-1 pt-1">
                    <button
                      onClick={() => setShowFeedbackModal(false)}
                      className="px-2 py-0.5 rounded text-slate-500 hover:text-slate-700 text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Evidence: {item.evidence_strength}</span>
          )}

          {/* Action link */}
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition"
          >
            {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, iconColor, iconBg, title, count }: { icon: any; iconColor: string; iconBg: string; title: string; count: number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      </div>
      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
        {count}
      </span>
    </div>
  );
}

function EmptyCategoryMessage({ message }: { message: string }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 text-center italic mt-3">
      {message}
    </div>
  );
}
