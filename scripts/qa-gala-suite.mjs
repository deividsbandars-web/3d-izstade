#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'artifacts/qa-gala-suite';
const DEFAULT_TIMEOUT_MS = 240000;

const CANONICAL_CHECKS = [
  {
    concern: 'ownership',
    description: 'Active renderer ownership and legacy import boundary',
    script: 'qa-gala-renderer-ownership-audit.mjs',
    usesBaseUrl: false,
  },
  {
    concern: 'dom-overlay',
    description: 'Visitor overlay does not block the studio canvas',
    script: 'qa-gala-dom-overlay-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'wall-skin-coverage',
    description: 'Exterior/interior wall skin coverage and source ownership',
    script: 'qa-gala-wall-skin-coverage-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'floor-ground-isolation',
    description: 'Interior floor remains isolated from ground/void color artifacts',
    script: 'qa-gala-floor-ground-isolation-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'geometry-clip',
    description: 'Openings, boards, frames, and closed/open door clipping',
    script: 'qa-gala-opening-clip-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'furniture-clearance',
    description: 'Furniture and fixtures do not intersect walls/opening clearances',
    script: 'qa-gala-furniture-clearance-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'static-budget',
    description: 'Stationary draw-call/FPS/material/mesh budget',
    script: 'qa-gala-performance-budget-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'motion-perf',
    description: 'Real movement frame-time and stutter budget',
    script: 'qa-gala-motion-performance-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'visual-design-intent',
    description: 'Authoritative visual material/design-intent audit',
    script: 'qa-gala-visual-design-intent-audit.mjs',
    usesBaseUrl: true,
  },
  {
    concern: 'visual-acceptance-preflight',
    description: 'Technical visual preflight only; human product acceptance remains separate',
    script: 'qa-gala-visual-acceptance-local.mjs',
    usesBaseUrl: true,
  },
];

const SMOKE_CONCERNS = new Set([
  'ownership',
  'dom-overlay',
  'wall-skin-coverage',
  'floor-ground-isolation',
  'geometry-clip',
]);

const RETIRED_CHECKS = [
  {
    replacementConcern: 'visual-design-intent',
    reason: 'Retired from canonical suite: stale floor-color userData flags can contradict the current design-intent audit.',
    script: 'qa-gala-construction-renderer.mjs',
  },
  {
    replacementConcern: 'wall-skin-coverage',
    reason: 'Superseded by the focused wall-skin coverage audit and design-intent audit.',
    script: 'qa-gala-cladding-dimension-audit.mjs',
  },
  {
    replacementConcern: 'geometry-clip',
    reason: 'Historical opening capture script; authoritative clipping gate is qa-gala-opening-clip-audit.mjs.',
    script: 'qa-gala-opening-voids.mjs',
  },
  {
    replacementConcern: 'geometry-clip',
    reason: 'Specialized flicker diagnostic; authoritative suite keeps opening clip plus motion performance as separate checks.',
    script: 'qa-gala-opening-motion-flicker-audit.mjs',
  },
  {
    replacementConcern: 'visual-acceptance-preflight',
    reason: 'Historical visual capture pack; not a canonical pass/fail gate.',
    script: 'qa-gala-final-fit.mjs',
  },
  {
    replacementConcern: 'visual-acceptance-preflight',
    reason: 'Historical visual construction capture pack; not a canonical pass/fail gate.',
    script: 'qa-gala-visual-construction.mjs',
  },
  {
    replacementConcern: 'visual-acceptance-preflight',
    reason: 'Historical defect/root-cause evidence pack; not a canonical pass/fail gate.',
    script: 'qa-gala-defect-root-cause.mjs',
  },
  {
    replacementConcern: 'visual-acceptance-preflight',
    reason: 'Diagnostic readability probe; visual acceptance preflight is the canonical route-level visual check.',
    script: 'qa-gala-view-readability-diagnostic.mjs',
  },
  {
    replacementConcern: 'static-budget',
    reason: 'DevTools trace capture only; static/motion budget audits are the canonical performance gates.',
    script: 'qa-gala-devtools-trace.mjs',
  },
  {
    replacementConcern: 'visual-acceptance-preflight',
    reason: 'Camera/FOV composition is a targeted diagnostic; camera changes remain human/product controlled.',
    script: 'qa-gala-camera-fov-composition.mjs',
  },
  {
    replacementConcern: 'ownership',
    reason: 'Meta-audit of QA false-positive risk; useful documentation input, not a canonical release gate.',
    script: 'qa-gala-full-architecture-audit.mjs',
  },
  {
    replacementConcern: 'geometry-clip',
    reason: 'Walk-physics remains a targeted motion/clearance diagnostic; canonical suite keeps opening clip and motion perf separated.',
    script: 'qa-gala-real-user-walk-physics.mjs',
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    concerns: null,
    outDir: DEFAULT_OUT_DIR,
    profile: 'release',
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = path.resolve(arg.slice('--out-dir='.length));
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number(arg.slice('--timeout-ms='.length));
    } else if (arg.startsWith('--profile=')) {
      options.profile = arg.slice('--profile='.length);
    } else if (arg.startsWith('--concerns=')) {
      options.concerns = new Set(arg.slice('--concerns='.length).split(',').map((value) => value.trim()).filter(Boolean));
    } else if (arg === '--list') {
      options.list = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error('--timeout-ms must be a positive number');
  }
  if (!['release', 'smoke'].includes(options.profile)) {
    throw new Error('--profile must be release or smoke');
  }

  return options;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function selectChecks(options) {
  let checks = CANONICAL_CHECKS;
  if (options.profile === 'smoke') {
    checks = checks.filter((check) => SMOKE_CONCERNS.has(check.concern));
  }
  if (options.concerns) {
    checks = checks.filter((check) => options.concerns.has(check.concern));
  }
  return checks;
}

function assertNoActiveConcernContradictions(checks) {
  const concerns = new Map();
  const duplicates = [];
  for (const check of checks) {
    if (concerns.has(check.concern)) {
      duplicates.push(`${check.concern}: ${concerns.get(check.concern)} and ${check.script}`);
    }
    concerns.set(check.concern, check.script);
  }
  return duplicates;
}

function runCheck(check, options) {
  const scriptPath = path.resolve(process.cwd(), 'scripts', check.script);
  const checkOutDir = path.join(options.outDir, check.concern);
  const args = [
    scriptPath,
    `--out-dir=${checkOutDir}`,
    ...(check.usesBaseUrl ? [`--base-url=${options.baseUrl}`] : []),
  ];
  const startedAt = Date.now();

  return new Promise((resolve) => {
    ensureDir(checkOutDir);
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: process.env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options.timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startedAt;
      fs.writeFileSync(path.join(checkOutDir, 'stdout.log'), stdout);
      fs.writeFileSync(path.join(checkOutDir, 'stderr.log'), stderr);
      resolve({
        ...check,
        command: [process.execPath, ...args],
        durationMs,
        exitCode: code,
        signal,
        status: code === 0 && !timedOut ? 'pass' : 'fail',
        timedOut,
      });
    });
  });
}

function renderMarkdown(report) {
  return `# GALA QA Suite Report

- baseUrl: \`${report.baseUrl}\`
- profile: \`${report.profile}\`
- pass: \`${report.pass}\`
- generatedAt: \`${report.generatedAt}\`
- productVisualAccepted: \`false\`

## Canonical Checks

| Concern | Script | Status | Duration ms |
| --- | --- | --- | ---: |
${report.results.map((result) => `| ${result.concern} | \`${result.script}\` | ${result.status.toUpperCase()} | ${result.durationMs} |`).join('\n')}

## Retired Or Diagnostic Scripts

| Script | Replacement concern | Reason |
| --- | --- | --- |
${report.retiredChecks.map((check) => `| \`${check.script}\` | ${check.replacementConcern} | ${check.reason} |`).join('\n')}

## Notes

- The suite keeps one authoritative active check per concern to avoid contradictory pass/fail output.
- \`qa-gala-construction-renderer.mjs\` is retired from the canonical suite because its floor-color flags are stale.
- Product visual acceptance remains a human gate; this suite never records \`productVisualAccepted=true\`.
`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const checks = selectChecks(options);

  if (options.list) {
    console.log(JSON.stringify({
      canonicalChecks: CANONICAL_CHECKS,
      retiredChecks: RETIRED_CHECKS,
    }, null, 2));
    return;
  }

  if (checks.length === 0) {
    throw new Error('No GALA QA checks selected.');
  }

  const duplicateConcerns = assertNoActiveConcernContradictions(checks);
  if (duplicateConcerns.length > 0) {
    throw new Error(`Duplicate active GALA QA concerns: ${duplicateConcerns.join('; ')}`);
  }

  ensureDir(options.outDir);
  const results = [];
  for (const check of checks) {
    console.log(`[qa-gala-suite] running ${check.concern}: ${check.script}`);
    const result = await runCheck(check, options);
    results.push(result);
    console.log(`[qa-gala-suite] ${result.status.toUpperCase()} ${check.concern} (${result.durationMs}ms)`);
  }

  const report = {
    baseUrl: options.baseUrl,
    generatedAt: new Date().toISOString(),
    pass: results.every((result) => result.status === 'pass'),
    productVisualAccepted: false,
    profile: options.profile,
    results,
    retiredChecks: RETIRED_CHECKS,
  };
  writeJson(path.join(options.outDir, 'qa-gala-suite-report.json'), report);
  fs.writeFileSync(path.join(options.outDir, 'qa-gala-suite-report.md'), renderMarkdown(report));

  console.log(`[qa-gala-suite] report: ${path.join(options.outDir, 'qa-gala-suite-report.json')}`);
  if (!report.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[qa-gala-suite] failed');
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
