"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Input, Button, Tag, Alert, ConfigProvider, Card, Tooltip } from "antd";
import {
  Compass, Sparkles, User, FolderGit2, BookOpen,
  Building2, ArrowRight, Loader2, AlertCircle,
  LucideTag, ShieldCheck, ChevronDown, ChevronUp, Zap,
  TerminalSquare, Layers, Network, CheckCircle2,
  HelpCircle, ExternalLink, Lightbulb, Wrench,
  ThumbsUp, ThumbsDown
} from "lucide-react";
import { matchingApi } from "@/lib/api/matching";
import { feedbackApi, FeedbackType } from "@/lib/api/feedback";
import { MatchingAnalyzeResponse, MatchingResult, HelpChain, ResultType } from "@/types/matching";
import { getEvidenceDetails } from "@/lib/evidence";

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
        className="relative overflow-hidden transition-all duration-300 shadow-2xl"
        style={{ 
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #1d4ed8 100%)",
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 20px 50px -15px rgba(29, 78, 216, 0.45)",
          padding: matchingData ? "28px 36px" : "36px 44px",
        }}
      >
        {/* Luminous blue aurora ambient spots */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-sky-300/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />

        {/* High-Tech Micro-grid Pattern Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(to right, black, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to right, black, transparent 80%)",
          }}
        />

        <div className="relative z-10 max-w-3xl">
          {/* Phase / Status Tag */}
          <div
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-4 transition-all duration-300 select-none shadow-sm"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span
              className="text-white font-semibold text-[11px] uppercase tracking-wider"
              style={{ letterSpacing: "0.08em" }}
            >
              Campus Intelligence Engine <span className="text-blue-200 mx-1">•</span> Real-time Matching
            </span>
          </div>

          <h1
            className="text-white mb-3"
            style={{
              fontSize: matchingData ? "clamp(1.75rem, 2.5vw, 2.25rem)" : "clamp(2rem, 3.5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Turn campus knowledge into your next{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #fef08a 0%, #fde047 40%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 14px rgba(245, 158, 11, 0.35))",
              }}
            >
              breakthrough.
            </span>
          </h1>

          {!matchingData && (
            <p
              className="mb-6 leading-relaxed"
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                maxWidth: "680px",
                lineHeight: 1.6,
              }}
            >
              Describe a technical problem. CampusLink identifies top candidates, explains why they match, surfaces supporting evidence, and maps potential help chains.
            </p>
          )}
        </div>

        {/* Omnibox / AI Search Bar (Centerpiece) */}
        <div className="relative z-10 mt-6">
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 transition-all duration-300"
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "6px 8px 6px 16px",
              boxShadow: isSearchFocused
                ? "0 0 0 3px rgba(147, 197, 253, 0.6), 0 16px 38px rgba(0, 0, 0, 0.22)"
                : "0 10px 30px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.3)",
            }}
          >
            <div className="flex items-center flex-1 min-w-0 py-1 sm:py-0">
              <Compass className="w-5 h-5 text-blue-600 mr-2.5 shrink-0" />
              <Input
                variant="borderless"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onPressEnter={() => handleDiscover()}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Describe your campus problem or research need…"
                className="w-full text-[15px] p-0 font-normal"
                style={{
                  fontSize: "15px",
                  color: "#0f172a",
                  boxShadow: "none",
                }}
              />
            </div>
            <Button
              type="primary"
              onClick={() => handleDiscover()}
              loading={loading}
              icon={!loading && <Sparkles className="w-4 h-4" />}
              className="shrink-0 flex items-center justify-center gap-2"
              style={{
                borderRadius: 12,
                height: 44,
                padding: "0 24px",
                fontWeight: 700,
                fontSize: "14px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                boxShadow: "0 4px 16px rgba(37, 99, 235, 0.4)",
                border: "none",
              }}
            >
              Discover
            </Button>
          </div>

          {!matchingData && !loading && (
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="text-[12.5px] font-semibold text-blue-100 flex items-center gap-1.5 mr-1 select-none">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" /> Try:
              </span>
              {EXAMPLE_QUERIES.map((q) => {
                const isTruncated = q.length > 42;
                const chip = (
                  <Tag
                    key={q}
                    className="m-0 inline-flex items-center cursor-pointer select-none transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => handleDiscover(q)}
                    style={{
                      background: "rgba(255, 255, 255, 0.14)",
                      border: "1px solid rgba(255, 255, 255, 0.22)",
                      backdropFilter: "blur(14px)",
                      WebkitBackdropFilter: "blur(14px)",
                      color: "#ffffff",
                      borderRadius: 100,
                      padding: "4px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    <span className="truncate max-w-[280px]">
                      {isTruncated ? q.substring(0, 42) + "…" : q}
                    </span>
                  </Tag>
                );

                return isTruncated ? (
                  <Tooltip key={q} title={q} placement="bottom" arrow={{ pointAtCenter: true }}>
                    {chip}
                  </Tooltip>
                ) : (
                  chip
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ERROR DISPLAY ── */}
      {error && (
        <Alert
          message="Discovery Failed"
          description={error}
          type="error"
          showIcon
          className="rounded-2xl border-rose-200"
        />
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
                  <LucideTag className="w-4 h-4 text-blue-600" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-[13px]">
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
              {matchingData.understanding.resource_needs && matchingData.understanding.resource_needs.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Resource Needs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingData.understanding.resource_needs.map((rn, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">{rn}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* INTENT-AWARE KNOWLEDGE COMPOSITION */}
          {(() => {
            const comp = matchingData.result_composition || {
              primary_result_type: "PEOPLE" as ResultType,
              secondary_result_types: ["PROJECTS", "SOLUTIONS", "RESEARCH", "FACILITIES"] as ResultType[],
              evidence_only_types: [] as ResultType[],
            };

            const primaryType: ResultType = comp.primary_result_type;
            const secondaryTypes: ResultType[] = comp.secondary_result_types || [];
            const evidenceOnlyTypes = new Set(comp.evidence_only_types || []);

            const categoryMap: Record<ResultType, {
              title: string;
              icon: any;
              iconColor: string;
              iconBg: string;
              items: MatchingResult[];
              hrefPrefix: string;
              actionLabel: string;
              isSolution?: boolean;
              emptyMessage: string;
              emptyFallback: string;
            }> = {
              PEOPLE: {
                title: "People Who Can Help",
                icon: User,
                iconColor: "text-blue-600",
                iconBg: "bg-blue-50",
                items: matchingData.top_people,
                hrefPrefix: "/profile/",
                actionLabel: "View Profile",
                emptyMessage: "No matching campus members found for this query.",
                emptyFallback: "Related campus projects or laboratories may still provide useful guidance.",
              },
              FACILITIES: {
                title: "Relevant Facilities & Equipment",
                icon: Building2,
                iconColor: "text-purple-600",
                iconBg: "bg-purple-50",
                items: matchingData.facilities,
                hrefPrefix: "/facilities/",
                actionLabel: "View Facility",
                emptyMessage: "No matching laboratories or hardware facilities found.",
                emptyFallback: "Related people and research contacts may still be able to help.",
              },
              PROJECTS: {
                title: "Relevant Projects",
                icon: FolderGit2,
                iconColor: "text-indigo-600",
                iconBg: "bg-indigo-50",
                items: matchingData.top_projects,
                hrefPrefix: "/projects/",
                actionLabel: "View Project",
                emptyMessage: "No matching campus projects indexed yet.",
                emptyFallback: "Related campus researchers or contributors may be working on similar topics.",
              },
              SOLUTIONS: {
                title: "Top Previous Solutions",
                icon: Lightbulb,
                iconColor: "text-orange-500",
                iconBg: "bg-orange-50",
                items: matchingData.top_solutions,
                hrefPrefix: "/solutions",
                actionLabel: "View Solution",
                isSolution: true,
                emptyMessage: "No previous solution records matching your exact problem symptoms found yet.",
                emptyFallback: "Campus members with matching technical skills can assist with troubleshooting.",
              },
              RESEARCH: {
                title: "Relevant Research",
                icon: BookOpen,
                iconColor: "text-emerald-600",
                iconBg: "bg-emerald-50",
                items: matchingData.research,
                hrefPrefix: "/research",
                actionLabel: "View Paper",
                emptyMessage: "No relevant research publications found.",
                emptyFallback: "Faculty researchers and students with matching skills can offer guidance.",
              },
            };

            const primaryCat = categoryMap[primaryType] || categoryMap.PEOPLE;

            return (
              <div className="space-y-10">
                {/* 1. PRIMARY RESULT SECTION */}
                <section>
                  <SectionHeader
                    icon={primaryCat.icon}
                    iconColor={primaryCat.iconColor}
                    iconBg={primaryCat.iconBg}
                    title={primaryCat.title}
                    count={primaryCat.items.length}
                    badge="Primary Result"
                    badgeColor="bg-blue-600 text-white border-blue-600 shadow-sm"
                  />
                  {primaryCat.items.length === 0 ? (
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-card mt-4 space-y-1.5 text-center">
                      <p className="text-sm font-bold text-slate-800">{primaryCat.emptyMessage}</p>
                      <p className="text-xs text-slate-500">{primaryCat.emptyFallback}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                      {primaryCat.items.map((item) => (
                        <CandidateCard
                          key={item.candidate_id}
                          item={item}
                          href={`${primaryCat.hrefPrefix}${item.candidate_id}`}
                          actionLabel={primaryCat.actionLabel}
                          isSolution={primaryCat.isSolution}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* 2. HELP CHAIN (WHEN APPLICABLE: ONLY FOR PEOPLE INTENT OR GENUINE MULTI-PERSON CHAINS) */}
                {matchingData.help_chain && (primaryType === "PEOPLE" || !matchingData.help_chain.is_single_candidate_sufficient) && (
                  <HelpChainSection helpChain={matchingData.help_chain} />
                )}

                {/* 3. SECONDARY RESULT SECTIONS (ONLY NON-EMPTY AND NON-EVIDENCE-ONLY) */}
                {secondaryTypes.map((secType) => {
                  if (secType === primaryType || evidenceOnlyTypes.has(secType)) {
                    return null;
                  }
                  const secCat = categoryMap[secType];
                  if (!secCat || secCat.items.length === 0) {
                    return null; // Strict rule: never render empty secondary sections!
                  }
                  const displayTitle = (secType === "PEOPLE" && primaryType === "FACILITIES")
                    ? "Related Expertise: People Who May Help"
                    : (secType === "PEOPLE" && primaryType !== "PEOPLE")
                    ? "Related Contributors & Expertise"
                    : secCat.title;

                  return (
                    <section key={secType}>
                      <SectionHeader
                        icon={secCat.icon}
                        iconColor={secCat.iconColor}
                        iconBg={secCat.iconBg}
                        title={displayTitle}
                        count={secCat.items.length}
                        badge="Supporting Context"
                        badgeColor="bg-slate-100 text-slate-700 border-slate-200"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                        {secCat.items.map((item) => (
                          <CandidateCard
                            key={item.candidate_id}
                            item={item}
                            href={`${secCat.hrefPrefix}${item.candidate_id}`}
                            actionLabel={secCat.actionLabel}
                            isSolution={secCat.isSolution}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            );
          })()}

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
  const evidenceDetails = getEvidenceDetails(item);

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
              {evidenceDetails.totalCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md"
                  title={evidenceDetails.label}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {evidenceDetails.label}
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

        {/* Similar Problem Solved highlight (for problem solving queries / person evidence) */}
        {item.person_evidence_graph?.solutions && item.person_evidence_graph.solutions.length > 0 && (
          <div className="mb-3 p-3 bg-orange-50/80 border border-orange-200/90 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-orange-900 text-[11px] uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-orange-600" />
              <span>Similar Problem Solved</span>
            </div>
            {item.person_evidence_graph.solutions.map((sol, idx) => (
              <p key={idx} className="text-slate-800 font-semibold text-[12px] leading-snug">
                "{sol.title}"
              </p>
            ))}
          </div>
        )}

        {/* Matched badges */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {item.matched_skills.slice(0, 4).map((sk, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">{sk}</span>
          ))}
          {item.matched_technologies.slice(0, 4).map((tc, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">{tc}</span>
          ))}
        </div>

        {/* Evidence Sources Breakdown */}
        {evidenceDetails.categories.length > 0 && (
          <div className="mb-3.5 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{evidenceDetails.label}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
              {evidenceDetails.categories.map((cat) => (
                <span key={cat.key} className="inline-flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  {cat.label}
                </span>
              ))}
            </div>
          </div>
        )}

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

              {item.person_evidence_graph && evidenceDetails.totalCount > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Evidence Graph</p>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                      {evidenceDetails.shortBadgeLabel}
                    </span>
                  </div>
                  {item.person_evidence_graph.skills && item.person_evidence_graph.skills.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Verified Skills: </span>
                      {item.person_evidence_graph.skills.join(", ")}
                    </div>
                  )}
                  {item.person_evidence_graph.projects && item.person_evidence_graph.projects.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Projects: </span>
                      {item.person_evidence_graph.projects.map((p) => p.title).join(", ")}
                    </div>
                  )}
                  {item.person_evidence_graph.solutions && item.person_evidence_graph.solutions.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Past Solutions: </span>
                      {item.person_evidence_graph.solutions.map((s) => s.title).join(", ")}
                    </div>
                  )}
                  {item.person_evidence_graph.research && item.person_evidence_graph.research.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Research: </span>
                      {item.person_evidence_graph.research.map((r) => r.title).join(", ")}
                    </div>
                  )}
                  {item.person_evidence_graph.facilities && item.person_evidence_graph.facilities.length > 0 && (
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Labs: </span>
                      {item.person_evidence_graph.facilities.map((f) => f.name).join(", ")}
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

function SectionHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  count,
  badge,
  badgeColor,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  count: number;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
        {badge && (
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeColor || "bg-blue-50 text-blue-700 border-blue-200"}`}>
            {badge}
          </span>
        )}
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
