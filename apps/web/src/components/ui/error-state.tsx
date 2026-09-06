"use client";

import React from "react";
import { AlertCircle, WifiOff, Lock, ShieldOff, ServerCrash, FileQuestion, SearchX, Inbox } from "lucide-react";

// ============================================================
// ERROR STATE
// ============================================================

interface ErrorStateProps {
  status?: number;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ status, message, onRetry, className = "" }: ErrorStateProps) {
  const config = getErrorConfig(status, message);

  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${config.iconBg}`}>
        <config.Icon className={`w-7 h-7 ${config.iconColor}`} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{config.title}</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{config.description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-blue"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function getErrorConfig(status?: number, message?: string) {
  switch (status) {
    case 401:
      return {
        Icon: Lock,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        title: "Session Expired",
        description: "Your session has expired. Please sign in again to continue.",
      };
    case 403:
      return {
        Icon: ShieldOff,
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        title: "Access Denied",
        description: "You don't have permission to access this resource.",
      };
    case 404:
      return {
        Icon: FileQuestion,
        iconBg: "bg-slate-100",
        iconColor: "text-slate-400",
        title: "Resource Not Found",
        description: "We couldn't find the requested campus resource. It may have been moved or deleted.",
      };
    case 500:
    case 502:
    case 503:
      return {
        Icon: ServerCrash,
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        title: "Server Error",
        description: "CampusLink encountered a server error. Our team has been notified. Please try again shortly.",
      };
    default:
      return {
        Icon: AlertCircle,
        iconBg: "bg-rose-50",
        iconColor: "text-rose-500",
        title: "Something went wrong",
        description: message || "An unexpected error occurred. Please try again.",
      };
  }
}

// ============================================================
// INLINE ERROR BANNER
// ============================================================

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function InlineError({ message, onDismiss, className = "" }: InlineErrorProps) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl ${className}`}>
      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <p className="text-sm text-rose-700 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-rose-400 hover:text-rose-600 text-sm font-medium shrink-0">
          Dismiss
        </button>
      )}
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition ${
            action.variant === "secondary"
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue"
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================================
// NETWORK ERROR STATE
// ============================================================

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <WifiOff className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">No Connection</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
        Unable to reach CampusLink servers. Please check your internet connection.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-blue"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================
// SEARCH EMPTY STATE
// ============================================================

export function SearchEmpty({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <SearchX className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">
        {query ? `No results for "${query}"` : "No results found"}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
        Try adjusting your search terms or removing filters. CampusLink searches across
        profiles, projects, research, facilities, and solutions.
      </p>
    </div>
  );
}
