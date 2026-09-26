import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cpcbAirQuery, surfaceWaterQuery } from "@/lib/niecp/government/apiGateway";
import { Wind, Droplets, Loader2, Info } from "lucide-react";

function Result({ result, nature, note }) {
  if (!result) return null;
  if (result.status !== "success") {
    return (
      <div className={`rounded-xl border p-3 text-xs ${result.status === "PENDING_AUTHORIZATION" ? "bg-orange-50 border-orange-200 text-orange-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
        {result.message}
      </div>
    );
  }
  const records = (result.records || []).slice(0, 6);
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold uppercase text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">{nature}</div>
      <div className="text-[11px] text-slate-500">{result.total} observation(s) · Source: {result.provenance?.source} — {result.provenance?.organization}</div>
      {records.length === 0 && <div className="text-xs text-slate-400">No observations returned for these inputs.</div>}
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
        {records.map((rec, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-2.5 text-[11px] space-y-0.5">
            {Object.entries(rec).slice(0, 8).map(([k, v]) => (
              <div key={k}><span className="text-slate-400">{k}:</span> <span className="text-slate-700">{String(v).slice(0, 60)}</span></div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-[11px] text-slate-500 border-l-2 border-amber-300 pl-2">{note || result.note}</div>
    </div>
  );
}

export default function EnvironmentalContext({ profile }) {
  const [state, setState] = useState(profile?.state || "");
  const [city, setCity] = useState(profile?.city || "");
  const [district, setDistrict] = useState(profile?.district || "");
  const [air, setAir] = useState(null);
  const [water, setWater] = useState(null);
  const [busy, setBusy] = useState(null);

  async function loadAir() {
    setBusy("air");
    try { setAir(await cpcbAirQuery({ state, city })); }
    catch (e) { setAir({ status: "ERROR", message: "Government service is temporarily unavailable." }); }
    finally { setBusy(null); }
  }

  async function loadWater() {
    setBusy("water");
    try { setWater(await surfaceWaterQuery({ state, district })); }
    catch (e) { setWater({ status: "ERROR", message: "Government service is temporarily unavailable." }); }
    finally { setBusy(null); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Wind className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-slate-900 text-sm">Environmental Context</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        CPCB air-quality and surface-water observations for the project location. This is <b>context only</b> — it never
        decides whether an environmental approval applies.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input value={state} onChange={(e) => setState(e.target.value.slice(0, 80))} placeholder="State"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200" />
        <input value={city} onChange={(e) => setCity(e.target.value.slice(0, 80))} placeholder="City"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200" />
        <input value={district} onChange={(e) => setDistrict(e.target.value.slice(0, 80))} placeholder="District"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-200" />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={loadAir} disabled={busy === "air" || (!state && !city)}>
          {busy === "air" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wind className="w-3.5 h-3.5 mr-1" />} Air quality context
        </Button>
        <Button size="sm" variant="outline" onClick={loadWater} disabled={busy === "water" || (!state && !district)}>
          {busy === "water" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Droplets className="w-3.5 h-3.5 mr-1" />} Surface water context
        </Button>
      </div>

      <div className="mt-3 space-y-4">
        <Result result={air} nature="CONTEXTUAL ENVIRONMENTAL DATA" />
        <Result result={water} nature="HISTORICAL ENVIRONMENTAL DATA"
          note="Historical observations — not current water quality. Context only; the deterministic rule engine decides applicability." />
      </div>

      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-3 flex gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        No environmental approval is ever derived from this data. Approvals come from the deterministic rule engine.
      </div>
    </div>
  );
}