import React from "react";
import { classifyMSME, formatINR } from "@/lib/niecp/msme";
import { Info, Ruler } from "lucide-react";

const TONE = {
  MICRO: "bg-emerald-50 border-emerald-200 text-emerald-800",
  SMALL: "bg-blue-50 border-blue-200 text-blue-800",
  MEDIUM: "bg-indigo-50 border-indigo-200 text-indigo-800",
  NOT_MSME: "bg-slate-100 border-slate-200 text-slate-700",
  INSUFFICIENT_DATA: "bg-amber-50 border-amber-200 text-amber-800"
};

export default function ClassificationCard({ profile }) {
  const c = classifyMSME(profile);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">MSME Classification</h3>
        </div>
        <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded border ${TONE[c.category]}`}>
          {c.category_label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[10px] uppercase text-slate-400 font-semibold">Investment</div>
          <div className="text-lg font-bold text-slate-900">{c.investment_label}</div>
          <div className="text-[11px] text-slate-500">
            {c.limit ? `Limit ${formatINR(c.limit.investment_limit)}` : "Enter a figure in your profile"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[10px] uppercase text-slate-400 font-semibold">Annual turnover</div>
          <div className="text-lg font-bold text-slate-900">{c.turnover_label}</div>
          <div className="text-[11px] text-slate-500">
            {c.limit ? `Limit ${formatINR(c.limit.turnover_limit)}` : "Enter a figure in your profile"}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-3">{c.explanation}</p>

      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-3 flex gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Both limits must be met, using investment in plant &amp; machinery or equipment (excluding land and building) and
          turnover as per Income Tax returns. Limits shown are the revised classification effective 1 April 2025 —
          confirm the final class in the Udyam portal. Rule set {c.rule_version}, last verified {c.last_verified}.
        </span>
      </div>
    </div>
  );
}