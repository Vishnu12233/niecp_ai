// NIECP-AI deterministic mappings
// Factor -> approval and document -> approval relationships, derived ONLY from
// the existing rule pack (approvals.js). Nothing here is inferred or invented.

import { APPROVALS } from "./approvals";

// Which approvals a regulatory factor can trigger.
export function approvalsForFactor(factorKey) {
  return Object.entries(APPROVALS)
    .filter(([, ap]) => (ap.triggerFactors || []).includes(factorKey))
    .map(([key, ap]) => ({
      key,
      name: ap.name,
      authority: ap.authority,
      conditional: !!ap.conditional
    }));
}

// Which approvals require each document. The same document can be required by
// several approvals (e.g. a building plan approval feeds factory + occupancy).
export function documentApprovalMap(approvals = []) {
  const map = {};
  approvals.forEach((a) => {
    (a.required_document_keys || []).forEach((dk) => {
      if (!map[dk]) map[dk] = [];
      if (!map[dk].some((x) => x.key === a.approval_key)) {
        map[dk].push({ key: a.approval_key, name: a.approval_name, status: a.status });
      }
    });
  });
  return map;
}