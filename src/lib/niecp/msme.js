// NIECP-AI MSME Regulatory Intelligence (deterministic)
// MSME classification, Udyam registration readiness, obligations and benefits.
// All decisions are rule-driven — AI never overrides these rules.
// This is regulatory intelligence, not legal advice; figures are indicative
// and must be confirmed with the concerned authority or official portal.

export const MSME_RULE_VERSION = "niecp-msme-v1.0";
export const MSME_LAST_VERIFIED = "2026-09-01";
export const MSME_SOURCE_URL = "https://msme.gov.in/";
export const UDYAM_PORTAL_URL = "https://udyamregistration.gov.in/";

const CR = 10000000; // 1 crore
const LAKH = 100000;

// Revised MSME classification limits (Ministry of MSME, effective 1 April 2025).
// Both the investment and the turnover limit must be met.
export const MSME_THRESHOLDS = [
  { category: "MICRO", label: "Micro Enterprise", investment_limit: 2.5 * CR, turnover_limit: 10 * CR },
  { category: "SMALL", label: "Small Enterprise", investment_limit: 25 * CR, turnover_limit: 100 * CR },
  { category: "MEDIUM", label: "Medium Enterprise", investment_limit: 125 * CR, turnover_limit: 500 * CR }
];

const MANUFACTURING_INDUSTRIES = [
  "food_processing", "textile", "automobile", "electronics", "chemicals",
  "plastics", "printing", "wood", "mining", "energy"
];

export function formatINR(v) {
  const n = Number(v) || 0;
  if (n <= 0) return "—";
  if (n >= CR) return `₹${(n / CR).toFixed(n % CR === 0 ? 0 : 2)} Cr`;
  if (n >= LAKH) return `₹${(n / LAKH).toFixed(n % LAKH === 0 ? 0 : 1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// Deterministic MSME class from the project's investment and annual turnover.
export function classifyMSME(profile = {}) {
  const investment = Number(profile.investment) || 0;
  const turnover = Number(profile.annual_revenue) || 0;
  const base = {
    rule_version: MSME_RULE_VERSION,
    last_verified: MSME_LAST_VERIFIED,
    source_url: MSME_SOURCE_URL,
    investment, turnover,
    investment_label: formatINR(investment),
    turnover_label: formatINR(turnover),
    thresholds: MSME_THRESHOLDS,
    limit: null,
    meets_investment: null,
    meets_turnover: null
  };

  if (investment <= 0 || turnover <= 0) {
    return {
      ...base,
      category: "INSUFFICIENT_DATA",
      category_label: "Not enough data",
      explanation: "Add your investment in plant & machinery/equipment and your annual turnover to see the MSME class."
    };
  }

  for (const t of MSME_THRESHOLDS) {
    if (investment <= t.investment_limit && turnover <= t.turnover_limit) {
      return {
        ...base,
        category: t.category,
        category_label: t.label,
        limit: t,
        meets_investment: true,
        meets_turnover: true,
        explanation: `Both limits for ${t.label} are met — investment within ${formatINR(t.investment_limit)} and turnover within ${formatINR(t.turnover_limit)}.`
      };
    }
  }

  const top = MSME_THRESHOLDS[MSME_THRESHOLDS.length - 1];
  return {
    ...base,
    category: "NOT_MSME",
    category_label: "Above MSME limits",
    limit: top,
    meets_investment: investment <= top.investment_limit,
    meets_turnover: turnover <= top.turnover_limit,
    explanation: "The figures entered are above the Medium limits, so the enterprise falls outside the MSME classification."
  };
}

// Udyam registration readiness — what is already known and what still needs input.
export function assessUdyamReadiness(profile = {}) {
  const employees = Number(profile.workforce) || Number(profile.employee_count) || 0;
  const items = [
    { key: "name", label: "Business name as it should appear", status: profile.name ? "READY" : "MISSING", required: true, hint: "Udyam issues the certificate in this name." },
    { key: "entity_type", label: "Enterprise type (Proprietorship / Partnership / Company / LLP)", status: profile.entity_type ? "READY" : "MISSING", required: true },
    { key: "pan", label: "PAN of the business or owner", status: profile.pan_available ? "READY" : "MISSING", required: true, hint: "Udyam validates PAN against Income Tax records." },
    { key: "aadhaar", label: "Aadhaar of the owner / authorised signatory", status: "VERIFY", required: true, hint: "Verified by Udyam through Aadhaar OTP — never stored by NIECP." },
    { key: "activity", label: "Primary activity (Manufacturing / Service / Trading)", status: (profile.primary_activity || profile.industry) ? "READY" : "MISSING", required: true },
    { key: "address", label: "Plant / business address (state, district, city)", status: (profile.state && profile.district && profile.city) ? "READY" : (profile.state && profile.city ? "VERIFY" : "MISSING"), required: true },
    { key: "pincode", label: "PIN code", status: profile.pincode ? "READY" : "MISSING", required: true },
    { key: "contact", label: "Contact email and mobile", status: (profile.contact_email && profile.contact_phone) ? "READY" : ((profile.contact_email || profile.contact_phone) ? "VERIFY" : "MISSING"), required: true },
    { key: "scale", label: "Investment and turnover figures", status: (Number(profile.investment) > 0 && Number(profile.annual_revenue) > 0) ? "READY" : "MISSING", required: true, hint: "Udyam derives these from PAN, GST and ITR data where available." },
    { key: "workforce", label: "Number of employees", status: employees > 0 ? "READY" : "MISSING", required: true },
    { key: "gst", label: "GSTIN (auto-linked where registered)", status: profile.gst_available ? "READY" : "VERIFY", required: false, hint: "Not mandatory for Udyam, but it is linked automatically when you have one." },
    { key: "bank", label: "Enterprise bank account", status: "VERIFY", required: false, hint: "Needed for scheme benefits; verified by your bank, not by NIECP." }
  ];
  const required = items.filter((i) => i.required);
  const ready = required.filter((i) => i.status === "READY").length;
  return {
    items,
    ready,
    total: required.length,
    verify: items.filter((i) => i.status === "VERIFY").length,
    readiness: required.length ? Math.round((ready / required.length) * 100) : 0,
    ready_to_register: required.every((i) => i.status === "READY"),
    registration_status: profile.udyam_status || "Not Registered",
    portal_url: UDYAM_PORTAL_URL,
    rule_version: MSME_RULE_VERSION,
    last_verified: MSME_LAST_VERIFIED
  };
}

// MSME-specific obligations triggered by the project's confirmed profile.
export function msmeObligations(profile = {}, classification = classifyMSME(profile)) {
  const employees = Number(profile.workforce) || Number(profile.employee_count) || 0;
  const manufacturing = MANUFACTURING_INDUSTRIES.includes(profile.industry);
  const turnover = Number(profile.annual_revenue) || 0;
  const isMSME = ["MICRO", "SMALL", "MEDIUM"].includes(classification.category);

  const list = [
    {
      key: "udyam", name: "Udyam Registration", authority: "Ministry of MSME",
      applies: profile.udyam_status !== "Registered",
      why: "Free, online, Aadhaar + PAN based. Most MSME benefits and payment protections require a valid Udyam registration.",
      source_url: UDYAM_PORTAL_URL
    },
    {
      key: "gst", name: "GST Registration", authority: "GST Department",
      applies: !profile.gst_available && turnover > 2000000,
      why: "Required above the threshold (₹40 lakh for goods / ₹20 lakh for services in most states). Composition scheme and quarterly filing are available to small businesses.",
      source_url: "https://www.gst.gov.in/"
    },
    {
      key: "epf", name: "EPF Registration", authority: "Employees' Provident Fund Organisation",
      applies: employees >= 20,
      why: `Applies at 20 or more employees (your figure: ${employees}).`,
      source_url: "https://www.epfindia.gov.in/"
    },
    {
      key: "esi", name: "ESI Registration", authority: "Employees' State Insurance Corporation",
      applies: employees >= 10,
      why: `Applies at 10 or more employees within the wage limit (your figure: ${employees}).`,
      source_url: "https://www.esic.gov.in/"
    },
    {
      key: "factories", name: "Factories Act Registration / Licence", authority: "State Directorate of Industrial Safety & Health",
      applies: manufacturing && employees >= 10,
      why: "Applies to manufacturing premises with 10 or more workers (with power) or 20 or more (without power).",
      source_url: "https://labour.tn.gov.in/"
    },
    {
      key: "shops", name: "Shop & Establishment Registration", authority: "State Labour Department",
      applies: true,
      why: "Applies to commercial establishments in most states; renewals are periodic.",
      source_url: "https://labour.tn.gov.in/"
    },
    {
      key: "ptax", name: "Professional Tax Registration", authority: "State Commercial Tax Department",
      applies: true,
      why: "Levied by several states on employers and employees — confirm your state's rules.",
      source_url: "https://www.tn.gov.in/"
    },
    {
      key: "msme1", name: "MSME-1 half-yearly return (your buyers' obligation)", authority: "Ministry of Corporate Affairs",
      applies: isMSME,
      why: "Companies must report outstanding dues to MSME suppliers beyond 45 days. It protects your receivables — the MSMED Act requires payment within 45 days.",
      source_url: "https://www.mca.gov.in/"
    }
  ];

  return list.map((x) => ({ ...x, status: x.applies ? "ACTION_NEEDED" : "NOT_APPLICABLE" }));
}

// MSME benefits and protections the project is eligible for.
export function msmeBenefits(profile = {}, classification = classifyMSME(profile)) {
  const isMSME = ["MICRO", "SMALL", "MEDIUM"].includes(classification.category);
  const newUnit = ["Planning", "Under Construction"].includes(profile.project_stage) || profile.project_type === "New";

  return [
    {
      key: "cgtmse", name: "Collateral-free credit guarantee (CGTMSE)", provider: "CGTMSE, Ministry of MSME",
      applies: isMSME, summary: "Credit guarantee cover that lets banks lend to eligible MSEs without collateral.",
      source_url: "https://www.cgtmse.in/"
    },
    {
      key: "priority_sector", name: "Priority sector lending", provider: "Reserve Bank of India",
      applies: isMSME, summary: "Banks have mandated lending targets for MSMEs, which improves access and pricing.",
      source_url: "https://www.rbi.org.in/"
    },
    {
      key: "samadhaan", name: "Delayed payment recovery (MSME SAMADHAAN)", provider: "Ministry of MSME / MSEFC",
      applies: isMSME, summary: "Buyers must pay within 45 days; delayed payments attract compound interest, and MSME SAMADHAAN allows you to file a case before the MSE Facilitation Council.",
      source_url: "https://samadhaan.msme.gov.in/"
    },
    {
      key: "procurement", name: "Public procurement preference (25%)", provider: "GeM / Ministry of MSME",
      applies: isMSME, summary: "25% of government procurement is reserved for MSEs, with sub-targets of 4% for SC/ST and 3% for women-owned enterprises.",
      source_url: "https://gem.gov.in/"
    },
    {
      key: "treds", name: "Receivable financing on TReDS", provider: "RBI-licensed TReDS platforms",
      applies: isMSME, summary: "Discount your accepted invoices from large buyers to improve working capital.",
      source_url: "https://www.rbi.org.in/"
    },
    {
      key: "zed", name: "MSME Sustainable ZED certification", provider: "Ministry of MSME",
      applies: isMSME, summary: "Certification support for zero-defect, zero-effect manufacturing with cost reimbursement by enterprise class.",
      source_url: "https://zed.msme.gov.in/"
    },
    {
      key: "iso_patent", name: "Quality certification & patent reimbursement", provider: "Ministry of MSME",
      applies: isMSME, summary: "Reimbursement schemes for ISO/quality certification and for patent and IP registration costs.",
      source_url: "https://msme.gov.in/"
    },
    {
      key: "pmegp", name: "PMEGP subsidy for new units", provider: "KVIC / Ministry of MSME",
      applies: isMSME && newUnit, summary: "Margin money subsidy for setting up new micro enterprises in manufacturing and service activities.",
      source_url: "https://www.kviconline.gov.in/pmegpeportal/"
    },
    {
      key: "mudra", name: "Mudra loans", provider: "MUDRA Ltd.",
      applies: true, summary: "Collateral-free loans for micro and small business activity across Shishu, Kishore and Tarun categories.",
      source_url: "https://www.mudra.org.in/"
    },
    {
      key: "export", name: "Export promotion support", provider: "DGFT / Ministry of Commerce",
      applies: !!profile.export_import_value, summary: "Market Access Initiative support, duty drawback and export incentive schemes for eligible exporters.",
      source_url: "https://www.dgft.gov.in/"
    },
    {
      key: "state", name: "State industrial incentives", provider: "State Industries Department",
      applies: true, summary: "Capital subsidy, power tariff concession and SGST reimbursement are offered under state industrial policies — confirm the current policy for your state.",
      source_url: "https://www.tn.gov.in/"
    }
  ];
}