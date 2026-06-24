# Docs Generator

`infra/docs-gen` contains tooling for two documentation flows:

- building Diplodoc input from `docs/*.md`;
- extracting raw extension metadata from `packages/editor/src/extensions`.

## Commands

- `pnpm --filter @markdown-editor/docs-gen run build` creates `tmp/docs-src` and builds `dist/docs`.
- `pnpm --filter @markdown-editor/docs-gen run extract` creates `tmp/docs-gen/extensions.json` and `tmp/docs-gen/raw/*.md`.
- `pnpm --filter @markdown-editor/docs-gen run test` runs the colocated Node unit tests.

## Files

- `package.json` defines the local docs-gen package, scripts, and Nx target.
- `EXTRACTION_PIPELINE.md` documents the raw extension extraction flow with a Mermaid diagram.
- `src/config.mjs` stores shared paths, extension categories, ignored internal extensions, preset definitions, and generator regex constants.
- `src/extract-extension-data.mjs` provides the CLI entry point for raw extension extraction.
- `src/generate-docs.mjs` builds the Diplodoc source tree from repository markdown files.
- `src/logger.mjs` contains the small console logger used by docs-gen CLIs.
- `src/utils.mjs` contains filesystem helpers shared by the build and extraction flows.

## Extractor Files

- `src/extractor/index.mjs` contains `ExtensionExtractor`, the high-level orchestrator that scans extension categories, enriches records with presets, and writes output.
- `src/extractor/scan.mjs` scans one extension directory and assembles the raw extension IR record.
- `src/extractor/source-files.mjs` selects source, spec, serializer, root index, specs index, and test files from an extension directory.
- `src/extractor/output.mjs` writes extracted JSON and raw Markdown artifacts.
- `src/extractor/markdown-gen.mjs` renders one raw extension Markdown file from extracted metadata.
- `src/extractor/presets.mjs` parses editor preset files and resolves inherited preset membership.
- `src/extractor/constants.mjs` extracts string constants, enum values, object scalar members, and resolves references between them.
- `src/extractor/options.mjs` extracts extension option fields from local TypeScript option declarations.
- `src/extractor/examples.mjs` extracts serializer test markup examples from `same(...)` calls and simple local string expressions.
- `src/extractor/regex.mjs` contains shared scanner helpers and the source scanners for schema names, actions, keymaps, plugins, input rules, markdown-it plugins, and serializer hints.
- `src/extractor/patterns.mjs` keeps the regular expressions used by extractor modules.
- `src/extractor/actions.test.mjs` covers action extraction behavior.
- `src/extractor/cli.test.mjs` covers extraction CLI argument parsing.
- `src/extractor/constants.test.mjs` covers constant extraction and reference resolution behavior.
- `src/extractor/examples.test.mjs` covers markup example extraction behavior.
- `src/extractor/keymaps.test.mjs` covers keymap extraction behavior.
- `src/extractor/options.test.mjs` covers option declaration extraction behavior.

## Output

- `tmp/docs-gen/extensions.json` is the machine-readable raw IR for all extracted extensions.
- `tmp/docs-gen/raw/*.md` is the raw Markdown view of each extension record.
- `tmp/docs-src` is the generated Diplodoc input tree used by the docs build.
