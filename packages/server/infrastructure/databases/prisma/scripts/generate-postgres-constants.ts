import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(__dirname, '..');
const schemaDir = path.resolve(pkgDir, 'prisma', 'schema');
// Navigate from prisma package to packages/server/constants
const outDir = path.resolve(pkgDir, '..', '..', '..', 'constants', 'src', 'database');
const outFile = path.join(outDir, 'postgres.constants.generated.ts');

interface ParsedModel {
  name: string;
  dbName: string | null;
  schema: string | null;
}

interface ModelInfo {
  name: string;
  dbName: string;
  schema: string;
}

/**
 * Convert snake_case to UPPER_SNAKE_CASE
 */
function toUpperSnakeCase(str: string): string {
  return str.toUpperCase();
}

/**
 * Convert PascalCase model name to snake_case (fallback if @@map is missing)
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, (l) => `_${l.toLowerCase()}`)
    .replace(/^_/, '')
    .replace(/_+/g, '_');
}

/**
 * Read all .prisma files in the schema directory
 */
function readSchemas(): string {
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.prisma'));
  const schemas = files.map((f) => fs.readFileSync(path.join(schemaDir, f), 'utf8'));
  return schemas.join('\n');
}

/**
 * Parse Prisma schema text and extract model definitions with @@map and @@schema
 */
function parseModels(schemaText: string): ParsedModel[] {
  // Match: model ModelName { ... }
  const modelRegex = /model\s+(\w+)\s*{([\s\S]*?)^}/gm;
  // Match: @@map("table_name") or @@map('table_name')
  const mapRegex = /@@map\((?:'|")([^'"]+)(?:'|")\)/m;
  // Match: @@schema("schema_name") or @@schema('schema_name')
  const schemaRegex = /@@schema\((?:'|")([^'"]+)(?:'|")\)/m;

  const models: ParsedModel[] = [];
  let match;

  while ((match = modelRegex.exec(schemaText)) !== null) {
    const name = match[1] || '';
    const body = match[2] || '';
    const mapMatch = mapRegex.exec(body);
    const schemaMatch = schemaRegex.exec(body);
    const dbName = mapMatch?.[1] ?? null;
    const schema = schemaMatch?.[1] ?? null;

    models.push({ name, dbName, schema });
  }

  return models;
}

/**
 * Convert parsed models to enriched model info with defaults
 */
function enrichModels(models: ParsedModel[]): ModelInfo[] {
  return models.map((m) => {
    // Use @@map if present, otherwise convert model name to snake_case
    const dbName =
      m.dbName ??
      (toSnakeCase(m.name).endsWith('s') ? toSnakeCase(m.name) : `${toSnakeCase(m.name)}s`);

    // Schema should always be present; if not, use a fallback (error later)
    const schema = m.schema ?? 'UNKNOWN_SCHEMA';

    return { name: m.name, dbName, schema };
  });
}

/**
 * Generate the output TypeScript file
 */
function generateOutput(models: ModelInfo[]): string {
  // Group by schema for documentation
  const bySchema = new Map<string, ModelInfo[]>();
  for (const model of models) {
    if (!bySchema.has(model.schema)) {
      bySchema.set(model.schema, []);
    }
    bySchema.get(model.schema)!.push(model);
  }

  // Build Schemas object (first, extract unique schemas)
  const uniqueSchemas = Array.from(new Set(models.map((m) => m.schema))).sort();
  const schemasObj = uniqueSchemas.reduce(
    (acc, schema) => {
      // Convert schema name to constant key
      // e.g., "workspace_auth" -> "AUTH"
      const key = schema.replace(/^workspace_/, '').toUpperCase();
      acc[key] = schema;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Build Tables object (use table name in UPPER_SNAKE_CASE as key)
  const _tablesObj = models.reduce(
    (acc, model) => {
      const key = toUpperSnakeCase(model.dbName);
      acc[key] = model.dbName;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Build ModelToTable object
  const modelToTableObj = models.reduce(
    (acc, model) => {
      acc[model.name] = {
        schema: model.schema,
        table: model.dbName,
      };
      return acc;
    },
    {} as Record<string, { schema: string; table: string }>,
  );

  // Build TableToModel object
  const tableToModelObj = models.reduce(
    (acc, model) => {
      acc[model.dbName] = model.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Generate TypeScript output
  const lines: string[] = [
    '// GENERATED FILE — DO NOT EDIT BY HAND',
    '// Generated from Prisma schema definitions.',
    '// Run: pnpm --filter @workspace/prisma build',
    '//',
    '',
  ];

  // Schemas
  lines.push('export const Schemas = {');
  Object.entries(schemasObj).forEach(([key, value]) => {
    lines.push(`  ${key}: '${value}',`);
  });
  lines.push('} as const;');
  lines.push('');
  lines.push('export type Schema = (typeof Schemas)[keyof typeof Schemas];');
  lines.push('');

  // Tables (grouped by schema for readability)
  lines.push('export const Tables = {');
  for (const schema of uniqueSchemas) {
    const schemaModels = bySchema.get(schema) || [];
    const _schemaKey = schema.replace(/^workspace_/, '').toUpperCase();
    lines.push(`  // ${schema}`);
    schemaModels
      .sort((a, b) => a.dbName.localeCompare(b.dbName))
      .forEach((model) => {
        const key = toUpperSnakeCase(model.dbName);
        lines.push(`  ${key}: '${model.dbName}',`);
      });
  }
  lines.push('} as const;');
  lines.push('');
  lines.push('export type Table = (typeof Tables)[keyof typeof Tables];');
  lines.push('');

  // ModelToTable
  lines.push('export const ModelToTable = {');
  Object.entries(modelToTableObj)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([model, info]) => {
      lines.push(`  ${model}: {`);
      lines.push(`    schema: '${info.schema}',`);
      lines.push(`    table: '${info.table}',`);
      lines.push(`  },`);
    });
  lines.push('} as const;');
  lines.push('');
  lines.push('export type ModelName = keyof typeof ModelToTable;');
  lines.push('');

  // TableToModel
  lines.push('export const TableToModel = {');
  Object.entries(tableToModelObj)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([table, model]) => {
      lines.push(`  '${table}': '${model}',`);
    });
  lines.push('} as const;');
  lines.push('');
  lines.push('export type TableName = keyof typeof TableToModel;');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🔍 Reading Prisma schemas from', schemaDir);
    const schemaText = readSchemas();

    console.log('📝 Parsing models...');
    const parsed = parseModels(schemaText);
    console.log(`   Found ${parsed.length} models`);

    console.log('🔧 Enriching model data...');
    const models = enrichModels(parsed);

    // Check for missing schemas
    const missingSchemas = models.filter((m) => m.schema === 'UNKNOWN_SCHEMA');
    if (missingSchemas.length > 0) {
      console.warn(
        '⚠️  Warning: Models without @@schema directive:',
        missingSchemas.map((m) => m.name),
      );
    }

    console.log('✍️  Generating output...');
    const output = generateOutput(models);

    console.log('💾 Writing to', outFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outFile, output, 'utf8');

    console.log('✅ Done! Generated constants for', models.length, 'models');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
