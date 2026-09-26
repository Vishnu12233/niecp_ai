import React from "react";
import { FACTORS } from "@/lib/niecp/catalogs";
import { outcomeLabel } from "@/lib/niecp/engine";
import { ArrowDown } from "lucide-react";

// "Why is this required?" — the compact deterministic chain:
// PROJECT FACTOR -> RULE CONDITION -> APPROVAL TRIGGER -> APPROVAL.
// It explicitly separates the deterministic rule result, the AI explanation and
// the source/reference, so the AI can never appear to decide applicability.
export default function WhyRequired({ approval }) {
  const facts = approval.triggered_factors || [];
  const missing = approval.missing_facts || [];
  const factorText = facts.length
    ? facts.map((fk) => `${FACTORS[fk]?.name || fk} = Yes`).join("  ·  ")
    : "No confirmed factor yet";
  const outcome = outcomeLabel(approval);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Why is this required?</div>
      <div className="space-y-1.5">
        <Step label="Project factor" value={factorText} tag="User-provided" tagClass="bg-slate-50 text-slate-600 border-slate-200" />
        <Arrow />
        <Step label="Rule condition" value={approval.evaluated_rule} tag="Deterministic rule" tagClass="bg-teal-50 text-teal-700 border-teal-200" />
        <Arrow />
        <Step
          label="Result"
          value={outcome.replace(/_/g, " ")}
          tag="Deterministic rule result"
          tagClass="bg-teal-50 text-teal-700 border-teal-200"
        />
        <Arrow />
        <Step label="Approval" value={`${approval.approval_name} · ${approval.authority}`} tag={`Rule ${approval.rule_id}`} tagClass="bg-blue-50 text-blue-700 border-blue-200" />
      </div>

      {missing.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mt-2">
          Information required: <b>{missing.map((k) => FACTORS[k]?.name || k).join(", ")}</b> — no applicability decision can be made until this is confirmed.
        </div>
      )}

      <div className="text-xs text-slate-600 mt-2">
        <span className="text-[9px] uppercase font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 mr-1.5">AI explanation</span>
        {approval.description}
      </div>

      <div className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
        <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 mr-1.5">Source</span>
        {approval.legal_basis}{" "}
        <a href={approval.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Official reference</a>
        {" "}· verified {approval.last_verified} · {(approval.legal_basis_verification || "REQUIRES_VERIFICATION").replace(/_/g, " ").toLowerCase()}
      </div>

      <div className="text-[10px] text-slate-400 mt-2">
        The rule engine decides applicability. The AI assistant explains this result and cannot change it.
      </div>
    </div>
  );
}

function Step({ label, value, tag, tagClass }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase font-semibold text-slate-400">{label}</span>
        {tag && <span className={`text-[9px] font-semibold border rounded px-1.5 py-0.5 ${tagClass}`}>{tag}</span>}
      </div>
      <div className="text-xs text-slate-700 mt-0.5">{value}</div>
    </div>
  );
}

function Arrow() {
  return <div className="flex justify-center"><ArrowDown className="w-3 h-3 text-slate-300" /></div>;
}