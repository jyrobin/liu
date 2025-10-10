# Liu LLM Integration (Standalone)

This package provides a light LLM integration for generating Liu TS plans directly from natural language requests. It does not depend on registries or enterprise workflow components — all “domain” information is supplied by the domain folder (tools, .d.ts types) and provider-specific prompt templates.

## Where LLM Config Lives

- LLM configuration is stored in the domain’s `liu-domain.config.json` under the `llm` field.
- The profiles utility is stateless and only merges defaults; your app/CLI reads and writes the domain config.

Example `liu-domain.config.json` (subset):
```
{
  "version": 1,
  "paths": { ... },
  "llm": {
    "activeProfile": "default_openai",
    "profiles": {
      "default_openai": {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "apiKey": "$env(OPENAI_API_KEY)",
        "extras": { "temperature": 0.2, "maxTokens": 1500 }
      },
      "default_claude": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-latest",
        "apiKey": "$env(ANTHROPIC_API_KEY)",
        "extras": { "temperature": 0.2, "maxTokens": 1500 }
      }
    }
  }
}
```

Notes:
- `apiKey` can use `$env(NAME)` to load from environment.
- `extras` are passed through to the LLM provider as temperature/maxTokens where supported.

## CLI Commands

- Status and profiles:
```
liu llm status --domain-root <domain>
liu llm profile list --domain-root <domain>
liu llm profile show --domain-root <domain>
liu llm profile use <name> --domain-root <domain>
liu llm profile set --name my_openai --provider openai --model gpt-4o --api-key $env(OPENAI_API_KEY) --domain-root <domain>
```

- Compose a prompt (YAML template + domain variables from .d.ts):
```
liu llm compose --domain-root <domain> --request "Reconcile invoice 8891" \
  --allowed '["schemas:Invoice,MatchResult","tools:add,notify"]' \
  --profile default_openai
```
This prints the composed prompt. The `--allowed` parameter is optional and free-form; it is injected into templates as `{{allowed}}` — use it to restrict schemas/tools as your domain demands.

- Generate a plan:
```
# Manual mode: prints prompt; paste model response; then validates and prints/saves plan
liu llm gen-plan --domain-root <domain> --request "..." --manual [--save] [--name <planName>]

# Direct mode (if network available and API key set)
liu llm gen-plan --domain-root <domain> --request "..." --save --name <planName>
```
- Output is annotated with metadata in a header.
- Validation runs on the returned code; with `--save`:
  - valid → `<plans>/<name>.liu.ts`
  - invalid → `<plans>/<name>.liu.invalid.ts`

## Template Resolution (YAML-first)

- Domain file search (first match wins):
  - `<domain>/llm/templates/nl_to_liu_ts/<provider>/<model>.yaml`
  - `<domain>/llm/templates/nl_to_liu_ts/<provider>/default.yaml`
  - `<domain>/llm/templates/nl_to_liu_ts/default.yaml`
- If no YAML is found, the CLI falls back to a simple text template.

### Template Variables
- `nlRequest`: the NL task text
- `helpersDts`: typed helper definitions from `liu/src/helpers.d.ts`
- `toolsSignatures`: one-line signatures extracted from domain `.d.ts` (see below)
- `schemaTypes`: block of exported type definitions from domain `.d.ts`
- `typeNames`: list of exported type names (for advanced templates)
- `constraints`: standard Liu TS constraints
- `allowed`: optional free-form constraints passed by `--allowed`/`--allowed-kinds`

### Domain .d.ts Extraction
- The template utilities scan common domain type locations:
  - `<domain>/types/tools.d.ts`
  - `<domain>/tools/types.d.ts`
  - `<domain>/types.d.ts`
- From these, the CLI extracts:
  - `toolsSignatures`: `export declare function name(args): returnType;`
  - `schemaTypes`: concatenated `export type Name = { ... };` blocks
  - `typeNames`: exported type names

## Fallback Text Template
If no YAML is found, a simple template is used with tokens `{{nlRequest}}` and `{{allowed}}`.

## Provider APIs
- The generic client supports OpenAI- and Anthropic-style chat endpoints via `fetch`. If your environment blocks network, use `--manual` mode.

## Next Steps
- Customize templates under `<domain>/llm/templates/nl_to_liu_ts/...` per provider/model.
- Use `--allowed` to quickly scope which schemas/tools the LLM may use (based on your domain `.d.ts`).
- Add more variables to your templates if needed; the YAML system is flexible and minimal.

