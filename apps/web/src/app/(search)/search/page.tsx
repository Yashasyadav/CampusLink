"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  Sparkles,
  Filter,
  Layers,
  User,
  FolderGit2,
  BookOpen,
  Building2,
  Wrench,
  Lightbulb,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  searchService,
  EntityTypeFilter,
  SearchMode,
  SearchResultItem,
} from "@/services/search";

const ALL_ENTITY_TYPES: { id: EntityTypeFilter; label: string; icon: any }[] = [
  { id: "PROFILE", label: "People", icon: User },
  { id: "PROJECT", label: "Projects", icon: FolderGit2 },
  { id: "RESEARCH", label: "Research", icon: BookOpen },
  { id: "FACILITY", label: "Facilities", icon: Building2 },
  { id: "EQUIPMENT", label: "Equipment", icon: Wrench },
  { id: "PROBLEM_SOLUTION", label: "Problems & Solutions", icon: Lightbulb },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<EntityTypeFilter[]>([]);
  const [mode, setMode] = useState<SearchMode>("HYBRID");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleEntityType = (type: EntityTypeFilter) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await searchService.executeSearch({
        query: query.trim(),
        entity_types: selectedTypes.length > 0 ? selectedTypes : undefined,
        mode: mode,
        limit: 15,
      });

      setResults(res.results);
      setTotal(res.total);
      setDurationMs(res.duration_ms);
    } catch (err: any) {
      setError(err?.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getEntityBadge = (type: EntityTypeFilter) => {
    switch (type) {
      case "PROFILE":
        return { label: "PROFILE", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: User };
      case "PROJECT":
        return { label: "PROJECT", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: FolderGit2 };
      case "RESEARCH":
        return { label: "RESEARCH", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: BookOpen };
      case "FACILITY":
        return { label: "FACILITY", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Building2 };
      case "EQUIPMENT":
        return { label: "EQUIPMENT", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", icon: Wrench };
      case "PROBLEM_SOLUTION":
        return { label: "PROBLEM / SOLUTION", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: Lightbulb };
      default:
        return { label: type, color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Layers };
    }
  };

  const getEntityUrl = (item: SearchResultItem) => {
    switch (item.entity_type) {
      case "PROFILE":
        return `/profile/${item.entity_id}`;
      case "PROJECT":
        return `/projects/${item.entity_id}`;
      case "RESEARCH":
        return `/research/${item.entity_id}`;
      case "FACILITY":
        return `/facilities/${item.entity_id}`;
      case "EQUIPMENT":
        return `/facilities`;
      case "PROBLEM_SOLUTION":
        return `/solutions/${item.entity_id}`;
      default:
        return "#";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Phase 6 — Hybrid Knowledge Retrieval
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            CampusLink Semantic Search
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Discover relevant people, active projects, published research, equipment labs, and institutional problem/solution records using natural language.
          </p>
        </div>

        {/* Search Bar Container */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-blue-500/50 transition">
              <SearchIcon className="w-6 h-6 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your problem, technique, hardware, or research interest..."
                className="w-full bg-transparent px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none text-base md:text-lg"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
                <span className="hidden md:inline">Search</span>
              </button>
            </div>
          </div>

          {/* Controls: Mode & Filter Checkboxes */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Filter className="w-4 h-4 text-blue-400" /> Filter Entity Types
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("SEMANTIC")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    mode === "SEMANTIC"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Semantic Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMode("HYBRID")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    mode === "HYBRID"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Hybrid Mode (Vector + Text)
                </button>
              </div>
            </div>

            {/* Checkbox Group */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {ALL_ENTITY_TYPES.map(({ id, label, icon: Icon }) => {
                const isSelected = selectedTypes.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleEntityType(id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
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

        {/* Results Header Meta */}
        {hasSearched && !loading && total !== null && (
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-2">
            <span>
              Found <strong className="text-slate-200 font-semibold">{total}</strong> relevant campus records
            </span>
            {durationMs !== null && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Executed in {durationMs}ms
              </span>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-slate-800 rounded w-1/4" />
                  <div className="h-5 bg-slate-800 rounded w-16" />
                </div>
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State / Search Prompt */}
        {!hasSearched && !loading && (
          <div className="text-center py-16 space-y-4 bg-slate-900/30 border border-slate-800/40 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
              <SearchIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-200">
                Ready to search CampusLink Knowledge
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Try queries like: <span className="text-blue-400">"ESP32 TinyML keyword detection"</span>,{" "}
                <span className="text-purple-400">"audio processing"</span>, or{" "}
                <span className="text-emerald-400">"cybersecurity intrusion detection"</span>.
              </p>
            </div>
          </div>
        )}

        {/* Zero Results State */}
        {hasSearched && !loading && results.length === 0 && (
          <div className="text-center py-16 space-y-4 bg-slate-900/30 border border-slate-800/40 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-200">No relevant records found</h3>
              <p className="text-slate-400 text-sm">
                Try broadening your query terms or selecting additional entity filters.
              </p>
            </div>
          </div>
        )}

        {/* Results List */}
        {hasSearched && !loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((item) => {
              const badge = getEntityBadge(item.entity_type);
              const BadgeIcon = badge.icon;
              const targetUrl = getEntityUrl(item);

              return (
                <div
                  key={`${item.entity_type}-${item.entity_id}`}
                  className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition duration-200 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${badge.color}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
                      Relevance: {(item.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition">
                      {item.title}
                    </h3>
                    <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                      {item.snippet}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      {Object.entries(item.metadata).map(([key, val]) => (
                        <span key={key} className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                          {key}: <strong className="text-slate-300">{String(val)}</strong>
                        </span>
                      ))}
                    </div>

                    <Link
                      href={targetUrl}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition shrink-0 ml-auto"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
