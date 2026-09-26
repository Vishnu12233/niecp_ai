import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { mcaSearch, linkGovernmentRecordWithConsent } from "@/lib/niecp/government/apiGateway";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Building2, Loader2, Search, ShieldCheck } from "lucide-react";

const STATES = ["TN", "KA", "MH", "TS", "KL", "AP", "GJ", "DL", "UP", "RJ", "WB"];

export default function McaEnrichment({ profile, onLinked }) {
  const [cin, setCin] = useState("");
  const [name, setName] = useState(profile?.name || "");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [linking, setLinking] = useState(false);

  async function run() {
    setBusy(true); setResult(null);
    try { setResult(await mcaSearch({ cin, company_name: name, state })); }
    catch (e) { setResult({ status: "ERROR", message: "Government service is temporarily unavailable." }); }
    finally { setBusy(false); }
  }

  async function confirmLink() {
    setLinking(true);
    try {
      await linkGovernmentRecordWithConsent({
        profile, providerKey: "mca", providerName: "MCA Company Master Data (public dataset)",
        organization: "Ministry of Corporate Affairs", service: "Company Master Data (public dataset)", record: candidate
      });
      await onLinked();
      setCandidate(null);
      setResult(null);
    } finally { setLinking(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-slate-900 text-sm">MCA Company Dataset Match</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Match the project against the public MCA Company Master Data dataset (CIN, status, registered office,
        industrial classification). This is a <b>public government dataset</b> — not an authorized MCA verification.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input value={cin} onChange={(e) => setCin(e.target.value.toUpperCase().slice(0, 30))} placeholder="CIN (exact)"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200" />
        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 120))} placeholder="Company name"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200" />
        <select value={state} onChange={(e) => setState(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 ring-blue-200">
          <option value="">State…</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={run} disabled={busy || (!cin && !name)}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {result && (
        <div className="mt-3 text-sm space-y-2">
          {result.status === "success" && (
            <>
              <div className="text-[11px] text-slate-500">
                {result.total} record(s) · {result.verification_label} · matched by {result.match_method === "PAGE_SCAN" ? "bounded page scan" : "exact field filter"}
              </div>
              {result.match_note && <div className="text-[11px] text-amber-700">{result.match_note}</div>}
              {result.records.length === 0 && <div className="text-xs text-slate-400">No matching company in the dataset for these inputs.</div>}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {result.records.map((rec, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs space-y-0.5">
                      {["CIN", "CompanyName", "CompanyStatus", "CompanyCategory", "CompanyClass", "CompanyStateCode", "Registered_Office_Address", "CompanyIndustrialClassification"].filter((k) => rec[k]).map((k) => (
                        <div key={k}><span className="text-slate-400">{k}:</span> <span className="text-slate-700">{String(rec[k]).slice(0, 90)}</span></div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-2" disabled={!profile} onClick={() => setCandidate(rec)}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Select this company
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
          {(result.status === "PENDING_AUTHORIZATION" || result.status === "ERROR") && (
            <div className={`rounded-xl border p-3 text-xs ${result.status === "PENDING_AUTHORIZATION" ? "bg-orange-50 border-orange-200 text-orange-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
              {result.message}
            </div>
          )}
        </div>
      )}

      {profile?.government_data?.mca && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          Linked MCA record · <b>PUBLIC GOVERNMENT DATASET</b> (not an authorized verification) · linked {new Date(profile.government_data.mca.linked_at).toLocaleDateString()}
        </div>
      )}

      <AlertDialog open={!!candidate} onOpenChange={(o) => !o && setCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Consent to link MCA dataset record</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-xs leading-relaxed">
              Organization: <b>Ministry of Corporate Affairs (data.gov.in)</b><br />
              Government service: <b>Company Master Data (public dataset)</b><br />
              Purpose: <b>Link this dataset match to project "{profile?.name}" for company identity enrichment</b><br />
              Data requested: <b>The selected public dataset record</b><br /><br />
              Stored as a <b>PUBLIC GOVERNMENT DATASET</b> match — not an authorized MCA verification. You can revoke this consent anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-blue-600 hover:bg-blue-700" onClick={confirmLink} disabled={linking}>
              {linking ? "Linking…" : "GRANT CONSENT & LINK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}