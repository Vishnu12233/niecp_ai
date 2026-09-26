// NIECP-AI Compliance / Inspection Readiness
// Regulatory assistance only — this is never a legal certification. Each item
// is derived from the approval's real state and its evidence documents.

import { computeApprovalReadiness, computeDocStatus } from "./engine";

export const COMPLIANCE_STATUS = {
  COMPLIANT: { label: "Compliant", className: "bg-teal-100 text-teal-700" },
  PENDING: { label: "Pending", className: "bg-slate-100 text-slate-600" },
  NON_COMPLIANT: { label: "Non-compliant", className: "bg-red-100 text-red-700" },
  REQUIRES_VERIFICATION: { label: "Requires verification", className: "bg-amber-100 text-amber-700" }
};

export function computeComplianceReadiness(approvals = [], documents = [], nodes = []) {
  return approvals.map((a) => {
    const node = nodes.find((n) => n.approval_key === a.approval_key);
    const rd = a.readiness_detail || computeApprovalReadiness(a, documents);

    const evidence = (a.required_document_keys || []).map((dk) => {
      const d = documents.find((x) => x.requirement_key === dk);
      return { requirement_key: dk, name: d?.document_name || dk, status: computeDocStatus(d) };
    });
    const expired = evidence.filter((e) => e.status === "EXPIRED");
    const missing = evidence.filter((e) => e.status === "MISSING");

    let status = "PENDING";
    if (expired.length > 0) status = "NON_COMPLIANT";
    else if (node?.lifecycle === "COMPLETED") status = "COMPLIANT";
    else if (a.status !== "LIKELY_APPLICABLE") status = "REQUIRES_VERIFICATION";

    const issues = [
      ...expired.map((e) => `${e.name} has expired.`),
      ...missing.map((e) => `${e.name} is not on record.`)
    ];

    return {
      approval_key: a.approval_key,
      item: a.approval_name,
      requirement: a.description,
      authority: a.authority,
      status,
      evidence,
      evidence_complete: `${rd.complete}/${rd.total}`,
      action: expired.length
        ? `Renew ${expired[0].name}.`
        : missing.length
          ? `Upload ${missing[0].name}.`
          : status === "COMPLIANT"
            ? "Maintain records and renewal dates."
            : "Confirm applicability and keep evidence ready for inspection.",
      issue: issues.length ? issues.join(" ") : null
    };
  });
}