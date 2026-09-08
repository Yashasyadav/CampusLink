"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  ShieldAlert, Sparkles, Search, Filter, AlertTriangle,
  CheckCircle2, XCircle, FileText, ArrowRight, RefreshCw,
  BarChart3, Layers, HelpCircle, Eye, ShieldCheck, ThumbsUp, ThumbsDown
} from "lucide-react";
import {
  feedbackApi,
  QualityMetricsResponse,
  AdminRecommendationItem
} from "@/lib/api/feedback";
import { Button, Input, Select } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";

export default function AdminRecommendationsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AppShell>
        <AdminRecommendationsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AdminRecommendationsContent() {
  const [metrics, setMetrics] = useState<QualityMetricsResponse | null>(null);
  const [items, setItems] = useState<AdminRecommendationItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, recs] = await Promise.all([
        feedbackApi.getMetrics(),
        feedbackApi.getAdminRecommendations({
          query: searchQuery.trim() || undefined,
          entity_type: entityTypeFilter || undefined,
          has_quality_flag: flagFilter || undefined,
          limit: 50,
        }),
      ]);
      setMetrics(m);
      setItems(recs.items);
      setTotalCount(recs.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit metrics. Ensure administrator permissions.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entityTypeFilter, flagFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      
      {/* ── HEADER & BREADCRUMB ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Phase 10 — Administrative Audit & Quality Controls
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recommendation Quality & Audit Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Monitor recommendation precision, user feedback distribution, and audit quality flags without privacy compromise.
          </p>
        </div>

        <Button
          type="primary"
          onClick={fetchData}
          disabled={loading}
          icon={<ReloadOutlined spin={loading} />}
          size="large"
          className="self-start md:self-auto"
        >
          Refresh Audit Metrics
        </Button>
      </div>

      {/* ── ERROR MESSAGE ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ── METRICS OVERVIEW CARDS ── */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Surfaced Recs</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.total_recommendations}</p>
            <p className="text-[10px] text-slate-500 mt-1">Total candidate events logged</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Helpful Rate</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{Math.round(metrics.helpful_rate * 100)}%</p>
            <p className="text-[10px] text-slate-500 mt-1">{metrics.helpful_count} positive votes</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Negative Rate</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{Math.round(metrics.negative_rate * 100)}%</p>
            <p className="text-[10px] text-slate-500 mt-1">{metrics.negative_count} negative votes</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Evidence Quality Avg</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{Math.round(metrics.evidence_quality_avg * 100)}%</p>
            <p className="text-[10px] text-slate-500 mt-1">Grounding evidence score</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card col-span-2 md:col-span-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Feedback Coverage</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{Math.round(metrics.feedback_coverage * 100)}%</p>
            <p className="text-[10px] text-slate-500 mt-1">{metrics.total_feedback} feedback submissions</p>
          </div>
        </div>
      )}

      {/* ── ENTITY TYPE BREAKDOWN TABLE ── */}
      {metrics && metrics.by_entity_type.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Entity Quality Breakdown</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="pb-3 pr-4">Entity Type</th>
                  <th className="pb-3 px-4">Surfaced Recs</th>
                  <th className="pb-3 px-4">Feedback Count</th>
                  <th className="pb-3 px-4">Helpful Rate</th>
                  <th className="pb-3 px-4">Avg Relevance</th>
                  <th className="pb-3 pl-4">Avg Evidence Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {metrics.by_entity_type.map((row) => (
                  <tr key={row.entity_type} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-bold text-slate-900 uppercase">{row.entity_type}</td>
                    <td className="py-3 px-4">{row.total_recommendations}</td>
                    <td className="py-3 px-4">{row.feedback_count}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{Math.round(row.helpful_rate * 100)}%</td>
                    <td className="py-3 px-4">{Math.round(row.average_relevance * 100)}%</td>
                    <td className="py-3 pl-4 text-blue-600">{Math.round(row.average_evidence_quality * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── RECOMMENDATION EVENTS AUDIT LOG TABLE ── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recommendation Event Audit Logs</h2>
            <p className="text-xs text-slate-500">Filtered view of surfaced recommendations and flagged quality issues</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {totalCount} Total Audit Records
          </span>
        </div>

        {/* Filter Toolbar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            className="md:col-span-2"
            prefix={<SearchOutlined />}
            placeholder="Search query text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            value={entityTypeFilter}
            onChange={setEntityTypeFilter}
            options={[
              { value: "", label: "All Entity Types" },
              { value: "PEOPLE", label: "People" },
              { value: "PROJECT", label: "Projects" },
              { value: "RESEARCH", label: "Research" },
              { value: "FACILITY", label: "Facilities" },
              { value: "SOLUTION", label: "Solutions" },
            ]}
          />

          <Select
            value={flagFilter}
            onChange={setFlagFilter}
            options={[
              { value: "", label: "All Quality Flags" },
              { value: "LOW_EVIDENCE", label: "Low Evidence" },
              { value: "WEAK_SKILL_MATCH", label: "Weak Skill Match" },
              { value: "LOW_SEMANTIC_RELEVANCE", label: "Low Relevance" },
              { value: "NEGATIVE_USER_FEEDBACK", label: "Negative Feedback" },
              { value: "EXPLANATION_MISSING", label: "Explanation Missing" },
            ]}
          />
        </form>

        {/* Audit Log Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading audit logs...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 italic">No recommendation events match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="pb-3 pr-4">Timestamp & ID</th>
                  <th className="pb-3 px-4">Search Query</th>
                  <th className="pb-3 px-4">Candidate Entity</th>
                  <th className="pb-3 px-4">Scores</th>
                  <th className="pb-3 px-4">Quality Flags</th>
                  <th className="pb-3 px-4">User Feedback</th>
                  <th className="pb-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4">
                      <p className="font-mono text-[11px] font-bold text-slate-900">{item.id.slice(0, 8)}…</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-800 font-normal">{item.query}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mr-1.5">
                        {item.entity_type}
                      </span>
                      <span className="font-bold text-slate-900">{item.entity_title || item.entity_id.slice(0, 8)}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Rel:</span>
                          <span className="font-mono font-bold text-slate-900">{Math.round(item.relevance_score * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Evid:</span>
                          <span className="font-mono font-bold text-blue-600">{Math.round(item.evidence_quality_score * 100)}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.quality_flags.length === 0 ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Pass
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.quality_flags.map((flag) => (
                            <span
                              key={flag}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                flag === "NEGATIVE_USER_FEEDBACK" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                flag === "LOW_EVIDENCE" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.feedback_type ? (
                        <div className="space-y-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                            item.feedback_type === "HELPFUL" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {item.feedback_type === "HELPFUL" ? <ThumbsUp className="w-2.5 h-2.5" /> : <ThumbsDown className="w-2.5 h-2.5" />}
                            {item.feedback_type}
                          </span>
                          {item.feedback_comment && (
                            <p className="text-[10px] text-slate-500 italic max-w-xs line-clamp-1">{item.feedback_comment}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="py-3.5 pl-4 text-right">
                      <Link
                        href={`/admin/recommendations/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Audit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
