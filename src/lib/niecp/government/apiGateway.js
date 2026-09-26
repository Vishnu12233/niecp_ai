// NIECP Government API gateway (frontend). Thin, typed wrappers over the
// secure governmentApi backend function. No credentials ever appear here —
// the backend reads secrets server-side. Consent is recorded before any
// government data is linked to a project.

import { base44 } from "@/api/base44Client";
import { logAudit } from "./manager";

async function invoke(operation, params = {}) {
  const res = await base44.functions.invoke("governmentApi", { operation, params });
  return res?.data || {};
}

export async function getIntegrationStatus() {
  return invoke("status");
}

export async function testIntegration(providerKey) {
  return invoke("test", { provider: providerKey });
}

export async function pincodeLookup(pincode) {
  return invoke("pincode_lookup", { pincode });
}

export async function udyamSearch({ state, district, enterprise_name, pincode }) {
  return invoke("udyam_search", { state, district, enterprise_name, pincode });
}

// MCA Company Master Data — PUBLIC GOVERNMENT DATASET match, never claimed as
// an authorized MCA verification.
export async function mcaSearch({ cin, company_name, state }) {
  return invoke("mca_search", { cin, company_name, state });
}

// CPCB air-quality observations — environmental CONTEXT only.
export async function cpcbAirQuery({ state, city }) {
  return invoke("cpcb_air_query", { state, city });
}

// CPCB surface-water observations — HISTORICAL environmental context only.
export async function surfaceWaterQuery({ state, district }) {
  return invoke("surface_water_query", { state, district });
}

// Enrich the project location from an official pincode lookup result.
export async function applyPincodeToProfile(profile, { pincode, state, district }) {
  const updated = await base44.entities.BusinessProfile.update(profile.id, {
    pincode: pincode || profile.pincode,
    state: state || profile.state,
    district: district || profile.district
  });
  await logAudit({
    profile_id: profile.id,
    action: "LOCATION_ENRICHED",
    detail: `Pincode ${pincode} resolved to ${state || "?"} / ${district || "?"} via the data.gov.in pincode directory (Department of Posts).`,
    category: "government_api",
    integration_mode: "LIVE",
    provider: "India Post Pincode Directory",
    source: "DATA_GOV_IN"
  });
  return updated;
}

// Record explicit user consent, then link the selected government dataset
// record to the project. Stored as a reference — clearly a dataset match,
// never a registration verification.
export async function linkGovernmentRecordWithConsent({ profile, providerKey, providerName, organization, service, record }) {
  const consent = await base44.entities.Consent.create({
    organization_id: organization,
    project_id: profile.id,
    provider: providerName,
    service,
    purpose: "Link the selected government dataset record to this project for regulatory profile enrichment.",
    data_categories: ["Public government dataset record (data.gov.in)"],
    status: "GRANTED",
    expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  });
  const governmentData = { ...(profile.government_data || {}) };
  governmentData[providerKey] = {
    record,
    verification_status: "GOVERNMENT_DATASET_MATCH",
    source: "data.gov.in",
    organization,
    service,
    linked_at: new Date().toISOString(),
    consent_id: consent.id
  };
  await base44.entities.BusinessProfile.update(profile.id, { government_data: governmentData });
  await logAudit({
    profile_id: profile.id,
    action: "GOVERNMENT_DATA_LINKED",
    detail: `${providerName} dataset match linked with consent ${consent.id}. Stored as GOVERNMENT_DATASET_MATCH — not a verification.`,
    category: "government_api",
    integration_mode: "LIVE",
    provider: providerName,
    source: "DATA_GOV_IN"
  });
  return { consent, governmentData };
}