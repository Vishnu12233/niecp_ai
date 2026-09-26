import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/niecp/profileContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Trash2, Edit3, MapPin, Factory, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { computeApprovals } from "@/lib/niecp/engine";
import { DEMO_SCENARIOS } from "@/lib/niecp/demoScenarios";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Projects() {
  const { profiles, selected, selectProfile, loadProfiles, loading } = useProfile();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(null);

  async function loadDemo(scenario) {
    setLoadingDemo(scenario.name);
    try {
      const created = await base44.entities.BusinessProfile.create(scenario.data);
      const approvals = computeApprovals(created);
      await base44.entities.ProjectApproval.bulkCreate(approvals.map((a) => ({ ...a, profile_id: created.id })));
      await base44.entities.AuditLog.create({ profile_id: created.id, action: "demo_loaded", detail: scenario.name, category: "profile" });
      await loadProfiles();
      selectProfile(created.id);
      navigate("/dashboard");
    } catch (e) {
      alert("Could not load demo: " + (e?.message || e));
    } finally { setLoadingDemo(null); }
  }

  async function del(p) {
    if (!confirm(`Delete profile "${p.name}"? This removes its approvals and documents.`)) return;
    setDeleting(p.id);
    try {
      await base44.entities.ProjectApproval.deleteMany({ profile_id: p.id });
      await base44.entities.ProjectDocument.deleteMany({ profile_id: p.id });
      await base44.entities.Application.deleteMany({ profile_id: p.id });
      await base44.entities.BusinessProfile.delete(p.id);
      await loadProfiles();
    } finally { setDeleting(null); }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading profiles…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Each profile is fully isolated. Documents and approvals never cross profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!!loadingDemo}>
                {loadingDemo ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {loadingDemo ? `Loading ${loadingDemo}…` : "Load Demo Scenario"} <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {DEMO_SCENARIOS.map((s) => (
                <DropdownMenuItem key={s.name} onClick={() => loadDemo(s)} className="flex flex-col items-start py-2">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-slate-500">{s.tag}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/onboarding")}><Plus className="w-4 h-4 mr-1" /> New Project</Button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No projects yet. Create your first business profile.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${selected?.id === p.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                <button disabled={deleting === p.id} onClick={() => del(p)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="font-semibold text-slate-900 mt-3">{p.name}</div>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}, {p.state}</div>
                <div className="flex items-center gap-1"><Factory className="w-3 h-3" /> {p.sub_industry || p.industry}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1" onClick={() => { selectProfile(p.id); navigate("/dashboard"); }}>Open</Button>
                <Button size="sm" variant="outline" onClick={() => { selectProfile(p.id); navigate("/approvals"); }}><Edit3 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}