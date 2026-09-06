"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  FileText, Upload, CheckCircle2, Loader2, AlertCircle,
  RefreshCw, Eye, ArrowUpFromLine, X, Calendar, Clock
} from "lucide-react";
import { resumeService, ResumeDocument } from "@/services/knowledge";
import { ApiError } from "@/lib/api-client";

// ============================================================
// RESUME SECTION COMPONENT
// ============================================================

interface ResumeSectionProps {
  onToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function ResumeSection({ onToast }: ResumeSectionProps) {
  const [doc, setDoc] = useState<ResumeDocument | null | undefined>(undefined); // undefined=loading
  const [extractionStatus, setExtractionStatus] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load current resume on mount
  const loadCurrent = useCallback(async () => {
    try {
      const res = await resumeService.getCurrent();
      setDoc(res.document ?? null);
      setExtractionStatus(res.extraction_status ?? "");
      setLoadError(null);
    } catch {
      setDoc(null);
      setLoadError("Could not load resume status.");
    }
  }, []);

  React.useEffect(() => { loadCurrent(); }, [loadCurrent]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Validate type & size
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      onToast?.("Only PDF and DOCX files are accepted.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onToast?.("File must be smaller than 10 MB.", "error");
      return;
    }

    try {
      setUploading(true);
      onToast?.("Uploading resume...", "info");
      const result = await resumeService.upload(file);
      const newDoc = result.document;
      setDoc(newDoc);
      onToast?.("Resume uploaded successfully.", "success");

      // Trigger AI processing
      setProcessing(true);
      onToast?.("Processing resume with AI…", "info");
      try {
        await resumeService.process(newDoc.id);
        onToast?.("AI extraction complete. Please review your resume.", "success");
        await loadCurrent();
        // Redirect to review page if we have a window
        if (typeof window !== "undefined") {
          window.location.href = `/onboarding/resume/review?doc=${newDoc.id}&from=profile`;
        }
      } catch (procErr: unknown) {
        const msg = procErr instanceof ApiError ? procErr.message : "AI processing failed. You can retry from the resume section.";
        onToast?.(msg, "error");
        await loadCurrent();
      } finally {
        setProcessing(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Upload failed. Please try again.";
      onToast?.(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  const isLoading = uploading || processing || doc === undefined;

  // ── Loading state ──
  if (doc === undefined) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-24 bg-slate-200 rounded mb-4" />
        <div className="h-20 w-full bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Resume</h3>
            <p className="text-xs text-slate-500">AI-powered skills extraction</p>
          </div>
        </div>
        {doc && !isLoading && (
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        {loadError && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {loadError}
          </div>
        )}

        {/* No Resume */}
        {!doc && !isLoading && (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-2xl p-10 text-center cursor-pointer transition group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-4 transition">
              <ArrowUpFromLine className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition" />
            </div>
            <p className="font-semibold text-slate-700 text-sm mb-1">Upload Your Resume</p>
            <p className="text-xs text-slate-500 mb-3">
              Your resume helps CampusLink understand your skills, projects and experience
            </p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-blue">
              <Upload className="w-3.5 h-3.5" /> Choose File
            </span>
            <p className="text-[11px] text-slate-400 mt-3">PDF or DOCX · Maximum 10 MB</p>
          </div>
        )}

        {/* Uploading / Processing State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">
              {uploading ? "Uploading resume…" : "Processing with AI…"}
            </p>
            <p className="text-xs text-slate-400">This may take a few seconds</p>
          </div>
        )}

        {/* Resume Exists */}
        {doc && !isLoading && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{doc.original_filename}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  <span>{Math.round(doc.file_size / 1024)} KB</span>
                </div>
              </div>
              <StatusBadge status={doc.processing_status} extractionStatus={extractionStatus} />
            </div>

            {/* Action area */}
            <div className="flex items-center gap-3">
              {(doc.processing_status === "COMPLETED" || doc.processing_status === "CONFIRMED") && (
                <a
                  href={`/onboarding/resume/review?doc=${doc.id}&from=profile`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition"
                >
                  <Eye className="w-3.5 h-3.5" /> View Details
                </a>
              )}
              {doc.processing_status === "FAILED" && (
                <button
                  onClick={async () => {
                    try {
                      setProcessing(true);
                      await resumeService.process(doc.id);
                      onToast?.("Processing retried. Please review your resume.", "success");
                      await loadCurrent();
                    } catch {
                      onToast?.("Retry failed. Please upload a new version.", "error");
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Processing
                </button>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" /> Upload New Version
              </button>
            </div>

            {/* Note about safety */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Uploading a new version starts a new AI extraction. Your current resume data is preserved until you confirm the new extraction.
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileChange}
      />
    </section>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
  extractionStatus,
}: {
  status: string;
  extractionStatus?: string;
}) {
  const cfg = getStatusConfig(status, extractionStatus);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function getStatusConfig(status: string, extractionStatus?: string) {
  if (status === "CONFIRMED" || extractionStatus === "CONFIRMED") {
    return {
      Icon: CheckCircle2,
      label: "Confirmed",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    };
  }
  if (status === "COMPLETED" && extractionStatus !== "CONFIRMED") {
    return {
      Icon: Eye,
      label: "Review Required",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    };
  }
  if (status === "PROCESSING") {
    return {
      Icon: Loader2,
      label: "Processing",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    };
  }
  if (status === "FAILED") {
    return {
      Icon: AlertCircle,
      label: "Failed",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    };
  }
  return {
    Icon: Clock,
    label: "Uploaded",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  };
}
