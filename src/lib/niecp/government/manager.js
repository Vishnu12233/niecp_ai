// NIECP Government Integration Manager
// The single facade over every government channel. The rest of NIECP talks to
// this manager — never to a provider directly. No live government API is
// authorized for this application, so no channel is ever shown as LIVE.
// Channels: DEMO (synthetic), OFFICIAL_REDIRECT (verified portals), MANUAL
// (user-entered tracking). ARCHITECTURE-READY for future authorized APIs.

import { base44 } from "@/api/base44Client";
import { listProviders, getProvider } from "./registry";
import { DEMO_META, demoCorrelationId, demoApplicationId, nextDemoEvent, raiseDemoQuery } from "./demoAdapter";

export { listProviders, getProvider, DEMO_META };

export const MODE_LABELS = {
  DEMO: {
    icon: "🟡",
    chip: "DEMO — SYNTHETIC",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
    description: "NIECP demonstration workflow with synthetic data. Not connected to a live government system."
  },
  OFFICIAL_REDIRECT: {
    icon: "🔵",
    chip: "OFFICIAL REDIRECT",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
    description: "No live API is connected. Your application is prepared here, then you continue on the official government portal."
  },
  MANUAL: {
    icon: "⚪",
    chip: "MANUAL TRACKING",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
    description: "No API or automated workflow available. You apply outside NIECP and record the status here."
  },
  PENDING_AUTHORIZATION: {
    icon: "🟠",
    chip: "PENDING AUTHORIZATION",
    className: "bg-orange-100 text-orange-800 border border-orange-200",
    description: "Official credentials are not authorized yet. No live government API is connected — no data is returned until a real authenticated response succeeds."
  },
  PENDING_VERIFICATION: {
    icon: "🔵",
    chip: "PENDING VERIFICATION",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    description: "Credentials are configured but no real authenticated response has succeeded yet."
  },
  NOT_AVAILABLE: {
    icon: "⚪",
    chip: "NOT AVAILABLE",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
    description: "No authorized API exists for this service. Continue via the official portal or manual tracking."
  },
  AUTHORIZED_API: {
    icon: "🟢",
    chip: "LIVE API",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    description: "Authorized live government API connection."
  }
};

export function modeLabel(mode) {
  return MODE_LABELS[mode] || MODE_LABELS.MANUAL;
}

// Apply decision logic: authorized LIVE API > verified official portal > manual.
export function resolveChannel(approval) {
  const liveProvider = listProviders().find((p) => p.live && p.authorization_status === "AUTHORIZED");
  if (liveProvider) return { mode: "AUTHORIZED_API", provider: liveProvider };
  if (approval?.source_url) return { mode: "OFFICIAL_REDIRECT", provider: null, url: approval.source_url };
  return { mode: "MANUAL", provider: null };
}

export async function logAudit(entry) {
  try {
    await base44.entities.AuditLog.create({
      profile_id: entry.profile_id || "",
      action: entry.action,
      detail: entry.detail || "",
      category: entry.category || "application",
      application_id: entry.application_id || "",
      integration_mode: entry.integration_mode || "",
      provider: entry.provider || "",
      correlation_id: entry.correlation_id || "",
      status_before: entry.status_before || "",
      status_after: entry.status_after || "",
      source: entry.source || ""
    });
  } catch (e) {
    // audit logging must never break the user flow
  }
}

async function nextDemoSequence(profileId) {
  try {
    const existing = await base44.entities.Application.filter({ profile_id: profileId, integration_mode: "DEMO" });
    return (existing?.length || 0) + 1;
  } catch (e) {
    return Math.floor(Math.random() * 9000) + 1000;
  }
}

// ---- DEMO ADAPTER (internal NIECP demonstration, synthetic data) ----
export async function submitDemoApplication({ profile, approval }) {
  const correlationId = demoCorrelationId();
  const sequence = await nextDemoSequence(profile.id);
  const reference = demoApplicationId(sequence);
  const app = await base44.entities.Application.create({
    profile_id: profile.id,
    approval_key: approval.approval_key,
    approval_name: approval.approval_name,
    authority: approval.authority,
    application_reference: reference,
    status: "SUBMITTED",
    status_source: "NIECP_DEMO",
    official_url: approval.source_url || "",
    integration_mode: "DEMO",
    environment: DEMO_META.environment,
    data_source: DEMO_META.data_source,
    provider: "NIECP Demo Government",
    correlation_id: correlationId,
    submitted_date: new Date().toISOString(),
    next_action: "Check status to advance the demo workflow (simulated).",
    notes: DEMO_META.government_api === "NOT_CONNECTED" ? "NIECP demo application — synthetic data." : "",
    timeline: [
      {
        at: new Date().toISOString(),
        status: "SUBMITTED",
        source: "NIECP_DEMO",
        note: `Demo application submitted to the NIECP demonstration environment. Reference ${reference} is a synthetic NIECP demo ID.`
      }
    ],
    queries: []
  });
  await logAudit({
    profile_id: profile.id,
    action: "DEMO_SUBMITTED",
    detail: `${approval.approval_name} — ${reference} (synthetic demo ID)`,
    category: "application",
    application_id: app.id,
    integration_mode: "DEMO",
    provider: "NIECP Demo Government",
    correlation_id: correlationId,
    status_before: "USER_CONFIRMED",
    status_after: "SUBMITTED",
    source: "NIECP_DEMO"
  });
  return app;
}

// Simulated status check: advances the demo state machine by one event.
export async function syncDemoApplication(app) {
  // First check while UNDER_REVIEW raises a synthetic query; further review
  // events flow through the state machine in demoAdapter.nextDemoEvent.
  if (app.status === "UNDER_REVIEW" && !(app.queries || []).length) {
    const query = raiseDemoQuery(app);
    const queries = [...(app.queries || []), query];
    const timeline = [
      ...(app.timeline || []),
      { at: new Date().toISOString(), status: "QUERY_RAISED", source: "NIECP_DEMO", note: "A synthetic clarification request was raised in the demo environment." }
    ];
    const updated = await base44.entities.Application.update(app.id, {
      status: "QUERY_RAISED", queries, timeline,
      next_action: "Translate the demo query and respond to continue."
    });
    await logAudit({
      profile_id: app.profile_id, action: "QUERY_RECORDED",
      detail: `Synthetic query raised on ${app.approval_name} (DEMO)`,
      category: "query", application_id: app.id, integration_mode: "DEMO",
      provider: "NIECP Demo Government", correlation_id: app.correlation_id,
      status_before: "UNDER_REVIEW", status_after: "QUERY_RAISED", source: "NIECP_DEMO"
    });
    return updated;
  }

  const event = nextDemoEvent(app);
  if (!event) return app;
  const timeline = [...(app.timeline || []), { at: new Date().toISOString(), status: event.status, source: "NIECP_DEMO", note: event.note }];
  const updated = await base44.entities.Application.update(app.id, {
    status: event.status,
    timeline,
    next_action: event.next_action
  });
  await logAudit({
    profile_id: app.profile_id,
    action: "APPLICATION_STATUS_CHANGED",
    detail: `${app.approval_name}: ${app.status} → ${event.status} (DEMO simulation)`,
    category: "application",
    application_id: app.id,
    integration_mode: "DEMO",
    provider: "NIECP Demo Government",
    correlation_id: app.correlation_id,
    status_before: app.status,
    status_after: event.status,
    source: "NIECP_DEMO"
  });
  return updated;
}

export async function respondToQuery(app, queryId, responseText) {
  const source = app.integration_mode === "DEMO" ? "NIECP_DEMO" : "USER_ENTERED";
  const queries = (app.queries || []).map((q) =>
    q.id === queryId ? { ...q, response: responseText, responded_at: new Date().toISOString() } : q
  );
  const timeline = [
    ...(app.timeline || []),
    { at: new Date().toISOString(), status: "USER_RESPONDED", source, note: "Query response submitted." }
  ];
  const updated = await base44.entities.Application.update(app.id, {
    status: "USER_RESPONDED",
    queries,
    timeline,
    next_action: app.integration_mode === "DEMO" ? "Check status again for the simulated decision." : "Await the authority's decision and record any update."
  });
  await logAudit({
    profile_id: app.profile_id,
    action: "QUERY_RESPONSE_SUBMITTED",
    detail: `Response submitted for a query on ${app.approval_name}`,
    category: "query",
    application_id: app.id,
    integration_mode: app.integration_mode,
    provider: app.provider || "",
    correlation_id: app.correlation_id || "",
    status_before: app.status,
    status_after: "USER_RESPONDED",
    source
  });
  return updated;
}

// ---- OFFICIAL REDIRECT ADAPTER (verified official portals only) ----
export async function openOfficialRedirect({ profile, approval }) {
  const existing = await base44.entities.Application.filter({
    profile_id: profile.id,
    approval_key: approval.approval_key
  });
  let app = (existing || []).find((a) => a.integration_mode === "OFFICIAL_REDIRECT");
  if (!app) {
    app = await base44.entities.Application.create({
      profile_id: profile.id,
      approval_key: approval.approval_key,
      approval_name: approval.approval_name,
      authority: approval.authority,
      status: "DRAFT",
      status_source: "USER_ENTERED",
      official_url: approval.source_url,
      portal: approval.source_url,
      integration_mode: "OFFICIAL_REDIRECT",
      next_action: "Complete the application on the official portal, then record the reference here.",
      timeline: [
        { at: new Date().toISOString(), status: "DRAFT", source: "USER_ENTERED", note: "Application prepared in NIECP-AI. Continue on the official portal." }
      ],
      queries: []
    });
    await logAudit({
      profile_id: profile.id,
      action: "APPLICATION_PREPARED",
      detail: `${approval.approval_name} prepared for official redirect`,
      category: "application",
      application_id: app.id,
      integration_mode: "OFFICIAL_REDIRECT",
      provider: approval.authority,
      correlation_id: app.correlation_id || "",
      status_before: "",
      status_after: "DRAFT",
      source: "USER_ENTERED"
    });
  }
  await logAudit({
    profile_id: profile.id,
    action: "OFFICIAL_REDIRECT_OPENED",
    detail: `${approval.approval_name} — opened ${approval.source_url}`,
    category: "application",
    application_id: app.id,
    integration_mode: "OFFICIAL_REDIRECT",
    provider: approval.authority,
    correlation_id: app.correlation_id || "",
    source: "USER_ENTERED"
  });
  return app;
}

// ---- MANUAL APPLICATION ADAPTER (user-entered tracking) ----
export async function createManualTracking({ profile, approval }) {
  const app = await base44.entities.Application.create({
    profile_id: profile.id,
    approval_key: approval.approval_key,
    approval_name: approval.approval_name,
    authority: approval.authority,
    status: "DRAFT",
    status_source: "USER_ENTERED",
    official_url: approval.source_url || "",
    integration_mode: "MANUAL",
    next_action: "Apply at the authority/portal and record the application ID and status here.",
    timeline: [
      { at: new Date().toISOString(), status: "DRAFT", source: "USER_ENTERED", note: "Manual tracking started. All statuses will be user-entered." }
    ],
    queries: []
  });
  await logAudit({
    profile_id: profile.id,
    action: "APPLICATION_PREPARED",
    detail: `${approval.approval_name} — manual tracking created`,
    category: "application",
    application_id: app.id,
    integration_mode: "MANUAL",
    provider: approval.authority,
    correlation_id: app.correlation_id || "",
    status_before: "",
    status_after: "DRAFT",
    source: "USER_ENTERED"
  });
  return app;
}

export async function updateManualStatus(app, fields) {
  const source = "USER_ENTERED";
  const timeline = [...(app.timeline || [])];
  if (fields.status && fields.status !== app.status) {
    timeline.push({ at: new Date().toISOString(), status: fields.status, source, note: fields.note || "Status updated (user-entered)." });
  }
  const updated = await base44.entities.Application.update(app.id, {
    application_reference: fields.application_reference ?? app.application_reference,
    submitted_date: fields.submitted_date ?? app.submitted_date,
    portal: fields.portal ?? app.portal ?? app.official_url,
    status: fields.status || app.status,
    notes: fields.notes ?? app.notes,
    next_action: fields.next_action ?? app.next_action,
    timeline
  });
  await logAudit({
    profile_id: app.profile_id,
    action: "MANUAL_STATUS_UPDATED",
    detail: `${app.approval_name}: ${app.status} → ${fields.status || app.status}`,
    category: "application",
    application_id: app.id,
    integration_mode: app.integration_mode,
    provider: app.provider || app.authority,
    correlation_id: app.correlation_id || "",
    status_before: app.status,
    status_after: fields.status || app.status,
    source
  });
  return updated;
}

export async function recordManualQuery(app, queryText) {
  const query = {
    id: demoCorrelationId(),
    text: queryText,
    raised_at: new Date().toISOString(),
    source: "USER_ENTERED",
    data_source: "USER_ENTERED",
    response: null,
    responded_at: null
  };
  const queries = [...(app.queries || []), query];
  const timeline = [
    ...(app.timeline || []),
    { at: new Date().toISOString(), status: "QUERY_RAISED", source: "USER_ENTERED", note: "Government query recorded (user-entered)." }
  ];
  const updated = await base44.entities.Application.update(app.id, {
    status: app.status === "APPROVED" || app.status === "REJECTED" ? app.status : "QUERY_RAISED",
    queries,
    timeline,
    next_action: "Translate the query and prepare your response."
  });
  await logAudit({
    profile_id: app.profile_id,
    action: "QUERY_RECORDED",
    detail: `Query recorded on ${app.approval_name}`,
    category: "query",
    application_id: app.id,
    integration_mode: app.integration_mode,
    provider: app.provider || app.authority,
    correlation_id: app.correlation_id || "",
    status_before: app.status,
    status_after: "QUERY_RAISED",
    source: "USER_ENTERED"
  });
  return updated;
}