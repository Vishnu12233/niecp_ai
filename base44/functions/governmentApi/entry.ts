import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// NIECP Government Integration Manager (server-side). All external government
// API calls flow through here — credentials never reach the frontend.
// Adapters: DataGov (UDYAM MSME dataset + India Post Pincode directory),
// MCA, DigiLocker (requester), NSWS.
// A provider is reported LIVE only after a real successful authenticated
// response. Without credentials the mode is PENDING_AUTHORIZATION — never
// DEMO masquerading as live, never fabricated data.
//
// CREDENTIALS: none are configured yet (secrets deliberately not set).
// To activate live data.gov.in lookups later: register a free data.gov.in API
// key (https://www.data.gov.in/user/register) as the app's data-gov secret,
// then set CONFIG.dataGovApiKey to read it; DigiLocker / NSWS credentials the
// same way once officially authorized.

const CONFIG = {
  dataGovApiKey: null,           // data.gov.in API key (not configured yet)
  digiLockerConfigured: false,  // DigiLocker partner credentials (not authorized yet)
  nswsConfigured: false         // NSWS partner credentials (not authorized yet)
};

const DATA_GOV_BASE = 'https://api.data.gov.in/resource/';
// Official dataset resource IDs (non-secret configuration).
// UDYAM: List of MSME Registered Units under UDYAM
// PINCODE: All India Pincode Directory till last month
// MCA: Company Master Data (Ministry of Corporate Affairs)
// CPCB_AIR: Real time Air Quality Index from various locations
// SURFACE_WATER: CPCB surface water quality observations
const RESOURCE_IDS = {
  udyam: '8b68ae56-84cf-4728-a0a6-1be11028dea7',
  pincode: '5c2f62fe-5afa-4119-a499-fec9d604d5bd',
  mca: '4dbe5667-7b6b-41d7-82af-211562424d9a',
  cpcb_air: '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69',
  surface_water: '19697d76-442e-4d76-aeae-13f8a17c91e1'
};
const DATASET_KEYS = ['udyam', 'pincode', 'mca', 'cpcb_air', 'surface_water'];
const TIMEOUT_MS = 15000; // hard timeout per attempt
const MAX_PER_MINUTE = 30; // in-memory rate limiting per user

// Last real successful authenticated response per provider (instance memory;
// the permanent record lives in the AuditLog entity).
const lastSuccess = new Map();
const rateMap = new Map();

function correlationId() {
  return 'gov-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function allowRate(userId) {
  const now = Date.now();
  const windowStart = now - 60000;
  const hits = (rateMap.get(userId) || []).filter((t) => t > windowStart);
  if (hits.length >= MAX_PER_MINUTE) return false;
  hits.push(now);
  rateMap.set(userId, hits);
  return true;
}

async function audit(base44, entry) {
  try {
    await base44.entities.AuditLog.create(entry);
  } catch (e) {
    // audit logging must never break the user flow
  }
}

function dataGovMode(key) {
  if (!CONFIG.dataGovApiKey) return 'PENDING_AUTHORIZATION';
  return lastSuccess.get(key) ? 'LIVE' : 'PENDING_VERIFICATION';
}

function providerCatalog() {
  return [
    {
      key: 'udyam',
      provider: 'UDYAM — MSME Registered Units dataset',
      organization: 'Ministry of Micro, Small and Medium Enterprises',
      service: 'List of MSME Registered Units under UDYAM (data.gov.in)',
      purpose: 'MSME dataset matching for project profile enrichment. This is a government dataset match — NOT a UDYAM registration verification service.',
      endpoint: DATA_GOV_BASE + RESOURCE_IDS.udyam,
      http_method: 'GET',
      authentication_method: 'data.gov.in API key (not configured yet)',
      authorization_status: 'PENDING',
      integration_mode: dataGovMode('udyam'),
      supported_operations: ['dataset_search'],
      timeout_ms: TIMEOUT_MS,
      retry_policy: '1 retry on timeout/5xx',
      last_verified: lastSuccess.get('udyam') || null,
      fallback_mode: 'MANUAL',
      official_portal_url: 'https://udyamregistration.gov.in/',
      docs_url: 'https://www.data.gov.in/resource/list-msme-registered-units-under-udyam'
    },
    {
      key: 'pincode',
      provider: 'India Post Pincode Directory',
      organization: 'Department of Posts, Government of India',
      service: 'All India Pincode Directory till last month (data.gov.in)',
      purpose: 'Validate pincode and enrich project location (state, district, post office).',
      endpoint: DATA_GOV_BASE + RESOURCE_IDS.pincode,
      http_method: 'GET',
      authentication_method: 'data.gov.in API key (not configured yet)',
      authorization_status: 'PENDING',
      integration_mode: dataGovMode('pincode'),
      supported_operations: ['pincode_lookup'],
      timeout_ms: TIMEOUT_MS,
      retry_policy: '1 retry on timeout/5xx',
      last_verified: lastSuccess.get('pincode') || null,
      fallback_mode: 'MANUAL',
      official_portal_url: 'https://www.indiapost.gov.in/vas/pages/findpincode.aspx',
      docs_url: 'https://www.data.gov.in/resource/all-india-pincode-directory-till-last-month'
    },
    {
      key: 'mca',
      provider: 'MCA Company Master Data (public dataset)',
      organization: 'Ministry of Corporate Affairs',
      service: 'Company Master Data — company identity, status, registered office and industrial classification',
      purpose: 'Match the project against the public MCA company dataset. This is a PUBLIC GOVERNMENT DATASET match — not an authorized MCA verification API.',
      endpoint: DATA_GOV_BASE + RESOURCE_IDS.mca,
      http_method: 'GET',
      authentication_method: 'data.gov.in API key (not configured yet)',
      authorization_status: 'PENDING',
      integration_mode: dataGovMode('mca'),
      supported_operations: ['cin_search', 'company_name_search'],
      timeout_ms: TIMEOUT_MS,
      retry_policy: '1 retry on timeout/5xx',
      last_verified: lastSuccess.get('mca') || null,
      fallback_mode: 'MANUAL',
      official_portal_url: 'https://www.mca.gov.in/',
      docs_url: DATA_GOV_BASE + RESOURCE_IDS.mca
    },
    {
      key: 'cpcb_air',
      provider: 'CPCB Air Quality (public dataset)',
      organization: 'Central Pollution Control Board',
      service: 'Real time Air Quality Index observations by station',
      purpose: 'Environmental CONTEXT for the project location (state, city, station, pollutant observations). Never decides whether an environmental approval applies.',
      endpoint: DATA_GOV_BASE + RESOURCE_IDS.cpcb_air,
      http_method: 'GET',
      authentication_method: 'data.gov.in API key (not configured yet)',
      authorization_status: 'PENDING',
      integration_mode: dataGovMode('cpcb_air'),
      supported_operations: ['air_quality_context'],
      timeout_ms: TIMEOUT_MS,
      retry_policy: '1 retry on timeout/5xx',
      last_verified: lastSuccess.get('cpcb_air') || null,
      fallback_mode: 'MANUAL',
      official_portal_url: 'https://cpcb.nic.in/',
      docs_url: DATA_GOV_BASE + RESOURCE_IDS.cpcb_air
    },
    {
      key: 'surface_water',
      provider: 'CPCB Surface Water Quality (public dataset)',
      organization: 'Central Pollution Control Board',
      service: 'Surface water quality observations (basin, station, pH, BOD, COD, DO, TDS)',
      purpose: 'Historical environmental CONTEXT for the project location. Historical observations are never presented as current water quality and never decide approval applicability.',
      endpoint: DATA_GOV_BASE + RESOURCE_IDS.surface_water,
      http_method: 'GET',
      authentication_method: 'data.gov.in API key (not configured yet)',
      authorization_status: 'PENDING',
      integration_mode: dataGovMode('surface_water'),
      supported_operations: ['water_quality_context'],
      timeout_ms: TIMEOUT_MS,
      retry_policy: '1 retry on timeout/5xx',
      last_verified: lastSuccess.get('surface_water') || null,
      fallback_mode: 'MANUAL',
      official_portal_url: 'https://cpcb.nic.in/',
      docs_url: DATA_GOV_BASE + RESOURCE_IDS.surface_water
    },
    {
      key: 'digilocker',
      provider: 'DigiLocker (Requester)',
      organization: 'NeGD / MeitY, Government of India',
      service: 'Authorized verified digital document retrieval',
      purpose: 'Let users provide DigiLocker-authorized documents to NIECP.',
      endpoint: null,
      http_method: 'OAuth 2.0 (requester flow)',
      authentication_method: CONFIG.digiLockerConfigured ? 'CREDENTIALS_CONFIGURED (requester flow not yet implemented)' : 'Partner credentials not authorized',
      authorization_status: CONFIG.digiLockerConfigured ? 'CREDENTIALS_PRESENT' : 'PENDING',
      integration_mode: 'PENDING_AUTHORIZATION',
      supported_operations: [],
      timeout_ms: null,
      retry_policy: null,
      last_verified: null,
      fallback_mode: 'OFFICIAL_REDIRECT',
      official_portal_url: 'https://www.digilocker.gov.in/',
      docs_url: 'https://apisetu.gov.in/'
    },
    {
      key: 'nsws',
      provider: 'NSWS — National Single Window System',
      organization: 'Invest India / DPIIT',
      service: 'Central + state approvals single window',
      purpose: 'Approval applications through the official portal.',
      endpoint: null,
      http_method: null,
      authentication_method: CONFIG.nswsConfigured ? 'CREDENTIALS_CONFIGURED (API not yet implemented)' : 'Partner credentials not authorized',
      authorization_status: CONFIG.nswsConfigured ? 'CREDENTIALS_PRESENT' : 'PENDING',
      integration_mode: 'PENDING_AUTHORIZATION',
      supported_operations: [],
      timeout_ms: null,
      retry_policy: null,
      last_verified: null,
      fallback_mode: 'OFFICIAL_REDIRECT',
      official_portal_url: 'https://www.nsws.gov.in/',
      docs_url: 'https://www.nsws.gov.in/'
    }
  ];
}

// data.gov.in resource call with timeout, retry and response validation.
// Error mapping: 401/403 → AUTHORIZATION_UNAVAILABLE, 429 → RATE_LIMIT,
// 5xx/timeout → PROVIDER_ERROR (1 retry), network → NETWORK_ERROR,
// unexpected shape → INVALID_RESPONSE. Never returns fabricated records.
async function dataGovFetch({ resource, filters = {}, limit = 20, apiKey }) {
  const params = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    limit: String(Math.min(100, limit)),
    offset: '0'
  });
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(`filters[${k}]`, String(v));
  }
  const url = DATA_GOV_BASE + resource + '?' + params.toString();
  for (let attempt = 0; attempt <= 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'AUTHORIZATION_UNAVAILABLE', code: res.status };
      if (res.status === 429) return { ok: false, error: 'RATE_LIMIT', code: 429 };
      if (!res.ok) {
        if (res.status >= 500 && attempt === 0) continue;
        return { ok: false, error: 'PROVIDER_ERROR', code: res.status };
      }
      const data = await res.json().catch(() => null);
      const records = Array.isArray(data?.records) ? data.records : null;
      if (!records) return { ok: false, error: 'INVALID_RESPONSE', code: res.status };
      return { ok: true, records, total: data.total ?? records.length };
    } catch (e) {
      clearTimeout(timer);
      if (attempt === 0) continue; // one retry on timeout/network
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }
  return { ok: false, error: 'NETWORK_ERROR' };
}

// Bounded dataset search. Exact field filters are used wherever the user gave
// one; when a name term is supplied, a single bounded page is scanned and the
// method is reported as PAGE_SCAN so it is never hidden from the user.
async function dataGovSearch({ resource, filters = {}, nameField, nameQuery, limit = 20, apiKey }) {
  const term = String(nameQuery || '').trim();
  if (!term) {
    const r = await dataGovFetch({ resource, filters, limit, apiKey });
    return r.ok ? { ...r, match_method: 'FIELD_FILTER' } : r;
  }
  const page = await dataGovFetch({ resource, filters, limit: 100, apiKey });
  if (!page.ok) return page;
  const needle = term.toLowerCase();
  const matches = page.records.filter((rec) => String(rec?.[nameField] ?? '').toLowerCase().includes(needle));
  return {
    ok: true,
    records: matches.slice(0, Math.min(100, limit)),
    total: matches.length,
    scanned: page.records.length,
    match_method: 'PAGE_SCAN',
    match_note: `Name matched by scanning ${page.records.length} dataset record(s) returned for the selected filters — not a full-dataset search.`
  };
}

function titleCase(s) {
  return String(s || '').trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanRecord(r) {
  const out = {};
  for (const [k, v] of Object.entries(r || {})) {
    if (v !== null && v !== '' && String(k)[0] !== '_') out[k] = v;
  }
  return out;
}

function provenance(organization, dataset) {
  return {
    source: 'data.gov.in',
    organization,
    dataset,
    retrieval_mode: 'OFFICIAL_API',
    retrieved_at: new Date().toISOString(),
    verification: 'SOURCE_BACKED'
  };
}

const FRIENDLY_ERRORS = {
  AUTHORIZATION_UNAVAILABLE: 'Government service authorization is pending. Please continue through the official portal.',
  RATE_LIMIT: 'Government service is busy. Please try again in a moment.',
  PROVIDER_ERROR: 'Government service is temporarily unavailable. Please try again later.',
  NETWORK_ERROR: 'Government service is temporarily unavailable. Please check your connection.',
  INVALID_RESPONSE: 'Government service returned an unexpected response. No data was used.'
};

export default async function(req) {
  const corr = correlationId();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const operation = String(body?.operation || 'status');
    const params = body?.params || {};

    if (!allowRate(user.id)) {
      return Response.json({ status: 'ERROR', error: 'RATE_LIMIT', message: FRIENDLY_ERRORS.RATE_LIMIT, correlation_id: corr });
    }

    const apiKey = CONFIG.dataGovApiKey;
    const pendingAuth = 'Government API credentials are not authorized yet. No data is returned and nothing is simulated — please continue via the official portal or manual tracking.';

    if (operation === 'status') {
      const providers = providerCatalog();
      await audit(base44, {
        action: 'GOV_API_STATUS_READ', category: 'government_api',
        detail: 'Integration status read', provider: 'ALL', correlation_id: corr, source: 'NIECP'
      });
      return Response.json({
        status: 'success',
        providers,
        note: 'Providers are LIVE only after a real successful authenticated response. PENDING_AUTHORIZATION means credentials are not yet authorized.',
        correlation_id: corr
      });
    }

    if (operation === 'test') {
      const key = String(params.provider || '');
      const providers = providerCatalog();
      const provider = providers.find((p) => p.key === key);
      if (!provider) return Response.json({ status: 'ERROR', message: 'Unknown provider', correlation_id: corr }, { status: 400 });
      if (DATASET_KEYS.includes(key)) {
        if (!apiKey) {
          await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `test ${key} → PENDING_AUTHORIZATION`, provider: provider.provider, correlation_id: corr, integration_mode: 'PENDING_AUTHORIZATION', source: 'DATA_GOV_IN' });
          return Response.json({
            status: 'PENDING_AUTHORIZATION',
            message: 'The data.gov.in API key is not configured yet. Add it when you are ready to enable this integration.',
            provider, correlation_id: corr
          });
        }
        const TEST_FILTERS = {
          pincode: { Pincode: '110001' },
          mca: { CompanyStateCode: 'TN' },
          cpcb_air: { state: 'Tamil Nadu' },
          surface_water: { State: 'Tamil Nadu' },
          udyam: {}
        };
        const testFilters = TEST_FILTERS[key] || {};
        const result = await dataGovFetch({ resource: RESOURCE_IDS[key], filters: testFilters, limit: 1, apiKey });
        if (result.ok) {
          lastSuccess.set(key, new Date().toISOString());
          await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `test ${key} → LIVE (real authenticated response)`, provider: provider.provider, correlation_id: corr, integration_mode: 'LIVE', source: 'DATA_GOV_IN' });
          return Response.json({ status: 'success', mode: 'LIVE', verified_at: lastSuccess.get(key), provider: providerCatalog().find((p) => p.key === key), correlation_id: corr });
        }
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `test ${key} → ${result.error}`, provider: provider.provider, correlation_id: corr, integration_mode: providerCatalog().find((p) => p.key === key).integration_mode, source: 'DATA_GOV_IN' });
        return Response.json({ status: 'ERROR', error: result.error, message: FRIENDLY_ERRORS[result.error], correlation_id: corr });
      }
      // mca / digilocker / nsws — no fake connectivity
      await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `test ${key} → PENDING_AUTHORIZATION`, provider: provider.provider, correlation_id: corr, integration_mode: provider.integration_mode, source: 'NIECP' });
      return Response.json({
        status: 'PENDING_AUTHORIZATION',
        message: key === 'digilocker'
          ? 'DigiLocker integration is awaiting official partner authorization.'
          : 'Authorization is pending. Please continue through the official portal.',
        provider, correlation_id: corr
      });
    }

    if (operation === 'pincode_lookup') {
      const pincode = String(params.pincode || '').trim();
      if (!/^\d{6}$/.test(pincode)) {
        return Response.json({ status: 'ERROR', message: 'Enter a valid 6-digit pincode.', correlation_id: corr }, { status: 400 });
      }
      if (!apiKey) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `pincode_lookup ${pincode} → PENDING_AUTHORIZATION`, provider: 'India Post Pincode Directory', correlation_id: corr, integration_mode: 'PENDING_AUTHORIZATION', source: 'DATA_GOV_IN' });
        return Response.json({ status: 'PENDING_AUTHORIZATION', message: 'Pincode lookup needs the data.gov.in API key. Until then, enter the location manually.', correlation_id: corr });
      }
      const result = await dataGovFetch({ resource: RESOURCE_IDS.pincode, filters: { pincode }, limit: 20, apiKey });
      if (!result.ok) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `pincode_lookup ${pincode} → ${result.error}`, provider: 'India Post Pincode Directory', correlation_id: corr, integration_mode: dataGovMode('pincode'), source: 'DATA_GOV_IN' });
        return Response.json({ status: 'ERROR', error: result.error, message: FRIENDLY_ERRORS[result.error], correlation_id: corr });
      }
      lastSuccess.set('pincode', new Date().toISOString());
      const offices = result.records.map((r) => ({
        office: r.officename || r.office_name || null,
        district: r.district || null,
        state: r.statename || r.state || null,
        division: r.divisionname || null,
        circle: r.circlename || null,
        raw: r
      }));
      const primary = offices[0] || {};
      await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `pincode_lookup ${pincode} → ${result.total} offices`, provider: 'India Post Pincode Directory', correlation_id: corr, integration_mode: 'LIVE', source: 'DATA_GOV_IN' });
      return Response.json({
        status: 'success',
        pincode,
        state: primary.state,
        district: primary.district,
        offices,
        total: result.total,
        source: { portal: 'data.gov.in', organization: 'Department of Posts', dataset: 'All India Pincode Directory till last month' },
        verification_status: 'GOVERNMENT_DATASET_MATCH',
        correlation_id: corr
      });
    }

    if (operation === 'udyam_search') {
      const state = titleCase(params.state).slice(0, 80);
      const district = titleCase(params.district).slice(0, 80);
      const pincode = String(params.pincode || '').trim().slice(0, 6);
      const enterprise = String(params.enterprise_name || '').trim().slice(0, 120);
      if (!state && !district && !pincode && !enterprise) {
        return Response.json({ status: 'ERROR', message: 'Provide an enterprise name, state, district or pincode to search.', correlation_id: corr }, { status: 400 });
      }
      if (pincode && !/^\d{6}$/.test(pincode)) {
        return Response.json({ status: 'ERROR', message: 'Enter a valid 6-digit pincode.', correlation_id: corr }, { status: 400 });
      }
      if (!apiKey) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: 'udyam_search → PENDING_AUTHORIZATION', provider: 'UDYAM (data.gov.in)', correlation_id: corr, integration_mode: 'PENDING_AUTHORIZATION', source: 'DATA_GOV_IN' });
        return Response.json({ status: 'PENDING_AUTHORIZATION', message: 'MSME dataset search needs the data.gov.in API key. Until then, no search is performed.', correlation_id: corr });
      }
      const result = await dataGovSearch({
        resource: RESOURCE_IDS.udyam,
        filters: {
          ...(state ? { State: state } : {}),
          ...(district ? { District: district } : {}),
          ...(pincode ? { Pincode: pincode } : {})
        },
        nameField: 'EnterpriseName',
        nameQuery: enterprise,
        limit: 20,
        apiKey
      });
      if (!result.ok) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `udyam_search → ${result.error}`, provider: 'UDYAM (data.gov.in)', correlation_id: corr, integration_mode: dataGovMode('udyam'), source: 'DATA_GOV_IN' });
        return Response.json({ status: 'ERROR', error: result.error, message: FRIENDLY_ERRORS[result.error], correlation_id: corr });
      }
      lastSuccess.set('udyam', new Date().toISOString());
      await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `udyam_search (${enterprise || 'any name'}; ${state || 'any state'}${district ? ' / ' + district : ''}${pincode ? ' / ' + pincode : ''}) → ${result.total} records`, provider: 'UDYAM (data.gov.in)', correlation_id: corr, integration_mode: 'LIVE', source: 'DATA_GOV_IN' });
      return Response.json({
        status: 'success',
        records: result.records.map(cleanRecord),
        total: result.total,
        match_method: result.match_method,
        match_note: result.match_note || null,
        provenance: provenance('Ministry of Micro, Small and Medium Enterprises', 'List of MSME Registered Units under UDYAM'),
        verification_status: 'GOVERNMENT_DATASET_MATCH',
        verification_label: 'Government Dataset Match · Source: data.gov.in · Status: Source-backed',
        disclaimer: 'Dataset match only — not a verified UDYAM registration and not an official UDYAM verification API.',
        correlation_id: corr
      });
    }

    if (operation === 'mca_search') {
      const cin = String(params.cin || '').trim().toUpperCase().slice(0, 30);
      const name = String(params.company_name || '').trim().slice(0, 120);
      const state = String(params.state || '').trim().toUpperCase().slice(0, 4);
      if (!cin && !name) {
        return Response.json({ status: 'ERROR', message: 'Provide a CIN or a company name to search.', correlation_id: corr }, { status: 400 });
      }
      if (!apiKey) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: 'mca_search → PENDING_AUTHORIZATION', provider: 'MCA (data.gov.in)', correlation_id: corr, integration_mode: 'PENDING_AUTHORIZATION', source: 'DATA_GOV_IN' });
        return Response.json({ status: 'PENDING_AUTHORIZATION', message: 'MCA company dataset lookup needs the data.gov.in API key. Until then, no lookup is performed — use the official MCA portal.', correlation_id: corr });
      }
      const result = await dataGovSearch({
        resource: RESOURCE_IDS.mca,
        filters: { ...(cin ? { CIN: cin } : {}), ...(state ? { CompanyStateCode: state } : {}) },
        nameField: 'CompanyName',
        nameQuery: name,
        limit: 20,
        apiKey
      });
      if (!result.ok) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `mca_search → ${result.error}`, provider: 'MCA (data.gov.in)', correlation_id: corr, integration_mode: dataGovMode('mca'), source: 'DATA_GOV_IN' });
        return Response.json({ status: 'ERROR', error: result.error, message: FRIENDLY_ERRORS[result.error], correlation_id: corr });
      }
      lastSuccess.set('mca', new Date().toISOString());
      await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `mca_search (${cin || name}) → ${result.total} records`, provider: 'MCA (data.gov.in)', correlation_id: corr, integration_mode: 'LIVE', source: 'DATA_GOV_IN' });
      return Response.json({
        status: 'success',
        records: result.records.map(cleanRecord),
        total: result.total,
        match_method: result.match_method,
        match_note: result.match_note || null,
        provenance: provenance('Ministry of Corporate Affairs', 'Company Master Data (public dataset)'),
        verification_status: 'PUBLIC_GOVERNMENT_DATASET',
        verification_label: 'Public Government Dataset · Source: data.gov.in · Not an authorized MCA verification',
        disclaimer: 'Public dataset match only — NIECP-AI does not claim live MCA verification.',
        correlation_id: corr
      });
    }

    if (operation === 'cpcb_air_query') {
      const state = titleCase(params.state).slice(0, 80);
      const city = titleCase(params.city).slice(0, 80);
      if (!state && !city) {
        return Response.json({ status: 'ERROR', message: 'Provide a state or city for air-quality context.', correlation_id: corr }, { status: 400 });
      }
      if (!apiKey) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: 'cpcb_air_query → PENDING_AUTHORIZATION', provider: 'CPCB Air Quality (data.gov.in)', correlation_id: corr, integration_mode: 'PENDING_AUTHORIZATION', source: 'DATA_GOV_IN' });
        return Response.json({ status: 'PENDING_AUTHORIZATION', message: 'Air-quality context needs the data.gov.in API key. Until then no environmental context is shown.', correlation_id: corr });
      }
      const result = await dataGovFetch({
        resource: RESOURCE_IDS.cpcb_air,
        filters: { ...(state ? { state } : {}), ...(city ? { city } : {}) },
        limit: 40,
        apiKey
      });
      if (!result.ok) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `cpcb_air_query → ${result.error}`, provider: 'CPCB Air Quality (data.gov.in)', correlation_id: corr, integration_mode: dataGovMode('cpcb_air'), source: 'DATA_GOV_IN' });
        return Response.json({ status: 'ERROR', error: result.error, message: FRIENDLY_ERRORS[result.error], correlation_id: corr });
      }
      lastSuccess.set('cpcb_air', new Date().toISOString());
      await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `cpcb_air_query (${city || state}) → ${result.total} observations`, provider: 'CPCB Air Quality (data.gov.in)', correlation_id: corr, integration_mode: 'LIVE', source: 'DATA_GOV_IN' });
      return Response.json({
        status: 'success',
        records: result.records.map(cleanRecord),
        total: result.total,
        data_nature: 'CONTEXTUAL_ENVIRONMENTAL_DATA',
        note: 'Air-quality observations are environmental context only. They never decide whether an environmental approval applies — the deterministic rule engine remains the authority.',
        provenance: provenance('Central Pollution Control Board', 'Real time Air Quality Index'),
        correlation_id: corr
      });
    }

    if (operation === 'surface_water_query') {
      const state = titleCase(params.state).slice(0, 80);
      const district = titleCase(params.district).slice(0, 80);
      if (!state && !district) {
        return Response.json({ status: 'ERROR', message: 'Provide a state or district for water-quality context.', correlation_id: corr }, { status: 400 });
      }
      if (!apiKey) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: 'surface_water_query → PENDING_AUTHORIZATION', provider: 'CPCB Surface Water (data.gov.in)', correlation_id: corr, integration_mode: 'PENDING_AUTHORIZATION', source: 'DATA_GOV_IN' });
        return Response.json({ status: 'PENDING_AUTHORIZATION', message: 'Water-quality context needs the data.gov.in API key. Until then no environmental context is shown.', correlation_id: corr });
      }
      const result = await dataGovFetch({
        resource: RESOURCE_IDS.surface_water,
        filters: { ...(state ? { State: state } : {}), ...(district ? { District: district } : {}) },
        limit: 40,
        apiKey
      });
      if (!result.ok) {
        await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `surface_water_query → ${result.error}`, provider: 'CPCB Surface Water (data.gov.in)', correlation_id: corr, integration_mode: dataGovMode('surface_water'), source: 'DATA_GOV_IN' });
        return Response.json({ status: 'ERROR', error: result.error, message: FRIENDLY_ERRORS[result.error], correlation_id: corr });
      }
      lastSuccess.set('surface_water', new Date().toISOString());
      await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `surface_water_query (${district || state}) → ${result.total} observations`, provider: 'CPCB Surface Water (data.gov.in)', correlation_id: corr, integration_mode: 'LIVE', source: 'DATA_GOV_IN' });
      return Response.json({
        status: 'success',
        records: result.records.map(cleanRecord),
        total: result.total,
        data_nature: 'HISTORICAL_ENVIRONMENTAL_DATA',
        note: 'These are historical water-quality observations, not current water quality. They are context only and never decide whether an approval applies.',
        provenance: provenance('Central Pollution Control Board', 'Surface water quality observations'),
        correlation_id: corr
      });
    }

    // DigiLocker requester operations — never faked
    if (operation === 'digilocker_authorize' || operation === 'digilocker_request_document' || operation === 'digilocker_retrieve_document') {
      await audit(base44, { action: 'GOV_API_CALL', category: 'government_api', detail: `${operation} → PENDING_AUTHORIZATION`, provider: 'DigiLocker (Requester)', correlation_id: corr, integration_mode: 'PENDING_AUTHORIZATION', source: 'NIECP' });
      return Response.json({
        status: 'PENDING_AUTHORIZATION',
        message: pendingAuth,
        redirect_url: 'https://www.digilocker.gov.in/',
        correlation_id: corr
      });
    }

    return Response.json({ status: 'ERROR', message: 'Unknown operation', correlation_id: corr }, { status: 400 });
  } catch (error) {
    return Response.json({ status: 'ERROR', message: 'Government service is temporarily unavailable.', correlation_id: corr }, { status: 500 });
  }
}