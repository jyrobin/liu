import path from 'node:path';
import fs from 'node:fs/promises';
import { composePrompt, UseCases } from './template-manager.js';
import { mergeDefaults, resolveProfile } from './profiles.js';
import { loadConfig } from '../domain.js';
import { LLMClient } from './client.js';
import { validateLiuSource } from '../liu-validator.js';

export async function genPlanFromNL({ domainRoot, request, allowed = null, profileName = null, manual = false }) {
  const dcfg = await loadConfig(domainRoot);
  const cfg = mergeDefaults(dcfg.llm || {});
  const prof = resolveProfile(cfg, profileName);
  const prompt = await composePrompt({ domainRoot, provider: prof.provider, useCase: UseCases.NL_TO_PLAN_TS, params: { nlRequest: request, allowed } });
  if (manual) {
    return { prompt, planText: null, profile: prof };
  }
  const client = new LLMClient(prof);
  const planText = await client.call({ user: prompt });
  return { prompt, planText, profile: prof };
}

export function annotatePlan({ planText, profile, request, valid, useCase = UseCases.NL_TO_PLAN_TS }) {
  const header = `/*
@source: liu llm gen-plan
@provider: ${profile?.provider||''}
@model: ${profile?.model||''}
@profile: ${profile?.name||''}
@useCase: ${useCase}
@timestamp: ${new Date().toISOString()}
@request: ${safeOneLine(request)}
@valid: ${valid}
*/
`;
  return header + (String(planText||'').trim() + '\n');
}

export async function savePlan({ domainRoot, content, name = null, valid = true, outDir = null }) {
  const dir = outDir ? path.resolve(domainRoot, outDir) : path.join(domainRoot, 'plans');
  await fs.mkdir(dir, { recursive: true });
  const base = name ? slug(name) : ('nl_plan_' + Date.now());
  const ext = valid ? '.liu.ts' : '.liu.invalid.ts';
  const p = path.join(dir, base + ext);
  await fs.writeFile(p, content);
  return p;
}

export function validatePlanText(text) {
  const v = validateLiuSource(text);
  return v;
}

function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function safeOneLine(s) { return String(s).replace(/\s+/g, ' ').slice(0, 2000); }
