import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, AlertTriangle, GitBranch, Sparkles, ArrowRight, Plus, Building2, TrendingUp } from "lucide-react";
import DataModeBadge from "@/components/niecp/DataModeBadge";
import ProjectTwin from "@/components/niecp/ProjectTwin";

export default function Dashboard() {
  const { selected, loading, approvals, approvalNodes, documents, criticalPath, blockers, regulatoryBlocker, statusCounts, readiness, nextBestAction } = useProjectData();
  const navigate = useNavigate();

  if (loading) return <div className="py-20 text-center text-slate-400">Loading project intelligence…</div>;
  if (!selected) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-slate-800">No business profile selected</h2>
        <p className="text-sm text-slate-500 mt-1">Create a profile to generate your project-specific regulatory roadmap.</p>
        <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/onboarding")}><Plus className="w-4 h-4 mr-1" /> Start New Project</Button>
      </div>
    );
  }

  const applicable = approvals.filter((a) => a.status === "LIKELY_APPLICABLE").length;
  const reviewRequired = approvals.filter((a) => a.status === "POTENTIALLY_APPLICABLE").length;
  const missingDocs = documents.filter((d) => d.status === "MISSING").length;
  const expiringDocs = documents.filter((d) => d.status === "EXPIRING_SOON").length;
  const validDocs = documents.filter((d) => d.status === "VALID" || d.status === "NO_EXPIRY").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Selected Project</div>
            <h1 className="text-2xl font-bold text-slate-900">{selected.name}</h1>
            <div className="text-sm text-slate-500 mt-1">{selected.city}, {selected.state} · {selected.sub_industry || selected.industry} · {selected.project_stage}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Project Readiness</div>
            <div className="text-4xl font-bold text-blue-700">{readiness}%</div>
            <div className="text-xs text-slate-500">calculated from project data</div>
            <div className="mt-2"><DataModeBadge /></div>
          </div>
        </div>
      </div>

      {/* Next Best Action */}
      {nextBestAction && (
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-6 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-wide text-blue-100">Smart Action Guide</div>
              <div className="text-lg font-semibold">{nextBestAction.label}</div>
              {nextBestAction.priority_label && (
                <div className="text-[10px] uppercase font-bold tracking-wide text-amber-200 mt-0.5">Priority: {nextBestAction.priority_label}</div>
              )}
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 max-w-2xl">
                <GuideRow label="Why it matters" value={nextBestAction.reason || nextBestAction.detail} />
                <GuideRow label="Blocker" value={nextBestAction.blocker || nextBestAction.detail} />
                <GuideRow label="Required input" value={nextBestAction.required_input} />
                <GuideRow label="Expected result" value={nextBestAction.expected_result || nextBestAction.impact} />
              </div>
            </div>
          </div>
          <Button className="bg-white text-blue-700 hover:bg-blue-50" onClick={() => {
            if (nextBestAction.action === "upload") navigate("/documents");
            else if (nextBestAction.action === "portal") navigate("/government");
            else if (nextBestAction.action === "factor") navigate("/approvals");
            else navigate("/projects");
          }}>
            {nextBestAction.action === "upload" ? "Upload Now" : "Take Action"} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={ShieldCheck} label="Potentially Applicable" value={approvals.length} sub={`${applicable} likely · ${reviewRequired} review`} color="blue" />
        <Stat icon={FileText} label="Documents" value={`${validDocs}/${documents.length}`} sub={`${missingDocs} missing · ${expiringDocs} expiring`} color="teal" />
        <Stat icon={AlertTriangle} label="Critical Blockers" value={blockers.length} sub={blockers[0]?.document_name || "None"} color={blockers.length ? "red" : "slate"} />
        <Stat icon={GitBranch} label="Critical Path" value={criticalPath.length} sub={`${criticalPath.length} approvals in chain`} color="purple" />
      </div>

      {/* Project readiness (dynamic, from approval statuses) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Project Readiness</h3>
          <div className="text-2xl font-bold text-blue-700">{readiness}%</div>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all" style={{ width: `${readiness}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          <ReadyCount label="Completed" value={statusCounts.completed} color="teal" />
          <ReadyCount label="In Progress" value={statusCounts.in_progress} color="blue" />
          <ReadyCount label="Pending" value={statusCounts.pending} color="slate" />
          <ReadyCount label="Blocked" value={statusCounts.blocked} color="red" />
          <ReadyCount label="Needs Confirmation" value={statusCounts.needs_confirmation} color="amber" />
        </div>
      </div>

      {/* Project Twin — the central, provenance-tagged source of project facts */}
      <ProjectTwin profile={selected} />

      {/* Current regulatory blocker */}
      {regulatoryBlocker && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-bold text-red-600 tracking-wide">Current Regulatory Blocker</div>
              <div className="font-semibold text-slate-900">{regulatoryBlocker.approval_name}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2"><StatusChip status={regulatoryBlocker.lifecycle} /> {regulatoryBlocker.authority}</div>
              {regulatoryBlocker.blocks_count > 0 && (
                <div className="text-xs text-slate-600 mt-1">Blocking: <b>{regulatoryBlocker.blocks.map((k) => approvalNodes.find((n) => n.approval_key === k)?.approval_name || k).join(", ")}</b></div>
              )}
              <div className="text-xs text-slate-500 mt-1">
                {regulatoryBlocker.blocks_count > 0
                  ? "Why it matters: these downstream approvals cannot proceed until this one is completed."
                  : "Why it matters: this approval is on your critical regulatory path."}
              </div>
              {nextBestAction && <div className="text-xs text-slate-600 mt-1">Recommended action: <b>{nextBestAction.label}</b></div>}
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/critical-path")}>View Dependency Map <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Critical path */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Critical Path</h3>
            <Link to="/critical-path" className="text-xs text-blue-600 hover:underline">View</Link>
          </div>
          {criticalPath.length === 0 ? <p className="text-sm text-slate-400">No critical path computed yet.</p> : (
            <div className="space-y-2">
              {criticalPath.map((k, i) => {
                const a = approvals.find((x) => x.approval_key === k);
                if (!a) return null;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{i + 1}</div>
                    <div className="flex-1 text-sm font-medium text-slate-700">{a.approval_name}</div>
                    <div className="text-xs text-slate-400">{a.readiness}%</div>
                    {i < criticalPath.length - 1 && <div className="text-slate-300 -mt-2">↓</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blockers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Critical Blockers</h3>
          {blockers.length === 0 ? (
            <div className="text-sm text-slate-400 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-500" /> No blockers. You're on track.</div>
          ) : (
            <div className="space-y-3">
              {blockers.map((b) => (
                <div key={b.requirement_key} className="border border-red-200 bg-red-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-red-800 text-sm">{b.document_name}</div>
                    <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">{b.status}</span>
                  </div>
                  <div className="text-xs text-red-600 mt-1">Required for {b.approval_name}</div>
                  <div className="text-xs text-red-500 mt-1">{b.reason}</div>
                  <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700 h-7 text-xs" onClick={() => navigate("/documents")}>Upload</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approvals summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Potentially Applicable Approvals</h3>
          <Link to="/approvals" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {approvals.map((a) => (
            <div key={a.approval_key} className="border border-slate-200 rounded-xl p-3">
              <div className="text-sm font-medium text-slate-800">{a.approval_name}</div>
              <div className="text-xs text-slate-500">{a.authority}</div>
              <div className="flex items-center justify-between mt-2">
                <StatusChip status={a.status} />
                <span className="text-xs text-slate-400">{a.readiness_detail?.complete || 0}/{a.readiness_detail?.total || 0} docs</span>
              </div>
            </div>
          ))}
          {approvals.length === 0 && <p className="text-sm text-slate-400">No approvals identified. Complete your regulatory assessment.</p>}
        </div>
      </div>
    </div>
  );
}

function GuideRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="text-[11px] leading-snug">
      <span className="text-[9px] uppercase font-bold tracking-wide text-blue-100/70 block">{label}</span>
      <span className="text-blue-50">{value}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600", teal: "bg-teal-50 text-teal-600",
    red: "bg-red-50 text-red-600", slate: "bg-slate-100 text-slate-500", purple: "bg-purple-50 text-purple-600"
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-[10px] text-slate-400 mt-1 truncate">{sub}</div>
    </div>
  );
}

function ReadyCount({ label, value, color }) {
  const colors = { teal: "text-teal-600", blue: "text-blue-600", slate: "text-slate-600", red: "text-red-600", amber: "text-amber-600" };
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export function StatusChip({ status }) {
  const map = {
    LIKELY_APPLICABLE: "bg-teal-100 text-teal-700",
    POTENTIALLY_APPLICABLE: "bg-amber-100 text-amber-700",
    REVIEW_REQUIRED: "bg-amber-100 text-amber-700",
    NOT_INDICATED: "bg-slate-100 text-slate-500",
    DOCUMENT_READY: "bg-teal-100 text-teal-700",
    DOCUMENTS_INCOMPLETE: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-teal-100 text-teal-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    PENDING: "bg-slate-100 text-slate-500",
    BLOCKED: "bg-red-100 text-red-700",
    NEEDS_CONFIRMATION: "bg-amber-100 text-amber-700"
  };
  const label = status?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${map[status] || "bg-slate-100 text-slate-500"}`}>{label}</span>;
}