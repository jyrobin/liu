const DEFAULT_CONFIG = {
  version: 1,
  activeProfile: null,
  profiles: {
    default_openai: { provider: 'openai', model: 'gpt-4o-mini', apiKey: '$env(OPENAI_API_KEY)', extras: { temperature: 0.2, maxTokens: 1500 } },
    default_claude: { provider: 'anthropic', model: 'claude-3-5-sonnet-latest', apiKey: '$env(ANTHROPIC_API_KEY)', extras: { temperature: 0.2, maxTokens: 1500 } }
  }
};

export function mergeDefaults(cfg) {
  const merged = { ...DEFAULT_CONFIG, ...cfg };
  merged.profiles = { ...DEFAULT_CONFIG.profiles, ...(cfg?.profiles || {}) };
  return merged;
}

export function resolveProfile(cfg, name) {
  const profName = name || cfg.activeProfile || Object.keys(cfg.profiles)[0];
  const prof = cfg.profiles[profName];
  if (!prof) throw new Error(`Profile not found: ${profName}`);
  return { name: profName, ...prof, apiKey: resolveApiKey(prof.apiKey) };
}

function resolveApiKey(ref) {
  if (!ref) return null;
  const m = String(ref).match(/^\$env\(([^)]+)\)$/);
  if (m) return process.env[m[1]] || null;
  return ref;
}
