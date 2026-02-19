# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Build (compiles TypeScript with SWC to dist/, then generates type declarations)
bun run build

# Run all tests (vitest + bun test, clears artifacts first)
bun run test

# Run only vitest tests (src/vitest.test.ts)
bunx vitest

# Run only bun tests (__tests__/*.test.ts)
bun test

# Run a single bun test file
bun test __tests__/index.test.ts

# Format source files
bun run fmt
```

The `dist/` directory is the CJS build output. The binary entrypoint is `bin/syncenv.js` which requires `dist/index.js`.

## Architecture

Syncenv is a CLI tool that generates env/secret files by fetching values from remote providers and replacing template placeholders.

### Execution flow

1. **`bin/syncenv.js`** calls `run(...process.argv)` from the built `dist/index.js`
2. **`src/index.ts`** — `Syncenv` class orchestrates everything:
   - Parses CLI options via `Syncenv.parseOptions()`
   - Loads config via `ConfigParser` (uses `cosmiconfig` to find `.syncenvrc`, `package.json#syncenv`, etc.)
   - Resolves plugins via `ConfigResolver`
   - For each setting entry, dispatches to the appropriate `Processor`
3. **`src/config-parser/index.ts`** — validates config with `valibot` schema, normalizes settings array, resolves paths, and computes `work_dir`/`cache_id`
4. **`src/config-resolver.ts`** — dynamically imports plugins (builtin: `default`, `gcp`; or custom paths/node_modules), aggregates pipes from all loaded plugins
5. **`src/processors/`** — one processor per output type:
   - `EnvProcessor` — handles `.env` and `.envrc` types
   - `FileProcessor` — handles `file` type (raw placeholder replacement)
   - `TemplateProcessor` — handles `template` type (reads `input_path`, replaces variables)
   - `BaseProcessor` — shared `replaceValue()` using `$VAR` / `${VAR}` regex, and `writeFile()` that also stores to cache
6. **`src/plugins/`** — plugin system:
   - `PluginInterface` — abstract base with `fetchValues()` and `loadPipes()`
   - `DefaultPlugin` — passthrough replacer + built-in `trim`/`replace` pipes
   - `GcpSecretPlugin` — fetches from Google Secret Manager; activated by `__gcp:secretPath__` syntax in replace values, or `plugins: ["gcp"]` config

### Plugin/replacer dispatch

The `replacerInputs()` method in `Syncenv` parses replace values for the `__provider:requestId__` pattern (`parseSetting.ts`). Matched values are routed to the named plugin's `fetchValues()`; unmatched values go to the `default_replacer` plugin.

### Cache system

`CacheResolver` (AES-256-CBC encryption + gzip + tar archive):
- Cache files stored at `~/.syncenv/{cacheId}-cache.data`
- Encryption key at `~/.syncenv/cache-key.json` (never commit this)
- Enabled via `cache: true` in config; bypass with `-f`/`--force` flag

### Testing approach

There are **two test runners**:
- **vitest** — `src/vitest.test.ts` (uses fixture `fixtures/syncenvrc.cache.yaml`)
- **bun test** — `__tests__/index.test.ts` (uses `fixtures/syncenvrc.yaml`)

Both test files use mock implementations of `IConfigParser`, `IConfigResolver`, and `IGcpSecretReplacerClient` to avoid real GCP calls. The full `bun run test` script clears `artifacts/` before running both.

### Custom plugin API

Plugins must export a `default` class extending `PluginInterface` with a static `pluginId`. Implement `fetchValues()` to transform replace values, and/or `loadPipes()` to register pipe functions. Plugins must be compiled to CommonJS before use.
