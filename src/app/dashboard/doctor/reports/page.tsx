"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useToast } from "@/components/ToastProvider";
import {
  FileText,
  Filter,
  Download,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";

export default function DoctorReportsPage() {
  const { success, error } = useToast();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, statusFilter, dateFilter]);

  const loadCertificates = async () => {
    try {
      const res = await fetch("/api/certificates");
      const data = await res.json();
      if (data.success) {
        setCertificates(data.certificates);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    }
  };

  const filterCertificates = () => {
    let filtered = [...certificates];

    if (searchTerm) {
      filtered = filtered.filter(
        (cert) =>
          cert.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.certificateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((cert) => cert.status === statusFilter);
    }

    if (dateFilter === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter((cert) => new Date(cert.appliedDate).toDateString() === today);
    } else if (dateFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((cert) => new Date(cert.appliedDate) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((cert) => new Date(cert.appliedDate) >= monthAgo);
    }

    setFilteredCertificates(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "Valid":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "rejected":
      case "Revoked":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case "submitted":
      case "under-review":
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "Valid":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "rejected":
      case "Revoked":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "submitted":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "under-review":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const exportReport = () => {
    const csvContent = [
      ["Certificate ID", "Applicant Name", "National ID", "Purpose", "Decision", "Status", "Applied Date", "Doctor Notes"],
      ...filteredCertificates.map((cert) => [
        cert.certificateId,
        cert.candidateName,
        cert.candidateIdNumber,
        cert.purpose,
        cert.decision || "PENDING",
        cert.status,
        cert.appliedDate ? new Date(cert.appliedDate).toLocaleDateString() : "—",
        cert.doctorNotes || "—",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitmed-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    success("Export", "Report exported successfully");
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              Applicant Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View all received applications and decisions made
            </p>
          </div>
          <button
            onClick={exportReport}
            className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] text-xs font-black flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-[#12B8B0]" />
              <span className="text-xs font-bold text-slate-600 uppercase">Total</span>
            </div>
            <div className="text-2xl font-extrabold text-[#0B2D5C]">{certificates.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800 uppercase">Approved</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">
              {certificates.filter((c) => c.status === "approved" || c.status === "Valid").length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span className="text-xs font-bold text-rose-800 uppercase">Rejected</span>
            </div>
            <div className="text-2xl font-extrabold text-rose-900">
              {certificates.filter((c) => c.status === "rejected" || c.status === "Revoked").length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-bold text-amber-800 uppercase">Pending</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-900">
              {certificates.filter((c) => c.status === "submitted" || c.status === "under-review").length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Certificate ID</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Applicant</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">National ID</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Purpose</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Decision</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Applied Date</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Doctor Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No certificates found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map((cert) => (
                    <tr key={cert._id || cert.certificateId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-[#0B2D5C]">{cert.certificateId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{cert.candidateName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{cert.candidateIdNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{cert.purpose}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{cert.decision || "PENDING"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(cert.status)}`}>
                          {getStatusIcon(cert.status)}
                          {cert.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {cert.appliedDate ? new Date(cert.appliedDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {cert.doctorNotes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
