##### Develop / Extension docs generation

## How to Generate Extension Docs

The extension docs pipeline has two kinds of inputs:

- hand-written docs from `docs/`, which are converted into `docs-src/`;
- tracked enriched extension docs from `docs-gen/enriched/*.md`, which are assembled into the published extensions reference.

## Authoring Workflow

1. Run `pnpm docs:extract` to refresh `docs-gen/raw/*.md` and `docs-gen/extensions.json`.
2. Fill every `<!-- AI:NEEDED:* -->` marker and save the result to `docs-gen/enriched/{Name}.md`.
3. Commit the updated `docs-gen/enriched/*.md` files together with any script changes.
4. Run `pnpm docs:assemble` to rebuild the extensions section inside `docs-src/`.
5. Run `pnpm docs:build` when you need a full local docs site build.

## Enrichment Options

- `pnpm docs:enrich:prompts` exports prompts for manual or external processing.
- `pnpm docs:enrich` sends prompts to OpenAI directly and writes results into `docs-gen/enriched/`.
- `pnpm docs:enrich:apply` applies prepared JSON responses from `docs-gen/responses/`.
- `pnpm docs:enrich:agent` prints the instruction file for agent-driven enrichment.

## Strict Publish Rules

`docs:assemble`, `docs:build`, and `ci:docs:build` are strict publish commands:

- every publishable extension from `docs-gen/extensions.json` must have a matching `docs-gen/enriched/{Name}.md`;
- enriched docs must not contain `AI:NEEDED` or `AI:FAILED` markers;
- orphan enriched docs are rejected;
- stale files under `docs-src/extensions/` are removed before new pages are written.

The pipeline excludes internal extensions such as `BaseInputRules`, `BaseKeymap`, `BaseStyles`, `ReactRenderer`, and `SharedState`. They are not published and should not have committed enriched pages.

## Verification

- Run `pnpm docs:test` for pipeline regressions.
- Run `node scripts/docs/index.mjs build` to verify the strict generator and assembler flow before publishing.
