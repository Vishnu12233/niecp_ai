import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { modeLabel, syncDemoApplication } from "@/lib/niecp/government/manager";
import { DEMO_DISCLAIMER } from "@/lib/niecp/government/demoAdapter";
import { ExternalLink, RefreshCw, Clock, CheckCircle2, Loader2 } from "lucide-react";
import QueryDialog from "./QueryDialog";
import ManualStatusDialog from "./ManualStatusDialog";

const STATUS_STYLES = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  QUERY_RAISED: "bg-amber-100 text-amber-800",
  USER_RESPONDED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-indigo-100 text-indigo-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  DRAFT: "bg-slate-100 text-slate-700"
};

function Timeline({ timeline }) {
  if (!timeline?.length) return null;
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Timeline</div>
      <ol className="space-y-1.5">
        {timeline.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <div>
              <span className="font-medium text-slate-700">{(e.status || "").replace(/_/g, " ")}</span>
              <span className="text-slate-400"> · {new Date(e.at).toLocaleString()}</span>
              {e.note && <div className="text-slate-500">{e.note}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ApplicationCard({ app, onDone }) {
  const [syncing, setSyncing] = useState(false);
  const [queryDialog, setQueryDialog] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const mode = modeLabel(app.integration_mode);
  const isDemo = app.integration_mode === "DEMO";
  const openQueries = (app.queries || []).filter((q) => !q.response);
  const statusStyle = STATUS_STYLES[app.status] || "bg-slate-100 text-slate-700";

  async function checkStatus() {
    setSyncing(true);
    try { await syncDemoApplication(app); onDone?.(); } finally { setSyncing(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">{app.approval_name}</div>
          <div className="text-xs text-slate-500">{app.authority}</div>
          {app.application_reference && (
            <div className="text-xs mt-1 font-mono text-slate-600">
              {app.application_reference}
              {isDemo && <span className="ml-2 text-[10px] font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">SYNTHETIC NIECP DEMO ID</span>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusStyle}`}>{(app.status || "").replace(/_/g, " ")}</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${mode.className}`}>{mode.icon} {mode.chip}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
        {app.submitted_date && <span>Submitted: <b>{new Date(app.submitted_date).toLocaleDateString()}</b></span>}
        <span>Source: <b>{(app.status_source || "USER_ENTERED").replace(/_/g, " ")}</b></span>
        {app.correlation_id && <span>Correlation: <b className="font-mono">{app.correlation_id}</b></span>}
      </div>

      {isDemo && (
        <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          DEMO WORKFLOW SIMULATION — {DEMO_DISCLAIMER}
        </div>
      )}
      {app.status === "APPROVED" && (
        <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {isDemo ? "Simulated approval with synthetic compliance conditions. This is NOT a real government approval." : "Approval recorded from user-entered status. Verify the original approval order with the authority."}
        </div>
      )}

      {app.next_action && <div className="text-xs text-slate-600 mt-2">Next: {app.next_action}</div>}

      {/* Queries */}
      {(app.queries || []).length > 0 && (
        <div className="mt-3 space-y-2">
          {app.queries.map((q) => (
            <div key={q.id} className={`rounded-xl border p-3 ${q.response ? "border-slate-200 bg-slate-50" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-slate-700">
                  <span className="font-semibold">Government query{q.source === "NIECP_DEMO" ? " (synthetic — demo)" : ""}:</span> {q.text}
                </div>
                {!q.response && (
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => setQueryDialog(q)}>Translate & Respond</Button>
                )}
              </div>
              {q.response && <div className="text-xs text-slate-500 mt-1.5 border-t border-slate-200 pt-1.5">Your response: {q.response}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        {isDemo && ["SUBMITTED", "UNDER_REVIEW", "USER_RESPONDED", "QUERY_RAISED"].includes(app.status) && (
          <Button size="sm" variant="outline" disabled={syncing || (app.status === "QUERY_RAISED" && openQueries.length > 0)} onClick={checkStatus}>
            {syncing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Check status (simulated)
          </Button>
        )}
        {!isDemo && (
          <Button size="sm" variant="outline" onClick={() => setManualOpen(true)}>
            {(app.integration_mode === "MANUAL" ? "Record status" : "Update application")}
          </Button>
        )}
        {(app.official_url || app.portal) && (
          <a href={app.portal || app.official_url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost" className="text-blue-600"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Official portal</Button>
          </a>
        )}
        <Link to="/government"><Button size="sm" variant="ghost" className="text-slate-500">Government Gateway</Button></Link>
      </div>

      <Timeline timeline={app.timeline} />

      {queryDialog && (
        <QueryDialog application={app} query={queryDialog} onClose={() => setQueryDialog(null)}
          onResponded={() => { setQueryDialog(null); onDone?.(); }} />
      )}
      {manualOpen && (
        <ManualStatusDialog application={app} onClose={() => setManualOpen(false)} onSaved={() => { setManualOpen(false); onDone?.(); }} />
      )}
    </div>
  );
}