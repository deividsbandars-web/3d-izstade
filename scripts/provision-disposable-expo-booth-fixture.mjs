#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const REQUIRED_PROJECT_REF = 'aasovfczmqytdtugcrmh';
const BLOCKED_PRODUCTION_PROJECT_REFS = new Set(['gbmxrposlrhctyaaznmj']);
const DEFAULTS = {
  boothName: 'Disposable Staging Booth',
  boothDescription: 'Disposable staging-only fixture',
  boothType: 'standard',
  district: 'tech',
  subscriptionType: 'standard',
};

function helpText() {
  return `Disposable staging expo booth fixture provisioning helper

Usage:
  doppler run -- node scripts/provision-disposable-expo-booth-fixture.mjs

Required env:
  QA_CONFIRM_CREATE_DISPOSABLE_EXPO_BOOTH=true
  QA_DISPOSABLE_COMPANY_ID=<staging company id>
  QA_DISPOSABLE_OWNER_USER_ID=<staging sponsor user id>
  QA_DISPOSABLE_OWNER_EMAIL=<staging sponsor email>
  SUPABASE_URL=<staging Supabase project URL>
  SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY

Optional env:
  QA_DISPOSABLE_BOOTH_NAME=Disposable Staging Booth
  QA_DISPOSABLE_BOOTH_DESCRIPTION=Disposable staging-only fixture
  QA_DISPOSABLE_BOOTH_TYPE=standard
  QA_DISPOSABLE_BOOTH_DISTRICT=tech
  QA_DISPOSABLE_SUBSCRIPTION_TYPE=standard

Safety rules:
  - Staging only.
  - Refuses production-looking Supabase project refs.
  - Refuses to run unless QA_CONFIRM_CREATE_DISPOSABLE_EXPO_BOOTH=true.
  - Prints only redacted metadata and the generated fixture id.
  - Does not upload media, approve, reject, or promote.
`;
}

function fail(message) {
  console.error('Disposable expo booth fixture provisioning: FAIL');
  console.error(message);
  process.exit(1);
}

function readEnv(name) {
  return String(process.env[name] || '').trim();
}

function requireEnv(name) {
  const value = readEnv(name);
  if (!value) {
    fail(`${name} is required.`);
  }
  return value;
}

function parseSupabaseProjectRef(supabaseUrl) {
  let parsed;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    throw new Error(`Invalid SUPABASE_URL: ${supabaseUrl}`);
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith('.supabase.co')) {
    throw new Error(`Refusing non-Supabase host: ${host}`);
  }

  const projectRef = host.split('.')[0];
  if (BLOCKED_PRODUCTION_PROJECT_REFS.has(projectRef)) {
    throw new Error(`Refusing blocked production Supabase project ref: ${projectRef}`);
  }

  if (projectRef !== REQUIRED_PROJECT_REF) {
    throw new Error(`Supabase project ref mismatch: expected ${REQUIRED_PROJECT_REF}, got ${projectRef}`);
  }

  return { host, projectRef, origin: `${parsed.protocol}//${parsed.host}` };
}

function redactEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!value) {
    return '<redacted>';
  }
  const [localPart = '', domain = ''] = value.split('@');
  const domainHead = domain.split('.')[0] || '';
  const domainTail = domain.includes('.') ? domain.slice(domain.indexOf('.')) : '';
  return `${localPart.slice(0, 1)}***@${domainHead.slice(0, 1)}***${domainTail}`;
}

function redactId(value) {
  const id = String(value || '').trim();
  if (!id) {
    return '<redacted>';
  }
  return `${id.slice(0, 4)}***${id.slice(-4)}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, json, text };
}

async function verifySceneContract() {
  const response = await fetch('https://api-staging.30sek24.com/api/expo/scene');
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`/api/expo/scene returned ${response.status}`);
  }
  if (text.includes('expo_review_media')) {
    throw new Error('/api/expo/scene leaked expo_review_media');
  }
  return { status: response.status };
}

async function lookupCompany(baseUrl, serviceRoleKey, companyId) {
  const url = `${baseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}&select=id,name,slug&limit=1`;
  const { response, json, text } = await fetchJson(url, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Company lookup failed with ${response.status}: ${text.slice(0, 200)}`);
  }

  return Array.isArray(json) && json.length > 0 ? json[0] : null;
}

async function lookupAuthUser(baseUrl, serviceRoleKey, userId, email) {
  const url = `${baseUrl}/auth/v1/admin/users?per_page=200`;
  const { response, json, text } = await fetchJson(url, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Auth user lookup failed with ${response.status}: ${text.slice(0, 200)}`);
  }

  const users = Array.isArray(json?.users) ? json.users : [];
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedUserId = String(userId || '').trim().toLowerCase();
  const match = users.find((user) => (
    String(user.id || '').toLowerCase() === normalizedUserId
    || String(user.email || '').trim().toLowerCase() === normalizedEmail
  ));

  return match || null;
}

async function lookupExistingFixture(baseUrl, serviceRoleKey, companyId, boothName) {
  const url = `${baseUrl}/rest/v1/expo_booths?select=id,company_id,company_name,status,contact_info&company_id=eq.${encodeURIComponent(companyId)}&company_name=eq.${encodeURIComponent(boothName)}&limit=1`;
  const { response, json, text } = await fetchJson(url, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Existing fixture lookup failed with ${response.status}: ${text.slice(0, 200)}`);
  }

  return Array.isArray(json) && json.length > 0 ? json[0] : null;
}

async function insertFixture(baseUrl, serviceRoleKey, payload) {
  const { response, json, text } = await fetchJson(`${baseUrl}/rest/v1/expo_booths?select=id,company_id,company_name,status,contact_info`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Fixture insert failed with ${response.status}: ${text.slice(0, 400)}`);
  }

  return Array.isArray(json) && json.length > 0 ? json[0] : null;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(helpText());
    return;
  }

  if (readEnv('QA_CONFIRM_CREATE_DISPOSABLE_EXPO_BOOTH') !== 'true') {
    fail('QA_CONFIRM_CREATE_DISPOSABLE_EXPO_BOOTH=true is required.');
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_KEY') || readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    fail('SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is required.');
  }

  const { projectRef, origin } = parseSupabaseProjectRef(supabaseUrl);
  const companyId = requireEnv('QA_DISPOSABLE_COMPANY_ID');
  const ownerUserId = requireEnv('QA_DISPOSABLE_OWNER_USER_ID');
  const ownerEmail = requireEnv('QA_DISPOSABLE_OWNER_EMAIL');
  const boothName = readEnv('QA_DISPOSABLE_BOOTH_NAME') || DEFAULTS.boothName;
  const boothDescription = readEnv('QA_DISPOSABLE_BOOTH_DESCRIPTION') || DEFAULTS.boothDescription;
  const boothType = readEnv('QA_DISPOSABLE_BOOTH_TYPE') || DEFAULTS.boothType;
  const boothDistrict = readEnv('QA_DISPOSABLE_BOOTH_DISTRICT') || DEFAULTS.district;
  const subscriptionType = readEnv('QA_DISPOSABLE_SUBSCRIPTION_TYPE') || DEFAULTS.subscriptionType;

  await verifySceneContract();

  const company = await lookupCompany(origin, serviceRoleKey, companyId);
  if (!company) {
    fail(`Staging company not found: ${redactId(companyId)}`);
  }

  const authUser = await lookupAuthUser(origin, serviceRoleKey, ownerUserId, ownerEmail);
  if (!authUser) {
    fail(`Disposable owner Auth user not found: ${redactEmail(ownerEmail)} / ${redactId(ownerUserId)}`);
  }

  const existingFixture = await lookupExistingFixture(origin, serviceRoleKey, companyId, boothName);
  if (existingFixture) {
    console.log(JSON.stringify({
      action: 'reused-existing',
      projectRef,
      companyId: redactId(companyId),
      companyName: company.name,
      ownerEmail: redactEmail(ownerEmail),
      ownerUserId: redactId(ownerUserId),
      fixtureId: existingFixture.id,
      status: existingFixture.status,
      boothName,
    }, null, 2));
    return;
  }

  const inserted = await insertFixture(origin, serviceRoleKey, {
    company_id: companyId,
    company_name: boothName,
    industry_sector: null,
    subscription_type: subscriptionType,
    assets_3d: {},
    contact_info: {
      owner_user_id: ownerUserId,
      owner_email: ownerEmail,
      company_id: companyId,
    },
    status: 'draft',
    description: boothDescription,
    booth_type: boothType,
    '3d_model_url': null,
    logo: null,
    contact_email: ownerEmail,
    district: boothDistrict,
  });

  if (!inserted?.id) {
    fail('Fixture insert did not return a row id.');
  }

  console.log(JSON.stringify({
    action: 'created',
    projectRef,
    companyId: redactId(companyId),
    companyName: company.name,
    ownerEmail: redactEmail(ownerEmail),
    ownerUserId: redactId(ownerUserId),
    fixtureId: inserted.id,
    status: inserted.status,
    boothName,
  }, null, 2));
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
