import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');

const allowedManualSqlFiles = new Set([
  'create_expo_tables_and_seed.sql',
  'run_me.sql',
]);
const allowedDateOnlyMigrationFiles = new Set([
  '20260318_production_setup.sql',
]);
const publicSceneTables = ['sectors', 'companies', 'booths'];
const quoteTable = 'modular_home_quote_requests';

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function normalizeSql(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function readSqlFiles() {
  if (!fs.existsSync(migrationsDir)) {
    fail(`Missing migrations directory: ${path.relative(repoRoot, migrationsDir)}`);
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => {
      const filePath = path.join(migrationsDir, fileName);
      return {
        fileName,
        filePath,
        sql: fs.readFileSync(filePath, 'utf8'),
      };
    });
}

function splitIdentifierList(input) {
  return input
    .split(',')
    .map((value) => value.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}

function parsePrivilegeList(input) {
  return input
    .split(',')
    .flatMap((value) => value.trim().split(/\s+/))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value && value !== 'privileges');
}

function collectGrants(normalizedSql) {
  const grants = [];
  const grantPattern = /\bgrant\s+(.+?)\s+on\s+(?:table\s+)?(?:only\s+)?(?:(public)\.)?([a-z_][a-z0-9_]*)\s+to\s+(.+?);/g;
  let match;

  while ((match = grantPattern.exec(`${normalizedSql};`)) !== null) {
    grants.push({
      privileges: parsePrivilegeList(match[1]),
      schema: match[2] || 'public',
      table: match[3],
      grantees: splitIdentifierList(match[4]),
    });
  }

  return grants;
}

function hasDangerousPrivilege(privileges) {
  return privileges.some((privilege) => (
    privilege === 'all'
    || privilege === 'select'
    || privilege === 'insert'
    || privilege === 'update'
    || privilege === 'delete'
  ));
}

function hasRestrictedMutationPrivilege(privileges) {
  return privileges.some((privilege) => (
    privilege === 'all'
    || privilege === 'insert'
    || privilege === 'update'
    || privilege === 'delete'
  ));
}

function grantTargetsPublicClient(grant) {
  return grant.grantees.some((grantee) => grantee === 'anon' || grantee === 'authenticated' || grantee === 'public');
}

function assertMigrationOrder(sqlFiles) {
  const ordered = [];
  const seenTimestamps = new Set();

  for (const { fileName } of sqlFiles) {
    const canonical = fileName.match(/^(\d{14})_[a-z0-9][a-z0-9_]*\.sql$/);
    if (canonical) {
      const timestamp = canonical[1];
      if (seenTimestamps.has(timestamp)) {
        fail(`Duplicate migration timestamp ${timestamp} in ${fileName}.`);
      }
      seenTimestamps.add(timestamp);
      ordered.push({ fileName, timestamp });
      continue;
    }

    const dateOnly = fileName.match(/^(\d{8})_[a-z0-9][a-z0-9_]*\.sql$/);
    if (dateOnly && allowedDateOnlyMigrationFiles.has(fileName)) {
      const timestamp = `${dateOnly[1]}000000`;
      if (seenTimestamps.has(timestamp)) {
        fail(`Duplicate normalized date-only migration timestamp ${timestamp} in ${fileName}.`);
      }
      seenTimestamps.add(timestamp);
      ordered.push({ fileName, timestamp });
      notes.push(`Allowed legacy date-only migration in ordered chain: ${fileName}.`);
      continue;
    }

    if (allowedManualSqlFiles.has(fileName)) {
      notes.push(`Allowed manual SQL helper outside ordered migration chain: ${fileName}.`);
      continue;
    }

    fail(`Non-canonical migration SQL filename: ${fileName}. Expected YYYYMMDDHHMMSS_description.sql.`);
  }

  const sortedTimestamps = [...ordered].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  ordered.forEach((entry, index) => {
    if (entry.timestamp !== sortedTimestamps[index].timestamp) {
      fail(`Migration order is not chronological at ${entry.fileName}; expected ${sortedTimestamps[index].fileName}.`);
    }
  });

  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].timestamp <= ordered[index - 1].timestamp) {
      fail(`Migration timestamp sequence is not strictly increasing: ${ordered[index - 1].fileName} -> ${ordered[index].fileName}.`);
    }
  }

  notes.push(`Checked ${ordered.length} timestamped migrations in strict chronological order.`);
}

function assertQuoteTableRls(normalizedSql, grants) {
  if (!new RegExp(`\\balter\\s+table\\s+(?:public\\.)?${quoteTable}\\s+enable\\s+row\\s+level\\s+security\\b`).test(normalizedSql)) {
    fail(`${quoteTable} must enable row level security.`);
  }

  const defaultDenyPattern = new RegExp(
    `\\bcreate\\s+policy\\s+.+?\\s+on\\s+(?:public\\.)?${quoteTable}\\s+for\\s+all\\s+(?:to\\s+[^\\s]+\\s+)?using\\s*\\(\\s*false\\s*\\)\\s+with\\s+check\\s*\\(\\s*false\\s*\\)`,
  );
  if (!defaultDenyPattern.test(normalizedSql)) {
    fail(`${quoteTable} must keep a FOR ALL default-deny policy with USING (false) and WITH CHECK (false).`);
  }

  const publicQuoteGrants = grants.filter((grant) => (
    grant.schema === 'public'
    && grant.table === quoteTable
    && grantTargetsPublicClient(grant)
    && hasDangerousPrivilege(grant.privileges)
  ));
  publicQuoteGrants.forEach((grant) => {
    fail(`${quoteTable} must not grant direct DML/read privileges to anon/authenticated/public clients; found ${grant.privileges.join(',')} to ${grant.grantees.join(',')}.`);
  });
}

function assertPublicSceneGrants(grants) {
  for (const table of publicSceneTables) {
    const tableGrants = grants.filter((grant) => grant.schema === 'public' && grant.table === table);
    const anonSelect = tableGrants.some((grant) => grant.grantees.includes('anon') && grant.privileges.includes('select'));
    const authenticatedSelect = tableGrants.some((grant) => grant.grantees.includes('authenticated') && grant.privileges.includes('select'));

    if (!anonSelect) {
      fail(`public.${table} must grant SELECT to anon for the public scene contract.`);
    }
    if (!authenticatedSelect) {
      fail(`public.${table} must grant SELECT to authenticated for the public scene contract.`);
    }

    tableGrants
      .filter((grant) => grantTargetsPublicClient(grant) && hasRestrictedMutationPrivilege(grant.privileges))
      .forEach((grant) => {
        fail(`public.${table} must expose only public SELECT to anon/authenticated/public clients; found ${grant.privileges.join(',')} to ${grant.grantees.join(',')}.`);
      });
  }
}

const sqlFiles = readSqlFiles();
const combinedNormalizedSql = normalizeSql(sqlFiles.map((file) => file.sql).join('\n'));
const grants = sqlFiles.flatMap((file) => collectGrants(normalizeSql(file.sql)));

assertMigrationOrder(sqlFiles);
assertQuoteTableRls(combinedNormalizedSql, grants);
assertPublicSceneGrants(grants);

if (failures.length > 0) {
  console.error('[check-supabase-rls] failed');
  failures.forEach((message) => console.error(`- ${message}`));
  if (notes.length > 0) {
    console.error('[check-supabase-rls] notes');
    notes.forEach((message) => console.error(`- ${message}`));
  }
  process.exit(1);
}

console.log('[check-supabase-rls] passed');
notes.forEach((message) => console.log(`- ${message}`));
console.log(`- Verified ${quoteTable} RLS/default-deny and no public direct grants.`);
console.log(`- Verified public scene SELECT grants for: ${publicSceneTables.map((table) => `public.${table}`).join(', ')}.`);
