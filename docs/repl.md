# Liu REPL (Simple)

The REPL is a thin, interactive wrapper over the CLI. It fixes `--domain-root` and `--workspace` at startup and accepts CLI-like subcommands without the `liu` prefix.

Start
```
liu repl --domain-root path/to/domain --workspace . [--backend memory|file] [--state-dir <dir>]
```

Dot commands (built-in)
- `.help` or `.h`: show REPL help
- `.runs`: list run IDs under the current workspace (`.liu-runs/*`)
- `.use <runId>`: set the current run ID; used by run/resume/state commands when omitted
- `.current`: print the current run ID
- `.reset <runId>`: delete run directory and state; clears current if it matches
- `.pwd`: print workspace path

Commands
- `list [plans|tools]`
- `run-plan <name>` — uses the chosen backend; file-backed state under `.liu-runs/<name>/state` by default
- `state-show <planId>`
- `state-reset <planId>`
- `exit` / `quit`

Scripting
- Provide a text file with one command per line (lines starting with `#` are comments):
```
liu repl --domain-root path/to/domain --workspace . --script scripts/demo.txt
```

Notes
- Memory backend is handy for quick iterations; file backend is useful for tracing runs.
- The REPL keeps the same tool resolution and workspace behavior as the CLI.

