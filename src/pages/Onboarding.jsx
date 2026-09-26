import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/niecp/profileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INDUSTRIES, STATES, FACTORS, getRelevantFactors } from "@/lib/niecp/catalogs";
import { computeApprovals, computeDocumentRequirements, computeReadiness, computeNextBestAction, computeBlockers } from "@/lib/niecp/engine";
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2, Info, HelpCircle } from "lucide-react";

const STEPS = ["Business Identity", "Location", "Industry & Activity", "Scale", "Infrastructure", "AI Regulatory Assessment"];

const INFRA_OPTIONS = [
  { key: "factory_premises", label: "Factory Premises" },
  { key: "office_premises", label: "Office Premises" },
  { key: "warehouse", label: "Warehouse" },
  { key: "production_machinery", label: "Production Machinery" },
  { key: "heavy_machinery", label: "Heavy Machinery" },
  { key: "power_connection", label: "Power Connection" },
  { key: "transformer", label: "Transformer" },
  { key: "dg_set", label: "DG Set" },
  { key: "boiler", label: "Boiler" },
  { key: "steam_system", label: "Steam System" },
  { key: "pressure_equipment", label: "Pressure Equipment" },
  { key: "chemical_storage", label: "Chemical Storage" },
  { key: "fuel_storage", label: "Fuel Storage" },
  { key: "gas_storage", label: "Gas Storage" },
  { key: "battery_storage", label: "Battery Storage" },
  { key: "cold_storage", label: "Cold Storage" },
  { key: "testing_lab", label: "Testing Laboratory" },
  { key: "clean_room", label: "Clean Room" },
  { key: "etp_stp", label: "ETP / STP" },
  { key: "water_treatment", label: "Water Treatment" },
  { key: "waste_storage", label: "Waste Storage" },
  { key: "high_temp_equipment", label: "High-temperature Equipment" },
  { key: "fire_protection", label: "Fire Protection System" }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { loadProfiles, selectProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [whyOpen, setWhyOpen] = useState(null);

  const [form, setForm] = useState({
    name: "", entity_type: "", founder_name: "", registration_status: "Not Registered",
    pan_available: false, gst_available: false, udyam_status: "", contact_email: "", contact_phone: "",
    description: "", website: "", primary_activity: "", products_services: "",
    country: "India", state: "", district: "", city: "", pincode: "", industrial_area: "",
    area_type: "Urban", premises_type: "Owned", land_status: "",
    industry: "", sub_industry: "", custom_industry: "",
    investment: 0, annual_revenue: 0, production_capacity: "", workforce: 0, built_up_area: "",
    land_area: "", project_stage: "Planning", production_status: "Not Started", project_type: "New",
    employee_count: 0, power_requirement: "", water_requirement: "", export_import_value: "",
    infrastructure: {},
    factors: {},
    stage: "onboarding"
  });

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  const relevantFactors = useMemo(() => {
    if (!form.industry) return [];
    return getRelevantFactors(form.industry, form.infrastructure, { export_import_value: form.export_import_value });
  }, [form.industry, form.infrastructure, form.export_import_value]);

  const industryObj = INDUSTRIES.find((i) => i.key === form.industry);

  function toggleInfra(key) {
    setForm((f) => ({ ...f, infrastructure: { ...f.infrastructure, [key]: !f.infrastructure[key] } }));
  }

  function setFactor(key, value) {
    setForm((f) => ({
      ...f,
      factors: { ...f.factors, [key]: { ...(f.factors[key] || {}), user_value: value } }
    }));
  }

  async function runAIAssessment() {
    setAnalyzing(true);
    setAiError(null);
    try {
      const res = await base44.functions.invoke("aiAnalysis", {
        description: form.description,
        industry: form.industry,
        sub_industry: form.sub_industry,
        infrastructure: form.infrastructure,
        scale: { investment: form.investment, workforce: form.workforce, export_import_value: form.export_import_value },
        relevantFactors
      });
      const data = res?.data || res;
      const aiFactors = data?.factors || {};
      setForm((f) => {
        const merged = { ...f.factors };
        Object.entries(aiFactors).forEach(([k, v]) => {
          merged[k] = { ai_value: v.ai_value, confidence: v.confidence, reason: v.reason, source: v.source, user_value: merged[k]?.user_value };
        });
        return { ...f, factors: merged, ai_analysis: { source: data.source, note: data.note, timestamp: new Date().toISOString() } };
      });
    } catch (e) {
      setAiError("AI assessment unavailable. You can still set each factor manually below.");
    } finally {
      setAnalyzing(false);
    }
  }

  function canProceed() {
    if (step === 0) return form.name && form.description;
    if (step === 1) return form.state && form.city;
    if (step === 2) return form.industry && (form.industry !== "other" ? form.sub_industry : form.custom_industry);
    if (step === 3) return form.project_stage;
    if (step === 4) return true;
    return true;
  }

  async function saveAndFinish() {
    setSaving(true);
    try {
      const payload = { ...form, stage: "assessed" };
      const created = await base44.entities.BusinessProfile.create(payload);
      // Compute approvals + persist
      const approvals = computeApprovals(created);
      await base44.entities.ProjectApproval.bulkCreate(
        approvals.map((a) => ({ ...a, profile_id: created.id }))
      );
      await base44.entities.AuditLog.create({ profile_id: created.id, action: "profile_created", detail: form.name, category: "profile" });
      await loadProfiles();
      selectProfile(created.id);
      navigate("/dashboard");
    } catch (e) {
      alert("Could not save profile: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Business Profile</h1>
        <p className="text-sm text-slate-500">Create a project-specific regulatory roadmap in 6 steps.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${i === step ? "bg-blue-600 text-white" : i < step ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
              {i < step ? <Check className="w-3 h-3" /> : <span className="w-4 text-center">{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Business Name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ABC Electronics" /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Entity Type"><Input value={form.entity_type} onChange={(e) => set("entity_type", e.target.value)} placeholder="Private Limited" /></Field>
              <Field label="Founder / Applicant Name"><Input value={form.founder_name} onChange={(e) => set("founder_name", e.target.value)} /></Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Registration Status">
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.registration_status} onChange={(e) => set("registration_status", e.target.value)}>
                  <option>Not Registered</option><option>Registered</option><option>In Process</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 mt-7"><input type="checkbox" checked={form.pan_available} onChange={(e) => set("pan_available", e.target.checked)} /> PAN available</label>
              <label className="flex items-center gap-2 mt-7"><input type="checkbox" checked={form.gst_available} onChange={(e) => set("gst_available", e.target.checked)} /> GST available</label>
            </div>
            <Field label="Business Description * (natural language — the AI uses this)">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="We manufacture PCBs and assemble electronic control boards for consumer electronics." />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Primary Business Activity"><Input value={form.primary_activity} onChange={(e) => set("primary_activity", e.target.value)} /></Field>
              <Field label="Products / Services"><Input value={form.products_services} onChange={(e) => set("products_services", e.target.value)} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Contact Email"><Input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></Field>
              <Field label="Contact Phone"><Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} /></Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Country"><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
              <Field label="State *">
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="District"><Input value={form.district} onChange={(e) => set("district", e.target.value)} /></Field>
              <Field label="City *"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="PIN Code"><Input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} /></Field>
              <Field label="Industrial Area / SEZ / SIPCOT"><Input value={form.industrial_area} onChange={(e) => set("industrial_area", e.target.value)} /></Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Area Type">
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.area_type} onChange={(e) => set("area_type", e.target.value)}>
                  <option>Urban</option><option>Rural</option>
                </select>
              </Field>
              <Field label="Premises Type">
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.premises_type} onChange={(e) => set("premises_type", e.target.value)}>
                  <option>Owned</option><option>Leased</option><option>Rented</option>
                </select>
              </Field>
              <Field label="Land Status"><Input value={form.land_status} onChange={(e) => set("land_status", e.target.value)} /></Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Industry *">
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i.key} value={i.key}>{i.name}</option>)}
              </select>
            </Field>
            {form.industry && form.industry !== "other" && industryObj?.sub?.length > 0 && (
              <Field label="Sub-Industry *">
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.sub_industry} onChange={(e) => set("sub_industry", e.target.value)}>
                  <option value="">Select sub-industry</option>
                  {industryObj.sub.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            )}
            {form.industry === "other" && (
              <Field label="Custom Industry Name *"><Input value={form.custom_industry} onChange={(e) => set("custom_industry", e.target.value)} placeholder="Describe your industry" /></Field>
            )}
            <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              The selected industry and infrastructure determine which regulatory factors are assessed. You can override any AI suggestion later.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Estimated Project Investment (₹)"><Input type="number" value={form.investment} onChange={(e) => set("investment", Number(e.target.value))} /></Field>
              <Field label="Annual Revenue (₹)"><Input type="number" value={form.annual_revenue} onChange={(e) => set("annual_revenue", Number(e.target.value))} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Annual Production Capacity"><Input value={form.production_capacity} onChange={(e) => set("production_capacity", e.target.value)} /></Field>
              <Field label="Expected Workforce"><Input type="number" value={form.workforce} onChange={(e) => set("workforce", Number(e.target.value))} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Total Built-up Area"><Input value={form.built_up_area} onChange={(e) => set("built_up_area", e.target.value)} /></Field>
              <Field label="Land Area"><Input value={form.land_area} onChange={(e) => set("land_area", e.target.value)} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Project Stage">
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.project_stage} onChange={(e) => set("project_stage", e.target.value)}>
                  <option>Planning</option><option>Under Construction</option><option>Operational</option><option>Expansion</option>
                </select>
              </Field>
              <Field label="Project Type">
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.project_type} onChange={(e) => set("project_type", e.target.value)}>
                  <option>New</option><option>Expansion</option><option>Modification</option>
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Power Requirement"><Input value={form.power_requirement} onChange={(e) => set("power_requirement", e.target.value)} /></Field>
              <Field label="Water Requirement"><Input value={form.water_requirement} onChange={(e) => set("water_requirement", e.target.value)} /></Field>
            </div>
            <Field label="Export / Import Value (if applicable)"><Input value={form.export_import_value} onChange={(e) => set("export_import_value", e.target.value)} placeholder="e.g. ₹50 lakh exports" /></Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Select the infrastructure present at your project. This directly influences which regulatory factors apply.</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {INFRA_OPTIONS.map((o) => (
                <label key={o.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${form.infrastructure[o.key] ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="checkbox" checked={!!form.infrastructure[o.key]} onChange={() => toggleInfra(o.key)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">AI Regulatory Assessment</h3>
                <p className="text-sm text-slate-500">AI suggests factors based on your project. Confirm or override each one.</p>
              </div>
              <Button onClick={runAIAssessment} disabled={analyzing} className="bg-blue-600 hover:bg-blue-700">
                {analyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {analyzing ? "Analyzing..." : "Run AI Assessment"}
              </Button>
            </div>
            {aiError && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{aiError}</div>}
            {form.ai_analysis?.note && <div className="text-xs text-slate-500 bg-slate-50 border rounded-lg p-3">{form.ai_analysis.note}</div>}
            {relevantFactors.length === 0 && <div className="text-sm text-slate-400">Complete the previous steps to see relevant factors.</div>}
            <div className="space-y-3">
              {relevantFactors.map((fk) => {
                const f = FACTORS[fk];
                const val = form.factors[fk] || {};
                const final = val.user_value && val.user_value !== "NOT_SURE" ? val.user_value : val.ai_value;
                return (
                  <div key={fk} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{f.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{f.explanation}</div>
                      </div>
                      {val.ai_value && (
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-400">AI suggests</div>
                          <div className="text-sm font-semibold text-purple-600">{val.ai_value}</div>
                          {val.confidence && <div className="text-[10px] text-slate-400">{val.confidence}% confidence</div>}
                        </div>
                      )}
                    </div>
                    {val.reason && <div className="text-xs text-slate-500 mt-2 bg-slate-50 rounded p-2">{val.reason}</div>}
                    <div className="flex items-center gap-2 mt-3">
                      {["YES", "NO", "NOT_SURE"].map((opt) => (
                        <button key={opt} onClick={() => setFactor(fk, opt)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border ${val.user_value === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                          {opt === "NOT_SURE" ? "NOT SURE" : opt}
                        </button>
                      ))}
                      <button onClick={() => setWhyOpen(whyOpen === fk ? null : fk)} className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> Why?
                      </button>
                    </div>
                    {whyOpen === fk && (
                      <div className="mt-2 text-xs text-slate-500 bg-blue-50 rounded p-2 space-y-1">
                        <div><b>Examples:</b> {f.examples}</div>
                        <div><b>Why it matters:</b> {f.why}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="bg-blue-600 hover:bg-blue-700">
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={saveAndFinish} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            Save & Analyze Project
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}