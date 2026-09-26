// NIECP-AI Decision Trail
// Every regulatory decision is recorded with the facts, the rule evaluated, the
// result, the evidence and the engine version — so the user can always answer
// WHY / WHAT EVIDENCE / WHICH RULE / WHAT IS MISSING.

import { base44 } from "@/api/base44Client";
import { ENGINE_VERSION, resolveFactor } from "./engine";

export function decisionInputFacts(profile = {}) {
  const factors = {};
  Object.entries(profile.factors || {}).forEach(([k, v]) => {
    factors[k] = resolveFactor(profile.factors, k);
  });
  return {
    industry: profile.industry || null,
    sub_industry: profile.sub_industry || null,
    state: profile.state || null,
    district: profile.district || null,
    city: profile.city || null,
    project_stage: profile.project_stage || null,
    investment: profile.investment || null,
    employees: profile.workforce || profile.employee_count || null,
    factors
  };
}

// Build the trail record for one approval decision (pure — used by the UI and
// by the recorder).
export function buildDecision(profile, approval) {
  return {
    profile_id: profile.id,
    approval_key: approval.approval_key,
    approval_name: approval.approval_name,
    rule: approval.evaluated_rule,
    result: approval.outcome || "REQUIRES_VERIFICATION",
    status: approval.status,
    triggering_facts: approval.triggered_factors || [],
    missing_facts: approval.missing_facts || [],
    evaluated_conditions: approval.evaluated_conditions || [],
    input_facts: decisionInputFacts(profile),
    evidence: approval.reason,
    legal_basis: approval.legal_basis,
    source_url: approval.source_url,
    rule_version: approval.rule_version,
    engine_version: approval.engine_version || ENGINE_VERSION,
    evaluated_at: approval.evaluated_at || new Date().toISOString(),
    provenance: "USER_PROVIDED"
  };
}

export async function recordDecision(profile, approval) {
  return base44.entities.DecisionTrail.create(buildDecision(profile, approval));
}

export async function listDecisions(profileId) {
  return base44.entities.DecisionTrail.filter({ profile_id: profileId }, "-created_date", 50);
}