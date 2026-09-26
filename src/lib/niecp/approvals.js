// NIECP-AI Approval Catalog + Document Requirements + Dependencies
// Deterministic applicability rules driven by confirmed regulatory factors.

export const APPROVALS = {
  gst_registration: {
    name: "GST Registration",
    authority: "GST Department",
    category: "Tax",
    stage: "Pre-operations",
    triggerFactors: ["gst_applicable"],
    documents: ["gst_certificate"],
    dependencies: [],
    sourceUrl: "https://www.gst.gov.in/",
    description: "Mandatory GST registration for businesses above the threshold."
  },
  factory_license: {
    name: "Factory License",
    authority: "Directorate of Industrial Safety & Health (DISH)",
    category: "Factory Compliance",
    stage: "Pre-operations",
    triggerFactors: ["factory_premises", "machinery_safety", "worker_safety"],
    documents: ["factory_license", "building_plan_approval"],
    dependencies: ["environmental_consent", "fire_noc"],
    sourceUrl: "https://labour.tn.gov.in/",
    description: "License to operate a factory under the Factories Act."
  },
  fire_noc: {
    name: "Fire & Safety NOC",
    authority: "Tamil Nadu Fire & Rescue Services / State Fire Service",
    category: "Fire Safety",
    stage: "Pre-operations",
    triggerFactors: ["fire_safety", "high_risk_operations", "chemical_storage", "fuel_storage", "battery_handling"],
    documents: ["fire_noc"],
    dependencies: [],
    sourceUrl: "https://fireservice.tn.gov.in/",
    description: "Fire safety no-objection certificate for the premises."
  },
  environmental_consent: {
    name: "Environmental Consent (CTE/CTO)",
    authority: "Tamil Nadu Pollution Control Board (TNPCB) / State PCB",
    category: "Environmental",
    stage: "Pre-construction & operations",
    triggerFactors: ["air_emissions", "water_discharge", "hazardous_waste", "hazardous_materials", "voc_emissions", "dust", "dg_set"],
    documents: ["consent_to_establish", "consent_to_operate"],
    dependencies: [],
    sourceUrl: "https://tnpcb.gov.in/",
    description: "Consent to Establish and Consent to Operate under Air/Water Acts."
  },
  electrical_approval: {
    name: "Electrical Safety Approval",
    authority: "Electrical Inspectorate",
    category: "Electrical",
    stage: "Pre-operations",
    triggerFactors: ["electrical_safety", "dg_set", "transformer"],
    documents: ["electrical_safety_certificate"],
    dependencies: [],
    sourceUrl: "https://www.electricalinspectorate.gov.in/",
    description: "Approval of electrical installation and high-tension connections."
  },
  boiler_approval: {
    name: "Boiler Approval & Certificate",
    authority: "Department of Boilers (Tamil Nadu)",
    category: "Boiler",
    stage: "Pre-operations",
    triggerFactors: ["boiler_use"],
    documents: ["boiler_certificate"],
    dependencies: ["factory_license"],
    sourceUrl: "https://boilers.tn.gov.in/",
    description: "Registration and certificate for steam boilers. Applicable only when a boiler is actually used.",
    conditional: true
  },
  e_waste_authorization: {
    name: "E-Waste Authorization",
    authority: "CPCB / TNPCB",
    category: "E-Waste",
    stage: "Operations",
    triggerFactors: ["e_waste", "battery_handling"],
    documents: ["e_waste_authorization"],
    dependencies: ["factory_license"],
    sourceUrl: "https://cpcb.nic.in/e-waste/",
    description: "Authorization for handling/processing e-waste."
  },
  hazardous_waste_authorization: {
    name: "Hazardous Waste Authorization",
    authority: "TNPCB / State PCB",
    category: "Hazardous Waste",
    stage: "Operations",
    triggerFactors: ["hazardous_waste", "hazardous_materials", "used_oil"],
    documents: ["hazardous_waste_authorization"],
    dependencies: ["environmental_consent"],
    sourceUrl: "https://tnpcb.gov.in/",
    description: "Authorization for generation, storage and disposal of hazardous waste."
  },
  trade_license: {
    name: "Trade / Shop & Establishment License",
    authority: "Local Municipality / Corporation",
    category: "Local",
    stage: "Pre-operations",
    triggerFactors: ["retail", "building_occupancy"],
    documents: ["trade_license"],
    dependencies: [],
    sourceUrl: "https://www.tn.gov.in/",
    description: "Local trade/shop license for commercial establishments."
  },
  labour_registration: {
    name: "Labour Registration (PF/ESI/Contract)",
    authority: "Labour Department",
    category: "Labour",
    stage: "Post-employment",
    triggerFactors: ["labour_compliance", "worker_safety"],
    documents: ["labour_registration_certificate"],
    dependencies: ["factory_license"],
    sourceUrl: "https://labour.tn.gov.in/",
    description: "Establishment registration under PF/ESI/Contract Labour regulations."
  },
  food_license: {
    name: "FSSAI License",
    authority: "FSSAI",
    category: "Food Safety",
    stage: "Pre-operations",
    triggerFactors: ["food_safety"],
    documents: ["fssai_license"],
    dependencies: [],
    sourceUrl: "https://www.fssai.gov.in/",
    description: "Food safety license for food business operators."
  },
  building_approval: {
    name: "Building Approval & Occupancy Certificate",
    authority: "Local Authority / CMDA / DTCP",
    category: "Building",
    stage: "Pre-construction",
    triggerFactors: ["building_occupancy", "construction"],
    documents: ["building_plan_approval", "occupancy_certificate"],
    dependencies: ["environmental_consent"],
    sourceUrl: "https://www.cmdachennai.gov.in/",
    description: "Building plan approval and occupancy certificate."
  },
  export_import_license: {
    name: "IEC / Export-Import License",
    authority: "DGFT",
    category: "Import/Export",
    stage: "Pre-operations",
    triggerFactors: ["export_activity", "import_activity"],
    documents: ["iec_certificate"],
    dependencies: ["gst_registration"],
    sourceUrl: "https://www.dgft.gov.in/",
    description: "Importer-Exporter Code for import/export of goods."
  },
  biomedical_waste_authorization: {
    name: "Biomedical Waste Authorization",
    authority: "TNPCB / State PCB",
    category: "Healthcare",
    stage: "Operations",
    triggerFactors: ["biomedical_waste"],
    documents: ["biomedical_waste_authorization"],
    dependencies: ["environmental_consent"],
    sourceUrl: "https://tnpcb.gov.in/",
    description: "Authorization for biomedical waste handling."
  },
  data_privacy_registration: {
    name: "Data Privacy Registration",
    authority: "MeitY / Data Protection Board",
    category: "Data Privacy",
    stage: "Operations",
    triggerFactors: ["data_privacy", "cybersecurity"],
    documents: ["data_privacy_registration"],
    dependencies: [],
    sourceUrl: "https://www.meity.gov.in/",
    description: "Registration/obligations under Digital Personal Data Protection Act."
  },
  mining_approval: {
    name: "Mining Approval & Environmental Clearance",
    authority: "Department of Mining & Geology / MoEFCC",
    category: "Mining",
    stage: "Pre-operations",
    triggerFactors: ["mining", "land_use"],
    documents: ["mining_license", "environmental_clearance"],
    dependencies: [],
    sourceUrl: "https://mines.gov.in/",
    description: "Mining lease and environmental clearance for mining activity."
  },
  product_standards_bis: {
    name: "BIS / Product Standards Certification",
    authority: "Bureau of Indian Standards (BIS)",
    category: "Product Compliance",
    stage: "Pre-operations",
    triggerFactors: ["product_standards"],
    documents: ["bis_certificate"],
    dependencies: [],
    sourceUrl: "https://www.bis.gov.in/",
    description: "Product certification under BIS standards."
  }
};

// Document requirement definitions
export const DOCUMENTS = {
  gst_certificate: { name: "GST Registration Certificate", authority: "GST Department", priority: "high", mandatory: true, expiryRequired: false, sourceUrl: "https://www.gst.gov.in/" },
  factory_license: { name: "Factory License", authority: "DISH", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://labour.tn.gov.in/" },
  building_plan_approval: { name: "Building Plan Approval", authority: "Local Authority", priority: "high", mandatory: true, expiryRequired: false, sourceUrl: "https://www.cmdachennai.gov.in/" },
  fire_noc: { name: "Fire NOC", authority: "Fire & Rescue Services", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://fireservice.tn.gov.in/" },
  consent_to_establish: { name: "Consent to Establish (CTE)", authority: "TNPCB", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://tnpcb.gov.in/" },
  consent_to_operate: { name: "Consent to Operate (CTO)", authority: "TNPCB", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://tnpcb.gov.in/" },
  electrical_safety_certificate: { name: "Electrical Safety Certificate", authority: "Electrical Inspectorate", priority: "medium", mandatory: true, expiryRequired: true, sourceUrl: "https://www.electricalinspectorate.gov.in/" },
  boiler_certificate: { name: "Boiler Certificate / Registration", authority: "Department of Boilers", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://boilers.tn.gov.in/" },
  e_waste_authorization: { name: "E-Waste Authorization", authority: "CPCB/TNPCB", priority: "medium", mandatory: true, expiryRequired: true, sourceUrl: "https://cpcb.nic.in/e-waste/" },
  hazardous_waste_authorization: { name: "Hazardous Waste Authorization", authority: "TNPCB", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://tnpcb.gov.in/" },
  trade_license: { name: "Trade / Shop License", authority: "Local Municipality", priority: "medium", mandatory: true, expiryRequired: true, sourceUrl: "https://www.tn.gov.in/" },
  labour_registration_certificate: { name: "Labour Registration Certificate (PF/ESI)", authority: "Labour Department", priority: "medium", mandatory: true, expiryRequired: false, sourceUrl: "https://labour.tn.gov.in/" },
  fssai_license: { name: "FSSAI License", authority: "FSSAI", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://www.fssai.gov.in/" },
  occupancy_certificate: { name: "Occupancy Certificate", authority: "Local Authority", priority: "high", mandatory: true, expiryRequired: false, sourceUrl: "https://www.cmdachennai.gov.in/" },
  iec_certificate: { name: "IEC Certificate (Import-Export Code)", authority: "DGFT", priority: "medium", mandatory: true, expiryRequired: false, sourceUrl: "https://www.dgft.gov.in/" },
  biomedical_waste_authorization: { name: "Biomedical Waste Authorization", authority: "TNPCB", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://tnpcb.gov.in/" },
  data_privacy_registration: { name: "Data Privacy Registration", authority: "MeitY", priority: "medium", mandatory: false, expiryRequired: false, sourceUrl: "https://www.meity.gov.in/" },
  mining_license: { name: "Mining Lease / License", authority: "Dept of Mining", priority: "high", mandatory: true, expiryRequired: true, sourceUrl: "https://mines.gov.in/" },
  environmental_clearance: { name: "Environmental Clearance", authority: "MoEFCC / SEIAA", priority: "high", mandatory: true, expiryRequired: false, sourceUrl: "https://moef.gov.in/" },
  bis_certificate: { name: "BIS Product Certification", authority: "BIS", priority: "medium", mandatory: true, expiryRequired: true, sourceUrl: "https://www.bis.gov.in/" }
};

export const RULE_VERSION = "niecp-rules-v1.0";
export const LAST_VERIFIED = "2026-09-01";