import React from "react";
import { Link } from "react-router-dom";
import { useProjectData } from "@/lib/niecp/useProjectData";
import ApplicationCard from "@/components/applications/ApplicationCard";
import ApplicationPackagePanel from "@/components/approvals/ApplicationPackagePanel";
import { buildApplicationPackage } from "@/lib/niecp/readiness";
import { FileText, Package } from "lucide-react";

export default function Applications() {
  const { selected, loading, approvals, approvalNodes, applications, documents, nameOf, reload } = useProjectData();

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  if (!selected) return <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">Select a profile.</div>;

  const packages = approvals.map((a) =>
    buildApplicationPackage(selected, a, documents, approvalNodes.find((n) => n.approval_key === a.approval_key), nameOf)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500">
            Track every application across channels — demo, official portal and manual. Integration mode and status source are always shown truthfully.
          </p>
        </div>
        <Link to="/government" className="text-xs text-blue-600 hover:underline">Start a new application →</Link>
      </div>

      {/* Application packages — preparation readiness per approval */}
      {packages.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" /> Application Packages
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Each package assembles the project information, documents, checklist, dependencies and unresolved issues for one approval.
            NIECP-AI prepares the package — submission happens on the official channel.
          </p>
          <div className="grid lg:grid-cols-2 gap-3">
            {packages.map((p) => <ApplicationPackagePanel key={p.approval_key} pkg={p} />)}
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No applications tracked yet. Start one from the Government Gateway.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Tracked applications</h2>
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={app.id} app={app} onDone={reload} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}