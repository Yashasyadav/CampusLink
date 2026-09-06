"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Project } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { FolderGit2, Plus, Search, Users, ArrowRight, X } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // New Project Form state
  const [formData, setFormData] = useState({
    title: "",
    project_type: "ACADEMIC",
    domain: "",
    problem_statement: "",
    description: "",
    methodology: "",
    outcome: "",
    technologies: "",
    skills: "",
    visibility: "PUBLIC",
    status: "IN_PROGRESS",
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await knowledgeService.getProjects({
        domain: domainFilter || undefined,
      });
      setProjects(data.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load campus projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [domainFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const techArray = formData.technologies.split(",").map((t) => t.trim()).filter(Boolean);
      const skillArray = formData.skills.split(",").map((s) => s.trim()).filter(Boolean);

      await knowledgeService.createProject({
        title: formData.title,
        project_type: formData.project_type as any,
        domain: formData.domain,
        problem_statement: formData.problem_statement,
        description: formData.description,
        methodology: formData.methodology,
        outcome: formData.outcome,
        technologies: techArray as any,
        skills: skillArray as any,
        visibility: formData.visibility as any,
        status: formData.status as any,
      });

      setIsModalOpen(false);
      setFormData({
        title: "",
        project_type: "ACADEMIC",
        domain: "",
        problem_statement: "",
        description: "",
        methodology: "",
        outcome: "",
        technologies: "",
        skills: "",
        visibility: "PUBLIC",
        status: "IN_PROGRESS",
      });
      fetchProjects();
    } catch (err: any) {
      alert("Error creating project: " + err.message);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.domain && p.domain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-600">
            <FolderGit2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Campus Projects Repository
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Explore innovation initiatives, capstone projects, and collaborative research teams across campus.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by title, description, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 text-xs transition"
          />
        </div>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition"
        >
          <option value="">All Domains</option>
          <option value="IoT">IoT & Embedded Systems</option>
          <option value="AI">AI & Machine Learning</option>
          <option value="Robotics">Robotics & Autonomous Systems</option>
          <option value="Software">Software Engineering</option>
        </select>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs font-medium">Loading campus projects...</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">{error}</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-sm">No campus projects found</p>
          <p className="text-slate-400 text-xs mt-1">Be the first to record a new project!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {project.domain || project.project_type}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                      project.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition mb-2">
                  {project.title}
                </h3>

                <p className="text-slate-600 text-xs line-clamp-3 mb-4 leading-relaxed">{project.description}</p>

                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-200">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{project.contributors.length} Contributor(s)</span>
                </div>
                <button
                  onClick={() => setSelectedProject(project)}
                  className="text-blue-600 hover:text-blue-700 font-bold transition inline-flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Create Campus Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Autonomous Campus Delivery Rover"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Project Type
                  </label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="RESEARCH">Research</option>
                    <option value="CAPSTONE">Capstone</option>
                    <option value="ENTREPRENEURIAL">Entrepreneurial</option>
                    <option value="OPEN_SOURCE">Open Source</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="e.g. IoT & Embedded Systems"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed project summary..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Technologies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    placeholder="ESP32, Python, FastAPI"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Skills Used (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Embedded Systems, Circuit Design"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {selectedProject.domain || selectedProject.project_type}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedProject.title}</h2>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900">Description</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">{selectedProject.description}</p>
              </div>

              {selectedProject.outcome && (
                <div>
                  <h4 className="font-bold text-slate-900">Key Outcome</h4>
                  <p className="text-emerald-700 mt-1 font-medium">{selectedProject.outcome}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Contributors</h4>
                <div className="space-y-2">
                  {selectedProject.contributors.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{c.full_name || c.email || "Campus User"}</p>
                        <p className="text-slate-500">{c.contribution_description || c.role}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold">
                        {c.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
