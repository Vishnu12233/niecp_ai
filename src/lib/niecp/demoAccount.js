// SIH 2026 demo account + auto-seeded demo project.
//
// The demo user is a REAL account in the app's authentication system and
// signs in through the normal email/password login flow — there is no
// frontend-only or bypassed login. The demo password is intentionally
// public, but it still authenticates through the real auth system.
//
// The demo project is created BY the demo user after login, so RLS
// (created_by_id) keeps it fully isolated from every other account.

import { base44 } from "@/api/base44Client";
import { computeApprovals } from "@/lib/niecp/engine";

export const DEMO_ACCOUNT = {
  email: "demo@niecp-ai.app",
  password: "NIECP@Demo2026!"
};

export function isDemoUser(email) {
  return !!email && email.toLowerCase() === DEMO_ACCOUNT.email;
}

const f = (ai, user, confidence, reason, source) => ({ ai_value: ai, user_value: user, confidence, reason, source });

// ABC Electronics Manufacturing — realistic, internally consistent SIH demo
// project: a ₹5 Crore electronics manufacturing unit in Tamil Nadu. The
// declared factors drive the deterministic rule engine, so the derived
// approvals are exactly what this project implies (e.g. E-Waste
// Authorization applies; Boiler Approval does NOT, because boiler use = NO).
export const DEMO_PROJECT = {
  name: "ABC Electronics Manufacturing Pvt. Ltd.",
  entity_type: "Private Limited",
  founder_name: "Arjun Balaji",
  registration_status: "Registered",
  pan_available: true,
  gst_available: true,
  udyam_status: "Registered",
  contact_email: "info@abcelectronics.in",
  contact_phone: "+91 98400 12345",
  description: "New electronics manufacturing unit producing PCB assemblies and electronic control boards for consumer and industrial products.",
  website: "https://www.abcelectronics.in",
  primary_activity: "Electronics manufacturing",
  products_services: "PCB assemblies, electronic control boards",
  country: "India", state: "Tamil Nadu", district: "Chennai", city: "Chennai",
  pincode: "600130", industrial_area: "SIPCOT Siruseri",
  area_type: "Industrial", premises_type: "Leased", land_status: "Industrial",
  industry: "electronics",
  sub_industry: "PCB Assembly & Electronics Manufacturing",
  investment: 50000000, // ₹5 Crore
  annual_revenue: 0,
  production_capacity: "600,000 units/yr",
  workforce: 75,
  built_up_area: "25000 sqft", land_area: "0.6 acre",
  project_stage: "Commissioning", production_status: "Not started",
  project_type: "New Manufacturing Facility",
  employee_count: 75,
  power_requirement: "250 kW",
  water_requirement: "Moderate (approx. 10 KLD)",
  export_import_value: "₹1.2 crore exports (planned)",
  infrastructure: {
    factory_premises: true, production_machinery: true, chemical_storage: true,
    fire_protection: true, power_connection: true, testing_lab: true, waste_storage: true
  },
  factors: {
    factory_premises: f("YES", "YES", 95, "Factory premises declared.", "rule"),
    machinery_safety: f("YES", "YES", 90, "SMT pick-and-place, reflow ovens and testing machines in use.", "rule"),
    worker_safety: f("YES", "YES", 90, "Assembly-line machinery and chemical exposure hazards.", "ai"),
    e_waste: f("YES", "YES", 92, "Rejected PCBs and electronic scrap are generated.", "ai"),
    hazardous_materials: f("YES", "YES", 90, "Solder paste, flux and cleaning solvents are hazardous substances.", "ai"),
    hazardous_waste: f("YES", "YES", 88, "Solder dross, spent solvent and contaminated wipes are hazardous waste.", "ai"),
    chemical_storage: f("YES", "YES", 95, "Soldering chemicals and solvents stored on-site.", "rule"),
    general_waste: f("YES", "YES", 80, "Packaging, plastics and production scrap generated.", "ai"),
    fire_safety: f("YES", "YES", 93, "Combustible packaging, solvents and high electrical loads.", "ai"),
    high_risk_operations: f("YES", "YES", 88, "Reflow ovens and hot processes on the assembly line.", "ai"),
    electrical_safety: f("YES", "YES", 85, "250 kW power connection and industrial machinery.", "rule"),
    labour_compliance: f("YES", "YES", 95, "75 workers to be employed.", "rule"),
    product_standards: f("YES", "YES", 80, "Electronic products may require BIS certification.", "ai"),
    export_activity: f("YES", "YES", 95, "Export activity declared.", "rule"),
    import_activity: f("YES", "YES", 85, "Electronic components imported for assembly.", "ai"),
    gst_applicable: f("YES", "YES", 99, "Taxable business turnover.", "rule"),
    air_emissions: f("NO", "NO", 90, "No significant stack emissions; soldering fumes extracted locally.", "ai"),
    water_discharge: f("NO", "NO", 92, "No trade effluent discharged from premises.", "ai"),
    boiler_use: f("NO", "NO", 96, "No steam boiler used in PCB assembly.", "ai"),
    battery_handling: f("NO", "NO", 88, "No battery handling or storage on-site.", "ai")
  },
  ai_analysis: { source: "demo", note: "Pre-seeded SIH demo project for ABC Electronics Manufacturing.", timestamp: new Date().toISOString() },
  stage: "assessed"
};

// Creates the demo project under the currently logged-in demo user
// (RLS: created_by_id = demo user → fully isolated from real users).
// Derives the project-specific approvals from the same deterministic
// rule engine used everywhere else in the app.
export async function ensureDemoProject() {
  const created = await base44.entities.BusinessProfile.create(DEMO_PROJECT);
  const approvals = computeApprovals(created);
  if (approvals.length > 0) {
    await base44.entities.ProjectApproval.bulkCreate(
      approvals.map((a) => ({ ...a, profile_id: created.id }))
    );
  }
  await base44.entities.AuditLog.create({
    profile_id: created.id,
    action: "demo_project_seeded",
    detail: "ABC Electronics demo project auto-created for the SIH demo account",
    category: "profile"
  });
  return created;
}