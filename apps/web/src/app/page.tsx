import React from "react";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-950 text-slate-100">
      <div className="max-w-3xl space-y-6">
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-sky-950 text-sky-400 border border-sky-800/50">
          Enterprise Foundation — Phase 1
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
          CampusLink AI
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Agentic campus expertise and knowledge discovery platform.
        </p>
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-500">
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
            Problem Understanding
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
            Evidence Discovery
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
            Intelligent Matching
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
            Connection
          </div>
        </div>
      </div>
    </main>
  );
}
