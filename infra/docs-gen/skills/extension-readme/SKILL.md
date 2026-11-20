---
name: extension-readme
description: Writes the README.md of one markdown-editor extension in the strict format that the Extension API page generator reads. Run by `pnpm docs:readme`, which passes the context and validates the result. Not for other README files.
---

# Extension README

You write `README.md` for one extension of `@gravity-ui/markdown-editor`. The docs generator inserts its sections into the extension page of https://gravity-ui.github.io/markdown-editor/. CI compiles every code block against the current sources, and a reviewer compares the text with the code.

## Input

The script appends a context block to this skill:

- `name` — extension name, for example `Bold`.
- `dir` — extension directory relative to the repository root.
- `import` — the import line of the extension from its generated page.
- `page` — the generated page in Markdown: options, actions, keys, input rules, toolbar, Markdown plugin.
- `frontmatter` — field values for the README frontmatter.

## Sources

Read the sources in this order:

1. Every file in `dir`: the extension, its specs, the options type, the tests.
2. Presets in `packages/editor/src/bundle/` that pass options to the extension, for example `wysiwyg-preset.ts`.
3. The declaration of `useMarkdownEditor` in `packages/editor/src/bundle/useMarkdownEditor.ts`.
4. A file outside `dir` when the extension imports an option type, an action or a Markdown plugin from it.

Every name, option, action and Markdown construct in the README comes from these sources or from `page`.

## Output

Print the README and nothing else: no preface, no closing remark, no surrounding code fence.

~~~md
---
generated: ai
editor: <frontmatter.editor>
commit: <frontmatter.commit>
date: <frontmatter.date>
source-hash: <frontmatter.source-hash>
---

## Description

<one to three sentences>

## Examples

### Connect

```ts
<module>
```

### <Task>

```ts
<module>
```
~~~

- Copy the frontmatter values from `frontmatter` character for character.
- The README contains exactly these headings in this order: `## Description`, `## Examples`, `### Connect`, then zero to three `### <Task>` headings.
- Each `###` section contains exactly one `ts` code block and no text.

## Description

- One to three sentences in plain English (A2–B1), present tense.
- The first sentence names what the extension adds to the editor: a node, a mark, a command or a behavior.
- The second sentence gives the Markdown syntax that the extension parses and serializes, in backticks, when the extension has one.
- The third sentence, when needed, names a required option or a limitation that the sources state.
- The description repeats no list from `page` and names no action or key: options, actions and keys are already on the page.

## Examples

- `### Connect` connects the extension through `wysiwygConfig.extensions` of `useMarkdownEditor` and imports it with the line from `import`. Option values are the ones a preset passes, otherwise the required options only.
- Every option value in an example comes from a preset, a test or `page`. A value that the sources do not show stays out of the example.
- A `### <Task>` example shows one task that the sources support: setting an option, running an action, registering the Markdown plugin. The title is an imperative phrase, for example `### Set the shortcut`.
- Each code block is a complete TypeScript module: all imports, no `...`, no placeholders, no comments. It compiles with `strict: true`.
- Core API is imported from `@gravity-ui/markdown-editor`; the extension, from the `import` line.
- Every example imports the extension and passes it to `builder.use`.

## Rules

- Write only what the sources show. A fact the sources do not show stays out of the README.
- When no task example can be built from the sources, the README contains `### Connect` only.
- Do not create, edit or delete files. Read files only.
