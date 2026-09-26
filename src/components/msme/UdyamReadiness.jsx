import React from "react";
import { assessUdyamReadiness } from "@/lib/niecp/msme";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, HelpCircle, ExternalLink, Loader2 } from "lucide-react";

const ICON = {
  READY: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
  MISSING: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
  VERIFY: <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
};

const STATUSES = ["Not Registered", "In Process", "Registered"];

export default function UdyamReadiness({ profile, onSaveStatus, savingStatus }) {
  const a = assessUdyamReadiness(profile);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Udyam Registration Readiness</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {a.ready} of {a.total} required details ready · {a.verify} item(s) to verify on the portal
          </p>
        </div>
        <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded border shrink-0 ${a.ready_to_register ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          {a.ready_to_register ? "Ready to register" : `${a.readiness}% ready`}
        </span>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${a.readiness}%` }} />
      </div>

      <div className="mt-4 space-y-2">
        {a.items.map((it) => (
          <div key={it.key} className="flex items-start gap-2 text-xs">
            {ICON[it.status]}
            <div>
              <div className={`${it.required ? "font-medium" : ""} text-slate-700`}>
                {it.label}{!it.required && <span className="text-slate-400 font-normal"> (optional)</span>}
              </div>
              {it.hint && <div className="text-[11px] text-slate-400">{it.hint}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 mt-4 pt-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Udyam status on record</div>
          <select
            value={a.registration_status}
            onChange={(e) => onSaveStatus(e.target.value)}
            disabled={savingStatus}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 ring-blue-200"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {savingStatus && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        <a href={a.portal_url} target="_blank" rel="noreferrer" className="ml-auto">
          <Button size="sm" variant="outline">
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Udyam portal
          </Button>
        </a>
      </div>
    </div>
  );
}