import React from "react";
import { Award, ExternalLink } from "lucide-react";

export default function BenefitList({ items }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-teal-600" />
        <h3 className="font-semibold text-slate-900 text-sm">MSME Benefits &amp; Protections</h3>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((b) => (
          <div key={b.key} className={`rounded-xl border p-3 ${b.applies ? "border-teal-200 bg-teal-50/40" : "border-slate-200"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-slate-800">{b.name}</div>
                <div className="text-[11px] text-slate-500">{b.provider}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${b.applies ? "bg-teal-100 text-teal-800 border-teal-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                {b.applies ? "Likely eligible" : "Confirm eligibility"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5">{b.summary}</div>
            <a href={b.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1.5">
              <ExternalLink className="w-3 h-3" /> Official source
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}