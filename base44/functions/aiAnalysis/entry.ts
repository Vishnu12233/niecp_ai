import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// AI Business Understanding Engine
// Analyzes the business description + profile and returns suggested regulatory factors
// with confidence and reasons. Uses deterministic fallback if AI is unavailable.

const FACTOR_KEYS = [
  "land_use","water_use","water_discharge","air_emissions","dust","voc_emissions",
  "hazardous_materials","chemical_storage","hazardous_waste","general_waste","e_waste",
  "plastic_waste","biomedical_waste","used_oil","battery_handling","fire_safety",
  "high_risk_operations","worker_safety","machinery_safety","factory_premises","boiler_use",
  "pressure_systems","electrical_safety","dg_set","fuel_storage","cold_storage","food_safety",
  "packaging","product_standards","import_activity","export_activity","data_privacy",
  "cybersecurity","labour_compliance","building_occupancy","construction","mining","retail","gst_applicable"
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { description, industry, sub_industry, infrastructure, scale, relevantFactors } = body || {};

    // Deterministic fallback baseline
    const fallback = {};
    relevantFactors.forEach((f) => {
      const inferred = inferFromInfrastructure(f, infrastructure);
      fallback[f] = { ai_value: inferred ? "YES" : "NO", confidence: 60, reason: inferred ? "Suggested from declared infrastructure." : "Not indicated by declared infrastructure.", source: "rule" };
    });

    try {
      const prompt = `You are NIECP-AI, a regulatory intelligence engine for Indian businesses.
Analyze this business and suggest which regulatory factors likely apply.
Return ONLY JSON matching the schema. Use "YES", "NO", or "NOT_SURE" for ai_value.
Be conservative: only say YES when the description clearly indicates the factor.

Business description: ${description || "N/A"}
Industry: ${industry || "N/A"}
Sub-industry: ${sub_industry || "N/A"}
Infrastructure: ${JSON.stringify(infrastructure || {})}
Scale: ${JSON.stringify(scale || {})}

Factors to assess: ${relevantFactors.join(", ")}`;

      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  ai_value: { type: "string", enum: ["YES", "NO", "NOT_SURE"] },
                  confidence: { type: "number" },
                  reason: { type: "string" }
                },
                required: ["key", "ai_value", "confidence", "reason"]
              }
            }
          },
          required: ["factors"]
        },
        model: "gemini_3_flash"
      });

      const out = res?.factors || [];
      const aiMap = {};
      out.forEach((f) => {
        if (relevantFactors.includes(f.key)) {
          aiMap[f.key] = {
            ai_value: f.ai_value,
            confidence: Math.min(99, Math.max(50, Math.round(f.confidence || 70))),
            reason: f.reason || "AI inferred from business description.",
            source: "ai"
          };
        }
      });
      // Merge: AI overrides fallback where present
      const merged = {};
      relevantFactors.forEach((f) => { merged[f] = aiMap[f] || fallback[f]; });
      return Response.json({ factors: merged, source: "ai" });
    } catch (e) {
      return Response.json({ factors: fallback, source: "rule", note: "AI assistance unavailable. Using rule-based assessment." });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function inferFromInfrastructure(factor, infra) {
  const map = {
    boiler_use: ["boiler", "steam_system"],
    chemical_storage: ["chemical_storage"],
    fuel_storage: ["fuel_storage"],
    battery_handling: ["battery_storage"],
    cold_storage: ["cold_storage"],
    electrical_safety: ["transformer", "dg_set", "power_connection"],
    dg_set: ["dg_set"],
    pressure_systems: ["pressure_equipment"],
    water_discharge: ["etp_stp", "water_treatment"],
    machinery_safety: ["production_machinery", "heavy_machinery"],
    factory_premises: ["factory_premises", "production_machinery", "heavy_machinery"],
    high_risk_operations: ["high_temp_equipment"]
  };
  const keys = map[factor] || [];
  return keys.some((k) => infra && infra[k]);
}