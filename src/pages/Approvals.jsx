import React, { useState } from "react";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { StatusChip } from "./Dashboard";
import { FACTORS, INDUSTRIES } from "@/lib/niecp/catalogs";
import DataModeBadge from "@/components/niecp/DataModeBadge";
import ApprovalSummary from "@/components/approvals/ApprovalSummary";
import WhyRequired from "@/components/approvals/WhyRequired";
import DecisionTrailPanel from "@/components/approvals/DecisionTrailPanel";
import { recordDecision } from "@/lib/niecp/decisionTrail";
import { READINESS_STATUS, LIFECYCLE } from "@/lib/niecp/readiness";
import { ExternalLink, HelpCircle, ShieldCheck, Loader2, ArrowRight, Save } from "lucide-react";

export default function Approvals() {
  const { selected, loading, approvals, documents, approvalNodes, reload, refreshProfile } = useProjectData();
  const [open, setOpen] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [savingTrail, setSavingTrail] = useState(null);
  const [savedTrail, setSavedTrail] = useState([]);
  const [trailKey, setTrailKey] = useState(0);

  async function saveTrail(a) {
    setSavingTrail(a.approval_key);
    try {
      await recordDecision(selected, a);
      setSavedTrail((s) => [...s, a.approval_key]);
      setTrailKey((k) => k + 1);
    } finally { setSavingTrail(null); }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading approvals…</div>;
  if (!selected) return <Empty msg="Select or create a business profile to see applicable approvals." />;

  async function overrideFactor(factorKey, value) {
    setUpdating(true);
    try {
      const factors = { ...(selected.factors || {}) };
      factors[factorKey] = { ...(factors[factorKey] || {}), user_value: value };
      await base44.entities.BusinessProfile.update(selected.id, { factors });
      await refreshProfile();
      await reload();
      await base44.entities.AuditLog.create({ profile_id: selected.id, action: "factor_override", detail: `${factorKey}=${value}`, category: "assessment" });
    } finally { setUpdating(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approval Analysis</h1>
        <p className="text-sm text-slate-500">Potentially applicable approvals for {selected.name}, with reasons, dependencies and evidence.</p>
        <div className="mt-2"><DataModeBadge /></div>
      </div>

      <ApprovalSummary approvals={approvals} nodes={approvalNodes} />

      {approvals.length === 0 && <Empty msg="No approvals identified yet. Complete the regulatory assessment in onboarding." />}

      <div className="space-y-3">
        {approvals.map((a) => (
          <div key={a.approval_key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{a.approval_name}</h3>
                    <div className="text-xs text-slate-500">{a.authority} · {a.category} · {a.stage}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.on_critical_path && <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Critical Path</span>}
                  {approvalConfidence(selected, a)?.needsVerification ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-500">Confidence: Requires Verification</span>
                  ) : approvalConfidence(selected, a) ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-blue-50 text-blue-700">AI Confidence: {approvalConfidence(selected, a).avg}%</span>
                  ) : null}
                  <StatusChip status={a.status} />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${(LIFECYCLE[a.application_lifecycle] || LIFECYCLE.NOT_STARTED).className}`}>
                    {(LIFECYCLE[a.application_lifecycle] || LIFECYCLE.NOT_STARTED).label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${(READINESS_STATUS[a.readiness_status] || READINESS_STATUS.REQUIRES_VERIFICATION).className}`}>
                    {(READINESS_STATUS[a.readiness_status] || READINESS_STATUS.REQUIRES_VERIFICATION).label}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-600">{a.description}</div>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">{a.reason}</div>
              {a.blocked_reason && (
                <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{a.blocked_reason}</div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                <span>Documents: <b className="text-slate-700">{a.readiness_detail?.complete || 0}/{a.readiness_detail?.total || 0}</b></span>
                <span>Readiness: <b className="text-slate-700">{a.readiness}%</b></span>
                {a.dependencies?.length > 0 && <span>Depends on: <b className="text-slate-700">{a.dependencies.join(", ")}</b></span>}
                <span>Verified: {a.last_verified}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setOpen(open === a.approval_key ? null : a.approval_key)}>
                  <HelpCircle className="w-3.5 h-3.5 mr-1" /> Why do I need this?
                </Button>
                <a href={a.source_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Official Portal</Button>
                </a>
                <span className="text-[10px] text-slate-400 ml-auto">Rule version {a.rule_version}</span>
              </div>
            </div>

            {open === a.approval_key && (
              <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-4">
                <WhyRequired approval={a} />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Triggered Factors</div>
                  <div className="space-y-2">
                    {a.triggered_factors.map((fk) => {
                      const f = FACTORS[fk];
                      const cur = selected.factors?.[fk];
                      const final = cur?.user_value && cur.user_value !== "NOT_SURE" ? cur.user_value : cur?.ai_value;
                      return (
                        <div key={fk} className="bg-white border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-800">{f?.name || fk}</div>
                            <span className="text-xs text-slate-500">Current: <b>{final || "—"}</b>{cur?.confidence ? ` · ${cur.confidence}% match` : ""}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{f?.why}</div>
                          <div className="flex items-center gap-2 mt-2">
                            {["YES", "NO", "NOT_SURE"].map((opt) => (
                              <button key={opt} disabled={updating} onClick={() => overrideFactor(fk, opt)}
                                className={`px-2.5 py-1 rounded text-xs font-medium border ${final === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                                {opt === "NOT_SURE" ? "NOT SURE" : opt}
                              </button>
                            ))}
                            {updating && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Triggered by Your Project Inputs</div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {projectInputs(selected).map((inp) => (
                      <div key={inp.label} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <div className="text-[9px] uppercase text-slate-400 font-semibold">{inp.label}</div>
                        <div className="text-xs text-slate-700 font-medium truncate">{inp.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Required Documents</div>
                  <div className="space-y-1">
                    {a.required_document_keys.map((dk) => {
                      const doc = documents.find((d) => d.requirement_key === dk);
                      return (
                        <div key={dk} className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded px-3 py-2">
                          <span className="text-slate-700">{doc?.document_name || dk}</span>
                          <StatusChip status={doc?.status || "MISSING"} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Evidence & Source</div>
                    <span className="text-[9px] uppercase font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">Regulatory Evidence</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><b>Official authority:</b> {a.authority}</div>
                    <div><b>Source:</b> <a href={a.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{a.source_url}</a></div>
                    <div><b>Regulatory condition:</b> {a.reason}</div>
                    <div className="sm:col-span-2">
                      <b>Legal basis (indicative):</b> {a.legal_basis}{" "}
                      <span className="text-amber-700">— {(a.legal_basis_verification || "REQUIRES_VERIFICATION").replace(/_/g, " ").toLowerCase()}.</span>
                    </div>
                    <div><b>Last verified:</b> {a.last_verified}</div>
                    <div><b>Rule pack version:</b> {a.rule_version}</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Decision Trail</div>
                    <span className="text-[9px] uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                      Result: {(a.outcome || "REQUIRES_VERIFICATION").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div><b>Rule ID:</b> {a.rule_id}</div>
                    <div><b>Rule evaluated:</b> {a.evaluated_rule}</div>
                    <div><b>Evaluated conditions:</b> {a.evaluated_conditions?.length ? a.evaluated_conditions.join(" · ") : "None — information required"}</div>
                    <div><b>Missing information:</b> {a.missing_facts?.length ? a.missing_facts.map((fk) => FACTORS[fk]?.name || fk).join(", ") : "None"}</div>
                    <div><b>Evidence:</b> {a.reason}</div>
                    <div className="text-slate-400">Engine {a.engine_version} · rule pack {a.rule_version} · evaluated {a.evaluated_at ? new Date(a.evaluated_at).toLocaleString() : "—"}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Button size="sm" variant="outline" disabled={savingTrail === a.approval_key || savedTrail.includes(a.approval_key)} onClick={() => saveTrail(a)}>
                      {savingTrail === a.approval_key ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                      {savedTrail.includes(a.approval_key) ? "Saved to decision trail" : "Save to decision trail"}
                    </Button>
                    <span className="text-[11px] text-slate-400">Saved decisions are the permanent record of why this requirement was identified.</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[9px] uppercase font-semibold">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">AI Interpretation</span>
                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">Regulatory Evidence</span>
                  <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">User-Provided</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Requires Human Confirmation</span>
                </div>
                <div className="text-[11px] text-slate-500 border-l-2 border-amber-300 pl-2">
                  AI Recommendation — Verify with the concerned authority before submission.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <DecisionTrailPanel profileId={selected.id} refreshKey={trailKey} />
    </div>
  );
}

// Approval-level confidence — only shown when calculated from actual matched
// regulatory factors; otherwise shown as "Requires Verification".
function approvalConfidence(profile, a) {
  const factors = profile?.factors || {};
  const confs = (a.triggered_factors || []).map((fk) => factors[fk]?.confidence).filter((c) => typeof c === "number");
  if (!confs.length) return null;
  const needsVerification = a.status === "POTENTIALLY_APPLICABLE" || a.status === "REVIEW_REQUIRED";
  return {
    needsVerification,
    count: confs.length,
    avg: Math.round(confs.reduce((s, c) => s + c, 0) / confs.length)
  };
}

// Which concrete project inputs triggered the requirement
function projectInputs(profile) {
  const industryName = INDUSTRIES.find((i) => i.key === profile?.industry)?.name || profile?.industry;
  const list = [
    { label: "Industry", value: industryName },
    { label: "Activity", value: profile?.primary_activity },
    { label: "Location", value: [profile?.city, profile?.state].filter(Boolean).join(", ") },
    { label: "Capacity", value: profile?.production_capacity },
    { label: "Investment", value: profile?.investment ? `₹${(profile.investment / 10000000).toFixed(1)} Cr` : null },
    { label: "Workforce", value: profile?.workforce ? `${profile.workforce} employees` : null }
  ];
  return list.filter((x) => x.value);
}

function Empty({ msg }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">{msg}</div>;
}