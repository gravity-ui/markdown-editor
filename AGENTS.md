# AGENTS.md — gravity-ui/markdown-editor

## Following existing code

Where this file says nothing, copy the closest existing example in the repository: folder structure, file names, names of variables, functions, types and constants, class structure, React components and hooks, styles and CSS class names, i18n keys, exports, tests, demo stories. Add a new kind of file only if the repository already has one like it.

## Testing

**Always run visual (Playwright) tests in Docker. Never run them locally.** Their setup, commands and screenshot rules are in [`demo/AGENTS.md`](demo/AGENTS.md); read it before writing or running a visual test.

Unit tests use Vitest and run with `pnpm test` from the root. Import `describe`, `it`, `expect`, hooks, and `vi` explicitly from `vitest`; globals are disabled.

Test names (`it`, `test`, and parameterized cases) must start with `should `, followed by a base-form verb.

Type contract tests follow the same rules in every package:

- Store them in the package's `tests/types/` directory as `*.types.ts`.
- Check source API contracts with the package's `typecheck` command. Contracts that import the built package may use a separate TypeScript configuration and command, run after a fresh build as part of package tests and CI. This does not require a build in `typecheck`.
- Use explicit type assignments to check result types, methods, and overloads.
- Use `@ts-expect-error` for inputs or assignments that must be rejected. The check must fail if the expected error disappears.
- Keep each contract check in a small function or type alias. These files are checked without execution; runtime behavior belongs in Vitest tests.

## Code style

Prettier owns formatting, ESLint and Stylelint own the rest. One command applies the fixes of all three:

```bash
pnpm fix:lint
```

It covers `*.{js,jsx,mjs,ts,tsx,css,scss}` across the whole repository. Its output lists every file Prettier went through along with the problems that need a human. `pnpm lint` reports the problems alone, without touching files, and is what CI runs on every pull request.

- Never format code by hand, and never reformat lines you did not change.
- Read `git status` after a fix run and commit only the files your change belongs to.
- An `eslint-disable` comment that no longer suppresses anything is an error. Remove it instead of keeping it for safety.
- Use `T[]` for arrays and object shorthand (`{foo}`).
- Use `import type {Foo, Bar} from './foo'` when importing only types. When importing values and types together, mark each type inline (`import {createFoo, type Foo} from './foo'`).
- Where the linter is silent, follow the file you are editing.
- Shared rules live in `infra/linters/`; per-package overrides are in the root `eslint.config.mjs`.

## Styles

- Sizes are written without CSS math functions: `calc()`, `min()`, `max()`, `clamp()`. Change the layout so the value is not needed, or derive it from Sass variables with static values, which Sass computes at build time. A math function stays only where an operand is known at runtime: a percentage, viewport units, `lh`, or a custom property set from script.

## Extensions

An extension `Block` in `packages/editor/src/extensions/` has this layout:

```
Block/
  BlockSpecs/
    index.ts
    const.ts
    BlockSpecs.ts
  BlockNodeView/
    components/
      <React components>
    index.ts
    BlockNodeView.ts
  plugins/
    BlockPlugin/
      index.ts
      plugin.ts
  Block.ts
  index.ts
```

- `Block.ts` holds the extension; every `index.ts` only re-exports.
- `BlockSpecs/` holds the schema, the parser and the serializer; `const.ts` holds node and attribute names. Actions and their names belong to the main extension.
- Specs register a node with three calls: `addNodeSpec()`, `addMarkdownTokenParserSpec()` and `addNodeSerializerSpec()`; a mark with `addMarkSpec()`, `addMarkdownTokenParserSpec()` and `addMarkSerializerSpec()`. A NodeView or a mark view is registered in the main extension with `addNodeView()` or `addMarkView()`.
- A NodeView is a class in `BlockNodeView/`; its React components live in `components/`.
- Class names come from `cn`; element state is a modifier.
- CSS blocks and elements are kebab-case: `.g-md-some-block__some-element`. A NodeView block ends with `-nodeview`.
- A set of named constants is a plain object with `as const`.
- Each field of a public options type has a comment with its behavior and default.
- A markup command lives in its own file in `markup/commands/`. A command that inserts a block calls `replaceOrInsertAfter()` from `packages/editor/src/markup/commands/helpers.ts`; other packages import it as `MarkupHelpers` from `@gravity-ui/markdown-editor`.
- An unused translation key is deleted.
- A markdown-it plugin emits one token stream; extra data goes to `token.meta`.
- A markdown-it plugin only parses. The serializer lives in the extension and writes through `state`.

## Package naming

Published `@gravity-ui/*` packages live directly in `packages/`. The npm name starts with the target (`editor`, `viewer` or `plugin`), and the entity name comes before its kind:

| Package | npm name | Directory |
|---------|----------|-----------|
| Editor extension | `@gravity-ui/markdown-editor-<name>-extension` | `packages/editor-<name>-extension` |
| Viewer extension | `@gravity-ui/markdown-viewer-<name>-extension` | `packages/viewer-<name>-extension` |
| markdown-it plugin | `@gravity-ui/markdown-plugin-<name>` | `packages/plugin-<name>` |

- The directory name is the npm name without the `@gravity-ui/markdown-` prefix.
- Examples: `packages/editor-header-extension` and `packages/plugin-header`.

## Package structure

New editor packages split code by mode:

```
src/
  wysiwyg/
    extensions/
      <Extension>/
  markup/
    commands/
      <command>.ts
  toolbar/
    view/
      items.ts
    wysiwyg/
      items.ts
      presets.ts   # optional
    markup/
      items.ts
      presets.ts   # optional
    items.ts       # both modes
    presets.ts     # both modes, optional
```

Exports in `package.json`:

| Export | Contents |
|--------|----------|
| `.` | Toolbars, WYSIWYG and markup entities |
| `./wysiwyg` | WYSIWYG entities only: extensions, toolbar items without `markup` |
| `./wysiwyg/specs` | WYSIWYG specs only: spec extensions, constants |
| `./wysiwyg/utils` | WYSIWYG utils, optional |
| `./markup` | Markup entities only: CodeMirror commands and extensions, toolbar items without `wysiwyg` |
| `./markup/utils` | Markup utils, optional |
| `./wysiwyg/core` | WYSIWYG core, root editor package only |
| `./pm/*`, `./cm/*` | ProseMirror and CodeMirror re-exports, root editor package only |

## Dependencies

- A package that published code imports at runtime goes to `dependencies`, unless the application provides it.
- A package that the application provides is a peer: React, UIKit, `@gravity-ui/components`, `markdown-it`, Diplodoc packages, and the editor or the viewer that an extension package extends.
- A third-party package used only by the demo goes to `devDependencies` of `demo/package.json`.

## Moving code

- A file moves to another package with `git mv`. `git diff --staged -M --stat` shows it as renamed, not as deleted and added.
- A moved file changes only where the move requires it; other edits go into a separate pull request, so git still detects the rename.

## Imports

- Outside `packages/editor`, a ProseMirror or CodeMirror module re-exported in `packages/editor/src/pm/` or `packages/editor/src/cm/` is imported from `@gravity-ui/markdown-editor/pm/*` or `@gravity-ui/markdown-editor/cm/*`.
- Outside `packages/editor`, an editor module missing from the public API is imported from `@gravity-ui/markdown-editor/_/…`, not copied.
- Inside `packages/editor/src`, ProseMirror and CodeMirror modules come from their own packages, and imports between top-level folders use the `src/` alias.

## Documentation

Project docs live in `docs/`. Read the relevant file before working on the corresponding area:

| When you're working on… | Read |
|--------------------------|------|
| Visual / Playwright tests | [`docs/how-to-add-visual-test.md`](docs/how-to-add-visual-test.md) |
| Creating a new extension | [`docs/how-to-create-extension.md`](docs/how-to-create-extension.md) |
| Core exporters | [`docs/core-exporters.md`](docs/core-exporters.md) |
| Adding Markdown text bindings | [`docs/how-to-add-text-binding-extension-in-markdown.md`](docs/how-to-add-text-binding-extension-in-markdown.md) |
| Customizing toolbars | [`docs/how-to-customize-toolbars.md`](docs/how-to-customize-toolbars.md) |
| Customizing the editor | [`docs/how-to-customize-the-editor.md`](docs/how-to-customize-the-editor.md) |
| Adding preview | [`docs/how-to-add-preview.md`](docs/how-to-add-preview.md) |
| GPT / AI extensions | [`docs/how-to-connect-gpt-extensions.md`](docs/how-to-connect-gpt-extensions.md) |
| Contributing guidelines | [`docs/guidelines-contributions.md`](docs/guidelines-contributions.md) |

## Stack

- TypeScript, React 18
- CodeMirror 6, ProseMirror
- Vitest (unit), Playwright (visual/e2e)
- pnpm + nx monorepo
- Podman / Docker for containerized test runs

## Commits and pull requests

- Base commit messages on the staged diff (amend: the full resulting diff against the original commit's parent), and PR titles/descriptions on the full merge-base-to-head diff against the actual target branch.
- Write commit subjects and PR titles in concise English (B1), using Conventional Commits: `type: result`. Keep body/footer for essential context. Reuse the main commit's subject as the PR title if it describes the whole result.
- Omit scope by default in commits and PR titles. Use it only for a functional area within a package or shared across changed packages; omit it for whole-package changes. Never use a package name, its abbreviation or its directory as scope.
- Explain breaking changes; prefer `feat!:` for breaking features. A `BREAKING CHANGE:` body/footer is allowed with or without `!`. Label PRs with breaking changes `breaking change`, and create or comment on an issue with the same label.
- Publish new PRs as drafts.
- Write PR descriptions in plain English (A2–B1): problem, resulting behavior, limitations, and what tests protect. Reference related issues; use `Fixes #123` only when resolving them. Follow a PR template if provided; keep small PR descriptions to a few sentences. Omit successful checks covered by CI or required by AGENTS.md; report failures. Keep accurate titles/descriptions unchanged.
- Use base branches for PR stacks. Omit stack relationships and merge order from titles/descriptions.
