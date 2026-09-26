import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { listProviders, resolveChannel, submitDemoApplication, openOfficialRedirect, createManualTracking, modeLabel } from "@/lib/niecp/government/manager";
import { DEMO_DISCLAIMER } from "@/lib/niecp/government/demoAdapter";
import { StatusChip } from "./Dashboard";
import { ExternalLink, Landmark, Info, Loader2, PlayCircle, ClipboardList, Ban } from "lucide-react";

function ProviderCard({ provider }) {
  const isDemo = provider.environment === "DEMO";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm text-slate-900">{provider.provider_name}</div>
          <div className="text-[11px] text-slate-500">{provider.service_name}</div>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${isDemo ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
          {isDemo ? "🟡 DEMO" : provider.environment.replace(/_/g, " ")}
        </span>
      </div>
      <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
        <div>Authorization: <b>{provider.authorization_status.replace(/_/g, " ")}</b></div>
        <div>Live API: <b>{provider.live ? "CONNECTED" : "NOT CONNECTED"}</b></div>
        <div>Capabilities: <b>{provider.capabilities.slice(0, 2).join(" · ")}</b></div>
        <div>Last verified: {provider.last_verified_at}</div>
      </div>
      {isDemo && (
        <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">{DEMO_DISCLAIMER}</div>
      )}
      {provider.official_portal_url && (
        <a href={provider.official_portal_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
          <ExternalLink className="w-3 h-3" /> Open official portal
        </a>
      )}
    </div>
  );
}

export default function GovernmentGateway() {
  const { selected, loading, approvals, applications, reload } = useProjectData();
  const [confirm, setConfirm] = useState(null); // { type, approval }
  const [busy, setBusy] = useState(null);

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  if (!selected) return <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">Select a profile.</div>;

  const trackedKeys = applications.map((a) => a.approval_key);

  async function runConfirmed() {
    const { type, approval } = confirm;
    setBusy(type + approval.approval_key);
    try {
      if (type === "demo") {
        await submitDemoApplication({ profile: selected, approval });
      } else if (type === "redirect") {
        const app = await openOfficialRedirect({ profile: selected, approval });
        window.open(approval.source_url, "_blank", "noopener");
        void app;
      } else if (type === "manual") {
        await createManualTracking({ profile: selected, approval });
      }
      await reload();
      setConfirm(null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Government Gateway</h1>
        <p className="text-sm text-slate-500">
          NIECP-AI prepares your application, then connects you to the right channel. No live government API is connected — every channel is truthfully labelled.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          NIECP-AI complements NSWS and state single-window portals — it does not replace them. Authorized API access can be added later without changing this workflow.
        </div>
      </div>

      {/* Government Integration Registry */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Government Integration Registry</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {listProviders().map((p) => <ProviderCard key={p.provider_name} provider={p} />)}
        </div>
      </div>

      {/* Per-approval apply channels */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Apply for approvals</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {approvals.map((a) => {
            const channel = resolveChannel(a);
            const mode = modeLabel(channel.mode);
            const rd = a.readiness_detail || {};
            const ready = (a.readiness ?? 0) >= 100;
            const alreadyTracked = trackedKeys.includes(a.approval_key);
            const existing = applications.find((x) => x.approval_key === a.approval_key);
            return (
              <div key={a.approval_key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Landmark className="w-4 h-4 text-blue-600" /></div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 text-sm">{a.approval_name}</div>
                    <div className="text-xs text-slate-500">{a.authority}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${mode.className}`}>{mode.icon} {mode.chip}</span>
                  <StatusChip status={a.status} />
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ready ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {ready ? "READY TO APPLY" : "NOT READY"}
                  </span>
                </div>

                {!ready && rd.missing?.length > 0 && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 mt-2">
                    {rd.missing.length} missing document{rd.missing.length > 1 ? "s" : ""} — see <Link to="/documents" className="underline">Documents</Link>.
                  </div>
                )}

                {alreadyTracked ? (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Tracked: <b>{existing.status.replace(/_/g, " ")}</b></span>
                    <Link to="/applications"><Button size="sm" variant="outline">View</Button></Link>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setConfirm({ type: "redirect", approval: a })}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Official portal
                    </Button>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={!ready}
                      title={ready ? "Run the demo workflow with synthetic data" : "Complete all required documents first"}
                      onClick={() => setConfirm({ type: "demo", approval: a })}>
                      {busy === "demo" + a.approval_key ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5 mr-1" />} Run demo
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => setConfirm({ type: "manual", approval: a })}>
                      <ClipboardList className="w-3.5 h-3.5 mr-1" /> Track manually
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {approvals.length === 0 && (
            <div className="sm:col-span-3 text-center text-sm text-slate-400 py-10 flex items-center justify-center gap-2">
              <Ban className="w-4 h-4" /> No approvals identified yet — complete your project profile.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation dialog (consent before consequential actions) */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "demo" ? "Run demo application?" : confirm?.type === "redirect" ? "Continue to the official government portal?" : "Start manual tracking?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-xs leading-relaxed">
              {confirm?.type === "demo" && (
                <>
                  You are about to submit <b>{confirm?.approval.approval_name}</b> to the <b>NIECP demonstration environment</b> using <b>synthetic data</b>.<br />
                  Action: Demo submission · Provider: NIECP Demo Government · Environment: DEMO · Live government API: NOT CONNECTED.<br />
                  Expected result: a synthetic NIECP demo application ID and a simulated review workflow. This is not a real government application.
                </>
              )}
              {confirm?.type === "redirect" && (
                <>
                  Your <b>{confirm?.approval.approval_name}</b> application is prepared in NIECP-AI.<br />
                  Action: Open official portal · Provider: {confirm?.approval.authority} · Environment: LIVE OFFICIAL SITE (you complete the application there).<br />
                  NIECP will record that you continued to the official portal. No data is submitted automatically.
                </>
              )}
              {confirm?.type === "manual" && (
                <>
                  Manual tracking for <b>{confirm?.approval.approval_name}</b> lets you record the application ID, status, queries and decision yourself. All entries are labelled USER-ENTERED.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirmed} className={confirm?.type === "demo" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}>
              {confirm?.type === "demo" ? "RUN DEMO" : confirm?.type === "redirect" ? "OPEN OFFICIAL PORTAL" : "START TRACKING"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}