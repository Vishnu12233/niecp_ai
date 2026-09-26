import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { Button } from "@/components/ui/button";
import DependencyGraph from "@/components/niecp/DependencyGraph";
import DataModeBadge from "@/components/niecp/DataModeBadge";
import { StatusChip } from "./Dashboard";
import { READINESS_STATUS } from "@/lib/niecp/readiness";
import { GitBranch, ArrowRight, AlertTriangle, Gauge } from "lucide-react";

export default function CriticalPath() {
  const { selected, loading, approvalNodes, criticalPath, blockers, regulatoryBlocker, nextBestAction, bottlenecks } = useProjectData();
  const [selectedNode, setSelectedNode] = useState(null);
  const navigate = useNavigate();

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  if (!selected) return <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">Select a profile.</div>;

  const pathNodes = criticalPath.map((k) => approvalNodes.find((a) => a.approval_key === k)).filter(Boolean);
  const offPath = approvalNodes.filter((a) => !criticalPath.includes(a.approval_key));
  const nameOf = (k) => approvalNodes.find((n) => n.approval_key === k)?.approval_name || k;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><GitBranch className="w-5 h-5 text-purple-500" /> Critical Regulatory Path</h1>
          <p className="text-sm text-slate-500">Dependency-aware execution intelligence for {selected.name}.</p>
        </div>
        <DataModeBadge />
      </div>

      {/* Critical path narrative */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Critical Path</h3>
        {pathNodes.length === 0 ? <p className="text-sm text-slate-400">No critical path computed. Complete your regulatory assessment.</p> : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {pathNodes.map((a, i) => (
                <React.Fragment key={a.approval_key}>
                  <div className={`px-3 py-2 rounded-xl border text-sm font-medium ${a.lifecycle === "COMPLETED" ? "border-teal-300 bg-teal-50 text-teal-800" : "border-purple-200 bg-purple-50 text-slate-800"}`}>
                    {a.approval_name}
                    <span className="block text-[10px] font-normal text-slate-500">{a.authority}</span>
                  </div>
                  {i < pathNodes.length - 1 && <ArrowRight className="w-4 h-4 text-purple-400" />}
                </React.Fragment>
              ))}
            </div>

            {regulatoryBlocker && (
              <div className="mt-5 border border-red-200 bg-red-50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-[10px] uppercase font-bold text-red-600 tracking-wide">Current Blocker</span>
                  <span className="ml-auto"><StatusChip status={regulatoryBlocker.lifecycle} /></span>
                </div>
                <div className="font-semibold text-slate-900 mt-1">{regulatoryBlocker.approval_name}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Impact: {regulatoryBlocker.blocks_count > 0
                    ? `${regulatoryBlocker.blocks.map(nameOf).join(", ")} cannot proceed until ${regulatoryBlocker.approval_name} is completed.`
                    : `${regulatoryBlocker.approval_name} is the next step on your critical path.`}
                </div>
                {regulatoryBlocker.blocked_reason && (
                  <div className="text-xs text-red-700 bg-white border border-red-200 rounded px-2 py-1 mt-1">{regulatoryBlocker.blocked_reason}</div>
                )}
                {nextBestAction && (
                  <div className="text-xs text-slate-600 mt-1">Recommended Next Action: <b>{nextBestAction.label}</b> — {nextBestAction.detail}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Approval dependency map */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-slate-900">Approval Dependency Map</h3>
          <div className="flex flex-wrap gap-1.5 text-[9px] font-semibold uppercase">
            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">Completed</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-300">Pending</span>
            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Blocked</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Needs Confirmation</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Conditional</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-4">Generated from your project's approvals and their dependency relationships — it updates automatically when statuses change. Click a node for details.</p>
        <DependencyGraph nodes={approvalNodes} criticalPath={criticalPath} onSelect={setSelectedNode} />

        {selectedNode && (
          <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900">{selectedNode.approval_name}</div>
                <div className="text-xs text-slate-500">{selectedNode.authority} · {selectedNode.category} · {selectedNode.conditional ? "Conditionally required" : "Required"}</div>
              </div>
              <div className="flex items-center gap-2">
                {selectedNode.on_critical_path && <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Critical Path</span>}
                <StatusChip status={selectedNode.lifecycle} />
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${(READINESS_STATUS[selectedNode.readiness_status] || READINESS_STATUS.REQUIRES_VERIFICATION).className}`}>
                  {(READINESS_STATUS[selectedNode.readiness_status] || READINESS_STATUS.REQUIRES_VERIFICATION).label}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-600 mt-2">{selectedNode.reason}</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
              <div>Depends on: <b>{selectedNode.dep_keys?.length ? selectedNode.dep_keys.map(nameOf).join(", ") : "None"}</b></div>
              <div>Blocking: <b>{selectedNode.blocks_count > 0 ? selectedNode.blocks.map(nameOf).join(", ") : "Nothing"}</b></div>
              <div>Documents: <b>{selectedNode.readiness_detail?.complete || 0}/{selectedNode.readiness_detail?.total || 0}</b> complete</div>
              <div>Readiness: <b>{selectedNode.readiness}%</b></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => navigate("/approvals")}>Why required & evidence</Button>
              <a href={selectedNode.source_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Official portal</Button></a>
            </div>
          </div>
        )}
      </div>

      {/* Bottleneck intelligence — derived from real blockers only */}
      {bottlenecks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Gauge className="w-4 h-4 text-red-500" /> Bottleneck Intelligence</h3>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Identified from blocked approvals, missing documents and open queries</span>
          </div>
          <div className="space-y-2 mt-3">
            {bottlenecks.map((b, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="font-medium text-slate-800 text-sm">{b.title}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${b.severity === "HIGH" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{b.severity}</span>
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{b.category}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-1">Why blocked: {b.why}</div>
                <div className="text-xs text-slate-500 mt-0.5">Affected approvals: <b>{b.affected.join(", ") || "—"}</b></div>
                {b.sla_status && b.sla_status !== "SLA_INFORMATION_UNAVAILABLE" && (
                  <div className="text-xs text-slate-500 mt-0.5">SLA: <b>{b.sla_status.replace(/_/g, " ").toLowerCase()}</b>{typeof b.days_remaining === "number" ? ` · ${b.days_remaining} day(s) remaining` : ""}</div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <div className="text-xs text-slate-600">Recommended action: <b>{b.action}</b></div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(b.action_target)}>Go to fix</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document blockers on path */}
      {blockers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Document Blockers</h3>
          <div className="space-y-2">
            {blockers.map((b) => (
              <div key={b.requirement_key} className="flex flex-wrap items-center justify-between gap-2 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
                <div className="text-sm font-medium text-red-800">{b.document_name}</div>
                <div className="text-xs text-red-600">Required for {b.approval_name} · {b.reason}</div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate("/documents")}>Upload</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parallel approvals */}
      {offPath.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Other Applicable Approvals (parallel)</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {offPath.map((a) => (
              <button key={a.approval_key} onClick={() => setSelectedNode(a)} className="text-left border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-800 text-sm">{a.approval_name}</div>
                  <StatusChip status={a.lifecycle} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{a.authority} · {a.readiness_detail?.complete || 0}/{a.readiness_detail?.total || 0} docs</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}