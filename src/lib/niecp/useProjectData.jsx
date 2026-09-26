import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "./profileContext";
import {
  computeApprovals, computeDocumentRequirements, computeReadiness,
  computeNextBestAction, computeBlockers, computeCriticalPath, computeApprovalReadiness,
  computeDocStatus, computeDependencyGraph, computeCurrentBlocker
} from "./engine";
import { computeReadinessStatus, blockedReason, computeLifecycle, computeBottlenecks } from "./readiness";
import { computeFactorAnalysis } from "./factorAnalysis";
import { computeComplianceReadiness } from "./compliance";
import { documentApprovalMap } from "./mappings";

// Loads approvals + documents + applications for the selected profile and
// recomputes derived intelligence (lifecycle, dependency graph, readiness,
// factor analysis, bottlenecks, compliance, Smart Action Guide).
export function useProjectData() {
  const { selected, refreshProfile } = useProfile();
  const [approvals, setApprovals] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!selected?.id) { setApprovals([]); setDocuments([]); setApplications([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [ap, docs, apps] = await Promise.all([
        base44.entities.ProjectApproval.filter({ profile_id: selected.id }),
        base44.entities.ProjectDocument.filter({ profile_id: selected.id }),
        base44.entities.Application.filter({ profile_id: selected.id })
      ]);
      setApprovals(ap);
      setDocuments(docs);
      setApplications(apps);
    } catch (e) {
      setApprovals([]); setDocuments([]); setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => { load(); }, [load]);

  // Recompute approvals from the live profile factors (keeps UI in sync with overrides)
  const computedApprovals = selected ? computeApprovals(selected) : [];
  const mergedApprovals = computedApprovals.map((a) => {
    const persisted = approvals.find((p) => p.approval_key === a.approval_key);
    const readiness = computeApprovalReadiness(a, documents);
    return { ...a, id: persisted?.id, readiness: readiness.readiness, readiness_detail: readiness, on_critical_path: false };
  });

  const criticalPath = computeCriticalPath(mergedApprovals);
  mergedApprovals.forEach((a) => { a.on_critical_path = criticalPath.includes(a.approval_key); });

  // Lifecycle + dependency graph — dynamic, recomputed from documents & applications
  const approvalNodes = computeDependencyGraph(mergedApprovals, documents, applications);
  const nameOf = (k) => mergedApprovals.find((x) => x.approval_key === k)?.approval_name || k;

  // Attach the real lifecycle, readiness status, blocking reason and application
  // state to each approval so every screen reads from one consistent source.
  mergedApprovals.forEach((a) => {
    const node = approvalNodes.find((n) => n.approval_key === a.approval_key);
    a.lifecycle = node?.lifecycle || "PENDING";
    a.readiness_status = computeReadinessStatus(a, documents, node);
    a.blocked_reason = blockedReason(a, documents, node, nameOf);
    a.application = applications.find((x) => x.approval_key === a.approval_key) || null;
    a.application_lifecycle = computeLifecycle(a, a.application);
  });

  // Mirror the derived state onto the dependency-graph nodes so every view
  // (graph, critical path, bottlenecks) reads the same values.
  approvalNodes.forEach((n) => {
    const a = mergedApprovals.find((x) => x.approval_key === n.approval_key);
    if (!a) return;
    n.readiness_status = a.readiness_status;
    n.blocked_reason = a.blocked_reason;
    n.application_lifecycle = a.application_lifecycle;
  });

  const regulatoryBlocker = computeCurrentBlocker(approvalNodes, criticalPath);
  const statusCounts = {
    completed: approvalNodes.filter((n) => n.lifecycle === "COMPLETED").length,
    in_progress: approvalNodes.filter((n) => n.lifecycle === "IN_PROGRESS").length,
    pending: approvalNodes.filter((n) => n.lifecycle === "PENDING").length,
    blocked: approvalNodes.filter((n) => n.lifecycle === "BLOCKED").length,
    needs_confirmation: approvalNodes.filter((n) => n.lifecycle === "NEEDS_CONFIRMATION").length
  };

  const reqs = computeDocumentRequirements(mergedApprovals);
  const docsWithStatus = reqs.map((r) => {
    const uploaded = documents.find((d) => d.requirement_key === r.requirement_key);
    const status = computeDocStatus(uploaded);
    return { ...r, ...uploaded, id: uploaded?.id, status, file_url: uploaded?.file_url, issue_date: uploaded?.issue_date, expiry_date: uploaded?.expiry_date, no_expiry: uploaded?.no_expiry, ai_classification: uploaded?.ai_classification };
  });

  const blockers = computeBlockers(mergedApprovals, documents);
  const readiness = selected ? computeReadiness(selected, mergedApprovals, documents) : 0;
  const nextBestAction = selected ? computeNextBestAction(selected, mergedApprovals, documents, applications) : null;

  // Deeper intelligence — all deterministic, all from real project state.
  const bottlenecks = selected ? computeBottlenecks(selected, mergedApprovals, approvalNodes, documents, applications) : [];
  const factorAnalysis = selected
    ? computeFactorAnalysis(selected)
    : { items: [], counts: { ACTIVE: 0, INACTIVE: 0, NEEDS_CONFIRMATION: 0, INFORMATION_REQUIRED: 0 }, total: 0, impacting: 0 };
  const compliance = computeComplianceReadiness(mergedApprovals, documents, approvalNodes);
  const documentMap = documentApprovalMap(mergedApprovals);

  return {
    selected, loading, approvals: mergedApprovals, approvalNodes, documents: docsWithStatus,
    criticalPath, blockers, regulatoryBlocker, statusCounts, readiness, nextBestAction,
    applications, reload: load, refreshProfile,
    bottlenecks, factorAnalysis, compliance, documentMap, nameOf
  };
}