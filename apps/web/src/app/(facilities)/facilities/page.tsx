"use me";
"use client";

import React, { useState, useEffect } from "react";
import { Facility, Equipment } from "@/types";
import { knowledgeService } from "@/services/knowledge";
import { Building2, Plus, Search, MapPin, Clock, Mail, Cpu, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from "lucide-react";

export default function FacilitiesPage() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                Campus Facilities & Equipment
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Explore campus research labs, testing equipment, workstations, and specialized hardware assets.
              </p>
            </div>
          </div>

          <button
            id="register-facility-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-600/25"
          >
            <Plus className="w-5 h-5" />
            Register Facility
          </button>
        </div>

        {/* Filter Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
          <input
            id="search-facilities-input"
            type="text"
            placeholder="Search facilities by name, building, department, or equipment capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Facilities List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading lab facilities...</div>
        ) : error ? (
          <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-xl">{error}</div>
        ) : filteredFacilities.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No lab facilities found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredFacilities.map((fac) => {
              const isExpanded = expandedFacilityId === fac.id;
              return (
                <div
                  key={fac.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 transition space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {fac.facility_type}
                        </span>
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300">
                          {fac.department || "General Campus"}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-slate-800/80 text-emerald-400 rounded">
                          {fac.status}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-100">{fac.name}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span>{fac.location}</span>
                        </div>
                        {fac.operating_hours && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>{fac.operating_hours}</span>
                          </div>
                        )}
                        {fac.contact_email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span>{fac.contact_email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedFacilityId(isExpanded ? null : fac.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                      >
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <span>Equipment Assets ({fac.equipment_count})</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {fac.description && <p className="text-slate-400 text-sm">{fac.description}</p>}

                  {fac.capabilities && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                      <span className="font-semibold text-emerald-400">Capabilities: </span>
                      {fac.capabilities}
                    </div>
                  )}

                  {/* Equipment accordion */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        Lab Equipment Inventory
                      </h4>

                      {fac.equipment.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No registered equipment items in this lab.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {fac.equipment.map((eq) => (
                            <div
                              key={eq.id}
                              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-slate-200 text-sm">{eq.name}</p>
                                <p className="text-xs text-slate-500">
                                  Category: {eq.category || "General"} | Qty: {eq.quantity}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-md ${
                                  eq.availability_status === "AVAILABLE"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100">Register Lab Facility</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Facility Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. High Performance Computing & Robotics Lab"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Facility Type *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.facility_type}
                    onChange={(e) => setFormData({ ...formData, facility_type: e.target.value })}
                    placeholder="e.g. LABORATORY, WORKSHOP, SERVER_ROOM"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Electrical & Computer Engineering"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Location *
                </label>
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Block C, Room 304"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="lab-contact@campuslink.edu"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={formData.operating_hours}
                    onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                    placeholder="Mon-Fri 08:00 - 20:00"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Capabilities & Specialized Services
                </label>
                <textarea
                  rows={2}
                  value={formData.capabilities}
                  onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                  placeholder="PCB fabrication, logic timing analysis, 3D printing..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg"
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
