import React from "react";
import { COMPLIANCE_STATUS } from "@/lib/niecp/compliance";
import { ShieldCheck } from "lucide-react";

// Compliance / inspection readiness — regulatory assistance, not certification.
export default function ComplianceReadiness({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" /> Compliance & Inspection Readiness
        </h3>
        <span className="text-[10px] uppercase font-semibold text-slate-400">Regulatory assistance — not a legal certification</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">Derived from each approval's real state and its evidence documents.</p>

      <div className="space-y-2">
        {items.map((c) => {
          const chip = COMPLIANCE_STATUS[c.status] || COMPLIANCE_STATUS.PENDING;
          return (
            <div key={c.approval_key} className="border border-slate-200 rounded-xl p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-slate-800">{c.item}</div>
                  <div className="text-[11px] text-slate-500">{c.authority} · evidence {c.evidence_complete}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${chip.className}`}>{chip.label}</span>
              </div>
              {c.issue && <div className="text-[11px] text-red-600 mt-1">{c.issue}</div>}
              <div className="text-[11px] text-slate-600 mt-1">Responsible action: <b>{c.action}</b></div>
              {c.evidence.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.evidence.map((e) => (
                    <span key={e.requirement_key} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                      e.status === "VALID" || e.status === "NO_EXPIRY" ? "bg-teal-50 text-teal-700 border-teal-200"
                        : e.status === "EXPIRED" ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {e.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}