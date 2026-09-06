"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  Search as SearchIcon, Sparkles, User, FolderGit2, BookOpen,
  Building2, Wrench, Lightbulb, ArrowRight, Loader2, AlertCircle,
  Clock, Zap, Layers,
} from "lucide-react";
import {
  searchService, EntityTypeFilter, SearchMode, SearchResultItem,
} from "@/services/search";
import { SearchEmpty, InlineError } from "@/components/ui/error-state";
import { SearchResultSkeleton } from "@/components/ui/skeletons";

const ENTITY_TYPES: { id: EntityTypeFilter; label: string; icon: React.ElementType; color: string }[] = [
  { id: "PROFILE", label: "People", icon: User, color: "text-blue-600" },
  { id: "PROJECT", label: "Projects", icon: FolderGit2, color: "text-indigo-600" },
  { id: "RESEARCH", label: "Research", icon: BookOpen, color: "text-emerald-600" },
  { id: "FACILITY", label: "Facilities", icon: Building2, color: "text-amber-600" },
  { id: "EQUIPMENT", label: "Equipment", icon: Wrench, color: "text-orange-600" },
  { id: "PROBLEM_SOLUTION", label: "Solutions", icon: Lightbulb, color: "text-orange-500" },
];

const TYPE_COLORS: Record<EntityTypeFilter, { bg: string; text: string; border: string; label: string }> = {
  PROFILE:          { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    label: "Person" },
  PROJECT:          { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  label: "Project" },
  RESEARCH:         { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Research" },
  FACILITY:         { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   label: "Facility" },
  EQUIPMENT:        { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  label: "Equipment" },
  PROBLEM_SOLUTION: { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    label: "Solution" },
};

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={null}>
          <SearchContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [selectedTypes, setSelectedTypes] = useState<EntityTypeFilter[]>([]);
  const [mode, setMode] = useState<SearchMode>("HYBRID");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<EntityTypeFilter | "ALL">("ALL");

  // Auto-search if URL has ?q=
  useEffect(() => {
    if (urlQuery) executeSearch(urlQuery);
  }, []);

  const toggleType = (type: EntityTypeFilter) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const executeSearch = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await searchService.executeSearch({
        query: finalQuery.trim(),
        entity_types: selectedTypes.length > 0 ? selectedTypes : undefined,
        mode,
        limit: 50,
      });
      setResults(res.results);
      setTotal(res.total);
      setDurationMs(res.duration_ms);
      setActiveTab("ALL");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = activeTab === "ALL"
    ? results
    : results.filter((r) => r.entity_type === activeTab);

  const countByType = (type: EntityTypeFilter) => results.filter((r) => r.entity_type === type).length;

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
            <SearchIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Search Campus Knowledge</h1>
            <p className="text-slate-500 text-sm">Semantic + keyword hybrid search across all campus entities</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <form onSubmit={(e) => { e.preventDefault(); executeSearch(); }} className="space-y-4">
        <div className="flex items-center bg-white border-2 border-slate-200 rounded-2xl shadow-card focus-within:border-blue-500 focus-within:shadow-blue transition-all" style={{ minHeight: 60 }}>
          <SearchIcon className="w-5 h-5 text-slate-400 ml-5 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, projects, research papers, labs, equipment, solutions…"
            className="flex-1 bg-transparent px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none text-[15px]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="m-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl transition shadow-blue text-[13px] shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Search options */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-500">Mode:</span>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
              {(["HYBRID", "SEMANTIC"] as SearchMode[]).map((m) => (
                <button key={m} type="button"
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 text-[12px] font-semibold transition ${
                    mode === m ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m === "HYBRID" ? (
                    <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Hybrid</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Semantic</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Entity type filters */}
          <div className="flex flex-wrap gap-2">
            {ENTITY_TYPES.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button"
                onClick={() => toggleType(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition ${
                  selectedTypes.includes(id)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* ── RESULTS HEADER & TABS ── */}
      {hasSearched && !loading && !error && total !== null && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-600">
              <span className="font-bold text-slate-900">{total}</span> result{total !== 1 ? "s" : ""} for{" "}
              <span className="text-blue-600 font-semibold">"{query}"</span>
              {durationMs !== null && (
                <span className="ml-2 text-slate-400 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {durationMs}ms
                </span>
              )}
            </p>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold uppercase tracking-wide">
              {mode}
            </span>
          </div>

          {/* Tabs */}
          {total > 0 && (
            <div className="flex flex-wrap gap-2">
              <TabButton active={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} count={results.length}>
                All Results
              </TabButton>
              {ENTITY_TYPES.filter(({ id }) => countByType(id) > 0).map(({ id, label, icon: Icon }) => (
                <TabButton key={id} active={activeTab === id} onClick={() => setActiveTab(id)} count={countByType(id)}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </TabButton>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ERROR ── */}
      {error && <InlineError message={error} onDismiss={() => setError(null)} />}

      {/* ── LOADING ── */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <SearchResultSkeleton key={i} />)}
        </div>
      )}

      {/* ── EMPTY INITIAL STATE ── */}
      {!hasSearched && !loading && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <SearchIcon className="w-7 h-7 text-blue-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">Search all campus knowledge</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
            Hybrid search across people, projects, research papers, facilities, equipment, and solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Machine Learning", "ESP32", "Lab Equipment", "Quantum Computing"].map((q) => (
              <button key={q} onClick={() => { setQuery(q); executeSearch(q); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition">
                <Zap className="w-3 h-3 text-orange-400" /> {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── NO RESULTS ── */}
      {hasSearched && !loading && !error && total === 0 && (
        <SearchEmpty query={query} />
      )}

      {/* ── RESULTS GRID ── */}
      {hasSearched && !loading && !error && filteredResults.length > 0 && (
        <div className="space-y-4">
          {filteredResults.map((result, idx) => (
            <SearchResultCard key={`${result.entity_id}-${idx}`} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
  const typeConf = TYPE_COLORS[result.entity_type] || TYPE_COLORS.PROFILE;
  const Icon = ENTITY_TYPES.find((t) => t.id === result.entity_type)?.icon || User;

  const href = {
    PROFILE: `/profile/${result.entity_id}`,
    PROJECT: `/projects`,
    RESEARCH: `/research`,
    FACILITY: `/facilities`,
    EQUIPMENT: `/facilities`,
    PROBLEM_SOLUTION: `/solutions`,
  }[result.entity_type] || "#";

  return (
    <div className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-card card-interactive transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-9 h-9 rounded-xl ${typeConf.bg} border ${typeConf.border} flex items-center justify-center shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${typeConf.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${typeConf.bg} ${typeConf.text} ${typeConf.border}`}>
                {typeConf.label}
              </span>
              <h3 className="font-bold text-[15px] text-slate-900 group-hover:text-blue-600 transition">{result.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(result.score * 100)}%` }} />
              </div>
              <span className="text-[11px] font-bold text-slate-400">{Math.round(result.score * 100)}%</span>
            </div>
          </div>
          <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-3">{result.snippet}</p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {result.matched_fields.slice(0, 3).map((field, i) => (
                <span key={i} className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 rounded-md border border-slate-200 font-medium">
                  {field}
                </span>
              ))}
            </div>
            <a href={href} className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700 shrink-0 ml-3">
              View <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, count, children,
}: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold border transition ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
        {count}
      </span>
    </button>
  );
}
