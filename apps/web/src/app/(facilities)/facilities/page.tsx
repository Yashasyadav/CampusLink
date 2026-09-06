"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Facility } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { ApiError } from "@/lib/api-client";
import { Building2, Plus, Search, MapPin, Clock, Mail, Cpu, ChevronDown, ChevronUp, X, CheckCircle2, AlertTriangle, Wrench } from "lucide-react";
import { CardGridSkeleton, FacilityCardSkeleton } from "@/components/ui/skeletons";
import { ErrorState, EmptyState } from "@/components/ui/error-state";

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">{label}{required && " *"}</label>
      {children}
    </div>
  );
}

export default function FacilitiesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <FacilitiesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function FacilitiesContent() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", facility_type: "LABORATORY", location: "", building: "", floor: "",
    department: "", contact_email: "", operating_hours: "", description: "", capabilities: "",
    status: "OPERATIONAL", visibility: "PUBLIC",
  });

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getFacilities();
      setFacilities(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load campus facilities.";
      const status = err instanceof ApiError ? err.status : undefined;
      setError(msg);
      setErrorStatus(status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFacilities(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeService.createFacility({
        name: formData.name,
        facility_type: formData.facility_type,
        location: formData.location,
        building: formData.building || undefined,
        floor: formData.floor || undefined,
        department: formData.department || undefined,
        contact_email: formData.contact_email || undefined,
        operating_hours: formData.operating_hours || undefined,
        description: formData.description || undefined,
        capabilities: formData.capabilities || undefined,
        status: formData.status as Facility["status"],
        visibility: formData.visibility as Facility["visibility"],
      });
      setIsModalOpen(false);
      fetchFacilities();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create facility.";
      alert(msg);
    }
  };

  const filtered = facilities.filter((f) =>
    (f.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.department || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-200 pb-7">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facilities & Equipment</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading…" : `${facilities.length} facilit${facilities.length !== 1 ? "ies" : "y"} on campus`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl transition shadow-blue shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Facility
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search by name, department, location, or description…"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-[13px] transition" />
      </div>

      {/* CONTENT */}
      {loading ? (
        <CardGridSkeleton count={6} Skeleton={FacilityCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchFacilities} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No campus facilities found"
          description="Add labs, makerspaces, and research centers to the repository."
          action={{ label: "Add First Facility", onClick: () => setIsModalOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((f) => (
            <FacilityCard key={f.id} facility={f} expanded={expandedId === f.id}
              onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)} />
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add Campus Facility</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Register a lab or research space on campus</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Facility Name" required>
                <input required type="text" placeholder="e.g. Electronics & IoT Lab"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Facility Type">
                  <select value={formData.facility_type} onChange={(e) => setFormData({ ...formData, facility_type: e.target.value })} className={inputCls}>
                    <option value="LABORATORY">Laboratory</option>
                    <option value="MAKERSPACE">Makerspace</option>
                    <option value="STUDIO">Studio</option>
                    <option value="COMPUTING_CENTER">Computing Center</option>
                    <option value="LIBRARY">Library</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputCls}>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </Field>
              </div>
              <Field label="Location (Room / Campus)" required>
                <input required type="text" placeholder="e.g. Block A, Room 301"
                  value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Building">
                  <input type="text" placeholder="e.g. Engineering Block"
                    value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Department">
                  <input type="text" placeholder="e.g. ECE, CSE"
                    value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Field label="Description / Capabilities">
                <textarea rows={3} placeholder="What can students use this facility for?"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact Email">
                  <input type="email" placeholder="lab@university.edu"
                    value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Operating Hours">
                  <input type="text" placeholder="Mon–Fri 9 AM – 6 PM"
                    value={formData.operating_hours} onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[13px] transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[13px] shadow-blue transition">Add Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FacilityCard({ facility, expanded, onToggle }: { facility: Facility; expanded: boolean; onToggle: () => void }) {
  const statusColor = facility.status === "OPERATIONAL"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : facility.status === "MAINTENANCE"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-100 text-slate-600 border-slate-200";

  const StatusIcon = facility.status === "OPERATIONAL" ? CheckCircle2 : AlertTriangle;

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-card card-interactive transition-all">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase ${statusColor}`}>
            <StatusIcon className="w-3 h-3" />
            {facility.status}
          </span>
        </div>

        <h3 className="font-bold text-[15px] text-slate-900 mb-1 leading-snug">{facility.name}</h3>
        <p className="text-[12px] text-blue-600 font-semibold uppercase tracking-wider mb-3">{facility.facility_type}</p>

        <div className="space-y-1.5 text-[12px] text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{facility.location}{facility.building ? `, ${facility.building}` : ""}</span>
          </div>
          {facility.operating_hours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{facility.operating_hours}</span>
            </div>
          )}
          {facility.contact_email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a href={`mailto:${facility.contact_email}`} className="text-blue-600 hover:underline">{facility.contact_email}</a>
            </div>
          )}
        </div>

        {facility.description && <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-4">{facility.description}</p>}

        {/* Equipment count badge */}
        {facility.equipment_count > 0 && (
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-4">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>{facility.equipment_count} piece{facility.equipment_count !== 1 ? "s" : ""} of equipment</span>
          </div>
        )}

        {/* Expand/collapse equipment */}
        {facility.equipment.length > 0 && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            {expanded ? "Hide" : "Show"} Equipment ({facility.equipment.length})
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {expanded && facility.equipment.length > 0 && (
        <div className="border-t border-slate-100 px-6 pb-5">
          <div className="space-y-2 mt-4">
            {facility.equipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-[12px]">
                <div>
                  <p className="font-semibold text-slate-900">{eq.name}</p>
                  {eq.category && <p className="text-slate-500">{eq.category}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Qty: {eq.quantity}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    eq.availability_status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {eq.availability_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
