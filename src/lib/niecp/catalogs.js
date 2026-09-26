// NIECP-AI Regulatory Intelligence Catalogs
// Industry catalog (21 + OTHER), regulatory factor catalog, industry->factor mapping.

export const INDUSTRIES = [
  { key: "agriculture", name: "Agriculture & Allied", sub: ["Farming","Dairy","Poultry","Fisheries","Floriculture","Agricultural Services"] },
  { key: "food_processing", name: "Food Processing", sub: ["Bakery","Rice Mill","Flour Mill","Dairy Processing","Packaged Foods","Beverage Manufacturing","Spice Processing","Meat/Seafood Processing"] },
  { key: "textile", name: "Textile & Garments", sub: ["Spinning","Weaving","Garment Manufacturing","Dyeing","Printing","Textile Finishing"] },
  { key: "automobile", name: "Automobile & Auto Components", sub: ["CNC Machining","Auto Parts","Welding/Fabrication","Component Assembly","Vehicle Manufacturing"] },
  { key: "electronics", name: "Electronics & Electrical", sub: ["PCB Assembly","Electronics Manufacturing","Electrical Equipment","Consumer Electronics","Battery/Electronic Products"] },
  { key: "chemicals", name: "Chemicals & Pharmaceuticals", sub: ["Chemical Manufacturing","Pharmaceutical Manufacturing","Paints","Industrial Chemicals","Chemical Formulation"] },
  { key: "renewable_energy", name: "Renewable Energy", sub: ["Solar Equipment","Solar Installation","Wind Energy","Battery Systems","Renewable Energy Services"] },
  { key: "it_services", name: "IT Services", sub: ["Software Development","SaaS","IT Consulting","BPO","Technical Support","Web/App Development","Cloud Services"] },
  { key: "construction", name: "Construction & Real Estate", sub: ["Building Construction","Infrastructure","Civil Contractors","Real Estate Development"] },
  { key: "healthcare", name: "Healthcare & Medical", sub: ["Hospitals","Clinics","Diagnostic Centres","Dental Clinics","Medical Laboratories"] },
  { key: "education", name: "Education & Training", sub: ["Schools","Colleges","Coaching Centres","Skill Training","Vocational Institutes"] },
  { key: "retail", name: "Retail & Wholesale", sub: ["Retail Shops","Supermarkets","Wholesale Distribution","E-commerce","Dealers"] },
  { key: "hospitality", name: "Hospitality & Tourism", sub: ["Hotels","Restaurants","Catering","Resorts","Travel Agencies"] },
  { key: "logistics", name: "Logistics & Transportation", sub: ["Trucking","Courier","Warehousing","Fleet Management","Logistics Companies"] },
  { key: "financial", name: "Financial & Professional Services", sub: ["Accounting","Tax Consulting","Legal Services","Financial Consulting","Business Consulting"] },
  { key: "energy", name: "Energy & Utilities", sub: ["Power Generation","Power Distribution","Utilities","Energy Plants"] },
  { key: "mining", name: "Mining & Metals", sub: ["Mining","Mineral Processing","Metal Production","Foundries"] },
  { key: "plastics", name: "Plastics & Rubber", sub: ["Plastic Products","Plastic Moulding","Rubber Products","Packaging"] },
  { key: "printing", name: "Printing & Packaging", sub: ["Printing Press","Labels","Cartons","Packaging Manufacturing"] },
  { key: "wood", name: "Wood, Furniture & Paper", sub: ["Furniture","Wood Processing","Paper Products","Carpentry"] },
  { key: "telecom", name: "Telecom & Digital Infrastructure", sub: ["Telecom Services","Data Centres","Network Infrastructure","Internet Services"] },
  { key: "other", name: "Other / Custom Industry", sub: [] }
];

export const STATES = ["Tamil Nadu","Karnataka","Maharashtra","Telangana","Kerala","Andhra Pradesh","Gujarat","Delhi","Uttar Pradesh","Rajasthan","West Bengal","Others"];

// Regulatory factor catalog
export const FACTORS = {
  land_use: { name: "Land Use", explanation: "Whether the project uses land that may need land-use conversion or clearance.", examples: "Agricultural land converted to industrial use.", why: "Land use determines zoning and environmental clearance needs." },
  water_use: { name: "Water Use", explanation: "Significant water draw for operations.", examples: "Cooling, processing, washing.", why: "High water use may require consent and abstraction permissions." },
  water_discharge: { name: "Water Discharge / Effluent", explanation: "Discharge of wastewater outside premises.", examples: "Trade effluent to drain.", why: "Discharge triggers Pollution Control Board consent." },
  air_emissions: { name: "Air Emissions", explanation: "Emissions to air from stacks, vents or processes.", examples: "Boiler exhaust, fumes, dust.", why: "Air emissions require consent to operate and emission controls." },
  dust: { name: "Dust Generation", explanation: "Particulate dust from processes.", examples: "Grinding, milling, wood dust.", why: "Dust affects worker safety and air consent." },
  voc_emissions: { name: "VOC Emissions", explanation: "Volatile organic compound emissions.", examples: "Solvents, paints, inks.", why: "VOCs require air consent and exposure controls." },
  hazardous_materials: { name: "Hazardous Materials", explanation: "Storage or use of hazardous substances.", examples: "Solvents, acids, reactive chemicals.", why: "Hazardous materials trigger storage and handling rules." },
  chemical_storage: { name: "Chemical Storage", explanation: "On-site storage of chemicals.", examples: "Chemical drums, tanks.", why: "Chemical storage affects fire, safety and environmental compliance." },
  hazardous_waste: { name: "Hazardous Waste", explanation: "Generation of hazardous waste.", examples: "Spent solvents, contaminated residues.", why: "Hazardous waste requires authorization and disposal rules." },
  general_waste: { name: "General Waste", explanation: "Non-hazardous solid waste generation.", examples: "Packaging, scrap.", why: "Waste management rules apply." },
  e_waste: { name: "E-Waste", explanation: "Generation of electronic waste.", examples: "Rejected PCBs, electronic components.", why: "E-waste rules require authorized handling." },
  plastic_waste: { name: "Plastic Waste", explanation: "Plastic waste or plastic product obligations.", examples: "Plastic packaging, scrap.", why: "Plastic Waste Management Rules / EPR may apply." },
  biomedical_waste: { name: "Biomedical Waste", explanation: "Biomedical waste generation.", examples: "Clinical waste, used disposables.", why: "Biomedical waste rules apply to healthcare." },
  used_oil: { name: "Used Oil", explanation: "Used oil generation from machinery.", examples: "Engine oil, lubricants.", why: "Used oil is regulated as hazardous waste." },
  battery_handling: { name: "Battery Handling", explanation: "Handling or storage of batteries.", examples: "Lead-acid, lithium batteries.", why: "Battery rules require collection and handling compliance." },
  fire_safety: { name: "Fire Safety", explanation: "Fire risk or fire-protection needs.", examples: "Combustible materials, electrical loads.", why: "Fire NOC and safety systems may be required." },
  high_risk_operations: { name: "High-Risk Operations", explanation: "Operations with elevated process risk.", examples: "Hot work, pressurized systems, flammables.", why: "High-risk operations trigger safety approvals." },
  worker_safety: { name: "Worker Safety", explanation: "Workplace hazards to workers.", examples: "Machinery, chemicals, noise.", why: "Factory and labour safety rules apply." },
  machinery_safety: { name: "Machinery Safety", explanation: "Use of production machinery.", examples: "Presses, CNC, conveyors.", why: "Machinery safety is part of factory compliance." },
  factory_premises: { name: "Factory Premises", explanation: "Operation within a factory/manufacturing premises.", examples: "Manufacturing plant.", why: "Factory license and compliance may apply." },
  boiler_use: { name: "Boiler Use", explanation: "Use of a boiler for steam generation.", examples: "Steam boiler for process heating.", why: "Boilers require registration and certificate. Only if steam/boiler is actually used.", conditional: true },
  pressure_systems: { name: "Pressure Systems", explanation: "Use of pressure vessels/systems.", examples: "Compressed air receivers, pressure vessels.", why: "Pressure equipment has safety rules." },
  electrical_safety: { name: "Electrical Safety", explanation: "Electrical installation and high load.", examples: "HT connection, transformer, DG set.", why: "Electrical safety approval may be required." },
  dg_set: { name: "DG Set", explanation: "Diesel generator set in use.", examples: "Backup power DG set.", why: "DG sets trigger air consent and electrical safety." },
  fuel_storage: { name: "Fuel Storage", explanation: "Storage of fuel on-site.", examples: "Diesel, furnace oil tanks.", why: "Fuel storage affects fire and environmental compliance." },
  cold_storage: { name: "Cold Storage", explanation: "Cold storage facility.", examples: "Cold rooms, refrigeration.", why: "Cold storage has specific safety and energy rules." },
  food_safety: { name: "Food Safety", explanation: "Manufacturing or handling of food.", examples: "Packaged foods, dairy.", why: "FSSAI license is required for food business." },
  packaging: { name: "Packaging", explanation: "Packaging of products.", examples: "FSSAI/labeling, EPR packaging.", why: "Packaging and labeling rules may apply." },
  product_standards: { name: "Product Standards", explanation: "Products requiring standards certification.", examples: "Electronics, electrical goods.", why: "BIS/product certification may be required." },
  import_activity: { name: "Import Activity", explanation: "Importing goods or equipment.", examples: "Imported components, machinery.", why: "Import requires IEC and customs compliance." },
  export_activity: { name: "Export Activity", explanation: "Exporting goods or services.", examples: "Export of goods, export of services.", why: "Export requires IEC; export of services has GST rules." },
  data_privacy: { name: "Data Privacy", explanation: "Handling personal data of users/customers.", examples: "Customer databases, SaaS platforms.", why: "Data privacy registration may apply (DPDP)." },
  cybersecurity: { name: "Cybersecurity", explanation: "Digital infrastructure handling sensitive data.", examples: "Data centres, fintech.", why: "Cybersecurity obligations may apply." },
  labour_compliance: { name: "Labour Compliance", explanation: "Employment of workers.", examples: "Factory workers, contract labour.", why: "Labour registration and compliance apply." },
  building_occupancy: { name: "Building / Occupancy", explanation: "Building construction or occupancy.", examples: "New building, occupancy certificate.", why: "Building approval and occupancy certificate required." },
  construction: { name: "Construction Activity", explanation: "Construction or civil work.", examples: "Building, infrastructure.", why: "Construction permits and safety apply." },
  mining: { name: "Mining / Mineral Activity", explanation: "Mining or mineral processing.", examples: "Quarrying, ore processing.", why: "Mining and environmental clearance required." },
  retail: { name: "Retail / Shop Establishment", explanation: "Retail or shop establishment.", examples: "Shops, stores.", why: "Shop & establishment / trade license applies." },
  gst_applicable: { name: "GST Applicability", explanation: "Business turnover attracting GST.", examples: "Any taxable business.", why: "GST registration is required above threshold." }
};

// Industry -> relevant factor keys (from spec section 23)
export const INDUSTRY_FACTORS = {
  agriculture: ["land_use","water_use","general_waste","water_discharge","labour_compliance","fire_safety","food_safety","cold_storage"],
  food_processing: ["food_safety","general_waste","water_discharge","air_emissions","boiler_use","fire_safety","packaging","cold_storage","labour_compliance"],
  textile: ["factory_premises","labour_compliance","general_waste","air_emissions","water_discharge","chemical_storage","fire_safety","boiler_use","export_activity"],
  automobile: ["machinery_safety","factory_premises","air_emissions","hazardous_materials","chemical_storage","used_oil","water_discharge","high_risk_operations","export_activity","import_activity"],
  electronics: ["e_waste","hazardous_materials","worker_safety","fire_safety","air_emissions","general_waste","export_activity","import_activity","product_standards","battery_handling","chemical_storage","electrical_safety"],
  chemicals: ["hazardous_materials","chemical_storage","air_emissions","water_discharge","hazardous_waste","high_risk_operations","worker_safety","boiler_use","pressure_systems"],
  renewable_energy: ["electrical_safety","battery_handling","e_waste","fire_safety","worker_safety","land_use","export_activity","import_activity","product_standards"],
  it_services: ["gst_applicable","labour_compliance","data_privacy","cybersecurity","e_waste","fire_safety","export_activity"],
  construction: ["building_occupancy","construction","labour_compliance","general_waste","air_emissions","dust","water_use","water_discharge","fire_safety","land_use"],
  healthcare: ["biomedical_waste","fire_safety","worker_safety","data_privacy","water_discharge","general_waste"],
  education: ["building_occupancy","fire_safety","labour_compliance","data_privacy","e_waste","general_waste"],
  retail: ["gst_applicable","labour_compliance","fire_safety","retail","general_waste","e_waste","import_activity"],
  hospitality: ["food_safety","fire_safety","general_waste","water_discharge","labour_compliance","building_occupancy","retail"],
  logistics: ["labour_compliance","fire_safety","fuel_storage","hazardous_materials","general_waste","air_emissions","import_activity","export_activity"],
  financial: ["gst_applicable","data_privacy","cybersecurity","labour_compliance","fire_safety"],
  energy: ["electrical_safety","air_emissions","water_discharge","hazardous_materials","high_risk_operations","worker_safety","land_use"],
  mining: ["mining","land_use","air_emissions","dust","water_discharge","hazardous_waste","worker_safety","high_risk_operations","machinery_safety"],
  plastics: ["plastic_waste","air_emissions","fire_safety","chemical_storage","machinery_safety","worker_safety","water_discharge","packaging"],
  printing: ["general_waste","plastic_waste","chemical_storage","voc_emissions","air_emissions","fire_safety","worker_safety","water_discharge","packaging"],
  wood: ["fire_safety","dust","air_emissions","general_waste","machinery_safety","chemical_storage","water_discharge"],
  telecom: ["data_privacy","cybersecurity","e_waste","electrical_safety","fire_safety","dg_set","air_emissions"],
  other: []
};

// Infrastructure factors that map to regulatory factors
export const INFRA_FACTOR_MAP = {
  boiler: ["boiler_use"],
  steam_system: ["boiler_use"],
  pressure_equipment: ["pressure_systems"],
  dg_set: ["dg_set","air_emissions","electrical_safety"],
  transformer: ["electrical_safety"],
  power_connection: ["electrical_safety"],
  chemical_storage: ["chemical_storage"],
  fuel_storage: ["fuel_storage","fire_safety"],
  gas_storage: ["hazardous_materials","fire_safety"],
  battery_storage: ["battery_handling","fire_safety","e_waste"],
  cold_storage: ["cold_storage"],
  etp_stp: ["water_discharge"],
  water_treatment: ["water_use","water_discharge"],
  waste_storage: ["general_waste","hazardous_waste"],
  heavy_machinery: ["machinery_safety","factory_premises"],
  production_machinery: ["machinery_safety","factory_premises"],
  high_temp_equipment: ["high_risk_operations","air_emissions"],
  clean_room: ["worker_safety"],
  testing_lab: ["worker_safety","hazardous_materials"]
};

export function getRelevantFactors(industry, infrastructure = {}, scale = {}) {
  const base = new Set(INDUSTRY_FACTORS[industry] || []);
  Object.entries(infrastructure || {}).forEach(([k, v]) => {
    if (v && INFRA_FACTOR_MAP[k]) INFRA_FACTOR_MAP[k].forEach((f) => base.add(f));
  });
  if (scale && scale.export_import_value) {
    base.add("export_activity");
    base.add("import_activity");
  }
  // GST always relevant for a business
  base.add("gst_applicable");
  return Array.from(base);
}