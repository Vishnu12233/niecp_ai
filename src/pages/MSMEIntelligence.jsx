import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { logAudit } from "@/lib/niecp/government/manager";
import { classifyMSME, assessUdyamReadiness, msmeObligations, msmeBenefits } from "@/lib/niecp/msme";
import ClassificationCard from "@/components/msme/ClassificationCard";
import UdyamReadiness from "@/components/msme/UdyamReadiness";
import ObligationList from "@/components/msme/ObligationList";
import BenefitList from "@/components/msme/BenefitList";
import { Info, Plug } from "lucide-react";

export default function MSMEIntelligence() {
  const { selected, loading, reload } = useProjectData();
  const [savingStatus, setSavingStatus] = useState(false);

  async function saveUdyamStatus(status) {
    setSavingStatus(true);
    try {
      await base44.entities.BusinessProfile.update(selected.id, { udyam_status: status });
      await logAudit({
        profile_id: selected.id,
        action: "UDYAM_STATUS_UPDATED",
        detail: `Udyam registration status set to ${status} (user-entered).`,
        category: "msme",
        source: "USER_ENTERED"
      });
      await reload();
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  if (!selected) return <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">Select a profile to see its MSME intelligence.</div>;

  const classification = classifyMSME(selected);
  const udyam = assessUdyamReadiness(selected);
  const obligations = msmeObligations(selected, classification);
  const benefits = msmeBenefits(selected, classification);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">MSME Regulatory Intelligence</h1>
        <p className="text-sm text-slate-500">
          Deterministic MSME classification, Udyam readiness, obligations and benefits for {selected.name} — computed from your
          project data, never guessed by AI.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          NIECP-AI provides regulatory intelligence, not legal advice. Class, obligations and eligibility must be confirmed with
          the concerned authority or official portal before you act on them.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ClassificationCard profile={selected} />
        <UdyamReadiness profile={selected} onSaveStatus={saveUdyamStatus} savingStatus={savingStatus} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ObligationList items={obligations} />
        <BenefitList items={benefits} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <Plug className="w-4 h-4 text-blue-600" />
        <div className="text-sm text-slate-600">
          Udyam status: <b>{udyam.registration_status}</b> · matching against the official UDYAM dataset is available in
          Integrations.
        </div>
        <Link to="/integrations" className="ml-auto text-sm text-blue-600 hover:underline">Open Integrations</Link>
      </div>
    </div>
  );
}