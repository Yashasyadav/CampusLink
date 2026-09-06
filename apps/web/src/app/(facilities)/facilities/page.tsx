"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Facility } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { Building2, Plus, Search, MapPin, Clock, Mail, Cpu, ChevronDown, ChevronUp, X } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFacilityId, setExpandedFacilityId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    facility_type: "LABORATORY",
    location: "",
    building: "",
    floor: "",
    department: "",
    contact_email: "",
    operating_hours: "",
    description: "",
    capabilities: "",
    status: "OPERATIONAL",
    visibility: "PUBLIC",
  });

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const data = await knowledgeService.getFacilities();
      setFacilities(data.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load lab facilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeService.createFacility({
        name: formData.name,
        facility_type: formData.facility_type,
        location: formData.location,
        building: formData.building,
        floor: formData.floor,
        department: formData.department,
        contact_email: formData.contact_email,
        operating_hours: formData.operating_hours,
        description: formData.description,
        capabilities: formData.capabilities,
        status: formData.status as any,
        visibility: formData.visibility as any,
      });

      setIsModalOpen(false);
      setFormData({
        name: "",
        facility_type: "LABORATORY",
        location: "",
        building: "",
        floor: "",
        department: "",
        contact_email: "",
        operating_hours: "",
        description: "",
        capabilities: "",
        status: "OPERATIONAL",
        visibility: "PUBLIC",
      });
      fetchFacilities();
    } catch (err: any) {
      alert("Error registering facility: " + err.message);
    }
  };

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.department && f.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Campus Facilities & Equipment
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Explore campus research labs, testing equipment, workstations, and specialized hardware assets.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Facility</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search facilities by name, building, department, or equipment capabilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 text-xs transition"
        />
      </div>

      {/* Facilities List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs font-medium">Loading lab facilities...</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">{error}</div>
      ) : filteredFacilities.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-sm">No lab facilities found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFacilities.map((fac) => {
            const isExpanded = expandedFacilityId === fac.id;
            return (
              <div
                key={fac.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 transition space-y-4 shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                        {fac.facility_type}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {fac.department || "General Campus"}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded uppercase">
                        {fac.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">{fac.name}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>{fac.location}</span>
                      </div>
                      {fac.operating_hours && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{fac.operating_hours}</span>
                        </div>
                      )}
                      {fac.contact_email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{fac.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedFacilityId(isExpanded ? null : fac.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition"
                    >
                      <Cpu className="w-4 h-4 text-amber-600" />
                      <span>Equipment Assets ({fac.equipment_count})</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {fac.description && <p className="text-slate-600 text-xs leading-relaxed">{fac.description}</p>}

                {fac.capabilities && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Capabilities: </span>
                    {fac.capabilities}
                  </div>
                )}

                {/* Equipment accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-600" />
                      Lab Equipment Inventory
                    </h4>

                    {fac.equipment.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No registered equipment items in this lab.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fac.equipment.map((eq) => (
                          <div
                            key={eq.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{eq.name}</p>
                              <p className="text-[11px] text-slate-500">
                                Category: {eq.category || "General"} | Qty: {eq.quantity}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                eq.availability_status === "AVAILABLE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {eq.availability_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Register Lab Facility</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Facility Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. High Performance Computing & Robotics Lab"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Facility Type *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.facility_type}
                    onChange={(e) => setFormData({ ...formData, facility_type: e.target.value })}
                    placeholder="e.g. LABORATORY, WORKSHOP, SERVER_ROOM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Electrical & Computer Engineering"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location *
                </label>
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Block C, Room 304"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
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
                  Register Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
