import React from "react";
import { ExternalLink, ShieldAlert, Check } from "lucide-react";

export default function ObligationList({ items }) {
  const applicable = items.filter((i) => i.applies);
  const others = items.filter((i) => !i.applies);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-slate-900 text-sm">MSME Obligations</h3>
        <span className="text-[11px] text-slate-400 ml-auto">{applicable.length} applicable</span>
      </div>
      <div className="mt-3 space-y-2">
        {applicable.map((i) => (
          <div key={i.key} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-slate-800">{i.name}</div>
                <div className="text-[11px] text-slate-500">{i.authority}</div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                Action needed
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5">{i.why}</div>
            <a href={i.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1.5">
              <ExternalLink className="w-3 h-3" /> Official source
            </a>
          </div>
        ))}
      </div>

      {others.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="text-[10px] uppercase text-slate-400 font-semibold mb-2">Not applicable on current data</div>
          <div className="space-y-1">
            {others.map((i) => (
              <div key={i.key} className="flex items-center gap-2 text-xs text-slate-500">
                <Check className="w-3.5 h-3.5 text-slate-300" /> {i.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}