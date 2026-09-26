// NIECP-AI Regulatory Factor Analysis
// PROJECT FACTOR -> DETECTED VALUE -> STATUS -> REGULATORY IMPACT.
// Every value comes from the stored project (BusinessProfile) and every impact
// comes from the deterministic rule pack — nothing is guessed.

import { FACTORS, getRelevantFactors } from "./catalogs";
import { resolveFactor } from "./engine";
import { approvalsForFactor } from "./mappings";

// Factor states required by the analysis view.
export const FACTOR_STATUS = {
  ACTIVE: { label: "Active", className: "bg-teal-100 text-teal-700" },
  INACTIVE: { label: "Inactive", className: "bg-slate-100 text-slate-500" },
  NEEDS_CONFIRMATION: { label: "Needs confirmation", className: "bg-amber-100 text-amber-700" },
  INFORMATION_REQUIRED: { label: "Information required", className: "bg-rose-50 text-rose-600 border border-rose-200" }
};

// Concrete project measurements that give a factor a real detected value.
const MEASURED = {
  water_use: { field: "water_requirement", label: "Water requirement" },
  water_discharge: { field: "water_requirement", label: "Water requirement" },
  air_emissions: { field: "power_requirement", label: "Power requirement" },
  dg_set: { field: "power_requirement", label: "Power requirement" },
  electrical_safety: { field: "power_requirement", label: "Power requirement" },
  labour_compliance: { field: "workforce", label: "Workforce", suffix: " workers" }
};

export function factorStatus(profile, key) {
  const state = resolveFactor(profile?.factors || {}, key);
  if (state === "YES") return "ACTIVE";
  if (state === "NO") return "INACTIVE";
  if (state === "REVIEW_REQUIRED") return "NEEDS_CONFIRMATION";
  return "INFORMATION_REQUIRED";
}

// Regulatory impact — built from the rule pack, never invented.
export function factorImpact(factorKey) {
  const approvals = approvalsForFactor(factorKey);
  if (!approvals.length) {
    return {
      text: FACTORS[factorKey]?.why || "No requirement in the current rule pack is triggered by this factor.",
      approvals: []
    };
  }
  return {
    text: `May trigger: ${approvals.map((a) => a.name).join(", ")}.`,
    approvals
  };
}

export function computeFactorAnalysis(profile = {}) {
  const relevant = getRelevantFactors(profile.industry, profile.infrastructure || {}, profile);
  const answered = Object.keys(profile.factors || {});
  const keys = Array.from(new Set([...relevant, ...answered]));

  const items = keys.map((key) => {
    const status = factorStatus(profile, key);
    const impact = factorImpact(key);
    const measured = MEASURED[key] ? profile[MEASURED[key].field] : null;
    const answer = status === "ACTIVE" ? "Yes" : status === "INACTIVE" ? "No" : status === "NEEDS_CONFIRMATION" ? "Not sure" : null;
    return {
      key,
      name: FACTORS[key]?.name || key,
      explanation: FACTORS[key]?.explanation,
      detected_value: measured ? `${measured}${MEASURED[key].suffix || ""}` : answer || "Not provided",
      measured_field: measured ? MEASURED[key].label : null,
      status,
      impact: impact.text,
      triggered_approvals: impact.approvals
    };
  });

  const counts = { ACTIVE: 0, INACTIVE: 0, NEEDS_CONFIRMATION: 0, INFORMATION_REQUIRED: 0 };
  items.forEach((i) => { counts[i.status] += 1; });

  return {
    items,
    counts,
    total: items.length,
    impacting: items.filter((i) => i.triggered_approvals.length > 0).length
  };
}