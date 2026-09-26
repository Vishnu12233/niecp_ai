import React from "react";
import { FACTOR_STATUS } from "@/lib/niecp/factorAnalysis";

// One regulatory factor: PROJECT FACTOR -> DETECTED VALUE -> STATUS -> IMPACT.
export default function FactorCard({ factor }) {
  const chip = FACTOR_STATUS[factor.status] || FACTOR_STATUS.INFORMATION_REQUIRED;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-slate-900 text-sm">{factor.name}</div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${chip.className}`}>{chip.label}</span>
      </div>
      <div className="text-[11px] text-slate-500 mt-1">{factor.explanation}</div>

      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
        <div className="text-[9px] uppercase font-semibold text-slate-400">Detected value</div>
        <div className="text-xs text-slate-700">{factor.detected_value}</div>
        {factor.measured_field && <div className="text-[9px] text-slate-400">from project {factor.measured_field.toLowerCase()}</div>}
      </div>

      <div className="text-xs text-slate-600 mt-2">
        <span className="text-[9px] uppercase font-bold text-slate-500 mr-1">Regulatory impact</span>
        {factor.impact}
      </div>

      {factor.triggered_approvals.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {factor.triggered_approvals.map((a) => (
            <span key={a.key} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {a.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}