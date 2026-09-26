// One-click demo scenarios for the five acceptance scenarios.
// Each profile is created under the logged-in user's account (RLS-isolated).

const f = (ai, user, confidence, reason, source) => ({ ai_value: ai, user_value: user, confidence, reason, source });

export const DEMO_SCENARIOS = [
  {
    name: "ABC Electronics",
    tag: "Electronics · TN",
    data: {
      name: "ABC Electronics", entity_type: "Private Limited", founder_name: "A. Founder", registration_status: "Registered",
      pan_available: true, gst_available: true, udyam_status: "Registered", contact_email: "info@abcelectronics.in",
      description: "We manufacture PCBs and assemble electronic control boards for consumer electronics.",
      primary_activity: "PCB Assembly / SMT / Electronics Assembly", products_services: "PCBs, electronic control boards",
      country: "India", state: "Tamil Nadu", district: "Chennai", city: "Chennai", pincode: "600032", industrial_area: "SIPCOT",
      area_type: "Urban", premises_type: "Leased", land_status: "Industrial",
      industry: "electronics", sub_industry: "PCB Assembly",
      investment: 20000000, annual_revenue: 50000000, production_capacity: "1M units/yr", workforce: 85,
      built_up_area: "20000 sqft", land_area: "0.5 acre", project_stage: "Operational", production_status: "In Production",
      project_type: "New", employee_count: 85, power_requirement: "200 kVA", water_requirement: "10 KLD",
      export_import_value: "₹50 lakh exports",
      infrastructure: { factory_premises: true, production_machinery: true, chemical_storage: true, fire_protection: true, power_connection: true, testing_lab: true, waste_storage: true },
      factors: {
        factory_premises: f("YES", "YES", 95, "Factory premises declared.", "rule"),
        e_waste: f("YES", "YES", 92, "PCB assembly generates electronic waste.", "ai"),
        hazardous_materials: f("YES", "YES", 90, "Soldering/flux involves hazardous substances.", "ai"),
        worker_safety: f("YES", "YES", 90, "Factory with machinery and chemicals.", "ai"),
        fire_safety: f("YES", "YES", 93, "Combustible materials and electrical loads.", "ai"),
        chemical_storage: f("YES", "YES", 95, "Chemical storage declared.", "rule"),
        export_activity: f("YES", "YES", 95, "Export value declared.", "rule"),
        import_activity: f("YES", "YES", 80, "Electronics assembly typically imports components.", "ai"),
        product_standards: f("YES", "YES", 80, "Electronic products may require BIS certification.", "ai"),
        electrical_safety: f("YES", "YES", 85, "Power connection and machinery present.", "rule"),
        general_waste: f("YES", "YES", 80, "Manufacturing generates general waste.", "ai"),
        boiler_use: f("NO", "NO", 94, "PCB assembly does not use steam/boiler equipment.", "ai"),
        gst_applicable: f("YES", "YES", 99, "Business turnover above threshold.", "rule")
      },
      ai_analysis: { source: "demo", note: "Pre-loaded demo scenario for ABC Electronics.", timestamp: new Date().toISOString() },
      stage: "assessed"
    }
  },
  {
    name: "XYZ Foods",
    tag: "Food Processing · MH",
    data: {
      name: "XYZ Foods", entity_type: "Private Limited", founder_name: "R. Sharma", registration_status: "Registered",
      pan_available: true, gst_available: true, udyam_status: "Registered", contact_email: "ops@xyzfoods.in",
      description: "Packaged foods and dairy processing plant producing snacks, beverages and packaged sweets.",
      primary_activity: "Packaged Foods / Dairy Processing", products_services: "Packaged snacks, beverages, dairy products",
      country: "India", state: "Maharashtra", district: "Pune", city: "Pune", pincode: "411019", industrial_area: "MIDC Bhosari",
      area_type: "Industrial", premises_type: "Owned", land_status: "Industrial",
      industry: "food_processing", sub_industry: "Dairy Processing",
      investment: 45000000, annual_revenue: 120000000, production_capacity: "500 tonnes/yr", workforce: 120,
      built_up_area: "35000 sqft", land_area: "1.2 acre", project_stage: "Operational", production_status: "In Production",
      project_type: "Expansion", employee_count: 120, power_requirement: "300 kVA", water_requirement: "45 KLD",
      export_import_value: "",
      infrastructure: { factory_premises: true, production_machinery: true, boiler: true, cold_storage: true, water_treatment: true, etp_stp: true, power_connection: true, waste_storage: true },
      factors: {
        food_safety: f("YES", "YES", 98, "Food manufacturing requires an FSSAI license.", "rule"),
        factory_premises: f("YES", "YES", 95, "Manufacturing plant declared.", "rule"),
        boiler_use: f("YES", "YES", 96, "Steam boiler used for dairy/packaged food processing.", "rule"),
        air_emissions: f("YES", "YES", 90, "Boiler exhaust and cooking fumes emitted.", "ai"),
        water_discharge: f("YES", "YES", 93, "Process effluent discharged via ETP.", "rule"),
        water_use: f("YES", "YES", 92, "High water draw for washing and processing.", "rule"),
        general_waste: f("YES", "YES", 88, "Organic and packaging waste generated.", "ai"),
        packaging: f("YES", "YES", 90, "Packaged food labeling rules apply.", "ai"),
        cold_storage: f("YES", "YES", 95, "Cold storage facility declared.", "rule"),
        fire_safety: f("YES", "YES", 88, "Cooking processes and combustible packaging.", "ai"),
        worker_safety: f("YES", "YES", 88, "Machinery and food-handling hazards.", "ai"),
        labour_compliance: f("YES", "YES", 95, "120 workers employed.", "rule"),
        electrical_safety: f("YES", "YES", 85, "300 kVA power connection and machinery.", "rule"),
        gst_applicable: f("YES", "YES", 99, "Turnover above GST threshold.", "rule")
      },
      ai_analysis: { source: "demo", note: "Pre-loaded demo scenario for XYZ Foods (boiler-positive).", timestamp: new Date().toISOString() },
      stage: "assessed"
    }
  },
  {
    name: "TechNova IT",
    tag: "IT / SaaS · KA",
    data: {
      name: "TechNova IT", entity_type: "Private Limited", founder_name: "S. Iyer", registration_status: "Registered",
      pan_available: true, gst_available: true, udyam_status: "Registered", contact_email: "hello@technova.io",
      description: "SaaS product company building cloud-based business analytics software for global clients.",
      primary_activity: "Software Development / SaaS", products_services: "Cloud analytics SaaS platform",
      country: "India", state: "Karnataka", district: "Bengaluru Urban", city: "Bengaluru", pincode: "560103", industrial_area: "Embassy Tech Village",
      area_type: "Urban", premises_type: "Leased", land_status: "Commercial",
      industry: "it_services", sub_industry: "SaaS",
      investment: 8000000, annual_revenue: 25000000, production_capacity: "", workforce: 42,
      built_up_area: "8000 sqft", land_area: "", project_stage: "Operational", production_status: "N/A (Services)",
      project_type: "New", employee_count: 42, power_requirement: "75 kVA", water_requirement: "2 KLD",
      export_import_value: "₹1.2 crore export of services",
      infrastructure: { power_connection: true },
      factors: {
        gst_applicable: f("YES", "YES", 99, "Turnover above GST threshold.", "rule"),
        data_privacy: f("YES", "YES", 93, "SaaS platform processes customer personal data (DPDP Act).", "ai"),
        cybersecurity: f("YES", "YES", 88, "Cloud infrastructure handling client data.", "ai"),
        e_waste: f("YES", "YES", 80, "IT hardware (laptops, servers) generates e-waste.", "ai"),
        labour_compliance: f("YES", "YES", 90, "42 employees; shops & establishment registration applies.", "rule"),
        export_activity: f("YES", "YES", 95, "Export of software services declared.", "rule"),
        fire_safety: f("YES", "YES", 70, "Office premises with standard fire-safety obligations.", "ai"),
        factory_premises: f("NO", "NO", 97, "Office-based services, no manufacturing premises.", "rule"),
        boiler_use: f("NO", "NO", 99, "No boiler or steam equipment.", "rule"),
        worker_safety: f("NO", "NO", 95, "No industrial machinery or process hazards.", "ai")
      },
      ai_analysis: { source: "demo", note: "Pre-loaded demo scenario for TechNova IT (services, minimal approvals).", timestamp: new Date().toISOString() },
      stage: "assessed"
    }
  },
  {
    name: "WoodCraft",
    tag: "Furniture · KL",
    data: {
      name: "WoodCraft", entity_type: "Partnership", founder_name: "M. Nair", registration_status: "Registered",
      pan_available: true, gst_available: true, udyam_status: "Registered", contact_email: "sales@woodcraft.co.in",
      description: "Designer furniture workshop producing wooden furniture with finishing, spray lacquer and CNC woodworking.",
      primary_activity: "Furniture Manufacturing", products_services: "Wooden furniture, custom cabinetry",
      country: "India", state: "Kerala", district: "Ernakulam", city: "Kochi", pincode: "682304", industrial_area: "KINFRA Park",
      area_type: "Industrial", premises_type: "Leased", land_status: "Industrial",
      industry: "wood", sub_industry: "Furniture",
      investment: 12000000, annual_revenue: 30000000, production_capacity: "3000 units/yr", workforce: 55,
      built_up_area: "15000 sqft", land_area: "0.4 acre", project_stage: "Operational", production_status: "In Production",
      project_type: "New", employee_count: 55, power_requirement: "120 kVA", water_requirement: "6 KLD",
      export_import_value: "₹20 lakh exports",
      infrastructure: { factory_premises: true, production_machinery: true, chemical_storage: true, waste_storage: true, power_connection: true },
      factors: {
        factory_premises: f("YES", "YES", 95, "Manufacturing workshop declared.", "rule"),
        dust: f("YES", "YES", 95, "Woodworking generates significant sawdust.", "ai"),
        air_emissions: f("YES", "YES", 88, "Spray finishing and sanding emissions.", "ai"),
        voc_emissions: f("YES", "YES", 92, "Lacquers, polishes and adhesives release VOCs.", "ai"),
        chemical_storage: f("YES", "YES", 90, "Finishing chemicals and adhesives stored on-site.", "rule"),
        hazardous_materials: f("YES", "YES", 82, "Solvent-based finishes are hazardous substances.", "ai"),
        machinery_safety: f("YES", "YES", 93, "CNC routers, saws and sanders in use.", "rule"),
        fire_safety: f("YES", "YES", 96, "Wood dust and solvents are highly combustible.", "ai"),
        worker_safety: f("YES", "YES", 92, "Cutting machinery, noise and dust exposure.", "ai"),
        general_waste: f("YES", "YES", 85, "Wood offcuts and packaging waste.", "ai"),
        water_discharge: f("YES", "YES", 70, "Minor finishing effluent discharge.", "ai"),
        labour_compliance: f("YES", "YES", 92, "55 workers employed.", "rule"),
        export_activity: f("YES", "YES", 95, "Export value declared.", "rule"),
        boiler_use: f("NO", "NO", 97, "No steam/boiler equipment in furniture workshop.", "ai"),
        gst_applicable: f("YES", "YES", 99, "Turnover above GST threshold.", "rule")
      },
      ai_analysis: { source: "demo", note: "Pre-loaded demo scenario for WoodCraft (fire/dust risk focus).", timestamp: new Date().toISOString() },
      stage: "assessed"
    }
  },
  {
    name: "ChemPro",
    tag: "Chemicals · GJ",
    data: {
      name: "ChemPro Industries", entity_type: "Private Limited", founder_name: "P. Desai", registration_status: "Registered",
      pan_available: true, gst_available: true, udyam_status: "Registered", contact_email: "info@chempro.in",
      description: "Specialty chemical manufacturing unit producing industrial solvents and intermediates.",
      primary_activity: "Industrial Chemical Manufacturing", products_services: "Industrial solvents, chemical intermediates",
      country: "India", state: "Gujarat", district: "Vadodara", city: "Vadodara", pincode: "391740", industrial_area: "GIDC Makarpura",
      area_type: "Industrial", premises_type: "Owned", land_status: "Industrial",
      industry: "chemicals", sub_industry: "Industrial Chemicals",
      investment: 80000000, annual_revenue: 150000000, production_capacity: "6000 tonnes/yr", workforce: 150,
      built_up_area: "60000 sqft", land_area: "3 acre", project_stage: "Operational", production_status: "In Production",
      project_type: "New", employee_count: 150, power_requirement: "500 kVA", water_requirement: "80 KLD",
      export_import_value: "₹3 crore exports, ₹1.5 crore imports",
      infrastructure: { factory_premises: true, production_machinery: true, boiler: true, pressure_equipment: true, chemical_storage: true, fuel_storage: true, etp_stp: true, power_connection: true, waste_storage: true },
      factors: {
        factory_premises: f("YES", "YES", 95, "Chemical manufacturing plant declared.", "rule"),
        hazardous_materials: f("YES", "YES", 98, "Solvents and reactive chemicals handled.", "rule"),
        chemical_storage: f("YES", "YES", 98, "Bulk chemical storage on-site.", "rule"),
        hazardous_waste: f("YES", "YES", 96, "Spent solvents and residues are hazardous waste.", "ai"),
        air_emissions: f("YES", "YES", 96, "Process vents and boiler stacks emit to air.", "rule"),
        water_discharge: f("YES", "YES", 95, "Trade effluent treated via ETP then discharged.", "rule"),
        water_use: f("YES", "YES", 92, "High process water draw (80 KLD).", "rule"),
        boiler_use: f("YES", "YES", 96, "Steam boiler used for process heating.", "rule"),
        pressure_systems: f("YES", "YES", 95, "Pressure vessels and reactors in service.", "rule"),
        high_risk_operations: f("YES", "YES", 96, "Flammable solvents, exothermic reactions, hot work.", "ai"),
        fuel_storage: f("YES", "YES", 90, "Furnace oil and diesel storage declared.", "rule"),
        fire_safety: f("YES", "YES", 97, "Flammable inventory requires fire NOC.", "ai"),
        worker_safety: f("YES", "YES", 96, "Chemical exposure and process hazards.", "ai"),
        dg_set: f("YES", "YES", 88, "Backup DG set for continuous process.", "ai"),
        electrical_safety: f("YES", "YES", 92, "500 kVA connection in hazardous area.", "rule"),
        labour_compliance: f("YES", "YES", 95, "150 workers employed.", "rule"),
        battery_handling: f("NOT_SURE", "NOT_SURE", 60, "Battery handling at the facility is not confirmed — needs user confirmation.", "ai"),
        export_activity: f("YES", "YES", 95, "Export value declared.", "rule"),
        import_activity: f("YES", "YES", 95, "Import of raw materials declared.", "rule"),
        gst_applicable: f("YES", "YES", 99, "Turnover above GST threshold.", "rule")
      },
      ai_analysis: { source: "demo", note: "Pre-loaded demo scenario for ChemPro (highest-complexity hazard profile).", timestamp: new Date().toISOString() },
      stage: "assessed"
    }
  }
];