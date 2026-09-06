"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, Sparkles, ShieldCheck, Cpu } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Left Branding Panel */}
        <div className="md:col-span-6 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Abstract Network Visual Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                CampusLink <span className="text-orange-400">AI</span>
              </span>
            </Link>

            <div className="space-y-3 pt-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 border border-white/20 text-blue-100">
                Evidence-Backed Matching
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-white">
                Turn campus knowledge into your next breakthrough.
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed max-w-md">
                Discover the people, active projects, research papers, and hardware resources that can help solve your problem.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/20 grid grid-cols-2 gap-4 text-xs text-blue-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Campus Assets</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Agentic Intelligence</span>
            </div>
          </div>
        </div>

        {/* Right Form Card Panel */}
        <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h3>
            <p className="text-xs text-slate-500">Sign in to access your CampusLink account.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Campus Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campuslink.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In to CampusLink"
              )}
            </button>
          </form>

          <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 transition">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
