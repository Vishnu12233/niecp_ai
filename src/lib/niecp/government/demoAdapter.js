// NIECP Demo Government Adapter — INTERNAL NIECP DEMONSTRATION SYSTEM.
// This is NOT a government API. All data is synthetic. Every transaction
// carries truthful metadata proving it is a simulation.

export const DEMO_META = {
  environment: "DEMO",
  data_source: "SYNTHETIC",
  government_api: "NOT_CONNECTED",
  authorization_status: "NOT_AUTHORIZED",
  live: false
};

export const DEMO_DISCLAIMER =
  "DEMO — SYNTHETIC DATA. Demonstration workflow only. Not connected to a live government system.";

export function demoCorrelationId() {
  return `NIECP-CORR-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export function demoApplicationId(sequence) {
  return `NIECP-DEMO-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
}

// Synthetic clarification requests per approval category. Clearly labelled
// synthetic — never presented as real government queries.
const SYNTHETIC_QUERIES = {
  environmental_consent:
    "Please provide details of the hazardous waste storage arrangements and a layout plan showing solvent handling and waste collection areas.",
  fire_noc:
    "Please submit the building stability certificate and records of fire safety equipment installation and maintenance.",
  factory_license:
    "Please provide the manufacturing process flow chart and details of raw material and finished goods storage.",
  e_waste_authorization:
    "Please submit the Extended Producer Responsibility plan and details of authorized recycler/dismantler arrangements.",
  hazardous_waste_authorization:
    "Please provide the hazardous waste manifest format and details of the authorized transporter and treatment facility.",
  electrical_approval:
    "Please submit the single-line diagram of the electrical installation and the transformer test certificate.",
  labour_registration:
    "Please provide the employee strength declaration and contractor details if any.",
  product_standards_bis:
    "Please submit the product test reports from a BIS-recognized laboratory.",
  export_import_license:
    "Please provide bank details for the IEC application and a cancelled cheque copy.",
  gst_registration:
    "Please provide proof of principal place of business and a photograph of the premises.",
  default:
    "Please provide supporting documents for the applied activity, including a layout plan and process details."
};

// Demo status engine. One simulated government event per sync.
// SUBMITTED → UNDER_REVIEW → QUERY_RAISED → (user responds) → USER_RESPONDED
// → UNDER_REVIEW → APPROVED
export function nextDemoEvent(application) {
  switch (application.status) {
    case "SUBMITTED":
      return {
        status: "UNDER_REVIEW",
        note: "Demo application moved to the review queue (simulated).",
        next_action: "Check status again to advance the demo workflow."
      };
    case "UNDER_REVIEW": {
      const unanswered = (application.queries || []).some((q) => !q.response);
      if (!unanswered) {
        return {
          status: "APPROVED",
          note: "Demo application approved (simulated). Subject to synthetic compliance conditions — this is NOT a real government approval.",
          next_action: "Review compliance obligations and renewal reminders."
        };
      }
      return null; // still reviewing the response — nothing to do
    }
    case "USER_RESPONDED":
      return {
        status: "UNDER_REVIEW",
        note: "Query response received in the demo environment (simulated).",
        next_action: "Check status again for the simulated decision."
      };
    default:
      return null;
  }
}

// Raises a synthetic query (called when a demo application first enters review)
export function raiseDemoQuery(application) {
  return {
    id: demoCorrelationId(),
    text: SYNTHETIC_QUERIES[application.approval_key] || SYNTHETIC_QUERIES.default,
    raised_at: new Date().toISOString(),
    source: "NIECP_DEMO",
    data_source: "SYNTHETIC",
    response: null,
    responded_at: null
  };
}

export const DEMO_STATUSES = [
  "DRAFT", "READY_TO_APPLY", "USER_CONFIRMED", "SUBMITTED", "UNDER_REVIEW",
  "QUERY_RAISED", "USER_RESPONDED", "APPROVED", "REJECTED"
];