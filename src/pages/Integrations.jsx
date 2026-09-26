import React, { useEffect, useState } from "react";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import {
  getIntegrationStatus, testIntegration, pincodeLookup, udyamSearch,
  applyPincodeToProfile, linkGovernmentRecordWithConsent
} from "@/lib/niecp/government/apiGateway";
import McaEnrichment from "@/components/integrations/McaEnrichment";
import EnvironmentalContext from "@/components/integrations/EnvironmentalContext";
import { Landmark, ExternalLink, Loader2, Info, MapPin, Building2, Search, ShieldCheck, FlaskConical } from "lucide-react";

const MODE_STYLES = {
  LIVE: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  PENDING_VERIFICATION: "bg-blue-50 text-blue-700 border border-blue-200",
  PENDING_AUTHORIZATION: "bg-orange-100 text-orange-800 border border-orange-200",
  OFFICIAL_REDIRECT: "bg-blue-100 text-blue-800 border border-blue-200",
  NOT_AVAILABLE: "bg-slate-100 text-slate-600 border border-slate-200"
};

const DATA_GOV_STATES = [
  "ANDAMAN AND NICOBAR ISLANDS", "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR", "CHANDIGARH",
  "CHHATTISGARH", "DELHI", "GOA", "GUJARAT", "HARYANA", "HIMACHAL PRADESH", "JAMMU AND KASHMIR",
  "JHARKHAND", "KARNATAKA", "KERALA", "LADAKH", "LAKSHADWEEP", "MADHYA PRADESH", "MAHARASHTRA",
  "MANIPUR", "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA", "PUDUCHERRY", "PUNJAB", "RAJASTHAN",
  "SIKKIM", "TAMIL NADU", "TELANGANA", "THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU", "TRIPURA",
  "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL"
];

function ProviderCard({ provider, onTest, testResult, testing }) {
  const mode = MODE_STYLES[provider.integration_mode] || MODE_STYLES.NOT_AVAILABLE;
  const result = testResult?.[provider.key];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900">{provider.provider}</div>
            <div className="text-[11px] text-slate-500">{provider.organization}</div>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${mode}`}>
          {provider.integration_mode.replace(/_/g, " ")}
        </span>
      </div>
      <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
        <div>Purpose: {provider.purpose}</div>
        <div>Authorization: <b>{provider.authorization_status.replace(/_/g, " ")}</b></div>
        <div>Operations: <b>{provider.supported_operations.length ? provider.supported_operations.join(", ") : "none"}</b></div>
        <div>Last verified: <b>{provider.last_verified || "never (no real call yet)"}</b></div>
        <div>Fallback mode: <b>{provider.fallback_mode}</b></div>
        {provider.endpoint && <div className="truncate">Endpoint: <b>{provider.endpoint.split("?")[0]}</b></div>}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <Button size="sm" variant="outline" onClick={() => onTest(provider.key)} disabled={testing === provider.key}>
          {testing === provider.key ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5 mr-1" />}
          Test connection
        </Button>
        <a href={provider.docs_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <ExternalLink className="w-3 h-3" /> Official documentation
        </a>
      </div>
      {result && (
        <div className={`text-[11px] mt-2 rounded-lg px-2.5 py-1.5 ${result.status === "success" || result.status === "PENDING_AUTHORIZATION" ? "bg-slate-50 border border-slate-200 text-slate-600" : "bg-rose-50 border border-rose-200 text-rose-700"}`}>
          {result.message || (result.status === "success" ? `LIVE — verified at ${new Date(result.verified_at).toLocaleString()}` : "See card status.")}
        </div>
      )}
    </div>
  );
}

export default function Integrations() {
  const { selected, loading, reload } = useProjectData();
  const [providers, setProviders] = useState(null);
  const [testing, setTesting] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [pincode, setPincode] = useState("");
  const [pincodeBusy, setPincodeBusy] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [udyamEnterprise, setUdyamEnterprise] = useState("");
  const [udyamState, setUdyamState] = useState("");
  const [udyamDistrict, setUdyamDistrict] = useState("");
  const [udyamBusy, setUdyamBusy] = useState(false);
  const [udyamResult, setUdyamResult] = useState(null);
  const [consentCandidate, setConsentCandidate] = useState(null);
  const [linkBusy, setLinkBusy] = useState(false);

  useEffect(() => {
    getIntegrationStatus().then((res) => setProviders(res.providers || null)).catch(() => setProviders([]));
  }, []);

  async function onTest(key) {
    setTesting(key);
    try {
      const res = await testIntegration(key);
      setTestResults((r) => ({ ...r, [key]: res }));
      const refreshed = await getIntegrationStatus();
      setProviders(refreshed.providers || null);
    } catch (e) {
      setTestResults((r) => ({ ...r, [key]: { status: "ERROR", message: "Government service is temporarily unavailable." } }));
    } finally {
      setTesting(null);
    }
  }

  async function runPincodeLookup() {
    if (!/^\d{6}$/.test(pincode)) { setPincodeResult({ status: "ERROR", message: "Enter a valid 6-digit pincode." }); return; }
    setPincodeBusy(true);
    setPincodeResult(null);
    try { setPincodeResult(await pincodeLookup(pincode)); }
    catch (e) { setPincodeResult({ status: "ERROR", message: "Government service is temporarily unavailable." }); }
    finally { setPincodeBusy(false); }
  }

  async function runUdyamSearch() {
    setUdyamBusy(true);
    setUdyamResult(null);
    try { setUdyamResult(await udyamSearch({ state: udyamState, district: udyamDistrict, enterprise_name: udyamEnterprise })); }
    catch (e) { setUdyamResult({ status: "ERROR", message: "Government service is temporarily unavailable." }); }
    finally { setUdyamBusy(false); }
  }

  async function applyLocation() {
    setPincodeBusy(true);
    try {
      await applyPincodeToProfile(selected, {
        pincode, state: pincodeResult.state, district: pincodeResult.district
      });
      await reload();
      setPincodeResult({ ...pincodeResult, applied: true });
    } finally { setPincodeBusy(false); }
  }

  async function confirmLink() {
    setLinkBusy(true);
    try {
      await linkGovernmentRecordWithConsent({
        profile: selected,
        providerKey: "udyam",
        providerName: "UDYAM — MSME Registered Units dataset",
        organization: "Ministry of Micro, Small and Medium Enterprises",
        service: "List of MSME Registered Units under UDYAM (data.gov.in)",
        record: consentCandidate
      });
      await reload();
      setConsentCandidate(null);
      setUdyamResult(null);
    } finally { setLinkBusy(false); }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Government Integrations</h1>
        <p className="text-sm text-slate-500">
          Secure, provider-agnostic government data connections. A provider is LIVE only after a real successful authenticated
          response — anything else is truthfully labelled PENDING, REDIRECT or MANUAL. Credentials stay on the server.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          Dataset matches are <b>GOVERNMENT_DATASET_MATCH</b> — they are not registration verifications. DigiLocker document
          retrieval activates only after official partner authorization; until then use the official portal redirect.
        </div>
      </div>

      {/* Provider status cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Integration status</h2>
        {!providers ? (
          <div className="text-sm text-slate-400 py-6 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading integration status…</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {providers.map((p) => (
              <ProviderCard key={p.key} provider={p} onTest={onTest} testResult={testResults} testing={testing} />
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pincode lookup */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Pincode / Location Lookup</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">Official India Post pincode directory (data.gov.in). Enriches your project location for regulatory analysis.</p>
          <div className="flex gap-2">
            <input
              value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && runPincodeLookup()}
              placeholder="6-digit pincode"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200"
            />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={runPincodeLookup} disabled={pincodeBusy || pincode.length !== 6}>
              {pincodeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Lookup
            </Button>
          </div>
          {pincodeResult && (
            <div className="mt-3 text-sm space-y-2">
              {pincodeResult.status === "success" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-1">
                  <div className="text-emerald-900 font-medium">{pincodeResult.state} · {pincodeResult.district}</div>
                  <div className="text-[11px] text-emerald-700">{pincodeResult.total} post office record(s) · Source: {pincodeResult.source.portal} — {pincodeResult.source.organization}</div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={applyLocation} disabled={!selected || pincodeBusy || pincodeResult.applied}>
                    {pincodeResult.applied ? "Applied to project" : "Apply to project location"}
                  </Button>
                </div>
              )}
              {(pincodeResult.status === "PENDING_AUTHORIZATION" || pincodeResult.status === "ERROR") && (
                <div className={`rounded-xl border p-3 text-xs ${pincodeResult.status === "PENDING_AUTHORIZATION" ? "bg-orange-50 border-orange-200 text-orange-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                  {pincodeResult.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* UDYAM dataset search */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm">MSME / UDYAM Dataset Search</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Search MSME registered units in the official data.gov.in dataset, then link the matching record to {selected ? <b>{selected.name}</b> : "your project"}.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={udyamEnterprise} onChange={(e) => setUdyamEnterprise(e.target.value.slice(0, 120))}
              onKeyDown={(e) => e.key === "Enter" && runUdyamSearch()}
              placeholder="Enterprise name"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200" />
            <select value={udyamState} onChange={(e) => setUdyamState(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200 bg-white">
              <option value="">Select state…</option>
              {DATA_GOV_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={udyamDistrict} onChange={(e) => setUdyamDistrict(e.target.value.slice(0, 80))}
              placeholder="District (optional)"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200" />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={runUdyamSearch} disabled={udyamBusy || (!udyamState && !udyamDistrict && !udyamEnterprise)}>
              {udyamBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          {udyamResult && (
            <div className="mt-3 text-sm space-y-2">
              {udyamResult.status === "success" && (
                <>
                  <div className="text-[11px] text-slate-500">
                    {udyamResult.total} record(s) · {udyamResult.verification_label || `Government dataset match · ${udyamResult.provenance?.source}`} ·{" "}
                    matched by {udyamResult.match_method === "PAGE_SCAN" ? "bounded page scan" : "exact field filter"}
                  </div>
                  {udyamResult.match_note && <div className="text-[11px] text-amber-700">{udyamResult.match_note}</div>}
                  <div className="text-[11px] text-slate-400">{udyamResult.disclaimer}</div>
                  {udyamResult.records.length === 0 && <div className="text-xs text-slate-400">No matching records in the dataset.</div>}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {udyamResult.records.map((rec, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 p-3 hover:border-blue-300 transition">
                        <div className="text-xs space-y-0.5">
                          {Object.entries(rec).slice(0, 5).map(([k, v]) => (
                            <div key={k}><span className="text-slate-400">{k}:</span> <span className="text-slate-700">{String(v).slice(0, 60)}</span></div>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="mt-2" disabled={!selected} onClick={() => setConsentCandidate(rec)}>
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Select this record
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {(udyamResult.status === "PENDING_AUTHORIZATION" || udyamResult.status === "ERROR") && (
                <div className={`rounded-xl border p-3 text-xs ${udyamResult.status === "PENDING_AUTHORIZATION" ? "bg-orange-50 border-orange-200 text-orange-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                  {udyamResult.message}
                </div>
              )}
            </div>
          )}
          {selected?.government_data?.udyam && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              Linked UDYAM dataset record · <b>GOVERNMENT_DATASET_MATCH</b> (not a registration verification) · linked {new Date(selected.government_data.udyam.linked_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* MCA company dataset match + environmental context */}
      <div className="grid lg:grid-cols-2 gap-4">
        <McaEnrichment profile={selected} onLinked={reload} />
        <EnvironmentalContext profile={selected} />
      </div>

      {/* Consent dialog before linking government data */}
      <AlertDialog open={!!consentCandidate} onOpenChange={(o) => !o && setConsentCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Consent to link government dataset record</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-xs leading-relaxed">
              Organization: <b>Ministry of Micro, Small and Medium Enterprises (data.gov.in)</b><br />
              Government service: <b>List of MSME Registered Units under UDYAM</b><br />
              Purpose: <b>Link this dataset match to project "{selected?.name}" for regulatory profile enrichment</b><br />
              Data requested: <b>The selected public dataset record</b><br />
              Timestamp: <b>{new Date().toLocaleString()}</b><br /><br />
              This is stored as a <b>GOVERNMENT_DATASET_MATCH</b> — it is not a UDYAM registration verification. You can revoke this consent anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-blue-600 hover:bg-blue-700" onClick={confirmLink} disabled={linkBusy}>
              {linkBusy ? "Linking…" : "GRANT CONSENT & LINK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}