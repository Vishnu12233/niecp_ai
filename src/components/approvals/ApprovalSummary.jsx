import React from "react";
import { READINESS_STATUS } from "@/lib/niecp/readiness";

// Approval dashboard summary — counts derived from the rule engine results and
// the real dependency lifecycle, never estimated.
export default function ApprovalSummary({ approvals = [], nodes = [] }) {
  const count = (fn) => approvals.filter(fn).length;
  const stats = [
    { label: "Total identified", value: approvals.length, color: "text-slate-700" },
    { label: "Applies", value: count((a) => a.status === "LIKELY_APPLICABLE"), color: "text-teal-600" },
    { label: "Conditional", value: count((a) => a.status === "POTENTIALLY_APPLICABLE"), color: "text-amber-600" },
    { label: "Information required", value: count((a) => a.status === "REVIEW_REQUIRED"), color: "text-amber-600" },
    { label: "Requires verification", value: count((a) => a.conditional), color: "text-slate-600" },
    { label: "Ready", value: approvals.filter((a) => a.readiness_status === "READY").length, color: "text-teal-600" },
    { label: "Blocked", value: approvals.filter((a) => a.readiness_status === "BLOCKED").length, color: "text-red-600" },
    { label: "In progress", value: nodes.filter((n) => n.lifecycle === "IN_PROGRESS").length, color: "text-blue-600" },
    { label: "Completed", value: nodes.filter((n) => n.lifecycle === "COMPLETED").length, color: "text-teal-600" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">Approval Dashboard</h3>
        <span className="text-[10px] uppercase font-semibold text-slate-400">
          Rule engine results · not AI estimates
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-4 text-[9px] font-semibold uppercase">
        {Object.entries(READINESS_STATUS).map(([k, v]) => (
          <span key={k} className={`px-2 py-0.5 rounded ${v.className}`}>{v.label}</span>
        ))}
      </div>
    </div>
  );
}