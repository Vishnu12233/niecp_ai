import React, { useState } from "react";
import { useProjectData } from "@/lib/niecp/useProjectData";
import FactorCard from "@/components/factors/FactorCard";
import { Info, SlidersHorizontal } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All factors" },
  { key: "ACTIVE", label: "Active" },
  { key: "NEEDS_CONFIRMATION", label: "Needs confirmation" },
  { key: "INFORMATION_REQUIRED", label: "Information required" },
  { key: "INACTIVE", label: "Inactive" }
];

export default function RegulatoryFactors() {
  const { selected, loading, factorAnalysis } = useProjectData();
  const [filter, setFilter] = useState("all");

  if (loading) return <div className="py-20 text-center text-slate-400">Loading regulatory factors…</div>;
  if (!selected) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
        No regulatory decision can be made yet. Select or create a project and add its location and manufacturing details.
      </div>
    );
  }

  const { items, counts, total, impacting } = factorAnalysis;
  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Regulatory Factor Analysis
        </h1>
        <p className="text-sm text-slate-500">
          Every project factor for {selected.name}, its detected value, its status and the regulatory impact taken from the rule pack.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          Factors only <b>indicate</b> which requirements may apply. Applicability is decided by the deterministic rule engine, never by the AI.
          Factors that cannot be decided are shown as <b>Needs confirmation</b> or <b>Information required</b> instead of being guessed.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Count label="Active" value={counts.ACTIVE} className="text-teal-600" />
            <Count label="Needs confirmation" value={counts.NEEDS_CONFIRMATION} className="text-amber-600" />
            <Count label="Information required" value={counts.INFORMATION_REQUIRED} className="text-rose-600" />
            <Count label="Inactive" value={counts.INACTIVE} className="text-slate-500" />
          </div>
          <div className="text-xs text-slate-500 text-right">
            <div><b>{total}</b> factors assessed for this sector</div>
            <div><b>{impacting}</b> can trigger a regulatory requirement</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((f) => <FactorCard key={f.key} factor={f} />)}
      </div>
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          No factors match this filter.
        </div>
      )}
    </div>
  );
}

function Count({ label, value, className }) {
  return (
    <div>
      <div className={`text-xl font-bold ${className}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}