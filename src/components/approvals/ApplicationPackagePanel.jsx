import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PACKAGE_STATUS } from "@/lib/niecp/readiness";
import { CheckCircle2, Circle, AlertTriangle, ExternalLink, ChevronDown } from "lucide-react";

// Structured application package for one approval. It never claims a submission
// happened — the only outward action is the official portal handoff.
export default function ApplicationPackagePanel({ pkg }) {
  const [open, setOpen] = useState(false);
  const chip = PACKAGE_STATUS[pkg.status] || PACKAGE_STATUS.READY_TO_PREPARE;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-medium text-slate-900 text-sm">{pkg.approval_name}</div>
          <div className="text-xs text-slate-500">{pkg.authority} · rule {pkg.rule_id}</div>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${chip.className}`}>{chip.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500">
        <div>Documents: <b className="text-slate-700">{pkg.documents.filter((d) => d.uploaded).length}/{pkg.documents.length}</b></div>
        <div>Readiness: <b className="text-slate-700">{pkg.readiness}%</b></div>
        <div>Applicability: <b className="text-slate-700">{(pkg.approval_information.find((i) => i.label === "Applicability")?.value || "").replace(/_/g, " ")}</b></div>
        <div>Unresolved: <b className="text-slate-700">{pkg.unresolved.length}</b></div>
      </div>

      {pkg.unresolved.length > 0 && (
        <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <b>Missing requirements:</b> {pkg.unresolved.slice(0, 3).join(" · ")}
            {pkg.unresolved.length > 3 && ` +${pkg.unresolved.length - 3} more`}
          </div>
        </div>
      )}

      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-3">
        <ChevronDown className={`w-3.5 h-3.5 transition ${open ? "rotate-180" : ""}`} /> {open ? "Hide" : "View"} application package
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Checklist</div>
            <div className="space-y-1">
              {pkg.checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-xs">
                  {c.done ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                  <span className={c.done ? "text-slate-600" : "text-slate-500"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Documents</div>
            <div className="space-y-1">
              {pkg.documents.map((d) => (
                <div key={d.requirement_key} className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1">
                  <span className="text-slate-700">{d.name}</span>
                  <span className={d.uploaded ? "text-teal-600" : "text-red-600"}>{d.status.replace(/_/g, " ").toLowerCase()}</span>
                </div>
              ))}
              {pkg.documents.length === 0 && <div className="text-xs text-slate-400">No documents required by the rule pack.</div>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
            {pkg.project_information.map((p) => (
              <div key={p.label}><span className="text-slate-400">{p.label}:</span> <b>{p.value}</b></div>
            ))}
          </div>

          {pkg.dependencies.length > 0 && (
            <div className="text-[11px] text-slate-600">
              <b>Dependencies:</b> {pkg.dependencies.map((d) => d.name).join(", ")}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <a href={pkg.source_url} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Official Portal</Button>
        </a>
        <span className="text-[10px] text-slate-400">
          NIECP-AI prepares the package. No application is submitted automatically.
        </span>
      </div>
    </div>
  );
}