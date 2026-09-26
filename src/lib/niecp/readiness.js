// NIECP-AI Readiness, Lifecycle, SLA and Bottleneck intelligence.
// Every value is derived from real project state (documents, dependencies,
// applications, queries) — no arbitrary percentages, no invented deadlines.

import { computeApprovalReadiness, computeDocStatus } from "./engine";
import { FACTORS } from "./catalogs";

export const READINESS_STATUS = {
  READY: { label: "Ready", className: "bg-teal-100 text-teal-700" },
  NEARLY_READY: { label: "Nearly ready", className: "bg-blue-100 text-blue-700" },
  BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-700" },
  INFORMATION_REQUIRED: { label: "Information required", className: "bg-amber-100 text-amber-700" },
  REQUIRES_VERIFICATION: { label: "Requires verification", className: "bg-slate-100 text-slate-600" }
};

// Readiness is computed from real completion criteria only.
export function computeReadinessStatus(approval, documents, node) {
  if (node?.lifecycle === "COMPLETED") return "READY";
  if (approval.status === "REVIEW_REQUIRED" || (approval.missing_facts || []).length > 0) return "INFORMATION_REQUIRED";
  if (node?.lifecycle === "BLOCKED") return "BLOCKED";
  const rd = approval.readiness_detail || computeApprovalReadiness(approval, documents);
  if (rd.total === 0) return approval.status === "POTENTIALLY_APPLICABLE" ? "REQUIRES_VERIFICATION" : "READY";
  if (rd.complete === rd.total) return approval.status === "POTENTIALLY_APPLICABLE" ? "REQUIRES_VERIFICATION" : "READY";
  const ratio = rd.complete / rd.total;
  if (ratio >= 0.5) return "NEARLY_READY";
  return "BLOCKED";
}

// Specific, non-vague blocking reason.
export function blockedReason(approval, documents, node, nameOf = (k) => k) {
  const rd = approval.readiness_detail || computeApprovalReadiness(approval, documents);
  const reasons = [];
  if (node?.blocked_by?.length) reasons.push(`waiting on prerequisite approval ${node.blocked_by.map(nameOf).join(", ")}`);
  const expired = (approval.required_document_keys || []).filter((dk) => {
    const d = documents.find((x) => x.requirement_key === dk);
    return computeDocStatus(d) === "EXPIRED";
  });
  if (expired.length) reasons.push(`${expired.length} required document${expired.length > 1 ? "s" : ""} expired`);
  if (rd.missing?.length) reasons.push(`${rd.missing.length} required document${rd.missing.length > 1 ? "s" : ""} not uploaded`);
  if ((approval.missing_facts || []).length) {
    reasons.push(`unconfirmed project input: ${approval.missing_facts.map((k) => FACTORS[k]?.name || k).join(", ")}`);
  }
  return reasons.length ? `Blocked because: ${reasons.join("; ")}.` : null;
}

// ---- Application lifecycle ----
export const LIFECYCLE = {
  NOT_STARTED: { label: "Not started", className: "bg-slate-100 text-slate-500" },
  READY: { label: "Ready", className: "bg-teal-100 text-teal-700" },
  PREPARING: { label: "Preparing", className: "bg-blue-100 text-blue-700" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  UNDER_REVIEW: { label: "Under review", className: "bg-amber-100 text-amber-700" },
  QUERY_RAISED: { label: "Query raised", className: "bg-amber-100 text-amber-800" },
  RESPONSE_REQUIRED: { label: "Response required", className: "bg-red-100 text-red-700" },
  RESUBMITTED: { label: "Resubmitted", className: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approved", className: "bg-teal-100 text-teal-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" }
};

export function isOpenQuery(q) {
  return !/RESOLV|CLOSED|REPLIED|ANSWERED/i.test(String(q?.status || ""));
}

export function computeLifecycle(approval, application) {
  if (!application) return (approval.readiness ?? 0) >= 100 ? "READY" : "NOT_STARTED";
  const s = String(application.status || "").toUpperCase();
  if (s.includes("APPROV")) return "APPROVED";
  if (s.includes("REJECT")) return "REJECTED";
  if (s.includes("QUERY")) return (application.queries || []).some(isOpenQuery) ? "RESPONSE_REQUIRED" : "QUERY_RAISED";
  if (s.includes("RESUBMIT")) return "RESUBMITTED";
  if (s.includes("REVIEW")) return "UNDER_REVIEW";
  if (s.includes("SUBMIT")) return "SUBMITTED";
  if (s.includes("PREPAR")) return "PREPARING";
  return "SUBMITTED";
}

// ---- Query + SLA ----
// An SLA is only ever shown when the authority actually supplied a date.
export function computeSla(application) {
  return (application?.queries || []).map((q) => {
    const resolved = !isOpenQuery(q);
    const due = q.due_date || q.deadline || null;
    if (!due) {
      return { ...q, days_remaining: null, sla_status: resolved ? "RESOLVED" : "SLA_INFORMATION_UNAVAILABLE" };
    }
    const days = Math.ceil((new Date(due) - new Date()) / (1000 * 60 * 60 * 24));
    const sla_status = resolved ? "RESOLVED" : days < 0 ? "OVERDUE" : days <= 3 ? "DUE_SOON" : "ON_TRACK";
    return { ...q, days_remaining: days, sla_status };
  });
}

// ---- Application package ----
export const PACKAGE_STATUS = {
  READY_FOR_SUBMISSION: { label: "Ready for submission", className: "bg-teal-100 text-teal-700" },
  MISSING_REQUIREMENTS: { label: "Missing requirements", className: "bg-amber-100 text-amber-700" },
  READY_TO_PREPARE: { label: "Ready to prepare", className: "bg-blue-100 text-blue-700" },
  BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-700" }
};

export function buildApplicationPackage(profile, approval, documents, node, nameOf = (k) => k) {
  const rd = approval.readiness_detail || computeApprovalReadiness(approval, documents);
  const docs = (approval.required_document_keys || []).map((dk) => {
    const rec = documents.find((d) => d.requirement_key === dk);
    return { requirement_key: dk, name: rec?.document_name || dk, status: rec?.status || "MISSING", uploaded: !!rec?.file_url };
  });
  const missing = docs.filter((d) => d.status === "MISSING" || d.status === "EXPIRED");
  const unconfirmed = (approval.missing_facts || []).map((k) => FACTORS[k]?.name || k);
  const blockedBy = node?.blocked_by || [];

  const checklist = [
    { label: "All required documents uploaded and valid", done: missing.length === 0 },
    { label: "All triggering project inputs confirmed", done: unconfirmed.length === 0 },
    { label: "Prerequisite approvals completed", done: blockedBy.length === 0 },
    { label: "Applicability confirmed by the rule engine", done: approval.status === "LIKELY_APPLICABLE" }
  ];

  const unresolved = [
    ...missing.map((d) => `${d.name} — ${d.status === "EXPIRED" ? "expired, renewal required" : "not uploaded"}`),
    ...unconfirmed.map((u) => `Unconfirmed project input: ${u}`),
    ...blockedBy.map((k) => `Waiting on prerequisite approval: ${nameOf(k)}`)
  ];

  let status = "READY_FOR_SUBMISSION";
  if (blockedBy.length > 0) status = "BLOCKED";
  else if (missing.length > 0 || unconfirmed.length > 0) status = "MISSING_REQUIREMENTS";
  else if (approval.status !== "LIKELY_APPLICABLE") status = "READY_TO_PREPARE";

  return {
    approval_key: approval.approval_key,
    rule_id: approval.rule_id,
    approval_name: approval.approval_name,
    authority: approval.authority,
    source_url: approval.source_url,
    status,
    readiness: rd.readiness,
    documents: docs,
    checklist,
    unresolved,
    project_information: [
      { label: "Project", value: profile?.name },
      { label: "Sector", value: profile?.sub_industry || profile?.industry },
      { label: "Location", value: [profile?.city, profile?.state].filter(Boolean).join(", ") },
      { label: "Stage", value: profile?.project_stage }
    ].filter((x) => x.value),
    approval_information: [
      { label: "Rule ID", value: approval.rule_id },
      { label: "Authority", value: approval.authority },
      { label: "Applicability", value: approval.outcome },
      { label: "Legal basis", value: approval.legal_basis }
    ],
    dependencies: (approval.dependencies || []).map((k) => ({ key: k, name: nameOf(k), completed: blockedBy.includes(k) === false && (node?.dep_keys || []).includes(k) })),
    package_status_label: PACKAGE_STATUS[status]?.label || status
  };
}

// ---- Bottleneck intelligence ----
export function computeBottlenecks(profile, approvals, nodes, documents, applications = []) {
  const nameOf = (k) => approvals.find((a) => a.approval_key === k)?.approval_name || k;
  const out = [];

  // 1. Open government queries — the strongest signal available.
  applications.forEach((app) => {
    (app.queries || []).filter(isOpenQuery).forEach((q) => {
      const sla = computeSla({ queries: [q] })[0];
      out.push({
        severity: "HIGH",
        category: "Query",
        title: `Query raised on ${app.approval_name || nameOf(app.approval_key)}`,
        why: q.text || "The authority has raised a query that must be answered before this application can progress.",
        affected: [app.approval_name || nameOf(app.approval_key)],
        action: "Respond to the query from the Applications page.",
        action_target: "/applications",
        sla_status: sla.sla_status,
        days_remaining: sla.days_remaining
      });
    });
  });

  // 2. Dependency bottlenecks — approvals holding others up.
  nodes
    .filter((n) => n.lifecycle !== "COMPLETED" && n.blocks_count > 0)
    .sort((a, b) => b.blocks_count - a.blocks_count)
    .forEach((n) => {
      out.push({
        severity: "HIGH",
        category: "Dependency",
        title: `${n.approval_name} is holding up ${n.blocks_count} approval${n.blocks_count > 1 ? "s" : ""}`,
        why: `${n.blocks.map(nameOf).join(", ")} cannot proceed until ${n.approval_name} is completed.`,
        affected: n.blocks.map(nameOf),
        action: n.lifecycle === "BLOCKED"
          ? `Clear the prerequisite blocking ${n.approval_name} first.`
          : `Advance ${n.approval_name} on the critical path.`,
        action_target: "/critical-path"
      });
    });

  // 3. Missing documents on approvals that are actually applicable.
  approvals.forEach((a) => {
    const rd = a.readiness_detail || computeApprovalReadiness(a, documents);
    (rd.missing || []).forEach((dk) => {
      const rec = documents.find((d) => d.requirement_key === dk);
      out.push({
        severity: (a.readiness ?? 0) < 50 ? "HIGH" : "MEDIUM",
        category: "Document",
        title: `Missing document: ${rec?.document_name || dk}`,
        why: `Required for ${a.approval_name} — the application package cannot be completed without it.`,
        affected: [a.approval_name],
        action: `Upload ${rec?.document_name || dk}.`,
        action_target: "/documents"
      });
    });
  });

  // 4. Unresolved project information.
  approvals.filter((a) => a.status === "REVIEW_REQUIRED").forEach((a) => {
    out.push({
      severity: "MEDIUM",
      category: "Information",
      title: `Unconfirmed project input for ${a.approval_name}`,
      why: (a.missing_facts || []).map((k) => FACTORS[k]?.name || k).join(", ") || "A regulatory factor is not confirmed.",
      affected: [a.approval_name],
      action: "Confirm the project input in the regulatory factor analysis.",
      action_target: "/factors"
    });
  });

  return out;
}