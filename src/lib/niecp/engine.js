// NIECP-AI Deterministic Intelligence Engine
// Rules + verified data + AI. All regulatory decisions are rule-driven; AI explains.

import { APPROVALS, DOCUMENTS, RULE_VERSION, LAST_VERIFIED } from "./approvals";
import { FACTORS } from "./catalogs";
import { LEGAL_BASIS } from "./legalBasis";

export const ENGINE_VERSION = "niecp-engine-v2.0";

// Resolve a factor's final value from AI suggestion + user override
export function resolveFactor(factors, key) {
  if (!factors || !factors[key]) return "NOT_INDICATED";
  const f = factors[key];
  if (f.user_value && f.user_value !== "NOT_SURE") return f.user_value;
  if (f.ai_value && f.ai_value !== "NOT_SURE") return f.ai_value;
  if (f.user_value === "NOT_SURE" || f.ai_value === "NOT_SURE") return "REVIEW_REQUIRED";
  return "NOT_INDICATED";
}

export function factorIsYes(factors, key) {
  return resolveFactor(factors, key) === "YES";
}

// Outcome vocabulary — the only values the rule engine may return. The rule
// engine (never the AI assistant) decides which of these applies.
export const OUTCOMES = ["APPLIES", "CONDITIONAL", "NOT_APPLICABLE", "INFORMATION_REQUIRED", "REQUIRES_VERIFICATION"];

const OUTCOME_BY_STATUS = {
  LIKELY_APPLICABLE: "APPLIES",
  POTENTIALLY_APPLICABLE: "CONDITIONAL",
  REVIEW_REQUIRED: "INFORMATION_REQUIRED"
};

// Human-readable outcome for a computed approval (rule engine result only).
export function outcomeLabel(approval) {
  if (!approval) return "REQUIRES_VERIFICATION";
  return approval.outcome || OUTCOME_BY_STATUS[approval.status] || "REQUIRES_VERIFICATION";
}

// Build one fully explainable decision result: result, triggering facts, rule
// evaluated, missing facts, legal basis, source, verification state, timestamp.
function buildResult(key, ap, { triggered, missing, status }) {
  const lb = LEGAL_BASIS[key] || null;
  const nameOf = (fk) => FACTORS[fk]?.name || fk;
  const reason = triggered.length
    ? `Triggered because: ${triggered.map((tf) => `${nameOf(tf)} = YES`).join(", ")}.`
    : `Not enough confirmed information: ${missing.map(nameOf).join(", ")} must be confirmed before applicability can be decided.`;

  return {
    rule_id: `NIE-CP-${key.toUpperCase()}`,
    approval_key: key,
    approval_name: ap.name,
    authority: ap.authority,
    category: ap.category,
    stage: ap.stage,
    status,
    outcome: OUTCOME_BY_STATUS[status] || "REQUIRES_VERIFICATION",
    triggered_factors: triggered,
    missing_facts: missing,
    evaluated_conditions: triggered.map((tf) => `${nameOf(tf)} = YES`),
    evaluated_rule: `${ap.name} applies when any of: ${ap.triggerFactors.map(nameOf).join(" OR ")}.`,
    reason,
    legal_basis: lb?.legal_basis || "Not captured in the rule pack — requires verification.",
    legal_basis_verification: lb?.verification_status || "REQUIRES_VERIFICATION",
    required_document_keys: ap.documents,
    dependencies: ap.dependencies,
    source_url: ap.sourceUrl,
    source_provenance: "VERIFIED_GOV_SOURCE",
    verification_status: "REQUIRES_VERIFICATION",
    last_verified: LAST_VERIFIED,
    rule_version: RULE_VERSION,
    engine_version: ENGINE_VERSION,
    evaluated_at: new Date().toISOString(),
    description: ap.description,
    conditional: !!ap.conditional
  };
}

// Determine applicable approvals for a profile. Deterministic — an LLM never
// decides applicability, and uncertainty is surfaced rather than hidden.
export function computeApprovals(profile) {
  const factors = profile.factors || {};
  const infra = profile.infrastructure || {};
  const results = [];

  Object.entries(APPROVALS).forEach(([key, ap]) => {
    // Boiler: only applicable when a boiler is actually used. If the project
    // indicates boiler/steam infrastructure but the factor is unconfirmed, the
    // requirement is surfaced as INFORMATION_REQUIRED instead of being hidden.
    if (key === "boiler_approval" && !factorIsYes(factors, "boiler_use")) {
      const hinted = !!(infra.boiler || infra.steam_system);
      if (!hinted) return;
      results.push(buildResult(key, ap, { triggered: [], missing: ["boiler_use"], status: "REVIEW_REQUIRED" }));
      return;
    }

    const triggered = ap.triggerFactors.filter((tf) => factorIsYes(factors, tf));
    const reviewFactors = ap.triggerFactors.filter((tf) => resolveFactor(factors, tf) === "REVIEW_REQUIRED");

    if (triggered.length === 0) {
      if (reviewFactors.length === 0) return; // genuinely not applicable
      results.push(buildResult(key, ap, { triggered: [], missing: reviewFactors, status: "REVIEW_REQUIRED" }));
      return;
    }

    results.push(buildResult(key, ap, {
      triggered,
      missing: reviewFactors,
      status: reviewFactors.length > 0 ? "POTENTIALLY_APPLICABLE" : "LIKELY_APPLICABLE"
    }));
  });

  return results;
}

// Flatten required documents across applicable approvals
export function computeDocumentRequirements(approvals) {
  const map = {};
  approvals.forEach((a) => {
    a.required_document_keys.forEach((dk) => {
      if (!DOCUMENTS[dk]) return;
      if (!map[dk]) {
        map[dk] = {
          requirement_key: dk,
          document_name: DOCUMENTS[dk].name,
          approval_key: a.approval_key,
          approval_name: a.approval_name,
          authority: DOCUMENTS[dk].authority,
          priority: DOCUMENTS[dk].priority,
          mandatory: DOCUMENTS[dk].mandatory,
          source_url: DOCUMENTS[dk].sourceUrl,
          expiry_required: DOCUMENTS[dk].expiryRequired
        };
      }
    });
  });
  return Object.values(map);
}

// Document status calculation
export function computeDocStatus(doc) {
  if (!doc || !doc.file_url) return "MISSING";
  if (doc.no_expiry) return "NO_EXPIRY";
  if (!doc.expiry_date) return "NEEDS_VERIFICATION";
  const today = new Date();
  const expiry = new Date(doc.expiry_date);
  if (isNaN(expiry.getTime())) return "NEEDS_VERIFICATION";
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= 30) return "EXPIRING_SOON";
  return "VALID";
}

// Approval readiness
export function computeApprovalReadiness(approval, documents) {
  const reqKeys = approval.required_document_keys;
  const total = reqKeys.length || 0;
  if (total === 0) return { readiness: 100, complete: 0, total: 0, missing: [], status: "DOCUMENT_READY" };
  const docsForApproval = documents.filter((d) => reqKeys.includes(d.requirement_key));
  const valid = docsForApproval.filter((d) => {
    const s = computeDocStatus(d);
    return s === "VALID" || s === "NO_EXPIRY";
  }).length;
  const missing = reqKeys.filter((k) => !docsForApproval.find((d) => d.requirement_key === k));
  const expiring = docsForApproval.filter((d) => computeDocStatus(d) === "EXPIRING_SOON").length;
  const readiness = Math.round((valid / total) * 100);
  const status = valid === total ? "DOCUMENT_READY" : "DOCUMENTS_INCOMPLETE";
  return { readiness, complete: valid, total, missing, expiring, status };
}

// Dependency graph + critical path (topological longest chain)
export function computeCriticalPath(approvals) {
  const keys = approvals.map((a) => a.approval_key);
  const byKey = {};
  approvals.forEach((a) => (byKey[a.approval_key] = a));

  // longest path ending at each node
  const memo = {};
  function chain(key) {
    if (memo[key]) return memo[key];
    const deps = (byKey[key].dependencies || []).filter((d) => keys.includes(d));
    if (deps.length === 0) {
      memo[key] = [key];
      return memo[key];
    }
    let best = [];
    deps.forEach((d) => {
      const c = chain(d);
      if (c.length > best.length) best = c;
    });
    memo[key] = [...best, key];
    return memo[key];
  }
  let longest = [];
  keys.forEach((k) => {
    const c = chain(k);
    if (c.length > longest.length) longest = c;
  });
  return longest;
}

// Global readiness
export function computeReadiness(profile, approvals, documents) {
  let score = 0;
  let parts = 0;
  // Profile completeness
  const profileFields = ["name", "state", "industry", "sub_industry"];
  const filled = profileFields.filter((f) => profile[f]).length;
  score += (filled / profileFields.length) * 20;
  parts += 20;

  // Regulatory assessment completeness
  const factors = profile.factors || {};
  const factorKeys = Object.keys(factors);
  const confirmed = factorKeys.filter((k) => {
    const v = resolveFactor(factors, k);
    return v === "YES" || v === "NO";
  }).length;
  const factorScore = factorKeys.length ? (confirmed / factorKeys.length) * 20 : 0;
  score += factorScore;
  parts += 20;

  // Document readiness
  const reqs = computeDocumentRequirements(approvals);
  const totalDocs = reqs.length || 0;
  const validDocs = reqs.filter((r) => {
    const d = documents.find((doc) => doc.requirement_key === r.requirement_key);
    const s = computeDocStatus(d);
    return s === "VALID" || s === "NO_EXPIRY";
  }).length;
  const docScore = totalDocs ? (validDocs / totalDocs) * 40 : 0;
  score += docScore;
  parts += 40;

  // Approvals readiness
  const apReady = approvals.length ? approvals.reduce((acc, a) => acc + computeApprovalReadiness(a, documents).readiness, 0) / approvals.length : 0;
  score += (apReady / 100) * 20;
  parts += 20;

  return Math.round(score);
}

// Critical blockers: missing mandatory documents on critical path / high priority
export function computeBlockers(approvals, documents) {
  const blockers = [];
  const reqs = computeDocumentRequirements(approvals);
  reqs.forEach((r) => {
    const d = documents.find((doc) => doc.requirement_key === r.requirement_key);
    const status = computeDocStatus(d);
    if (status === "MISSING" || status === "EXPIRED") {
      blockers.push({ ...r, status, reason: status === "EXPIRED" ? "Document has expired and must be renewed." : "Required document has not been uploaded." });
    }
  });
  // sort by priority
  const order = { high: 0, medium: 1, low: 2 };
  blockers.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
  return blockers;
}

// Next Best Action engine — dependency-aware: recommends the action that
// unblocks the most downstream approvals on the critical regulatory path.
export function computeNextBestAction(profile, approvals, documents, applications = []) {
  const graph = computeDependencyGraph(approvals, documents, applications);
  const path = computeCriticalPath(approvals);
  const blocker = computeCurrentBlocker(graph, path);
  const nameOf = (k) => approvals.find((x) => x.approval_key === k)?.approval_name || k;

  if (blocker) {
    const downstream = blocker.blocks || [];
    const reason = downstream.length > 0
      ? `This approval is currently blocking ${downstream.length} downstream approval${downstream.length > 1 ? "s" : ""} (${downstream.map(nameOf).join(", ")}).`
      : "This approval is on your critical regulatory path.";
    const impact = downstream.length > 0
      ? `Unblocks ${downstream.map(nameOf).join(" and ")}.`
      : "Advances your critical regulatory path.";
    const rd = blocker.readiness_detail || computeApprovalReadiness(blocker, documents);

    if (rd.missing && rd.missing.length > 0) {
      const reqs = computeDocumentRequirements(approvals);
      const dk = rd.missing.find((k) => reqs.some((r) => r.requirement_key === k)) || rd.missing[0];
      const r = reqs.find((x) => x.requirement_key === dk);
      return {
        priority: 0, priority_label: "HIGH",
        label: `Upload ${r?.document_name || "required document"}`,
        detail: `Required for ${blocker.approval_name} — the current critical-path blocker.`,
        blocker: `${blocker.approval_name} cannot be prepared without this document.`,
        required_input: r?.document_name || "Required document",
        expected_result: `${blocker.approval_name} readiness is re-evaluated once the document is uploaded and valid.`,
        reason, impact, action: "upload", requirement_key: dk, approval_key: blocker.approval_key
      };
    }
    if (blocker.lifecycle === "BLOCKED" && blocker.blocked_by?.length) {
      const dep = approvals.find((x) => x.approval_key === blocker.blocked_by[0]);
      return {
        priority: 0, priority_label: "HIGH",
        label: `Complete ${dep?.approval_name || nameOf(blocker.blocked_by[0])} first`,
        detail: `${blocker.approval_name} is blocked until this approval is obtained.`,
        blocker: `${blocker.approval_name} has an incomplete prerequisite: ${dep?.approval_name || nameOf(blocker.blocked_by[0])}.`,
        required_input: dep?.approval_name || nameOf(blocker.blocked_by[0]),
        expected_result: `${blocker.approval_name} can then be prepared and submitted.`,
        reason, impact, action: "portal", approval_key: blocker.blocked_by[0], url: dep?.source_url
      };
    }
    if (blocker.lifecycle === "NEEDS_CONFIRMATION") {
      const factors = profile.factors || {};
      const tf = blocker.triggered_factors.find((fk) => resolveFactor(factors, fk) === "REVIEW_REQUIRED") || blocker.triggered_factors[0];
      return {
        priority: 0, priority_label: "HIGH",
        label: `Confirm "${FACTORS[tf]?.name || tf}" for ${blocker.approval_name}`,
        detail: "This approval needs a confirmed regulatory input before it can be actioned.",
        blocker: `Applicability of ${blocker.approval_name} cannot be decided while "${FACTORS[tf]?.name || tf}" is unconfirmed.`,
        required_input: FACTORS[tf]?.name || tf,
        expected_result: `${blocker.approval_name} is re-evaluated with a definite rule result.`,
        reason, impact, action: "factor", factor_key: tf, approval_key: blocker.approval_key
      };
    }
    return {
      priority: 0, priority_label: "HIGH",
      label: `Submit ${blocker.approval_name} application`,
      detail: `Documents are ready. Apply through the official ${blocker.authority} portal.`,
      blocker: "No blocker — documents and prerequisites are complete.",
      required_input: "Your confirmation to proceed on the official portal",
      expected_result: `${blocker.approval_name} is recorded as submitted in your lifecycle tracker.`,
      reason, impact, action: "portal", approval_key: blocker.approval_key, url: blocker.source_url
    };
  }

  // ---- No open dependency blocker: document / factor fallbacks ----
  const reqs = computeDocumentRequirements(approvals);
  const expiring = reqs.find((r) => {
    const d = documents.find((doc) => doc.requirement_key === r.requirement_key);
    return computeDocStatus(d) === "EXPIRING_SOON";
  });
  if (expiring) {
    return {
      priority: 2, priority_label: "MEDIUM",
      label: `Renew ${expiring.document_name}`,
      detail: `Expiring soon. Renew before expiry to maintain ${expiring.approval_name} readiness.`,
      blocker: "No submission blocker — this is a validity risk.",
      required_input: `Renewed ${expiring.document_name}`,
      expected_result: `${expiring.approval_name} readiness is preserved past the expiry date.`,
      action: "upload", requirement_key: expiring.requirement_key, approval_key: expiring.approval_key
    };
  }
  const factors = profile.factors || {};
  const unsure = Object.entries(factors).find(([k]) => resolveFactor(factors, k) === "REVIEW_REQUIRED");
  if (unsure) {
    return {
      priority: 3, priority_label: "MEDIUM",
      label: `Confirm "${FACTORS[unsure[0]]?.name || unsure[0]}"`,
      detail: "A regulatory factor is marked 'Not Sure'. Confirming it improves approval accuracy.",
      blocker: "Approval applicability cannot be decided for requirements that depend on this input.",
      required_input: FACTORS[unsure[0]]?.name || unsure[0],
      expected_result: "The rule engine re-evaluates applicability with a definite answer.",
      action: "factor", factor_key: unsure[0]
    };
  }
  const applicable = approvals.find((a) => a.status === "LIKELY_APPLICABLE" && (a.readiness ?? 0) >= 100);
  if (applicable) {
    return {
      priority: 4, priority_label: "MEDIUM",
      label: `Apply for ${applicable.approval_name}`,
      detail: `Documents are ready. Apply through the official ${applicable.authority} portal.`,
      blocker: "No blocker — documents and prerequisites are complete.",
      required_input: "Your confirmation to proceed on the official portal",
      expected_result: `${applicable.approval_name} is recorded as submitted in your lifecycle tracker.`,
      action: "portal", approval_key: applicable.approval_key, url: applicable.source_url
    };
  }
  return {
    priority: 5, priority_label: "LOW",
    label: "Complete your project profile",
    detail: "Add more project details to improve regulatory analysis.",
    blocker: "No regulatory decision can be made yet — the project profile is incomplete.",
    required_input: "Project location, manufacturing details and regulatory factors",
    expected_result: "The rule engine can produce a project-specific approval roadmap.",
    action: "onboarding"
  };
}

// ---- Approval lifecycle & dependency graph (structured relationships) ----
const GRANTED_STATUSES = ["granted", "approved", "completed", "issued", "received"];

// Builds the dependency graph for the project's identified approvals.
// Lifecycle is derived dynamically from documents + submitted applications:
// COMPLETED / IN_PROGRESS / PENDING / BLOCKED / NEEDS_CONFIRMATION.
export function computeDependencyGraph(approvals, documents, applications = []) {
  const present = new Set(approvals.map((a) => a.approval_key));
  const nodes = approvals.map((a) => {
    const app = applications.find((x) => x.approval_key === a.approval_key && x.status);
    const s = (app?.status || "").toLowerCase();
    let lifecycle = "PENDING";
    if (GRANTED_STATUSES.includes(s)) lifecycle = "COMPLETED";
    else if (app) lifecycle = "IN_PROGRESS";
    return {
      ...a,
      dep_keys: (a.dependencies || []).filter((d) => present.has(d)),
      lifecycle,
      has_application: !!app
    };
  });
  const byKey = {};
  nodes.forEach((n) => (byKey[n.approval_key] = n));

  // Blocked-by: a node is blocked while any in-project dependency is not completed
  nodes.forEach((n) => {
    if (n.lifecycle === "COMPLETED" || n.lifecycle === "IN_PROGRESS") { n.blocked_by = []; return; }
    n.blocked_by = n.dep_keys.filter((d) => byKey[d].lifecycle !== "COMPLETED");
    if (n.blocked_by.length > 0) n.lifecycle = "BLOCKED";
    else if (n.status === "POTENTIALLY_APPLICABLE" || n.status === "REVIEW_REQUIRED") n.lifecycle = "NEEDS_CONFIRMATION";
  });

  // Transitive downstream ("blocks") with cycle guard
  const blocksMemo = {};
  function blocksOf(k, stack = new Set()) {
    if (blocksMemo[k]) return blocksMemo[k];
    if (stack.has(k)) return new Set();
    stack.add(k);
    const out = new Set();
    nodes.forEach((n) => {
      if (n.dep_keys.includes(k)) {
        out.add(n.approval_key);
        blocksOf(n.approval_key, stack).forEach((x) => out.add(x));
      }
    });
    stack.delete(k);
    blocksMemo[k] = out;
    return out;
  }

  // Layout levels (longest distance from roots) with cycle guard
  const levelMemo = {};
  function levelOf(k, stack = new Set()) {
    if (levelMemo[k] !== undefined) return levelMemo[k];
    if (stack.has(k)) return 0;
    stack.add(k);
    const n = byKey[k];
    levelMemo[k] = n.dep_keys.length === 0 ? 0 : Math.max(...n.dep_keys.map((d) => levelOf(d, stack))) + 1;
    stack.delete(k);
    return levelMemo[k];
  }

  nodes.forEach((n) => {
    n.blocks = Array.from(blocksOf(n.approval_key));
    n.blocks_count = n.blocks.length;
    n.level = levelOf(n.approval_key);
  });
  return nodes;
}

// Current regulatory blocker: the first non-completed approval on the critical
// path (root cause resolved), ranked by downstream impact when off-path.
export function computeCurrentBlocker(nodes, criticalPath) {
  if (!nodes.length) return null;
  const find = (k) => nodes.find((x) => x.approval_key === k);
  for (const k of criticalPath) {
    const n = find(k);
    if (n && n.lifecycle !== "COMPLETED") {
      if (n.lifecycle === "BLOCKED" && n.blocked_by?.length) {
        const dep = find(n.blocked_by[0]);
        if (dep && dep.lifecycle !== "COMPLETED") return dep;
      }
      return n;
    }
  }
  const open = nodes
    .filter((n) => n.lifecycle !== "COMPLETED" && n.blocks_count > 0)
    .sort((a, b) => b.blocks_count - a.blocks_count);
  return open[0] || nodes.find((n) => n.lifecycle !== "COMPLETED") || null;
}

// Government integration mode (truthful)
export function getIntegrationMode(approval_key) {
  // No live government API credentials are configured. Truthful default.
  return {
    mode: "OFFICIAL_REDIRECT",
    label: "Official Redirect",
    description: "Live government API is not currently connected. You will be redirected to the official portal.",
    live: false
  };
}