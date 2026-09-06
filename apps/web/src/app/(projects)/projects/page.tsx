"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Project } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { ApiError } from "@/lib/api-client";
import { FolderGit2, Plus, Search, Users, ArrowRight, X, ExternalLink } from "lucide-react";
import { CardGridSkeleton, ProjectCardSkeleton } from "@/components/ui/skeletons";
import { ErrorState, EmptyState } from "@/components/ui/error-state";

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProjectsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "", project_type: "ACADEMIC", domain: "", problem_statement: "",
    description: "", methodology: "", outcome: "", technologies: "", skills: "",
    visibility: "PUBLIC", status: "IN_PROGRESS",
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getProjects({ domain: domainFilter || undefined });
      setProjects(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load campus projects.";
      const status = err instanceof ApiError ? err.status : undefined;
      setError(msg);
      setErrorStatus(status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [domainFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeService.createProject({
        title: formData.title,
        project_type: formData.project_type as Project["project_type"],
        domain: formData.domain,
        problem_statement: formData.problem_statement,
        description: formData.description,
        methodology: formData.methodology,
        outcome: formData.outcome,
        technologies: formData.technologies.split(",").map((t) => ({ name: t.trim(), normalized_name: t.trim().toLowerCase(), category: null })).filter((t) => t.name) as Project["technologies"],
        skills: formData.skills.split(",").map((s) => ({ name: s.trim(), skill_id: "", category: null })).filter((s) => s.name) as Project["skills"],
        visibility: formData.visibility as Project["visibility"],
        status: formData.status as Project["status"],
      });
      setIsModalOpen(false);
      setFormData({ title: "", project_type: "ACADEMIC", domain: "", problem_statement: "", description: "", methodology: "", outcome: "", technologies: "", skills: "", visibility: "PUBLIC", status: "IN_PROGRESS" });
      fetchProjects();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error creating project.";
      alert(msg);
    }
  };

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.domain || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-200 pb-7">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <FolderGit2 className="w-5.5 h-5.5 text-indigo-600" style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Projects</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading…" : `${projects.length} project${projects.length !== 1 ? "s" : ""} in repository`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl transition shadow-blue shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by title, description, or domain…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-[13px] transition"
          />
        </div>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
        >
          <option value="">All Domains</option>
          <option value="IoT">IoT & Embedded Systems</option>
          <option value="AI">AI & Machine Learning</option>
          <option value="Robotics">Robotics & Autonomous Systems</option>
          <option value="Software">Software Engineering</option>
          <option value="Security">Cybersecurity</option>
          <option value="Quantum">Quantum Computing</option>
        </select>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <CardGridSkeleton count={6} Skeleton={ProjectCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchProjects} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title={searchQuery ? `No projects matching "${searchQuery}"` : "No campus projects yet"}
          description="Be the first to record a new project!"
          action={{ label: "Create First Project", onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onView={() => setSelectedProject(project)} />
          ))}
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {isModalOpen && (
        <ModalBackdrop onClose={() => setIsModalOpen(false)}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Campus Project</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">Add a new project to the campus repository</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <ModalField label="Project Title" required>
              <input required type="text" placeholder="e.g. Autonomous Campus Delivery Rover"
                value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={modalInputCls} />
            </ModalField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModalField label="Type">
                <select value={formData.project_type} onChange={(e) => setFormData({ ...formData, project_type: e.target.value })} className={modalInputCls}>
                  <option value="ACADEMIC">Academic</option>
                  <option value="RESEARCH">Research</option>
                  <option value="CAPSTONE">Capstone</option>
                  <option value="ENTREPRENEURIAL">Entrepreneurial</option>
                  <option value="OPEN_SOURCE">Open Source</option>
                </select>
              </ModalField>
              <ModalField label="Domain">
                <input type="text" placeholder="e.g. IoT & Embedded Systems"
                  value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className={modalInputCls} />
              </ModalField>
            </div>
            <ModalField label="Description" required>
              <textarea required rows={3} placeholder="Detailed project summary…"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={modalInputCls} />
            </ModalField>
            <ModalField label="Outcome / Results">
              <input type="text" placeholder="e.g. 95% accurate TinyML model deployed on ESP32"
                value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className={modalInputCls} />
            </ModalField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModalField label="Technologies (comma-separated)">
                <input type="text" placeholder="ESP32, Python, FastAPI"
                  value={formData.technologies} onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className={modalInputCls} />
              </ModalField>
              <ModalField label="Skills Used (comma-separated)">
                <input type="text" placeholder="Embedded Systems, Circuit Design"
                  value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className={modalInputCls} />
              </ModalField>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[13px] transition">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[13px] shadow-blue transition">
                Create Project
              </button>
            </div>
          </form>
        </ModalBackdrop>
      )}

      {/* ── DETAIL MODAL ── */}
      {selectedProject && (
        <ModalBackdrop onClose={() => setSelectedProject(null)}>
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">{selectedProject.domain || selectedProject.project_type}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${selectedProject.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {selectedProject.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedProject.title}</h2>
            </div>
            <button onClick={() => setSelectedProject(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 ml-4">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-5 text-[13px]">
            <InfoBlock label="Description">{selectedProject.description}</InfoBlock>
            {selectedProject.outcome && <InfoBlock label="Key Outcome" className="text-emerald-700">{selectedProject.outcome}</InfoBlock>}
            {selectedProject.technologies.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technologies</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.technologies.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[12px] font-medium rounded-lg border border-slate-200">{t.name}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedProject.contributors.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contributors</p>
                <div className="space-y-2">
                  {selectedProject.contributors.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-900">{c.full_name || c.email || "Campus User"}</p>
                        {c.contribution_description && <p className="text-slate-500 text-[11px]">{c.contribution_description}</p>}
                      </div>
                      <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold uppercase">{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}

// ── Project Card ──
function ProjectCard({ project, onView }: { project: Project; onView: () => void }) {
  return (
    <div className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition-all card-interactive shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
            {project.domain || project.project_type}
          </span>
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
            project.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {project.status}
          </span>
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition mb-2 leading-snug">{project.title}</h3>
        <p className="text-slate-500 text-[13px] line-clamp-3 mb-4 leading-relaxed">{project.description}</p>
        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.technologies.slice(0, 4).map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 font-medium rounded-md border border-slate-200">{t.name}</span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-500 font-medium rounded-md border border-slate-200">+{project.technologies.length - 4}</span>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[12px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{project.contributors.length} contributor{project.contributors.length !== 1 ? "s" : ""}</span>
        </div>
        <button onClick={onView} className="text-blue-600 hover:text-blue-700 font-bold transition inline-flex items-center gap-1">
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Shared Helpers ──
const modalInputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition";

function ModalField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );
}

function InfoBlock({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-slate-700 leading-relaxed ${className}`}>{children}</p>
    </div>
  );
}

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
