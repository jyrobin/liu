import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { resolveTemplateYaml, instantiateTemplateYAML, buildTemplateVars } from './template-yaml.js';

export const UseCases = {
  NL_TO_PLAN_TS: 'nl_to_plan_ts'
};

export async function composePrompt({ domainRoot, provider, useCase = UseCases.NL_TO_PLAN_TS, params = {} }) {
  // Try YAML template first (provider/model aware) and inject domain variables
  const yamlPath = await resolveTemplateYaml(domainRoot, provider, params.model || null, 'nl_to_liu_ts');
  if (yamlPath) {
    const spec = yaml.load(await fs.readFile(yamlPath, 'utf8'));
    const vars = await buildTemplateVars(domainRoot);
    const prompt = instantiateTemplateYAML(spec, { ...vars, nlRequest: params.nlRequest || '', allowed: params.allowed || '' });
    return prompt;
  }
  // Fallback to simple text-based template
  const templPath = await findTemplate({ domainRoot, provider, useCase });
  const text = templPath ? await fs.readFile(templPath, 'utf8') : defaultTemplate(provider, useCase);
  return interpolate(text, params);
}

async function findTemplate({ domainRoot, provider, useCase }) {
  // Domain-specific template path: <domainRoot>/llm/templates/<provider>/<useCase>.txt
  const p = path.join(domainRoot, 'llm', 'templates', provider, `${useCase}.txt`);
  try { await fs.access(p); return p; } catch { return null; }
}

function interpolate(t, params) {
  return t.replace(/\{\{\s*([A-Za-z0-9_\.]+)\s*\}\}/g, (_, key) => {
    const v = params[key];
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
  });
}

function defaultTemplate(provider, useCase) {
  // Simple provider-agnostic fallback
  return `You are a Liu TS Plan Author. Produce a single .liu.ts file only.

Constraints:
- Only top-level code; no functions/classes/loops/async/new.
- Use only const/let (single-assignment principle).
- Import helpers as values from '@liu' and tools from '@tools'.
- Use flat if/else (no ternary ?:).
- Return final object via export default { ... }.
- No extra commentary: emit code only.

Task (Natural Language):
{{nlRequest}}

Allowed (optional, domain-specific schemas/tools list or constraints):
{{allowed}}
`;
}
