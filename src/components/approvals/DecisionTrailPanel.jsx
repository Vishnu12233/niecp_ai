import React, { useEffect, useState } from "react";
import { listDecisions } from "@/lib/niecp/decisionTrail";
import { FACTORS } from "@/lib/niecp/catalogs";
import { History, Loader2 } from "lucide-react";

// Decision Trail — the permanent, explainable record of why each requirement
// was identified: project input -> factor -> rule evaluated -> result ->
// approval -> documents -> dependency -> next action.
export default function DecisionTrailPanel({ profileId, refreshKey = 0 }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!profileId) { setRows([]); return; }
    listDecisions(profileId)
      .then((r) => { if (!cancelled) setRows(r || []); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, [profileId, refreshKey]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" /> Decision Trail
        </h3>
        <span className="text-[10px] uppercase font-semibold text-slate-400">Explainability record — saved decisions</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Every saved decision keeps the project input, the factor, the rule evaluated, the result, the source and the timestamp.
      </p>

      {rows === null && (
        <div className="text-xs text-slate-400 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading saved decisions…</div>
      )}

      {rows && rows.length === 0 && (
        <div className="text-xs text-slate-400">
          No decisions saved yet. Use "Save to decision trail" on an approval to record its rule evaluation permanently.
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((d) => (
            <div key={d.id} className="border border-slate-200 rounded-xl p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="font-medium text-slate-800 text-sm">{d.approval_name}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {(d.result || "").replace(/_/g, " ")}
                  </span>
                  <span className="text-[9px] text-slate-400">{d.evaluated_at ? new Date(d.evaluated_at).toLocaleString() : ""}</span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-600">
                <div><span className="text-slate-400">Rule:</span> {d.rule}</div>
                <div><span className="text-slate-400">Rule ID:</span> {d.approval_key} · engine {d.engine_version}</div>
                <div>
                  <span className="text-slate-400">Input:</span>{" "}
                  {(d.triggering_facts || []).length
                    ? d.triggering_facts.map((k) => FACTORS[k]?.name || k).join(", ")
                    : "No confirmed factor — information required"}
                </div>
                <div><span className="text-slate-400">Result:</span> {d.evidence}</div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Source:</span>{" "}
                  <a href={d.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{d.source_url}</a>
                  {" "}· {d.legal_basis}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}