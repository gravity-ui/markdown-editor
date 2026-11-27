---
name: markup-spec
description: Writes the specification of the Markdown syntax of an extension in the layout of the CommonMark Spec — numbered chapters, rules followed by numbered examples of Markdown and the HTML it renders — as a page of the Spec section in docs/. Use when asked to write, update or extend the specification of an extension, its syntax or its HTML output.
---

# Markup specification

A specification defines the Markdown syntax of an extension and the HTML that its markdown-it plugins render. It follows the layout of the [CommonMark Spec](https://spec.commonmark.org/0.31.2/) and uses the styles of the documentation site. The reader's side of the format is in `docs/spec-about.md`.

## Sources

- The extension code: markdown-it plugins, ProseMirror specs, parser and serializer tokens.
- The extension tests: their Markdown is a source of examples and limits.
- The extension page in Extension API: its section _Markdown plugin_ shows how to connect the plugins. `pnpm --filter @markdown-editor/docs-gen generate:extensions` writes the pages to `tmp/docs-gen/stubs/`.

## Page

- The file is `docs/spec-<name>.md`. Its first line is `##### Spec / <Name>`, the second is `# <Name> Spec`.
- Text is in plain English (A2–B1), in the present tense, one rule per paragraph.
- `##` is a chapter, `###` is a section. The build numbers them and gives each an anchor: the heading text in lowercase with other characters replaced by `-`. Write headings without numbers and link to them by this anchor: `### What is a banner?` → `#what-is-a-banner`.

## Structure

1. `## Introduction`
    - `### What is <construct>?` — one paragraph and a full example of the syntax in a `markdown` code block.
    - `### About this document` — what the document defines; the renderer of the examples: markdown-it version, plugins and their options; the meaning of classes and `data-*` attributes in the HTML.
2. `## Preliminaries` — the terms the rules use. A term is defined once, in bold: `A **container directive** begins with…`. The rest of the text links to the section of the term.
3. A chapter for each construct: block, mark, group of attributes. A section for each rule or attribute.

## Sections

A section states the rule and then shows it in examples: the main case, the variants, the limits of the rule. A limit is input that the rule rejects or changes: an invalid value, a missing part, an unsafe URL. Limits stay at the end of their section.

## Examples

```````````````````````````````` example
Markdown
.
HTML
````````````````````````````````

- The fence is 32 backticks with the info string `example`. A line with a single `.` separates Markdown from HTML.
- `→` stands for a tab.
- The build numbers the examples. The text refers to rules, not to example numbers: the numbers change when examples are added.
- The HTML is the output of the renderer from _About this document_. A temporary script in `tmp/` runs the plugins on the Markdown of each example; the output goes into the example unchanged.

An example is chosen by these criteria:

1. An example shows a rule. Each statement of the text has at least one example.
2. All values of an attribute are in one example, as several blocks in one Markdown.
3. Attributes are combined only where one affects another. Independent attributes are not multiplied.
4. The Markdown holds only what the rule needs.
5. A limit is a separate example. Limits of one kind share an example: four rejected URL schemes are one example.
6. A default value has one example per block: an omitted attribute and its explicit default render the same HTML.
7. Block content is shown by rule: one example with all marks, one with a nested link, one with unsupported blocks.

## Check

- The script renders the Markdown of every example to its HTML.
- Every `#anchor` link leads to a heading or an example of the page.
- `pnpm run ci:docs:build` builds the site; the page is `dist/docs/spec/<name>.html`.
