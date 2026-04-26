import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const routesRoot = path.join(repoRoot, 'backend-server', 'routes');
const controllersRoot = path.join(repoRoot, 'backend-server', 'controllers');
const middlewareRoot = path.join(repoRoot, 'backend-server', 'middleware');
const backendServerRoot = path.join(repoRoot, 'backend-server');
const backendExpoRoot = path.join(repoRoot, 'src', 'backend', 'expo');
const backendDistributionRoot = path.join(repoRoot, 'src', 'backend', 'distribution');
const backendPlatformRoot = path.join(repoRoot, 'src', 'backend', 'platform');
const backendAgentsRoot = path.join(repoRoot, 'src', 'backend', 'agents');
const backendAgentsToolsRoot = path.join(repoRoot, 'src', 'backend', 'agents', 'tools');
const backendAgentsToolAdaptersRoot = path.join(backendAgentsToolsRoot, 'adapters');
const backendEventsRoot = path.join(repoRoot, 'src', 'backend', 'events');
const backendGovernanceRoot = path.join(repoRoot, 'src', 'backend', 'governance');
const backendGrowthRoot = path.join(repoRoot, 'src', 'backend', 'growth');
const backendBusinessRoot = path.join(repoRoot, 'src', 'backend', 'business');
const backendLeadsRoot = path.join(repoRoot, 'src', 'backend', 'leads');
const backendRevenueRoot = path.join(repoRoot, 'src', 'backend', 'revenue');
const backendRevenueProspectingRoot = path.join(backendRevenueRoot, 'prospecting');
const revenueProspectingAdaptersPath = path.join(backendRevenueProspectingRoot, 'prospectingAdapters.ts');
const revenueProspectingGoogleMapsAdapterPath = path.join(backendRevenueProspectingRoot, 'prospectingGoogleMapsAdapter.ts');
const revenueProspectingTypesPath = path.join(backendRevenueProspectingRoot, 'prospectingTypes.ts');
const backendDataSourcesRoot = path.join(repoRoot, 'src', 'backend', 'dataSources');
const modulesExpoRoot = path.join(repoRoot, 'src', 'modules', 'expo');
const srcBackendRoot = path.join(repoRoot, 'src', 'backend');
const backendAiRoot = path.join(repoRoot, 'src', 'backend', 'ai');
const backendLoggingRoot = path.join(repoRoot, 'src', 'backend', 'logging');
const backendBillingRoot = path.join(repoRoot, 'src', 'backend', 'billing');
const backendBillingUsageRoot = path.join(backendBillingRoot, 'usage');
const srcAgentsRoot = path.join(repoRoot, 'src', 'agents');
const srcLibRoot = path.join(repoRoot, 'src', 'lib');
const srcLibSupabaseClientTs = path.join(srcLibRoot, 'supabaseClient.ts');
const srcLibSupabaseClientJs = path.join(srcLibRoot, 'supabaseClient.js');
const backendEventPublisherTs = path.join(backendEventsRoot, 'eventPublisher.ts');
const backendEventPublisherJs = path.join(backendEventsRoot, 'eventPublisher.js');
const agentsSchedulerTs = path.join(srcAgentsRoot, 'system', 'scheduler', 'agentScheduler.ts');
const agentsSchedulerJs = path.join(srcAgentsRoot, 'system', 'scheduler', 'agentScheduler.js');
const leadsGoogleMapsSourceTs = path.join(backendLeadsRoot, 'sources', 'googleMapsLeadSource.ts');
const leadsGoogleMapsSourceJs = path.join(backendLeadsRoot, 'sources', 'googleMapsLeadSource.js');
const leadsDirectorySourceTs = path.join(backendLeadsRoot, 'sources', 'directoryLeadSource.ts');
const leadsDirectorySourceJs = path.join(backendLeadsRoot, 'sources', 'directoryLeadSource.js');
const leadsLinkedinSourceTs = path.join(backendLeadsRoot, 'sources', 'linkedinLeadSource.ts');
const leadsLinkedinSourceJs = path.join(backendLeadsRoot, 'sources', 'linkedinLeadSource.js');
const leadsSerpApiHelperTs = path.join(backendLeadsRoot, 'sources', 'serpApiHelper.ts');
const leadsSerpApiHelperJs = path.join(backendLeadsRoot, 'sources', 'serpApiHelper.js');
const dataSourcesSerpApiSearchServiceTs = path.join(backendDataSourcesRoot, 'serpApiSearchService.ts');
const dataSourcesGoogleSearchServiceTs = path.join(backendDataSourcesRoot, 'googleSearchService.ts');
const leadValidationServiceTs = path.join(backendLeadsRoot, 'validation', 'leadValidationService.ts');
const leadValidationServiceJs = path.join(backendLeadsRoot, 'validation', 'leadValidationService.js');
const leadsControllerPath = path.join(controllersRoot, 'leadsController.ts');
const leadEnginePath = path.join(backendLeadsRoot, 'engine', 'leadEngine.ts');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'"`]*?\s+from\s+)?['"`]([^'"`]+)['"`]|\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
const TEST_PATH_FRAGMENT = '/__tests__/';

const allowedControllerTargets = new Map([
  [
    path.join(controllersRoot, 'landingController.ts'),
    [path.join(backendDistributionRoot, 'distributionApplicationService.ts')],
  ],
  [
    path.join(controllersRoot, 'platformController.ts'),
    [path.join(backendPlatformRoot, 'platformApplicationService.ts')],
  ],
  [
    path.join(controllersRoot, 'dashboardController.ts'),
    [path.join(backendPlatformRoot, 'platformApplicationService.ts')],
  ],
  [
    path.join(controllersRoot, 'agentsController.ts'),
    [path.join(backendAgentsRoot, 'agentsApplicationService.ts')],
  ],
  [
    path.join(controllersRoot, 'billingController.ts'),
    [path.join(backendBillingRoot, 'billingApplicationService.ts')],
  ],
  [leadsControllerPath, [path.join(backendLeadsRoot, 'leadsApplicationService.ts')]],
]);

const agentToolAdapterRules = [
  {
    match: path.join(backendAgentsToolAdaptersRoot, 'dataSourceToolAdapters.ts'),
    allow: [backendAgentsRoot, backendLoggingRoot, backendLeadsRoot, backendDataSourcesRoot],
    reason: 'data-source tool adapter may only import agents-local code, logging, leads sources, and dataSources dependencies',
  },
  {
    match: path.join(backendAgentsToolAdaptersRoot, 'leadToolAdapters.ts'),
    allow: [backendAgentsRoot, backendLoggingRoot, backendLeadsRoot],
    reason: 'lead tool adapter may only import agents-local code, logging, and leads dependencies',
  },
  {
    match: path.join(backendAgentsToolAdaptersRoot, 'workflowToolAdapters.ts'),
    allow: [backendAgentsRoot, backendLoggingRoot, backendBusinessRoot],
    reason: 'workflow tool adapter may only import agents-local code, logging, and business/workflow dependencies',
  },
  {
    match: path.join(backendAgentsToolAdaptersRoot, 'revenueToolAdapters.ts'),
    allow: [backendAgentsRoot, backendLoggingRoot, backendRevenueRoot],
    reason: 'revenue tool adapter may only import agents-local code, logging, and revenue dependencies',
  },
  {
    match: path.join(backendAgentsToolAdaptersRoot, 'marketingToolAdapters.ts'),
    allow: [backendAgentsRoot, backendLoggingRoot, backendGrowthRoot],
    reason: 'marketing tool adapter may only import agents-local code, logging, and growth/marketing dependencies',
  },
  {
    match: path.join(backendAgentsToolAdaptersRoot, 'index.ts'),
    allow: [backendAgentsRoot],
    reason: 'adapter index may only import agents-local adapter files',
  },
];

const duplicateRiskRoots = [
  backendDistributionRoot,
  backendPlatformRoot,
  backendAgentsRoot,
  backendRevenueRoot,
];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.has(path.extname(filePath));
}

function walkFiles(rootDir) {
  const results = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (entry.isFile() && isSourceFile(absolute)) {
        results.push(absolute);
      }
    }
  }

  return results.sort((left, right) => left.localeCompare(right));
}

function isTestFile(filePath) {
  return toPosix(filePath).includes(TEST_PATH_FRAGMENT);
}

function extractImports(contents) {
  const imports = [];
  let match;
  while ((match = IMPORT_PATTERN.exec(contents)) !== null) {
    const specifier = match[1] || match[2];
    if (specifier) {
      imports.push(specifier);
    }
  }
  return imports;
}

function resolveRelativeImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const extension = path.extname(base);
  const stem = extension ? base.slice(0, -extension.length) : base;
  const candidates = [
    base,
    extension === '.js' ? `${stem}.ts` : null,
    extension === '.js' ? `${stem}.tsx` : null,
    extension === '.ts' ? `${stem}.js` : null,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    `${base}.cjs`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
    path.join(base, 'index.mjs'),
    path.join(base, 'index.cjs'),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.resolve(candidate);
    }
  }

  return path.resolve(base);
}

function getResolvedRelativeImports(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const imports = [];

  for (const specifier of extractImports(contents)) {
    if (!specifier.startsWith('.')) {
      continue;
    }

    imports.push({
      specifier,
      resolved: resolveRelativeImport(filePath, specifier),
    });
  }

  return imports;
}

function createViolation(filePath, reason, specifier) {
  return { filePath, reason, specifier };
}

function createWarning(filePath, reason) {
  return { filePath, reason };
}

function isResolvedToFile(resolvedPath, targetPath) {
  return path.resolve(resolvedPath) === path.resolve(targetPath);
}

function checkRoutes() {
  const violations = [];
  const files = walkFiles(routesRoot).filter((filePath) => !isTestFile(filePath));

  for (const filePath of files) {
    for (const { specifier, resolved } of getResolvedRelativeImports(filePath)) {
      if (resolved.startsWith(modulesExpoRoot)) {
        violations.push(createViolation(filePath, 'routes must not import src/modules/expo/**', specifier));
        continue;
      }

      if (resolved.startsWith(srcBackendRoot)) {
        violations.push(createViolation(filePath, 'routes must not import src/backend/** directly; use controllers as boundary', specifier));
        continue;
      }

      if (
        resolved.startsWith(backendServerRoot) &&
        !resolved.startsWith(controllersRoot) &&
        !resolved.startsWith(middlewareRoot) &&
        !resolved.startsWith(routesRoot)
      ) {
        violations.push(createViolation(filePath, 'routes must not import backend-server implementation layers other than controllers/middleware', specifier));
      }
    }
  }

  return { files, violations };
}

function checkControllerAndExpoImports() {
  const violations = [];
  const files = [
    ...walkFiles(controllersRoot),
    ...walkFiles(backendExpoRoot),
    ...walkFiles(backendDistributionRoot),
    ...walkFiles(backendPlatformRoot),
    ...walkFiles(backendAgentsRoot),
    ...walkFiles(backendRevenueRoot),
  ];

  for (const filePath of files) {
    for (const { specifier, resolved } of getResolvedRelativeImports(filePath)) {
      if (resolved.startsWith(modulesExpoRoot)) {
        violations.push(createViolation(filePath, 'backend controllers/expo/distribution/platform domain must not import src/modules/expo/**', specifier));
      }

      if (filePath.startsWith(controllersRoot) && resolved.startsWith(srcBackendRoot)) {
        const allowedTargets = allowedControllerTargets.get(path.resolve(filePath));
        if (allowedTargets && !allowedTargets.some((target) => isResolvedToFile(resolved, target))) {
          violations.push(
            createViolation(
              filePath,
              'selected controllers must only import their domain application service from src/backend/**',
              specifier,
            ),
          );
        }
      }

      if (
        filePath.startsWith(backendDistributionRoot) &&
        (resolved.startsWith(backendPlatformRoot) || resolved.startsWith(backendAgentsRoot))
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/distribution/** must not import src/backend/platform/** or src/backend/agents/** directly',
            specifier,
          ),
        );
      }

      if (
        filePath.startsWith(backendPlatformRoot) &&
        resolved.startsWith(srcBackendRoot) &&
        !resolved.startsWith(backendPlatformRoot) &&
        !resolved.startsWith(backendAiRoot) &&
        !resolved.startsWith(backendLoggingRoot)
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/platform/** must not import sibling backend domains directly; use platform-local services or explicit contracts',
            specifier,
          ),
        );
      }

      if (
        filePath.startsWith(backendAgentsRoot) &&
        (resolved.startsWith(backendPlatformRoot) ||
          resolved.startsWith(backendDistributionRoot) ||
          resolved.startsWith(backendExpoRoot))
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/agents/** must not import src/backend/platform/**, src/backend/distribution/**, or src/backend/expo/** directly',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === path.join(backendAgentsRoot, 'engine', 'agentTools.ts') &&
        resolved.startsWith(srcBackendRoot) &&
        !resolved.startsWith(backendAgentsRoot) &&
        !resolved.startsWith(backendLoggingRoot)
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/agents/engine/agentTools.ts must not import sibling backend domains directly; use src/backend/agents/tools/** adapters',
            specifier,
          ),
        );
      }

      if (filePath.startsWith(backendAgentsToolsRoot)) {
        const allowlistedToolRoots = [
          backendAgentsRoot,
          backendLoggingRoot,
          backendAiRoot,
          backendBusinessRoot,
          backendLeadsRoot,
          backendRevenueRoot,
          backendGrowthRoot,
          backendDataSourcesRoot,
        ];

        if (
          resolved.startsWith(srcBackendRoot) &&
          !allowlistedToolRoots.some((root) => resolved.startsWith(root))
        ) {
          violations.push(
            createViolation(
              filePath,
              'src/backend/agents/tools/** may only import agents-local code, logging, and allowlisted adapter dependencies',
              specifier,
            ),
          );
        }
      }

      if (filePath.startsWith(backendAgentsToolAdaptersRoot)) {
        const matchingRule = agentToolAdapterRules.find((rule) => path.resolve(filePath) === path.resolve(rule.match));
        if (
          matchingRule &&
          resolved.startsWith(srcBackendRoot) &&
          !matchingRule.allow.some((root) => resolved.startsWith(root))
        ) {
          violations.push(createViolation(filePath, matchingRule.reason, specifier));
        }
      }

      if (
        filePath.startsWith(backendRevenueRoot) &&
        (resolved.startsWith(backendAgentsRoot) ||
          resolved.startsWith(backendPlatformRoot) ||
          resolved.startsWith(backendDistributionRoot) ||
          resolved.startsWith(backendExpoRoot))
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/revenue/** must not import src/backend/agents/**, src/backend/platform/**, src/backend/distribution/**, or src/backend/expo/** directly',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === path.join(backendAgentsToolAdaptersRoot, 'revenueToolAdapters.ts') &&
        resolved.startsWith(backendRevenueRoot) &&
        !isResolvedToFile(resolved, path.join(backendRevenueRoot, 'revenueApplicationService.ts'))
      ) {
        violations.push(
          createViolation(
            filePath,
            'revenue tool adapter must only import src/backend/revenue/revenueApplicationService.ts from the revenue domain',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === path.join(backendRevenueRoot, 'revenueApplicationService.ts') &&
        resolved.startsWith(srcBackendRoot) &&
        !resolved.startsWith(backendRevenueRoot)
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/revenue/revenueApplicationService.ts must coordinate revenue-local services only',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === path.join(backendRevenueRoot, 'clientProspector.ts') &&
        resolved.startsWith(backendRevenueRoot) &&
        !isResolvedToFile(resolved, path.join(backendRevenueRoot, 'revenueApplicationService.ts'))
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/revenue/clientProspector.ts must remain a compatibility-only delegator to revenueApplicationService.ts',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === path.join(backendRevenueRoot, 'clientProspector.ts') &&
        resolved.startsWith(srcBackendRoot) &&
        (resolved.startsWith(backendLeadsRoot) || resolved.startsWith(backendDataSourcesRoot))
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/revenue/clientProspector.ts must not import leads/dataSources directly; use the revenue prospecting adapter layer',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === path.join(backendRevenueProspectingRoot, 'prospectingAdapters.ts') &&
        (
          isResolvedToFile(resolved, leadsGoogleMapsSourceTs) ||
          isResolvedToFile(resolved, leadsGoogleMapsSourceJs)
        )
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/revenue/prospecting/prospectingAdapters.ts must not import the leads-local Google Maps provider directly; use src/backend/revenue/prospecting/prospectingGoogleMapsAdapter.ts',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === revenueProspectingAdaptersPath &&
        resolved.startsWith(backendRevenueProspectingRoot) &&
        !isResolvedToFile(resolved, revenueProspectingGoogleMapsAdapterPath) &&
        !isResolvedToFile(resolved, revenueProspectingTypesPath)
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/revenue/prospecting/prospectingAdapters.ts must use the revenue-local Google Maps adapter as its prospecting runtime seam',
            specifier,
          ),
        );
      }

      if (
        path.resolve(filePath) === path.join(backendRevenueProspectingRoot, 'prospectingAdapters.ts') &&
        resolved.startsWith(srcBackendRoot) &&
        !resolved.startsWith(backendRevenueRoot) &&
        !resolved.startsWith(backendLeadsRoot) &&
        !resolved.startsWith(backendDataSourcesRoot) &&
        !resolved.startsWith(backendLoggingRoot)
      ) {
        violations.push(
          createViolation(
            filePath,
            'revenue prospecting adapter may only import revenue-local code, leads/dataSources dependencies, and logging',
            specifier,
          ),
        );
      }
    }
  }

  return { files, violations };
}

function checkLeadEngineBoundary() {
  const violations = [];
  const files = fs.existsSync(leadEnginePath) ? [leadEnginePath] : [];

  for (const filePath of files) {
    const contents = fs.readFileSync(filePath, 'utf8');

    if (/^\s*validateLead\s*\(/m.test(contents)) {
      violations.push(
        createViolation(
          filePath,
          'src/backend/leads/engine/leadEngine.ts must not define a local validateLead helper; use src/backend/leads/validation/leadValidationService.ts',
          'validateLead(...)',
        ),
      );
    }

    for (const { specifier, resolved } of getResolvedRelativeImports(filePath)) {
      if (isResolvedToFile(resolved, srcLibSupabaseClientTs) || isResolvedToFile(resolved, srcLibSupabaseClientJs)) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/leads/engine/leadEngine.ts must not import supabaseClient directly for leads persistence; use leadService.ts or a leads-local persistence helper',
            specifier,
          ),
        );
      }

      if (isResolvedToFile(resolved, backendEventPublisherTs) || isResolvedToFile(resolved, backendEventPublisherJs)) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/leads/engine/leadEngine.ts must not import eventPublisher directly; use a leads-local event helper/service',
            specifier,
          ),
        );
      }

      if (isResolvedToFile(resolved, agentsSchedulerTs) || isResolvedToFile(resolved, agentsSchedulerJs)) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/leads/engine/leadEngine.ts must not import agentScheduler directly; use src/backend/leads/agents/leadAgentSchedulingService.ts',
            specifier,
          ),
        );
      }

      if (
        isResolvedToFile(resolved, leadsGoogleMapsSourceTs) ||
        isResolvedToFile(resolved, leadsGoogleMapsSourceJs) ||
        isResolvedToFile(resolved, leadsDirectorySourceTs) ||
        isResolvedToFile(resolved, leadsDirectorySourceJs) ||
        isResolvedToFile(resolved, leadsLinkedinSourceTs) ||
        isResolvedToFile(resolved, leadsLinkedinSourceJs)
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/leads/engine/leadEngine.ts must not import source providers directly; use src/backend/leads/sources/leadSourceCollectionService.ts',
            specifier,
          ),
        );
      }

      if (
        resolved.startsWith(path.join(backendLeadsRoot, 'validation')) &&
        !isResolvedToFile(resolved, leadValidationServiceTs) &&
        !isResolvedToFile(resolved, leadValidationServiceJs)
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/leads/engine/leadEngine.ts must use src/backend/leads/validation/leadValidationService.ts as the validation boundary',
            specifier,
          ),
        );
      }
    }
  }

  return { files, violations };
}

function checkDuplicateRisk(rootDir) {
  const warnings = [];
  const files = walkFiles(rootDir).filter((filePath) => !isTestFile(filePath));
  const groups = new Map();

  for (const filePath of files) {
    const extension = path.extname(filePath);
    if (!['.ts', '.js'].includes(extension)) {
      continue;
    }

    const base = filePath.slice(0, -extension.length);
    const existing = groups.get(base) ?? [];
    existing.push(filePath);
    groups.set(base, existing);
  }

  for (const [, groupedFiles] of groups) {
    const extensions = new Set(groupedFiles.map((filePath) => path.extname(filePath)));
    if (extensions.has('.ts') && extensions.has('.js')) {
      warnings.push(
        createWarning(
          groupedFiles[0],
          `duplicate .js/.ts pair present: ${groupedFiles.map((filePath) => toPosix(path.relative(repoRoot, filePath))).join(', ')}`,
        ),
      );
    }
  }

  return warnings;
}

function printViolations(label, violations) {
  if (violations.length === 0) {
    return;
  }
  console.error(`\n${label} violations:`);
  for (const violation of violations) {
    console.error(`- ${toPosix(path.relative(repoRoot, violation.filePath))}: ${violation.reason} (${violation.specifier})`);
  }
}

function printWarnings(label, warnings) {
  if (warnings.length === 0) {
    return;
  }
  console.warn(`\n${label} warnings:`);
  for (const warning of warnings) {
    console.warn(`- ${toPosix(path.relative(repoRoot, warning.filePath))}: ${warning.reason}`);
  }
}

function checkAgentsCrossDomainCoupling() {
  const warnings = [];
  const files = walkFiles(backendAgentsRoot);

  for (const filePath of files) {
    for (const { resolved } of getResolvedRelativeImports(filePath)) {
      if (!resolved.startsWith(srcBackendRoot) || resolved.startsWith(backendAgentsRoot)) {
        continue;
      }

      const allowlistedRoots = [
        backendAiRoot,
        backendLoggingRoot,
        backendGovernanceRoot,
        backendEventsRoot,
        backendLeadsRoot,
        backendBusinessRoot,
        backendGrowthRoot,
        backendRevenueRoot,
        backendDataSourcesRoot,
      ];

      if (!allowlistedRoots.some((root) => resolved.startsWith(root))) {
        warnings.push(
          createWarning(
            filePath,
            `agents cross-domain import outside allowlist: ${toPosix(path.relative(repoRoot, resolved))}`,
          ),
        );
      }
    }
  }

  return warnings;
}

function checkSerpApiBoundaryAudit() {
  const warnings = [];
  const violations = [];

  if (!fs.existsSync(dataSourcesSerpApiSearchServiceTs)) {
    warnings.push(
      createWarning(
        leadsSerpApiHelperTs,
        'canonical SerpAPI search home is expected at src/backend/dataSources/serpApiSearchService.ts, but the service is missing',
      ),
    );
    return { warnings, violations };
  }

  if (!fs.existsSync(leadsSerpApiHelperTs)) {
    return { warnings, violations };
  }

  const imports = getResolvedRelativeImports(leadsSerpApiHelperTs);
  const delegatesToCanonicalService = imports.some(({ resolved }) =>
    isResolvedToFile(resolved, dataSourcesSerpApiSearchServiceTs),
  );

  if (!delegatesToCanonicalService) {
    warnings.push(
      createWarning(
        leadsSerpApiHelperTs,
        'src/backend/leads/sources/serpApiHelper.ts should remain a compatibility shim that delegates search(...) to src/backend/dataSources/serpApiSearchService.ts',
      ),
    );
  }

  if (fs.existsSync(dataSourcesGoogleSearchServiceTs)) {
    for (const { specifier, resolved } of getResolvedRelativeImports(dataSourcesGoogleSearchServiceTs)) {
      if (
        isResolvedToFile(resolved, leadsSerpApiHelperTs) ||
        isResolvedToFile(resolved, leadsSerpApiHelperJs)
      ) {
        violations.push(
          createViolation(
            dataSourcesGoogleSearchServiceTs,
            'src/backend/dataSources/googleSearchService.ts must not import the leads compatibility shim; use src/backend/dataSources/serpApiSearchService.ts',
            specifier,
          ),
        );
      }
    }
  }

  return { warnings, violations };
}

function checkRevenueProspectingBoundary() {
  const violations = [];
  const files = [...walkFiles(backendAgentsRoot), ...walkFiles(srcAgentsRoot)];
  const blockedTargets = [
    path.join(backendRevenueRoot, 'clientProspector.ts'),
    path.join(backendRevenueProspectingRoot, 'revenueProspectingService.ts'),
    path.join(backendRevenueProspectingRoot, 'prospectingAdapters.ts'),
  ];

  for (const filePath of files) {
    for (const { specifier, resolved } of getResolvedRelativeImports(filePath)) {
      if (blockedTargets.some((target) => isResolvedToFile(resolved, target))) {
        violations.push(
          createViolation(
            filePath,
            'agents and src/agents must not import low-level revenue prospecting implementation; use revenueApplicationService.ts',
            specifier,
          ),
        );
      }
    }
  }

  return violations;
}

function checkBillingBoundarySignals() {
  const warnings = [];
  const billingControllerPath = path.join(controllersRoot, 'billingController.ts');
  const billingApplicationServicePath = path.join(backendBillingRoot, 'billingApplicationService.ts');
  const platformUsagePath = path.join(backendPlatformRoot, 'usageService.ts');
  const governanceCostMonitorPath = path.join(backendGovernanceRoot, 'costMonitor.ts');
  const billingQuotaServicePath = path.join(backendBillingUsageRoot, 'billingQuotaService.ts');
  const billingQuotaServiceJsPath = path.join(backendBillingUsageRoot, 'billingQuotaService.js');
  const aiLlmServicePath = path.join(backendAiRoot, 'llmService.ts');

  if (fs.existsSync(billingControllerPath) && !fs.existsSync(billingApplicationServicePath)) {
    warnings.push(
      createWarning(
        billingControllerPath,
        'billing controller imports billing services directly; no billingApplicationService caller-facing boundary is present yet',
      ),
    );
  }

  if (fs.existsSync(platformUsagePath)) {
    warnings.push(
      createWarning(
        platformUsagePath,
        'platform usageService remains a lower-level helper; canonical billing-facing usage entry now lives under src/backend/billing/usage/billingUsageService.ts',
      ),
    );
  }

  if (fs.existsSync(governanceCostMonitorPath)) {
    let usesBillingQuotaWrapper = false;
    for (const { resolved } of getResolvedRelativeImports(governanceCostMonitorPath)) {
      if (isResolvedToFile(resolved, billingQuotaServicePath) || isResolvedToFile(resolved, billingQuotaServiceJsPath)) {
        usesBillingQuotaWrapper = true;
        break;
      }
    }

    warnings.push(
      createWarning(
        governanceCostMonitorPath,
        usesBillingQuotaWrapper
          ? 'governance costMonitor remains as a deprecated compatibility wrapper; canonical quota/cost helper lives under src/backend/billing/usage/**'
          : 'governance costMonitor acts as a billing/quota proxy by checking usage and credits directly',
      ),
    );
  }

  if (fs.existsSync(aiLlmServicePath)) {
    for (const { resolved } of getResolvedRelativeImports(aiLlmServicePath)) {
      if (isResolvedToFile(resolved, platformUsagePath)) {
        warnings.push(
          createWarning(
            aiLlmServicePath,
            'AI service logs usage and estimated cost directly through platform usageService without a billing abstraction',
          ),
        );
        break;
      }
    }
  }

  return warnings;
}

function checkBillingEventBoundary() {
  const violations = [];
  const revenueSubscriberPath = path.join(backendServerRoot, 'events', 'revenueSubscribers.ts');
  const allowedBillingEventHandlerPath = path.join(backendBillingRoot, 'events', 'billingEventHandlers.ts');
  const billingEventHandlerPath = path.join(backendBillingRoot, 'events', 'billingEventHandlers.ts');
  const allowedBillingEventServicePath = path.join(backendBillingRoot, 'events', 'billingEventService.ts');

  if (!fs.existsSync(revenueSubscriberPath)) {
    return violations;
  }

  for (const { specifier, resolved } of getResolvedRelativeImports(revenueSubscriberPath)) {
    if (
      resolved.startsWith(backendBillingRoot) &&
      !isResolvedToFile(resolved, allowedBillingEventHandlerPath)
    ) {
      violations.push(
        createViolation(
          revenueSubscriberPath,
          'backend-server/events/revenueSubscribers.ts must not import low-level billing implementation; use billing-local event handlers',
          specifier,
        ),
      );
    }
  }

  if (fs.existsSync(billingEventHandlerPath)) {
    for (const { specifier, resolved } of getResolvedRelativeImports(billingEventHandlerPath)) {
      if (
        resolved.startsWith(backendBillingRoot) &&
        !isResolvedToFile(resolved, allowedBillingEventServicePath) &&
        !resolved.startsWith(backendLoggingRoot)
      ) {
        violations.push(
          createViolation(
            billingEventHandlerPath,
            'src/backend/billing/events/billingEventHandlers.ts must stay a thin event adapter; use billingEventService.ts for billing orchestration',
            specifier,
          ),
        );
      }
    }
  }

  return violations;
}

function checkBillingUsageBoundary() {
  const warnings = [];
  const violations = [];
  const usageServicePath = path.join(backendPlatformRoot, 'usageService.ts');
  const costMonitorPath = path.join(backendGovernanceRoot, 'costMonitor.ts');
  const costMonitorJsPath = path.join(backendGovernanceRoot, 'costMonitor.js');
  const billingApplicationServicePath = path.join(backendBillingRoot, 'billingApplicationService.ts');
  const billingQuotaServicePath = path.join(backendBillingUsageRoot, 'billingQuotaService.ts');
  const billingQuotaServiceJsPath = path.join(backendBillingUsageRoot, 'billingQuotaService.js');
  const billingUsageServicePath = path.join(backendBillingUsageRoot, 'billingUsageService.ts');
  const billingUsageServiceJsPath = path.join(backendBillingUsageRoot, 'billingUsageService.js');
  const files = [...walkFiles(srcBackendRoot), ...walkFiles(backendServerRoot), ...walkFiles(srcAgentsRoot)];

  for (const filePath of files) {
    for (const { specifier, resolved } of getResolvedRelativeImports(filePath)) {

      if (
        filePath.startsWith(backendAiRoot) &&
        (
          isResolvedToFile(resolved, usageServicePath) ||
          isResolvedToFile(resolved, costMonitorPath) ||
          isResolvedToFile(resolved, costMonitorJsPath)
        )
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/ai/** must not import platform/usageService.ts or governance/costMonitor.ts directly; use billingApplicationService.ts',
            specifier,
          ),
        );
      }

      if (
        filePath.startsWith(backendGovernanceRoot) &&
        (
          isResolvedToFile(resolved, usageServicePath)
        )
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/governance/** must not import platform/usageService.ts directly; use billingApplicationService.ts as the quota entry point',
            specifier,
          ),
        );
      }

      if (
        filePath.startsWith(backendGovernanceRoot) &&
        !isResolvedToFile(filePath, costMonitorPath) &&
        !isResolvedToFile(filePath, costMonitorJsPath) &&
        (
          isResolvedToFile(resolved, costMonitorPath) ||
          isResolvedToFile(resolved, costMonitorJsPath)
        )
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/governance/** must not import costMonitor directly; use billingApplicationService.ts as the quota entry point',
            specifier,
          ),
        );
      }

      if (
        filePath.startsWith(backendBillingRoot) &&
        (
          isResolvedToFile(resolved, costMonitorPath) ||
          isResolvedToFile(resolved, costMonitorJsPath)
        )
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/billing/** must not import governance/costMonitor; use billing-local usage/quota helpers instead',
            specifier,
          ),
        );
      }

      if (
        filePath.startsWith(backendBillingRoot) &&
        isResolvedToFile(resolved, usageServicePath) &&
        !isResolvedToFile(filePath, billingUsageServicePath) &&
        !isResolvedToFile(filePath, billingUsageServiceJsPath)
      ) {
        violations.push(
          createViolation(
            filePath,
            'src/backend/billing/** must not import platform/usageService.ts directly; use billing-local usage helpers instead',
            specifier,
          ),
        );
      }

      if (
        !filePath.startsWith(backendBillingRoot) &&
        !isResolvedToFile(filePath, costMonitorPath) &&
        !isResolvedToFile(filePath, costMonitorJsPath) &&
        (
          isResolvedToFile(resolved, costMonitorPath) ||
          isResolvedToFile(resolved, costMonitorJsPath)
        )
      ) {
        violations.push(
          createViolation(
            filePath,
            'new code outside billing must not import governance/costMonitor; use billingApplicationService.ts or billing-local helpers',
            specifier,
          ),
        );
      }

      if (
        !filePath.startsWith(backendBillingRoot) &&
        !filePath.startsWith(backendPlatformRoot) &&
        isResolvedToFile(resolved, usageServicePath)
      ) {
        warnings.push(
          createWarning(
            filePath,
            'usageService is being used outside billing; prefer billingApplicationService as the usage/quota entry point',
          ),
        );
      }

      if (
        filePath.startsWith(backendAiRoot) &&
        resolved.startsWith(backendBillingRoot) &&
        !isResolvedToFile(resolved, billingApplicationServicePath)
      ) {
        warnings.push(
          createWarning(
            filePath,
            'AI domain should use billingApplicationService.ts as the billing entry point rather than low-level billing files',
          ),
        );
      }

      if (
        filePath.startsWith(backendGovernanceRoot) &&
        (isResolvedToFile(filePath, costMonitorPath) || isResolvedToFile(filePath, costMonitorJsPath)) &&
        !(
          isResolvedToFile(resolved, billingQuotaServicePath) ||
          isResolvedToFile(resolved, billingQuotaServiceJsPath)
        )
      ) {
        warnings.push(
          createWarning(
            filePath,
            'governance costMonitor compatibility wrapper should delegate to billing-local usage/quota helper only',
          ),
        );
      }
    }
  }

  return { warnings, violations };
}

function collectDuplicateWarnings() {
  return duplicateRiskRoots.flatMap((rootDir) => checkDuplicateRisk(rootDir));
}

function collectLeadsDuplicateWarnings() {
  return checkDuplicateRisk(backendLeadsRoot);
}

const routeCheck = checkRoutes();
const backendCheck = checkControllerAndExpoImports();
const leadEngineBoundaryCheck = checkLeadEngineBoundary();
const revenueProspectingViolations = checkRevenueProspectingBoundary();
const billingEventBoundaryViolations = checkBillingEventBoundary();
const billingUsageBoundary = checkBillingUsageBoundary();
const duplicateWarnings = collectDuplicateWarnings();
const leadsDuplicateWarnings = collectLeadsDuplicateWarnings();
const agentsCrossDomainWarnings = checkAgentsCrossDomainCoupling();
const serpApiBoundaryAudit = checkSerpApiBoundaryAudit();
const serpApiBoundaryWarnings = serpApiBoundaryAudit.warnings;
const billingBoundaryWarnings = checkBillingBoundarySignals();
const violations = [
  ...routeCheck.violations,
  ...backendCheck.violations,
  ...leadEngineBoundaryCheck.violations,
  ...revenueProspectingViolations,
  ...serpApiBoundaryAudit.violations,
  ...billingEventBoundaryViolations,
  ...billingUsageBoundary.violations,
];

printViolations('Route boundary', routeCheck.violations);
printViolations('Controller/domain boundary', backendCheck.violations);
printViolations('Lead engine boundary', leadEngineBoundaryCheck.violations);
printViolations('Revenue prospecting boundary', revenueProspectingViolations);
printViolations('SerpAPI boundary', serpApiBoundaryAudit.violations);
printViolations('Billing event boundary', billingEventBoundaryViolations);
printViolations('Billing usage boundary', billingUsageBoundary.violations);
printWarnings('Backend duplicate risk', duplicateWarnings);
printWarnings('Leads duplicate risk', leadsDuplicateWarnings);
printWarnings('Agents cross-domain coupling', agentsCrossDomainWarnings);
printWarnings('SerpAPI boundary audit', serpApiBoundaryWarnings);
printWarnings('Billing boundary audit', billingBoundaryWarnings);
printWarnings('Billing usage boundary audit', billingUsageBoundary.warnings);

console.log('Backend boundary check summary');
console.log(`- route files scanned: ${routeCheck.files.length}`);
console.log(`- controller/expo/distribution/platform/agents files scanned: ${backendCheck.files.length}`);
console.log(`- domain duplicate warnings: ${duplicateWarnings.length}`);
console.log(`- leads duplicate warnings: ${leadsDuplicateWarnings.length}`);
console.log(`- agents cross-domain warnings: ${agentsCrossDomainWarnings.length}`);
console.log(`- billing boundary warnings: ${billingBoundaryWarnings.length}`);
console.log(`- violations: ${violations.length}`);

if (violations.length > 0) {
  process.exitCode = 1;
} else {
  console.log('- status: PASS');
}
