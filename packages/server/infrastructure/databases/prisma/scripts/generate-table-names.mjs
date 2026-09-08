import fs from 'fs';
import path from 'path';

// Resolve paths relative to this script file so the script works when invoked from any CWD
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const pkgDir = path.resolve(scriptDir, '..');
const schemaDir = path.resolve(pkgDir, 'prisma', 'schema');
const outDir = path.resolve(pkgDir, 'src', 'constants');
const outFile = path.join(outDir, 'table-names.ts');

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`).replace(/^_/, '');
}

function readSchemas() {
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.prisma'));
  const schemas = files.map((f) => fs.readFileSync(path.join(schemaDir, f), 'utf8'));
  return schemas.join('\n');
}

function parseModels(schemaText) {
  const modelRegex = /model\s+(\w+)\s*{([\s\S]*?)^}/gm;
  const mapRegex = /@@map\((?:'|")([^'"]+)(?:'|")\)/m;
  const schemaDecl = /@@schema\((?:'|")([^'"]+)(?:'|")\)/m;

  const models = [];
  let m;
  while ((m = modelRegex.exec(schemaText))) {
    const name = m[1];
    const body = m[2];
    const mapMatch = mapRegex.exec(body);
    const schemaMatch = schemaDecl.exec(body);
    const dbName = mapMatch ? mapMatch[1] : null;
    const schema = schemaMatch ? schemaMatch[1] : null;
    models.push({ name, dbName, schema });
  }
  return models;
}

function main() {
  const text = readSchemas();
  const models = parseModels(text);
  const entries = models.map((m) => {
    const dbName =
      m.dbName ??
      (toSnakeCase(m.name).endsWith('s') ? toSnakeCase(m.name) : `${toSnakeCase(m.name)}s`);
    return { name: m.name, dbName, schema: m.schema };
  });

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tableNames = Array.from(new Set(entries.map((e) => e.dbName))).sort();
  const modelNames = Array.from(new Set(entries.map((e) => e.name))).sort();

  const modelToTableObj = entries.reduce((acc, e) => {
    acc[e.name] = { table: e.dbName, schema: e.schema };
    return acc;
  }, {});

  const tableToModelObj = entries.reduce((acc, e) => {
    acc[e.dbName] = e.name;
    return acc;
  }, {});

  const content = `// GENERATED FILE — DO NOT EDIT BY HAND
// It provides a syntatic sugar for your table names at build and run time  
// Run: pnpm -w -C packages/database run generate:table-names

export const MODEL_TO_TABLE = ${JSON.stringify(modelToTableObj, null, 2)} as const;
export const TABLE_TO_MODEL = ${JSON.stringify(tableToModelObj, null, 2)} as const;

export type PrismaModelName = ${modelNames.map((n) => `'${n}'`).join(' | ')};
export type DbTableName = ${tableNames.map((n) => `'${n}'`).join(' | ')};
`;

  fs.writeFileSync(outFile, content, 'utf8');
  console.log('Wrote', outFile);
}

main();
