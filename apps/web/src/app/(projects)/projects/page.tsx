"use me";
"use client";

import React, { useState, useEffect } from "react";
import { Project } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { FolderGit2, Plus, Search, Tag, Users, CheckCircle2, Clock, Calendar } from "lucide-react";

export default function ProjectsPage() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <FolderGit2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-white bg-clip-text text-transparent">
                  Campus Projects Repository
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Explore innovation initiatives, capstone projects, and collaborative research teams across campus.
                </p>
              </div>
            </div>
          </div>

          <button
            id="create-project-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
            <input
              id="search-projects-input"
              type="text"
              placeholder="Search projects by title, description, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <select
            id="domain-filter-select"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 transition"
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
          <div className="text-center py-20 text-slate-500">Loading campus projects...</div>
        ) : error ? (
          <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-xl">{error}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No campus projects found</p>
            <p className="text-slate-600 text-sm mt-1">Be the first to record a new project!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-6 transition flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {project.domain || project.project_type}
                    </span>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        project.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition mb-2">
                    {project.title}
                  </h3>

                  <p className="text-slate-400 text-sm line-clamp-3 mb-4">{project.description}</p>

                  {/* Tech stack badges */}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.technologies.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-md">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-4 mt-2 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{project.contributors.length} Contributor(s)</span>
                  </div>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100">Create Campus Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Autonomous Campus Delivery Rover"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Project Type
                  </label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="RESEARCH">Research</option>
                    <option value="CAPSTONE">Capstone</option>
                    <option value="ENTREPRENEURIAL">Entrepreneurial</option>
                    <option value="OPEN_SOURCE">Open Source</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="e.g. IoT & Embedded Systems"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Problem Statement
                </label>
                <textarea
                  rows={2}
                  value={formData.problem_statement}
                  onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                  placeholder="What problem does this project solve?"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed project summary..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Technologies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    placeholder="ESP32, Python, FastAPI"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Skills Used (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Embedded Systems, Circuit Design"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  {selectedProject.domain || selectedProject.project_type}
                </span>
                <h2 className="text-2xl font-bold text-slate-100">{selectedProject.title}</h2>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-slate-500 hover:text-slate-300">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-slate-200">Description</h4>
                <p className="text-slate-400 mt-1">{selectedProject.description}</p>
              </div>

              {selectedProject.problem_statement && (
                <div>
                  <h4 className="font-semibold text-slate-200">Problem Statement</h4>
                  <p className="text-slate-400 mt-1">{selectedProject.problem_statement}</p>
                </div>
              )}

              {selectedProject.outcome && (
                <div>
                  <h4 className="font-semibold text-slate-200">Key Outcome</h4>
                  <p className="text-emerald-400 mt-1">{selectedProject.outcome}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Contributors</h4>
                <div className="space-y-2">
                  {selectedProject.contributors.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-200">{c.full_name || c.email || "Campus User"}</p>
                        <p className="text-xs text-slate-500">{c.contribution_description || c.role}</p>
                      </div>
                      <span className="px-2.5 py-0.5 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-semibold">
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
