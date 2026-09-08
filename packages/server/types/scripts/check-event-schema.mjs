#!/usr/bin/env node
/**
 * @fileoverview Event payload schema-drift guard.
 *
 * An event's payload is frozen once it ships (see domain-events.constants.ts's
 * header comment and modules/CLAUDE.md's "Events Are Facts" section) — a
 * breaking change mints a new versioned event constant + payload
 * (`REPORT_GENERATED_V2` / `ReportGeneratedV2Payload`) instead of mutating an
 * existing one. ESLint can't enforce this: it only sees the current file, not
 * what the shape looked like last commit. This script can, via a checked-in
 * snapshot of every resolved `AllEventsMap[eventType]` shape.
 *
 * Local dev usage: `node ./scripts/check-event-schema.mjs`
 *   - New event types are appended to the snapshot and written to disk.
 *   - An existing event type whose resolved shape differs from its snapshot
 *     fails the check WITHOUT being auto-updated — accepting a genuine
 *     breaking change means hand-editing event-payload.snapshot.json, which
 *     shows up as an explicit, reviewable diff in the PR.
 *
 * CI usage: `node ./scripts/check-event-schema.mjs --ci` (or `CI=true`)
 *   - Never writes to disk. Fails if the snapshot that would be written
 *     differs at all from what's committed — catches both shape drift AND a
 *     new event whose snapshot entry was never committed.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const entryFile = join(packageRoot, 'src/events/payloads/index.ts');
const snapshotDir = join(packageRoot, 'src/events/payloads/__snapshots__');
const snapshotFile = join(snapshotDir, 'event-payload.snapshot.json');

const isCi = process.argv.includes('--ci') || process.env.CI === 'true';

function loadCompilerOptions() {
  const configPath = ts.findConfigFile(packageRoot, ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    throw new Error('[check-event-schema] tsconfig.json not found for @workspace/types');
  }
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) {
    throw new Error(`[check-event-schema] Failed to read ${configPath}: ${error.messageText}`);
  }
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, dirname(configPath));
  return parsed.options;
}

/** Resolved shape of every `AllEventsMap[eventType]`, keyed by event type string. */
function buildCurrentSchema() {
  const options = loadCompilerOptions();
  const program = ts.createProgram([entryFile], options);
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(entryFile);

  if (!sourceFile) {
    throw new Error(`[check-event-schema] Could not load ${entryFile}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  const exportedSymbols = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
  const allEventsMapSymbol = exportedSymbols.find((s) => s.name === 'AllEventsMap');

  if (!allEventsMapSymbol?.declarations?.[0]) {
    throw new Error('[check-event-schema] `AllEventsMap` export not found in payloads/index.ts');
  }

  const declaration = allEventsMapSymbol.declarations[0];
  const mapType = checker.getTypeAtLocation(declaration);

  const schema = {};

  for (const eventProp of checker.getPropertiesOfType(mapType)) {
    const eventType = eventProp.name;
    const payloadType = checker.getTypeOfSymbolAtLocation(eventProp, declaration);

    schema[eventType] = checker
      .getPropertiesOfType(payloadType)
      .map((fieldProp) => ({
        name: fieldProp.name,
        optional: Boolean(fieldProp.flags & ts.SymbolFlags.Optional),
        type: checker.typeToString(
          checker.getTypeOfSymbolAtLocation(fieldProp, fieldProp.valueDeclaration ?? declaration),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return schema;
}

function loadCommittedSnapshot() {
  if (!existsSync(snapshotFile)) return {};
  return JSON.parse(readFileSync(snapshotFile, 'utf-8'));
}

function serialize(snapshot) {
  const sorted = Object.fromEntries(
    Object.keys(snapshot)
      .sort()
      .map((key) => [key, snapshot[key]]),
  );
  return JSON.stringify(sorted, null, 2) + '\n';
}

function main() {
  const current = buildCurrentSchema();
  const committed = loadCommittedSnapshot();

  const violations = [];
  const added = [];
  const removed = Object.keys(committed).filter((eventType) => !(eventType in current));
  const next = {};

  for (const [eventType, fields] of Object.entries(current)) {
    if (!(eventType in committed)) {
      next[eventType] = fields;
      added.push(eventType);
      continue;
    }

    const committedFields = committed[eventType];
    if (JSON.stringify(committedFields) === JSON.stringify(fields)) {
      next[eventType] = committedFields;
    } else {
      // Freeze the historical shape in the written file — do not silently
      // accept the drift.
      next[eventType] = committedFields;
      violations.push({ eventType, before: committedFields, after: fields });
    }
  }

  if (violations.length > 0) {
    console.error(
      `\n[check-event-schema] ${violations.length} event payload(s) changed shape without a new version:\n`,
    );
    for (const v of violations) {
      console.error(`  ${v.eventType}`);
      console.error(`    before: ${JSON.stringify(v.before)}`);
      console.error(`    after:  ${JSON.stringify(v.after)}`);
    }
    console.error(
      '\nAn event payload is frozen once shipped. Mint a new versioned event constant + payload ' +
        '(e.g. REPORT_GENERATED_V2 / ReportGeneratedV2Payload) instead of mutating an existing one.\n' +
        'If this is genuinely intentional (the event never shipped to a real consumer), hand-edit ' +
        `${relative(packageRoot, snapshotFile)} to accept the new shape.\n`,
    );
    process.exitCode = 1;
    return;
  }

  const nextSerialized = serialize(next);
  const committedSerialized = existsSync(snapshotFile) ? readFileSync(snapshotFile, 'utf-8') : '';
  const isDirty = nextSerialized !== committedSerialized;

  if (isCi) {
    if (isDirty) {
      console.error(
        `[check-event-schema] Snapshot is out of date (${added.length} new, ${removed.length} removed). ` +
          `Run \`pnpm --filter @workspace/types check:event-schema\` locally and commit ` +
          `${relative(packageRoot, snapshotFile)}.`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(`[check-event-schema] OK — ${Object.keys(current).length} event payload(s), snapshot up to date.`);
    return;
  }

  if (isDirty) {
    if (!existsSync(snapshotDir)) mkdirSync(snapshotDir, { recursive: true });
    writeFileSync(snapshotFile, nextSerialized);
  }

  if (added.length > 0) {
    console.log(`[check-event-schema] Added ${added.length} new event payload snapshot(s): ${added.join(', ')}`);
  }
  if (removed.length > 0) {
    console.log(`[check-event-schema] Removed ${removed.length} stale snapshot entr${removed.length === 1 ? 'y' : 'ies'}: ${removed.join(', ')}`);
  }
  console.log(`[check-event-schema] OK — ${Object.keys(current).length} event payload(s) checked, no drift.`);
}

main();
