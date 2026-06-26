#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

const BLOCKED_PRODUCTION_PROJECT_REFS = new Set([
  'gbmxrposlrhctyaaznmj',
]);

const DEFAULTS = {
  intendedRole: 'admin',
  lookupMaxPages: 10,
  lookupPageSize: 100,
};

function parseBoolean(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function optionalEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

function normalizeSupabaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function looksPlaceholder(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return true;
  if (text.includes('<') || text.includes('>')) return true;
  return [
    'booth-id',
    'disposable-staging-booth-id',
    'example',
    'placeholder',
    'test-booth-id',
    'todo',
  ].includes(text);
}

function safeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) {
    throw new Error('ADMIN_TARGET_EMAIL is required.');
  }
  if (looksPlaceholder(email)) {
    throw new Error(`Placeholder ADMIN_TARGET_EMAIL is not allowed: ${value}`);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Invalid ADMIN_TARGET_EMAIL: ${value}`);
  }
  return email;
}

function safeUserId(value) {
  const userId = String(value || '').trim();
  if (!userId) {
    throw new Error('ADMIN_TARGET_USER_ID is required.');
  }
  if (looksPlaceholder(userId)) {
    throw new Error(`Placeholder ADMIN_TARGET_USER_ID is not allowed: ${value}`);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error(`Invalid ADMIN_TARGET_USER_ID: ${value}`);
  }
  return userId;
}

function safeLookupHint(value) {
  const hint = String(value || '').trim();
  if (!hint) return '';
  if (looksPlaceholder(hint)) {
    throw new Error(`Placeholder ADMIN_LOOKUP_HINT is not allowed: ${value}`);
  }
  return hint;
}

function redactEmail(email) {
  const [localPart = '', domain = ''] = String(email || '').split('@');
  const maskedLocal = localPart ? `${localPart.slice(0, 1)}***` : '<redacted>';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts.length > 1
    ? `${domainParts[0].slice(0, 1)}***.${domainParts.slice(1).join('.')}`
    : '<redacted>';
  return `${maskedLocal}@${maskedDomain}`;
}

function redactId(value) {
  const id = String(value || '').trim();
  if (!id) return '<redacted>';
  if (id.length <= 8) return `${id.slice(0, 2)}***`;
  return `${id.slice(0, 4)}***${id.slice(-4)}`;
}

function redactMaybeFullEmail(email, showFullEmails) {
  return showFullEmails ? String(email || '').trim() : redactEmail(email);
}

function parseProjectRef(supabaseUrl) {
  const parsed = new URL(supabaseUrl);
  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith('.supabase.co')) {
    throw new Error(`Refusing non-Supabase host: ${host}`);
  }
  return host.split('.')[0];
}

function formatSupabaseHostSummary(supabaseUrl) {
  const parsed = new URL(supabaseUrl);
  return {
    host: parsed.hostname,
    projectRef: redactId(parsed.hostname.split('.')[0] || ''),
  };
}

function assertSafeTarget({ supabaseUrl, expectedProjectRef, applyMode }) {
  const projectRef = parseProjectRef(supabaseUrl);

  if (BLOCKED_PRODUCTION_PROJECT_REFS.has(projectRef)) {
    throw new Error(`Refusing blocked production Supabase project ref: ${projectRef}`);
  }

  if (expectedProjectRef) {
    if (projectRef !== expectedProjectRef.toLowerCase()) {
      throw new Error(
        `Supabase project ref mismatch: expected ${expectedProjectRef}, got ${projectRef}. Refusing to proceed.`,
      );
    }
  } else if (applyMode) {
    throw new Error(
      'ADMIN_EXPECTED_PROJECT_REF is required when ADMIN_ROLE_APPLY=true so the helper can verify the staging target.',
    );
  }

  return projectRef;
}

function printHelp() {
  console.log(`Staging admin role grant helper

Usage:
  doppler run -- node scripts/grant-staging-admin-role.mjs

Required env:
  ADMIN_TARGET_EMAIL
  SUPABASE_URL
  SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY

Safety / apply controls:
  ADMIN_ROLE_APPLY=true            Actually apply the role change. Default: dry-run only
  ADMIN_EXPECTED_PROJECT_REF=...   Required for apply mode; recommended for dry-run
  ADMIN_TARGET_USER_ID=...         Optional direct auth-user lookup by UUID
  ADMIN_LOOKUP_HINT=...            Optional redacted candidate search hint
  ADMIN_SHOW_FULL_EMAILS=true      Local-only; never use in reports or handoff files

Rules:
  - Dry-run is the default.
  - The helper refuses known production-looking Supabase project refs.
  - The helper never prints service keys or tokens.
  - The helper only updates auth metadata role to admin; it does not touch public.users.role.
`);
}

function readCurrentRole(user) {
  const role = user?.app_metadata?.role;
  return typeof role === 'string' && role.trim() ? role : 'user';
}

async function getAuthUserByEmail(authAdmin, email) {
  const target = email.toLowerCase();

  for (let page = 1; page <= DEFAULTS.lookupMaxPages; page += 1) {
    const { data, error } = await authAdmin.listUsers({ page, perPage: DEFAULTS.lookupPageSize });
    if (error) {
      throw new Error(`Supabase listUsers failed: ${error.message}`);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === target);
    if (match) {
      return { candidates: [], lookupMethod: 'auth.users by email', user: match };
    }

    if (!data.users.length || data.users.length < DEFAULTS.lookupPageSize) {
      break;
    }
  }

  return null;
}

async function getAuthUserById(authAdmin, userId) {
  const { data, error } = await authAdmin.getUserById(userId);
  if (error) {
    throw new Error(`Supabase getUserById failed: ${error.message}`);
  }

  return data?.user
    ? { candidates: [], lookupMethod: 'auth.users by id', user: data.user }
    : null;
}

async function collectAuthCandidates(authAdmin, hint, { showFullEmails = false } = {}) {
  const needle = hint.toLowerCase();
  const candidates = [];

  for (let page = 1; page <= DEFAULTS.lookupMaxPages; page += 1) {
    const { data, error } = await authAdmin.listUsers({ page, perPage: DEFAULTS.lookupPageSize });
    if (error) {
      throw new Error(`Supabase listUsers failed during candidate search: ${error.message}`);
    }

    for (const user of data.users) {
      const email = String(user.email || '').toLowerCase();
      const id = String(user.id || '').toLowerCase();
      if (email.includes(needle) || id.includes(needle)) {
        candidates.push({
          email: redactMaybeFullEmail(user.email || '', showFullEmails),
          id: redactId(user.id),
          role: readCurrentRole(user),
        });
      }

      if (candidates.length >= 5) {
        return candidates;
      }
    }

    if (!data.users.length || data.users.length < DEFAULTS.lookupPageSize) {
      break;
    }
  }

  return candidates;
}

async function getPublicUsersMatch(supabase, { authUser, targetEmail, targetUserId, showFullEmails = false }) {
  try {
    const query = targetUserId || authUser?.id
      ? supabase.from('users').select('id,email,role').eq('id', targetUserId || authUser.id).limit(1)
      : supabase.from('users').select('id,email,role').eq('email', targetEmail).limit(1);
    const { data, error } = await query;

    if (error) {
      return {
        evidence: null,
        reason: error.message,
        status: 'NOT_VERIFIABLE',
      };
    }

    const row = Array.isArray(data) ? data[0] : data?.[0] || data || null;
    if (!row) {
      return {
        evidence: null,
        reason: 'No matching public.users row',
        status: 'NOT_FOUND',
      };
    }

    return {
      evidence: {
        email: redactMaybeFullEmail(row.email || '', showFullEmails),
        id: redactId(row.id),
        role: row.role || 'user',
      },
      reason: 'Matching public.users row found',
      status: 'FOUND',
    };
  } catch (error) {
    return {
      evidence: null,
      reason: error instanceof Error ? error.message : String(error),
      status: 'NOT_VERIFIABLE',
    };
  }
}

async function run() {
  const rawTargetEmail = process.env.ADMIN_TARGET_EMAIL?.trim() || '';
  const rawTargetUserId = process.env.ADMIN_TARGET_USER_ID?.trim() || '';
  const targetEmail = rawTargetEmail ? safeEmail(rawTargetEmail) : '';
  const targetUserId = rawTargetUserId ? safeUserId(rawTargetUserId) : '';
  const lookupHint = safeLookupHint(process.env.ADMIN_LOOKUP_HINT);
  const showFullEmails = parseBoolean(process.env.ADMIN_SHOW_FULL_EMAILS);
  const supabaseUrl = normalizeSupabaseUrl(requiredEnv('SUPABASE_URL'));
  const supabaseServiceKey = optionalEnv('SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is required.');
  }

  const applyMode = parseBoolean(process.env.ADMIN_ROLE_APPLY);
  const expectedProjectRef = String(process.env.ADMIN_EXPECTED_PROJECT_REF || '').trim();
  const projectRef = assertSafeTarget({ supabaseUrl, expectedProjectRef, applyMode });
  const hostSummary = formatSupabaseHostSummary(supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let lookupResult = null;
  let authLookupStatus = 'NOT_ATTEMPTED';
  let authLookupReason = 'No lookup attempted';
  try {
    if (targetUserId) {
      lookupResult = await getAuthUserById(supabase.auth.admin, targetUserId);
    } else if (targetEmail) {
      lookupResult = await getAuthUserByEmail(supabase.auth.admin, targetEmail);
    }

    if (lookupResult?.user) {
      authLookupStatus = 'FOUND';
      authLookupReason = 'Auth user found';
    } else {
      authLookupStatus = 'NOT_FOUND';
      authLookupReason = 'No Auth user matched the provided target';
    }
  } catch (error) {
    authLookupStatus = 'FAILED';
    authLookupReason = error instanceof Error ? error.message : String(error);
  }

  const authUser = lookupResult?.user || null;
  const publicUsersMatch = await getPublicUsersMatch(supabase, {
    authUser,
    showFullEmails,
    targetEmail: targetEmail || authUser?.email || '',
    targetUserId,
  });
  const candidates = !authUser && lookupHint
    ? await collectAuthCandidates(supabase.auth.admin, lookupHint, { showFullEmails })
    : [];

  console.log(`Staging admin role grant: ${applyMode ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Supabase host: ${hostSummary.host}`);
  console.log(`Supabase project ref: ${projectRef ? redactId(projectRef) : '<redacted>'}`);
  console.log(`Service-role env present: ${Boolean(supabaseServiceKey) ? 'yes' : 'no'}`);
  console.log(`Target email: ${targetEmail ? redactMaybeFullEmail(targetEmail, showFullEmails) : '<not provided>'}`);
  console.log(`Target user id: ${targetUserId ? redactId(targetUserId) : '<not provided>'}`);
  console.log(`Lookup method: ${lookupResult?.lookupMethod || (targetUserId ? 'auth.users by id' : targetEmail ? 'auth.users by email' : 'none')}`);
  console.log(`Auth lookup status: ${authLookupStatus}`);
  console.log(`Auth lookup reason: ${authLookupReason}`);
  console.log(`Auth user found: ${authUser ? 'yes' : 'no'}`);
  console.log(`public.users match: ${publicUsersMatch.status}`);
  console.log(`public.users reason: ${publicUsersMatch.reason}`);
  if (publicUsersMatch.evidence) {
    console.log(`public.users evidence: ${JSON.stringify(publicUsersMatch.evidence)}`);
  }
  console.log(`Current app_metadata.role: ${authUser ? readCurrentRole(authUser) : '<not found>'}`);
  console.log(`Intended app_metadata.role: ${DEFAULTS.intendedRole}`);
  console.log('Legacy public.users.role: not changed by this helper');

  if (!authUser && candidates.length) {
    console.log(`Lookup hint candidates (${candidates.length}): ${JSON.stringify(candidates)}`);
  } else if (!authUser && lookupHint) {
    console.log('Lookup hint candidates: none found');
  }

  if (!authUser) {
    const reason = authLookupStatus === 'FAILED'
      ? `Auth lookup failed: ${authLookupReason}`
      : targetUserId
        ? `No Supabase Auth user found for user id ${redactId(targetUserId)}.`
        : `No Supabase Auth user found for ${targetEmail ? redactMaybeFullEmail(targetEmail, showFullEmails) : '<not provided>'}.`;
    throw new Error(reason);
  }

  if (!applyMode) {
    console.log('No mutation performed. Set ADMIN_ROLE_APPLY=true to apply the auth metadata update.');
    return;
  }

  const nextAppMetadata = {
    ...(authUser.app_metadata || {}),
    role: DEFAULTS.intendedRole,
  };

  const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
    app_metadata: nextAppMetadata,
  });

  if (error) {
    throw new Error(`Supabase updateUserById failed for ${targetEmail ? redactMaybeFullEmail(targetEmail, showFullEmails) : redactId(authUser.id)}: ${error.message}`);
  }

  const updatedRole = readCurrentRole(data.user);
  console.log(`Updated app_metadata.role: ${updatedRole}`);
  console.log('Mutation complete. Sign out and sign back in on staging to refresh the JWT.');
}

async function main() {
  const helpRequested = process.argv.slice(2).some((arg) => arg === '--help' || arg === '-h');
  if (helpRequested) {
    printHelp();
    return 0;
  }

  try {
    await run();
    return 0;
  } catch (error) {
    console.error('Staging admin role grant: FAIL');
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const exitCode = await main();
  process.exitCode = exitCode;
}
