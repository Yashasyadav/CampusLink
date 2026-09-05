"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { fetchApi, ApiError } from "@/lib/api-client";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";

interface ResumeDoc {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  processing_status: string;
  created_at: string;
}

export default function ResumeUploadPage() {
  return (
    <ProtectedRoute>
      <ResumeUploadContent />
    </ProtectedRoute>
  );
}

function ResumeUploadContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDoc, setCurrentDoc] = useState<ResumeDoc | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchCurrentResume = async () => {
    try {
      const res = await fetchApi<{ document: ResumeDoc | null }>("/api/v1/documents/resume/current", {
        credentials: "include",
      });
      if (res.document) {
        setCurrentDoc(res.document);
      }
    } catch (err) {
      // Ignore initial load error
    }
  };

  useEffect(() => {
    fetchCurrentResume();
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setError("Only PDF and DOCX files are allowed.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds maximum allowed limit of 10MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file && !currentDoc) return;
    try {
      setError(null);

      let targetDocId = currentDoc?.id;

      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetchApi<{ message: string; document: ResumeDoc }>("/api/v1/documents/resume", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        setCurrentDoc(res.document);
        targetDocId = res.document.id;
        setUploading(false);
      }

      if (targetDocId) {
        setProcessing(true);
        await fetchApi(`/api/v1/documents/resume/${targetDocId}/process`, {
          method: "POST",
          credentials: "include",
        });
        setProcessing(false);
        router.push(`/onboarding/resume/review?doc_id=${targetDocId}`);
      }
    } catch (err) {
      setUploading(false);
      setProcessing(false);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to upload or analyze resume. Please try again.");
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Resume Upload & Document Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload your resume (PDF or DOCX, max 10MB). Gemini AI will extract skills, projects, and domain experience for your review.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center space-y-4 ${
            isDragOver ? "border-sky-500 bg-sky-950/20" : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-200">
              Drag & drop your resume file here, or{" "}
              <label className="text-sky-400 hover:underline cursor-pointer">
                browse files
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </label>
            </p>
            <p className="text-xs text-slate-500">Supports PDF and DOCX formats up to 10MB</p>
          </div>

          {file && (
            <div className="w-full max-w-md bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <FileText className="w-5 h-5 text-sky-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-200 truncate">{file.name}</span>
              </div>
              <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
        </div>

        {/* Current Active Resume Status */}
        {currentDoc && !file && (
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Resume Document</h3>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  currentDoc.processing_status === "CONFIRMED"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                    : currentDoc.processing_status === "REVIEW_REQUIRED"
                    ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {currentDoc.processing_status}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-sky-400" />
                <span className="font-medium text-slate-200">{currentDoc.original_filename}</span>
              </div>
              <button
                onClick={() => router.push(`/onboarding/resume/review?doc_id=${currentDoc.id}`)}
                className="text-xs text-sky-400 hover:underline font-semibold flex items-center"
              >
                Review Candidates <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={() => router.push("/onboarding")}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
          >
            Back to Onboarding
          </button>

          <button
            onClick={handleUploadAndProcess}
            disabled={(!file && !currentDoc) || uploading || processing}
            className="flex items-center py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl transition disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...
              </>
            ) : processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing with Gemini...
              </>
            ) : (
              <>
                Analyze Resume <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
