# Enrich Extension Docs — Agent Instructions

You are enriching documentation for the `@gravity-ui/markdown-editor` library.

## What to do

1. Read `docs-gen/extensions.json` to get the list of all extensions and their metadata (IR).
2. For each extension that has a raw doc in `docs-gen/raw/{Name}.md`:
   - Read the raw doc file.
   - Find all `<!-- AI:NEEDED:{section} -->` markers.
   - For each marker, read the extension source code at the path from `dirPath` in the IR, then write a replacement text (see section templates below).
   - Write the result to `docs-gen/enriched/{Name}.md` — same content as raw but with markers replaced by your text.
3. Skip these extensions (infrastructure, no user-facing docs needed):
   - BaseInputRules, BaseKeymap, BaseStyles, ReactRenderer, SharedState

## Section templates

### `description`

Write 2-4 sentences describing what this extension does from a user's perspective. Do not start with the extension name. Write in English.

### `serialization`

Describe what markdown output this extension produces when serializing. Show syntax patterns with inline code. If the extension has no markdown output (behavior extensions), write: "This extension does not produce markdown output."

### `syntaxGuide`

Explain the markdown syntax this extension handles. Show patterns, explain how they render, note variations. If no markdown syntax, write: "This extension does not define custom markdown syntax."

### `useCases`

Write 2-4 bullet points: when would a developer include this extension? One concise sentence per bullet.

## How to find source code

Each extension IR entry has `dirPath` — relative path to the extension directory. Read the key files there:
- `index.ts` — main extension wiring (actions, keymaps, plugins)
- `*Specs/index.ts` — schema, parser, serializer definitions
- `*Specs/const.ts` — node/mark names, attribute enums
- `*Specs/serializer.ts` — how content is serialized to markdown

## How to write the enriched file

Take the raw file content, replace each `<!-- AI:NEEDED:section -->` with your text, write to `docs-gen/enriched/{Name}.md`. Keep everything else unchanged (frontmatter, deterministic sections, etc.).

## Scope control

- `--all` — enrich all extensions (default)
- `--only Bold,Heading,YfmNote` — enrich only listed extensions
- `--category markdown` — enrich only extensions in a category

When the user gives you this file, they may add a scope line at the bottom. If no scope is specified, do all.

## Quality guidelines

- Be accurate — base descriptions on the actual source code, not guesses.
- Be concise — 2-4 sentences for description, not a wall of text.
- Be specific — mention actual syntax like `**text**`, `{% note %}`, `$formula$`.
- Don't invent features that aren't in the code.
- For behavior extensions (Clipboard, History, Search, etc.) the syntaxGuide and serialization sections should say "does not define/produce" rather than being left empty.

---

## Scope

<!-- Add scope here when invoking the agent, e.g.: -->
<!-- --only Bold,Heading,Lists -->
<!-- --category markdown -->
<!-- --all -->
--all
