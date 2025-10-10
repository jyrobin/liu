import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

export async function resolveTemplateYaml(domainRoot, provider, model, useCase = 'nl_to_liu_ts', explicit = null) {
  const base = path.resolve(domainRoot, 'llm', 'templates', useCase);
  const candidates = explicit
    ? [path.resolve(domainRoot, explicit)]
    : [
        path.join(base, provider || '', `${model}.yaml`),
        path.join(base, provider || '', 'default.yaml'),
        path.join(base, 'default.yaml'),
      ];
  for (const p of candidates) {
    try { await fs.access(p); return p; } catch { /* continue */ }
  }
  return null;
}

export function instantiateTemplateYAML(templateSpec, params) {
  const vars = { ...(templateSpec.defaults || {}), ...(params || {}) };
  const parts = [];
  for (const part of templateSpec.order || []) {
    const content = templateSpec.components?.[part];
    if (content) parts.push(content);
  }
  let text = parts.join('\n\n');
  text = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? '' : String(v);
  });
  return text;
}

export async function buildTemplateVars(domainRoot) {
  const helpersPath = fileURLToPath(new URL('../../helpers.d.ts', import.meta.url));
  const helpersDts = await fs.readFile(helpersPath, 'utf8');
  // Try common d.ts locations under domain
  const candidates = [
    path.join(domainRoot, 'types', 'tools.d.ts'),
    path.join(domainRoot, 'tools', 'types.d.ts'),
    path.join(domainRoot, 'types.d.ts'),
  ];
  let dtsText = '';
  for (const p of candidates) {
    try { dtsText = await fs.readFile(p, 'utf8'); break; } catch {}
  }
  const toolsSignatures = parseToolSignaturesFromDts(dtsText);
  const schemaTypes = parseSchemaTypesFromDts(dtsText);
  const typeNames = parseTypeNamesFromDts(dtsText);
  const constraints = [
    'Constraints:',
    '- Only top-level code; no functions/classes/loops/async/new.',
    '- Use const/let (single-assignment principle).',
    "- Import helpers from '@liu' and tools from '@tools'.",
    '- Flat if/else; no ternary.',
    '- Return final object via export default { ... }.',
    '- Emit code only (no extra prose).',
  ].join('\n');
  return { toolsSignatures, schemaTypes, helpersDts, constraints, typeNames };
}

export function parseToolSignaturesFromDts(dtsText) {
  const re = /export\s+declare\s+function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^;]+);/g;
  const lines = [];
  let m;
  while ((m = re.exec(dtsText)) !== null) {
    const name = m[1];
    const args = m[2].trim();
    const ret = m[3].trim();
    lines.push(`${name}(${args}): ${ret}`);
  }
  return lines.join('\n');
}

export function parseSchemaTypesFromDts(dtsText) {
  const lines = dtsText.split(/\r?\n/);
  const out = [];
  let collecting = false;
  let brace = 0;
  let buf = [];
  for (const line of lines) {
    if (!collecting) {
      const m = line.match(/^\s*export\s+type\s+\w+\s*=\s*/);
      if (m) {
        collecting = true;
        brace = 0;
        buf.push(line);
        brace += (line.match(/\{/g) || []).length;
        brace -= (line.match(/\}/g) || []).length;
        if (brace === 0 && /;\s*$/.test(line)) {
          out.push(buf.join('\n'));
          buf = [];
          collecting = false;
        }
      }
    } else {
      buf.push(line);
      brace += (line.match(/\{/g) || []).length;
      brace -= (line.match(/\}/g) || []).length;
      if (brace === 0 && /;\s*$/.test(line)) {
        out.push(buf.join('\n'));
        buf = [];
        collecting = false;
      }
    }
  }
  return out.join('\n');
}

export function parseTypeNamesFromDts(dtsText) {
  const names = [];
  const re = /export\s+type\s+(\w+)\s*=/g;
  let m;
  while ((m = re.exec(dtsText)) !== null) names.push(m[1]);
  return Array.from(new Set(names));
}

