"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  ShieldAlert, ShieldCheck, ArrowLeft, Loader2, AlertCircle,
  FileText, CheckCircle2, ThumbsUp, ThumbsDown, Layers, Search,
  Award, HelpCircle
} from "lucide-react";
import {
  feedbackApi,
  AdminRecommendationDetailResponse
} from "@/lib/api/feedback";

export default function AdminRecommendationDetailPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AppShell>
        <DetailContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [detail, setDetail] = useState<AdminRecommendationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await feedbackApi.getAdminRecommendationDetail(id);
        setDetail(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load audit detail.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center text-xs text-slate-500 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
        Fetching audit record details…
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-4">
        <Link href="/admin/recommendations" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Recommendation Audit
        </Link>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error || "Recommendation audit record not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      
      {/* Back button */}
      <Link href="/admin/recommendations" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition">
        <ArrowLeft className="w-4 h-4 text-brand-600" /> Back to Recommendation Audit
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {detail.entity_type} Candidate
          </span>
          <span className="text-xs text-slate-400 font-mono">Event ID: {detail.id}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Audit Detail: {detail.entity_title || detail.entity_id}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Surfaced on {new Date(detail.created_at).toLocaleString()} • Rank Position #{detail.rank_position}
        </p>
      </div>

      {/* PRIVACY GUARANTEE BANNER */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs shadow-lg">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white text-xs">Privacy Protection Active</p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Raw resumes, original prompts, and private candidate contact details are sanitized & excluded from audit logs according to Phase 10 compliance rules.
          </p>
        </div>
      </div>

      {/* METRICS SUMMARY & SCORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Relevance Score</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{Math.round(detail.relevance_score * 100)}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2 border border-slate-200">
            <div className="bg-brand-600 h-full rounded-full" style={{ width: `${Math.round(detail.relevance_score * 100)}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Evidence Quality</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{Math.round(detail.evidence_quality_score * 100)}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2 border border-slate-200">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.round(detail.evidence_quality_score * 100)}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">User Feedback</p>
          {detail.feedback ? (
            <div className="mt-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 ${
                detail.feedback.feedback_type === "HELPFUL" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {detail.feedback.feedback_type === "HELPFUL" ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                {detail.feedback.feedback_type}
              </span>
              {detail.feedback.comment && (
                <p className="text-[11px] text-slate-600 italic mt-1 font-normal">&quot;{detail.feedback.comment}&quot;</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mt-2">No user feedback submitted</p>
          )}
        </div>
      </div>

      {/* QUALITY FLAGS */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Deterministic Quality Flags</h2>
        {detail.quality_flags.length === 0 ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            All quality criteria passed successfully. No anomalies detected.
          </div>
        ) : (
          <div className="space-y-2">
            {detail.quality_flags.map((flag) => (
              <div key={flag} className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between font-medium">
                <span className="font-bold font-mono">{flag}</span>
                <span className="text-[11px] text-amber-700">Flagged by automated compliance engine</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEARCH QUERY & EXPLANATION */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User Search Query</p>
          <p className="text-xs md:text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
            {detail.query}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Generated Explanation</p>
          <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
            {detail.explanation_generated || "No explanation recorded."}
          </p>
        </div>
      </section>

      {/* SCORE COMPONENTS BREAKDOWN */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Score Component Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {Object.entries(detail.score_components || {}).map(([key, val]) => (
            <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{key.replace(/_/g, " ")}</p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {typeof val === "number" ? (val <= 1 ? `${Math.round(val * 100)}%` : val) : String(val)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SUPPORTING EVIDENCE */}
      {detail.supporting_evidence.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Supporting Evidence Snippets ({detail.supporting_evidence.length})</h2>
          <div className="space-y-2.5">
            {detail.supporting_evidence.map((ev, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>[{String(ev.source_type || 'SOURCE')}] {String(ev.source_title || 'Untitled Evidence')}</span>
                  {typeof ev.relevance === "number" && (
                    <span className="text-emerald-600 font-mono text-[11px]">{Math.round(ev.relevance * 100)}% match</span>
                  )}
                </div>
                {Boolean(ev.snippet) && <p className="italic text-slate-600 text-[11px] leading-relaxed">&quot;{String(ev.snippet)}&quot;</p>}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
