// NIECP-AI Legal basis registry (indicative)
// The statutory instrument each approval is anchored to. These are indicative
// references captured in the rule pack — they are NOT verified legal opinions
// and must be confirmed with the concerned authority before submission.

export const LEGAL_BASIS = {
  gst_registration: {
    legal_basis: "Central Goods and Services Tax Act, 2017 — registration and threshold provisions",
    jurisdiction: "India (Central)",
    verification_status: "REQUIRES_VERIFICATION"
  },
  factory_license: {
    legal_basis: "Factories Act, 1948 — approval, licensing and registration of factories",
    jurisdiction: "India (Central) / State enforcement",
    verification_status: "REQUIRES_VERIFICATION"
  },
  fire_noc: {
    legal_basis: "State Fire Service Acts and National Building Code of India 2016, Part 4 (Fire and Life Safety)",
    jurisdiction: "State / Urban Local Body",
    verification_status: "REQUIRES_VERIFICATION"
  },
  environmental_consent: {
    legal_basis: "Water (Prevention and Control of Pollution) Act, 1974 and Air (Prevention and Control of Pollution) Act, 1981 — consent to establish / operate",
    jurisdiction: "State Pollution Control Board",
    verification_status: "REQUIRES_VERIFICATION"
  },
  electrical_approval: {
    legal_basis: "Electricity Act, 2003 and CEA (Measures relating to Safety and Electric Supply) Regulations, 2010",
    jurisdiction: "State Electrical Inspectorate",
    verification_status: "REQUIRES_VERIFICATION"
  },
  boiler_approval: {
    legal_basis: "Boilers Act, 1923 — registration and inspection of boilers",
    jurisdiction: "State Directorate of Boilers",
    verification_status: "REQUIRES_VERIFICATION"
  },
  e_waste_authorization: {
    legal_basis: "E-Waste (Management) Rules, 2022",
    jurisdiction: "CPCB / State Pollution Control Board",
    verification_status: "REQUIRES_VERIFICATION"
  },
  hazardous_waste_authorization: {
    legal_basis: "Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016",
    jurisdiction: "State Pollution Control Board",
    verification_status: "REQUIRES_VERIFICATION"
  },
  trade_license: {
    legal_basis: "State Shops and Commercial Establishments legislation and municipal trade licensing by-laws",
    jurisdiction: "Urban Local Body",
    verification_status: "REQUIRES_VERIFICATION"
  },
  labour_registration: {
    legal_basis: "Employees' Provident Funds and Miscellaneous Provisions Act, 1952; Employees' State Insurance Act, 1948; Contract Labour (Regulation and Abolition) Act, 1970",
    jurisdiction: "India (Central) / State Labour Department",
    verification_status: "REQUIRES_VERIFICATION"
  },
  food_license: {
    legal_basis: "Food Safety and Standards Act, 2006 — licensing and registration of food businesses",
    jurisdiction: "FSSAI / State Food Safety Department",
    verification_status: "REQUIRES_VERIFICATION"
  },
  building_approval: {
    legal_basis: "State Town and Country Planning legislation and municipal building rules, including occupancy certification",
    jurisdiction: "Planning Authority / Urban Local Body",
    verification_status: "REQUIRES_VERIFICATION"
  },
  export_import_license: {
    legal_basis: "Foreign Trade (Development and Regulation) Act, 1992 — Importer-Exporter Code",
    jurisdiction: "DGFT",
    verification_status: "REQUIRES_VERIFICATION"
  },
  biomedical_waste_authorization: {
    legal_basis: "Bio-Medical Waste Management Rules, 2016",
    jurisdiction: "State Pollution Control Board",
    verification_status: "REQUIRES_VERIFICATION"
  },
  data_privacy_registration: {
    legal_basis: "Digital Personal Data Protection Act, 2023 — obligations of a data fiduciary",
    jurisdiction: "India (Central)",
    verification_status: "REQUIRES_VERIFICATION"
  },
  mining_approval: {
    legal_basis: "Mines and Minerals (Development and Regulation) Act, 1957 and EIA Notification, 2006",
    jurisdiction: "State Mining Department / MoEFCC",
    verification_status: "REQUIRES_VERIFICATION"
  },
  product_standards_bis: {
    legal_basis: "Bureau of Indian Standards Act, 2016 — product certification",
    jurisdiction: "Bureau of Indian Standards",
    verification_status: "REQUIRES_VERIFICATION"
  }
};

export function getLegalBasis(approvalKey) {
  return LEGAL_BASIS[approvalKey] || null;
}