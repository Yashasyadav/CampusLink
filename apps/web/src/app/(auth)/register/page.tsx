"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Lock, Mail, AlertCircle, Loader2, Sparkles, GraduationCap, UserCheck, Award } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
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
      await register(email, password, role);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { id: "STUDENT", title: "Student", icon: GraduationCap, desc: "Explore projects, find collaborators, & solve problems." },
    { id: "FACULTY", title: "Faculty", icon: UserCheck, desc: "Manage research items, direct labs, & guide students." },
    { id: "ALUMNI", title: "Alumni", icon: Award, desc: "Share industry experience & mentor campus teams." },
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        {/* Left Branding Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                CampusLink <span className="text-orange-400">AI</span>
              </span>
            </Link>

            <div className="space-y-3 pt-6">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 border border-white/20 text-blue-100">
                Join the Campus Expertise Network
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight text-white">
                Create your CampusLink account.
              </h2>
              <p className="text-blue-100 text-xs leading-relaxed max-w-sm">
                Connect with verified projects, research papers, hardware laboratories, and problem/solution records.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Card Panel */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h3>
            <p className="text-xs text-slate-500">Select your role and enter your credentials.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Cards */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Your Campus Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ id, title, icon: Icon }) => {
                  const isSelected = role === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRole(id)}
                      className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20 font-bold"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="text-xs font-semibold">{title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Campus Email Address
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs transition"
                />
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
                  Creating account...
                </>
              ) : (
                "Create CampusLink Account"
              )}
            </button>
          </form>

          <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
