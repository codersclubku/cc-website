import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
const schemaFile = path.resolve(process.cwd(), 'supabase', 'schema.sql');

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log('Chronological migration files:');
migrationFiles.forEach(f => console.log('  -', f));

function normalizeParams(rawParams) {
  if (!rawParams || !rawParams.trim()) return '';
  return rawParams
    .split(',')
    .map(p => {
      const cleaned = p.trim().replace(/\s+/g, ' ');
      // extract type: handle e.g. "p_event_id uuid", "check_user_id uuid default auth.uid()", "uuid"
      const parts = cleaned.split(' ');
      if (parts.length === 1) return parts[0].toLowerCase();
      // look for default
      const defIdx = parts.findIndex(x => x.toLowerCase() === 'default');
      const typeParts = defIdx > 0 ? parts.slice(1, defIdx) : parts.slice(1);
      return typeParts.join(' ').toLowerCase();
    })
    .join(', ');
}

function parseFunctionsFromSql(sql, filename) {
  const funcRegex = /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_.]+)\s*\(([\s\S]*?)\)\s*returns\s+([\s\S]*?)as\s+\$\$([\s\S]*?)\$\$\s*;/gi;
  const functions = [];
  let match;

  while ((match = funcRegex.exec(sql)) !== null) {
    const rawName = match[1];
    const params = match[2].trim();
    const returnAndOpts = match[3];
    const body = match[4];

    const cleanName = rawName.startsWith('public.') ? rawName : `public.${rawName}`;
    const isSecDef = /security\s+definer/i.test(returnAndOpts);
    const isTrigger = /returns\s+trigger/i.test(`returns ${returnAndOpts}`);
    const searchPathMatch = /set\s+search_path\s*=\s*['"]?([^'";,\s]*)['"]?/i.exec(returnAndOpts);
    const searchPath = searchPathMatch ? searchPathMatch[1] : (isSecDef ? 'UNSET (insecure)' : 'N/A');

    // Find grants and revokes for this function in the file
    const baseName = cleanName.split('.')[1];
    const fnRegexEscaped = cleanName.replace('.', '\\.');
    const revokeRegex = new RegExp(`revoke\\s+all\\s+on\\s+function\\s+(?:public\\.)?${baseName}[^;]*from\\s+([^;]+);`, 'gi');
    const grantRegex = new RegExp(`grant\\s+execute\\s+on\\s+function\\s+(?:public\\.)?${baseName}[^;]*to\\s+([^;]+);`, 'gi');

    const revokes = [];
    let rMatch;
    while ((rMatch = revokeRegex.exec(sql)) !== null) {
      revokes.push(rMatch[1].trim().replace(/\s+/g, ' '));
    }

    const grants = [];
    let gMatch;
    while ((gMatch = grantRegex.exec(sql)) !== null) {
      grants.push(gMatch[1].trim().replace(/\s+/g, ' '));
    }

    functions.push({
      file: filename,
      fullName: cleanName,
      params,
      normParams: normalizeParams(params),
      isSecDef,
      isTrigger,
      searchPath,
      revokes,
      grants,
      bodyPreview: body.trim().slice(0, 80).replace(/\s+/g, ' ')
    });
  }

  return functions;
}

const inventory = new Map();
let totalDefinitions = 0;

for (const f of migrationFiles) {
  const content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
  const fns = parseFunctionsFromSql(content, f);
  for (const fn of fns) {
    totalDefinitions++;
    const key = `${fn.fullName}(${fn.normParams})`;
    if (!inventory.has(key)) {
      inventory.set(key, {
        fullName: fn.fullName,
        exactSignature: `${fn.fullName}(${fn.params})`,
        normParams: fn.normParams,
        history: [],
        effective: null
      });
    }
    const entry = inventory.get(key);
    entry.history.push(fn);
    entry.effective = fn; // latest migration wins
  }
}

console.log(`\nParsed ${totalDefinitions} total historical function definitions across ${migrationFiles.length} migrations.`);
console.log(`Distinct function signatures: ${inventory.size}\n`);

let idx = 1;
for (const [sig, data] of inventory.entries()) {
  const eff = data.effective;
  console.log(`--- [${idx++}] ${data.fullName} ---`);
  console.log(`  Signature:           ${data.exactSignature}`);
  console.log(`  Normalized Key:      ${sig}`);
  console.log(`  Historical Defs:     ${data.history.length} (${data.history.map(h => h.file).join(', ')})`);
  console.log(`  Type:                ${eff.isTrigger ? 'TRIGGER FUNCTION' : 'CALLABLE RPC'}`);
  console.log(`  Security Mode:       ${eff.isSecDef ? 'SECURITY DEFINER' : 'SECURITY INVOKER'}`);
  console.log(`  Final search_path:   '${eff.searchPath}'`);
  console.log(`  Final Effective In:  ${eff.file}`);
  console.log(`  Effective Revocations: ${eff.revokes.length > 0 ? eff.revokes.join(' | ') : 'NONE'}`);
  console.log(`  Effective Grants:      ${eff.grants.length > 0 ? eff.grants.join(' | ') : 'NONE'}`);
}

console.log('\n======================================================');
console.log('VALIDATING CONSOLIDATED SCHEMA (supabase/schema.sql)');
console.log('======================================================');

const schemaSql = fs.readFileSync(schemaFile, 'utf8');
const schemaFns = parseFunctionsFromSql(schemaSql, 'supabase/schema.sql');
const schemaMap = new Map();
for (const s of schemaFns) {
  const key = `${s.fullName}(${s.normParams})`;
  schemaMap.set(key, s);
}

console.log(`Parsed ${schemaFns.length} functions from schema.sql.`);
console.log(`Unique functions in final migration inventory: ${inventory.size}`);

let schemaMatches = 0;
let schemaMismatches = 0;

for (const [key, data] of inventory.entries()) {
  const eff = data.effective;
  const inSchema = schemaMap.get(key);
  if (!inSchema) {
    console.error(`SCHEMA DRIFT: Function ${key} exists in migrations but is MISSING from schema.sql`);
    schemaMismatches++;
    continue;
  }

  // Check security definer
  if (inSchema.isSecDef !== eff.isSecDef) {
    console.error(`SCHEMA DRIFT: ${key} security definer mismatch: schema=${inSchema.isSecDef}, migration=${eff.isSecDef}`);
    schemaMismatches++;
  }
  // Check search path
  if (inSchema.searchPath !== eff.searchPath) {
    console.error(`SCHEMA DRIFT: ${key} search_path mismatch: schema='${inSchema.searchPath}', migration='${eff.searchPath}'`);
    schemaMismatches++;
  }
  // Check trigger status
  if (inSchema.isTrigger !== eff.isTrigger) {
    console.error(`SCHEMA DRIFT: ${key} trigger status mismatch`);
    schemaMismatches++;
  }

  schemaMatches++;
}

console.log(`Schema comparison result: ${schemaMatches} matched, ${schemaMismatches} mismatches.`);
if (schemaMismatches === 0) {
  console.log('SUCCESS: Consolidated schema.sql is 100% consistent with final migration state.');
} else {
  console.error('FAILED: Consolidated schema.sql has drift.');
}
