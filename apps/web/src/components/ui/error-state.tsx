"use client";

import React from "react";
import { AlertCircle, WifiOff, Lock, ShieldOff, ServerCrash, FileQuestion, SearchX, Inbox } from "lucide-react";
import { Alert, Empty, Button } from "antd";

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
    <Empty
      image={<config.Icon className={`w-12 h-12 ${config.iconColor} mx-auto opacity-50`} />}
      description={
        <div className="space-y-2 mt-4 px-4">
          <h3 className="text-lg font-bold text-slate-900">{config.title}</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">{config.description}</p>
        </div>
      }
      className={`py-16 ${className}`}
    >
      {onRetry && (
        <Button onClick={onRetry} type="primary" size="large" className="mt-4 font-semibold px-8" shape="round">
          Try again
        </Button>
      )}
    </Empty>
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
    <Alert
      message={message}
      type="error"
      showIcon
      closable={!!onDismiss}
      onClose={onDismiss}
      className={`rounded-xl border-rose-200 ${className}`}
    />
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
    <Empty
      image={<Icon className="w-12 h-12 text-slate-300 mx-auto opacity-50" />}
      description={
        <div className="space-y-2 mt-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && (
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
          )}
        </div>
      }
      className={`py-16 ${className}`}
    >
      {action && (
        <Button
          onClick={action.onClick}
          type={action.variant === "secondary" ? "default" : "primary"}
          size="large"
          className="mt-4 font-semibold px-6"
          shape="round"
        >
          {action.label}
        </Button>
      )}
    </Empty>
  );
}

// ============================================================
// NETWORK ERROR STATE
// ============================================================

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Empty
      image={<WifiOff className="w-12 h-12 text-slate-300 mx-auto opacity-50" />}
      description={
        <div className="space-y-2 mt-4">
          <h3 className="text-base font-bold text-slate-900">No Connection</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Unable to reach CampusLink servers. Please check your internet connection.
          </p>
        </div>
      }
      className="py-16"
    >
      {onRetry && (
        <Button
          onClick={onRetry}
          type="primary"
          size="large"
          className="mt-4 font-semibold px-8"
          shape="round"
        >
          Retry
        </Button>
      )}
    </Empty>
  );
}

// ============================================================
// SEARCH EMPTY STATE
// ============================================================

export function SearchEmpty({ query }: { query?: string }) {
  return (
    <Empty
      image={<SearchX className="w-12 h-12 text-slate-300 mx-auto opacity-50" />}
      description={
        <div className="space-y-2 mt-4">
          <h3 className="text-base font-bold text-slate-900">
            {query ? `No results for "${query}"` : "No results found"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search terms or removing filters. CampusLink searches across
            profiles, projects, research, facilities, and solutions.
          </p>
        </div>
      }
      className="py-20"
    />
  );
}
