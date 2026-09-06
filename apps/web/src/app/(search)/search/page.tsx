"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
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
  return (
    <ProtectedRoute>
      <AppShell>
        <SearchContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SearchContent() {
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
        return { label: "PROFILE", color: "bg-blue-50 text-blue-700 border-blue-200", icon: User };
      case "PROJECT":
        return { label: "PROJECT", color: "bg-purple-50 text-purple-700 border-purple-200", icon: FolderGit2 };
      case "RESEARCH":
        return { label: "RESEARCH", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: BookOpen };
      case "FACILITY":
        return { label: "FACILITY", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Building2 };
      case "EQUIPMENT":
        return { label: "EQUIPMENT", color: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: Wrench };
      case "PROBLEM_SOLUTION":
        return { label: "PROBLEM / SOLUTION", color: "bg-orange-50 text-orange-700 border-orange-200", icon: Lightbulb };
      default:
        return { label: type, color: "bg-slate-100 text-slate-700 border-slate-200", icon: Layers };
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
    <div className="p-6 md:p-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Phase 6 — Hybrid Vector & Text Retrieval
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Knowledge Search
        </h1>
        <p className="text-slate-500 text-xs md:text-sm max-w-2xl">
          Search semantically across profiles, projects, research, facilities, equipment, and solutions using pgvector similarity and full-text search.
        </p>
      </div>

      {/* Search Bar Container */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative group">
          <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-2 shadow-lg focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition">
            <SearchIcon className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your query, technique, hardware, or research area..."
              className="w-full bg-transparent px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none text-sm md:text-base"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-600/20 shrink-0 text-xs md:text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Mode & Filter Checkboxes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-blue-600" /> Filter Entity Types
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMode("SEMANTIC")}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  mode === "SEMANTIC"
                    ? "bg-white text-blue-600 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semantic Mode
              </button>
              <button
                type="button"
                onClick={() => setMode("HYBRID")}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  mode === "HYBRID"
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
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
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Header Meta */}
      {hasSearched && !loading && total !== null && (
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
          <span>
            Found <strong className="text-slate-900 font-bold">{total}</strong> relevant campus records
          </span>
          {durationMs !== null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Executed in {durationMs}ms
            </span>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Zero Results State */}
      {hasSearched && !loading && results.length === 0 && (
        <div className="text-center py-16 space-y-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No relevant records found</h3>
            <p className="text-slate-500 text-xs">
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
                className="group bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.color}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    {badge.label}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-emerald-700">
                    Relevance: {(item.score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {Object.entries(item.metadata).map(([key, val]) => (
                      <span key={key} className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {key}: <strong className="text-slate-700">{String(val)}</strong>
                      </span>
                    ))}
                  </div>

                  <Link
                    href={targetUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition shrink-0 ml-auto"
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
  );
}
