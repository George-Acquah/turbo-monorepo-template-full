import type { Rule } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Enforces "the module that owns the aggregate owns the event": a
 * `publisher.publish(...)`/`publishWithTransaction(...)` call inside
 * `modules/{context}/src/**` may only reference an event constant that
 * `modules/{context}/src/{context}.produces.ts` declares as its own
 * (`{context}Produces: EventType[]`). Nothing else in the repo restricts
 * which `{Context}Events` constant a module publishes — the event catalog in
 * `@workspace/types` is deliberately shared/importable by every module (it's
 * the one sanctioned cross-context seam for *reacting*), so without this rule
 * any module could just as easily publish another context's event and it
 * would compile and lint clean.
 *
 * Only the *producing* call site is checked — reading an event constant to
 * declare a subscription (`{context}.subscriptions.ts`) is unrestricted by
 * design; a consumer reacts to any event, it just can't be the one to emit
 * one it doesn't own.
 */

const EVENTS_IMPORT_SOURCES = new Set(['@workspace/types', '@workspace/types/events']);
const PUBLISH_METHOD_NAMES = new Set(['publish', 'publishWithTransaction']);

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (
      fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(dir, 'turbo.json')) ||
      fs.existsSync(path.join(dir, '.git'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

/**
 * Every `EventsConstant.SOME_KEY` pair that appears in a module's own
 * `{context}.produces.ts` array. Read as plain text rather than re-parsed as
 * TS — the produces file is always a flat array of `XEvents.Y` member
 * expressions, so a scoped regex over the exported array's source is enough
 * and avoids standing up a second parser inside a lint rule.
 */
function loadProducesAllowlist(modulesRoot: string, moduleContext: string): Set<string> | null {
  const producesPath = path.join(modulesRoot, moduleContext, 'src', `${moduleContext}.produces.ts`);

  if (!fs.existsSync(producesPath)) return null;

  const text = fs.readFileSync(producesPath, 'utf8');
  const arrayMatch = text.match(/=\s*\[([\s\S]*?)\]\s*;/);
  if (!arrayMatch) return new Set();

  const body = arrayMatch[1] ?? '';
  const allowlist = new Set<string>();
  const memberExprPattern = /([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)/g;
  let match: RegExpExecArray | null;
  while ((match = memberExprPattern.exec(body))) {
    allowlist.add(`${match[1]}.${match[2]}`);
  }
  return allowlist;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Only a module's own {context}.produces.ts events may be published from inside that module.",
    },
    schema: [],
    messages: {
      notDeclared:
        'Event "{{eventKey}}" is not declared in {{producesFile}}. A module may only publish ' +
        'events it declares as its own — add it there if {{context}} genuinely owns this event, ' +
        "or move this publish call into the owning module if it doesn't.",
      noManifest:
        'modules/{{context}} has no {{context}}.produces.ts manifest, so it declares no events ' +
        'as its own — add "{{eventKey}}" to a new {{context}}.produces.ts before publishing it.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const filename = context.filename ?? context.getFilename();
    const moduleMatch = filename.match(/[/\\]modules[/\\]([^/\\]+)[/\\]src[/\\]/);
    const moduleContext = moduleMatch?.[1];
    if (!moduleContext) return {};

    const repoRoot = findRepoRoot(path.dirname(filename));
    const modulesRoot = path.join(repoRoot, 'modules');

    // Local identifiers bound to a `{X}Events` catalog import — only
    // `eventType` values built from one of these are in scope for this rule.
    const eventsCatalogLocalNames = new Set<string>();

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== 'string' || !EVENTS_IMPORT_SOURCES.has(source)) return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue;
          const importedName =
            specifier.imported.type === 'Identifier' ? specifier.imported.name : undefined;
          if (importedName && /^[A-Z]\w*Events$/.test(importedName)) {
            eventsCatalogLocalNames.add(specifier.local.name);
          }
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CallExpression(node: any) {
        const callee = node.callee;
        if (
          callee.type !== 'MemberExpression' ||
          callee.property.type !== 'Identifier' ||
          !PUBLISH_METHOD_NAMES.has(callee.property.name)
        ) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== 'ObjectExpression') return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventTypeProp = firstArg.properties.find((p: any) => {
          if (p.type !== 'Property' || p.computed) return false;
          return (
            (p.key.type === 'Identifier' && p.key.name === 'eventType') ||
            (p.key.type === 'Literal' && p.key.value === 'eventType')
          );
        });

        if (!eventTypeProp) return;

        const value = eventTypeProp.value;
        if (
          value.type !== 'MemberExpression' ||
          value.object.type !== 'Identifier' ||
          value.property.type !== 'Identifier' ||
          value.computed
        ) {
          return;
        }

        if (!eventsCatalogLocalNames.has(value.object.name)) return;

        const eventKey = `${value.object.name}.${value.property.name}`;
        const allowlist = loadProducesAllowlist(modulesRoot, moduleContext);
        const producesFile = `modules/${moduleContext}/src/${moduleContext}.produces.ts`;

        if (allowlist === null) {
          context.report({
            node: value,
            messageId: 'noManifest',
            data: { context: moduleContext, eventKey },
          });
          return;
        }

        if (!allowlist.has(eventKey)) {
          context.report({
            node: value,
            messageId: 'notDeclared',
            data: { eventKey, producesFile, context: moduleContext },
          });
        }
      },
    };
  },
};

export default rule;
