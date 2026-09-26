// NIECP-AI Project Twin
// The single, provenance-tagged source of project facts. Every fact is derived
// from the stored BusinessProfile (and its linked government dataset matches) —
// no fact is duplicated into a separate store and none is invented.

import { INDUSTRIES, FACTORS } from "./catalogs";
import { resolveFactor } from "./engine";
import { classifyMSME, formatINR } from "./msme";

export const PROVENANCE = {
  USER_PROVIDED: { label: "User provided", className: "bg-slate-50 text-slate-600 border-slate-200" },
  VERIFIED_GOV_SOURCE: { label: "Verified gov source", className: "bg-teal-50 text-teal-700 border-teal-200" },
  OFFICIAL_API: { label: "Official API", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  AI_INTERPRETATION: { label: "AI interpretation", className: "bg-purple-50 text-purple-700 border-purple-200" },
  REQUIRES_VERIFICATION: { label: "Requires verification", className: "bg-amber-50 text-amber-700 border-amber-200" },
  INFORMATION_UNAVAILABLE: { label: "Information unavailable", className: "bg-rose-50 text-rose-600 border-rose-200" },
  DEMO: { label: "Demo", className: "bg-amber-50 text-amber-800 border-amber-200" }
};

function fact(label, value, provenance = "USER_PROVIDED", note) {
  const missing = value === undefined || value === null || value === "" || value === 0;
  return {
    label,
    value: missing ? "Not provided" : String(value),
    provenance: missing ? "INFORMATION_UNAVAILABLE" : provenance,
    note: missing ? "Required for a complete regulatory assessment." : note
  };
}

function factorFact(label, profile, key) {
  const state = resolveFactor(profile.factors || {}, key);
  const f = FACTORS[key];
  if (state === "YES") return fact(label, "Yes", "USER_PROVIDED", f?.why);
  if (state === "NO") return fact(label, "No", "USER_PROVIDED", f?.why);
  if (state === "REVIEW_REQUIRED") return { label, value: "Not sure", provenance: "REQUIRES_VERIFICATION", note: "Confirm this input to complete the assessment." };
  return { label, value: "Not provided", provenance: "INFORMATION_UNAVAILABLE", note: "Required for a complete regulatory assessment." };
}

// Indicative pollution category — derived, never authoritative.
function pollutionCategory(profile) {
  const yes = (k) => resolveFactor(profile.factors || {}, k) === "YES";
  if (yes("hazardous_waste") || yes("hazardous_materials") || yes("chemical_storage")) return "Red (indicative)";
  if (yes("air_emissions") || yes("water_discharge") || yes("dust") || yes("voc_emissions")) return "Orange (indicative)";
  return "Green (indicative)";
}

function industryName(profile) {
  return INDUSTRIES.find((i) => i.key === profile.industry)?.name || profile.industry;
}

export function buildProjectTwin(profile = {}) {
  const gov = profile.government_data || {};
  const msme = classifyMSME(profile);
  const employees = profile.workforce || profile.employee_count;
  const infra = profile.infrastructure || {};
  const infraOn = Object.entries(infra).filter(([, v]) => v).map(([k]) => k.replace(/_/g, " "));

  const sections = [
    {
      key: "identity",
      title: "Company Identity",
      facts: [
        fact("Company name", profile.name),
        fact("Entity type", profile.entity_type),
        fact("Company identifier (CIN)", gov.mca?.record?.CIN, "OFFICIAL_API", "From the public MCA company dataset match."),
        fact("Sector", industryName(profile)),
        fact("Sub-sector", profile.sub_industry || profile.custom_industry),
        fact("Primary activity", profile.primary_activity),
        fact("Project type", profile.project_type),
        fact("Registration status", profile.registration_status),
        fact("PAN available", profile.pan_available ? "Yes" : "No", "USER_PROVIDED"),
        fact("GST available", profile.gst_available ? "Yes" : "No", "USER_PROVIDED")
      ]
    },
    {
      key: "location",
      title: "Location",
      facts: [
        fact("State", profile.state),
        fact("District", profile.district, "USER_PROVIDED", "May have been enriched from the official pincode directory."),
        fact("City", profile.city),
        fact("PIN code", profile.pincode),
        fact("Industrial area / SEZ", profile.industrial_area),
        fact("Land status", profile.land_status),
        fact("Area type", profile.area_type),
        fact("Premises type", profile.premises_type)
      ]
    },
    {
      key: "scale",
      title: "Scale & Operations",
      facts: [
        fact("Investment", profile.investment ? formatINR(profile.investment) : null),
        fact("Annual turnover", profile.annual_revenue ? formatINR(profile.annual_revenue) : null),
        fact("Employees", employees),
        fact("Production capacity", profile.production_capacity),
        fact("Built-up area", profile.built_up_area),
        fact("Land area", profile.land_area),
        fact("Power requirement", profile.power_requirement),
        fact("Water requirement", profile.water_requirement)
      ]
    },
    {
      key: "environment",
      title: "Environmental & Infrastructure",
      facts: [
        factorFact("Wastewater discharge", profile, "water_discharge"),
        factorFact("Solid waste", profile, "general_waste"),
        factorFact("Hazardous waste", profile, "hazardous_waste"),
        factorFact("Chemicals stored", profile, "chemical_storage"),
        fact("Machinery / infrastructure", infraOn.length ? infraOn.join(", ") : null),
        {
          label: "Pollution category",
          value: pollutionCategory(profile),
          provenance: "REQUIRES_VERIFICATION",
          note: "Indicative only — the category is assigned by the State Pollution Control Board."
        }
      ]
    },
    {
      key: "msme",
      title: "MSME & Government Records",
      facts: [
        fact("Udyam status", profile.udyam_status, "USER_PROVIDED"),
        {
          label: "MSME class",
          value: msme.category === "INSUFFICIENT_DATA" ? null : msme.category_label,
          provenance: "REQUIRES_VERIFICATION",
          note: "Computed from your investment and turnover — confirm in the Udyam portal."
        },
        fact("UDYAM dataset match", gov.udyam?.record ? "Linked (government dataset match)" : null, "OFFICIAL_API", gov.udyam?.record ? "Source-backed from data.gov.in — not a registration verification." : undefined),
        fact("MCA dataset match", gov.mca?.record ? "Linked (public dataset match)" : null, "OFFICIAL_API", gov.mca?.record ? "Public MCA dataset match — not an authorized MCA verification." : undefined)
      ]
    },
    {
      key: "stage",
      title: "Stage & Assessment",
      facts: [
        fact("Project stage", profile.project_stage),
        fact("Production status", profile.production_status),
        fact("Construction status", profile.premises_type || profile.project_stage),
        fact("AI assessment", profile.ai_analysis?.timestamp ? `Run on ${new Date(profile.ai_analysis.timestamp).toLocaleDateString()}` : null, "AI_INTERPRETATION", profile.ai_analysis?.note)
      ]
    }
  ];

  const all = sections.flatMap((s) => s.facts);
  const unavailable = all.filter((f) => f.provenance === "INFORMATION_UNAVAILABLE").length;
  const byProvenance = {};
  all.forEach((f) => { byProvenance[f.provenance] = (byProvenance[f.provenance] || 0) + 1; });

  return {
    sections,
    total: all.length,
    unavailable,
    verified_from_gov: all.filter((f) => f.provenance === "OFFICIAL_API" || f.provenance === "VERIFIED_GOV_SOURCE").length,
    completeness: all.length ? Math.round(((all.length - unavailable) / all.length) * 100) : 0,
    byProvenance
  };
}