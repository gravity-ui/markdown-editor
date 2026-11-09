# AGENTS.md — gravity-ui/markdown-editor

## Testing

**Always run visual (Playwright) tests in Docker. Never run them locally.**

Unit tests use Vitest. Import `describe`, `it`, `expect`, hooks, and `vi` explicitly from `vitest`; globals are disabled.

Test names (`it`, `test`, and parameterized cases) must start with `should `, followed by a base-form verb.

Type contract tests follow the same rules in every package:

- Store them in the package's `tests/types/` directory as `*.types.ts`.
- Include them in the package's TypeScript configuration and check them with its `typecheck` command. Vitest does not run these files.
- Use explicit type assignments to check result types, methods, and overloads.
- Use `@ts-expect-error` for inputs or assignments that must be rejected. The check must fail if the expected error disappears.
- Keep each contract check in a small function or type alias. These files are checked without execution; runtime behavior belongs in Vitest tests.

### Prerequisites

Before each visual test run, start the Podman machine:

```bash
podman machine start
```

> First-time setup (install Podman, init, configure resources) — see [`docs/how-to-add-visual-test.md#setup`](docs/how-to-add-visual-test.md#setup).

### Commands

| Task | Command |
|------|---------|
| Run visual (Playwright) tests | `pnpm run playwright:docker` (in `demo/`) |
| Run specific test | `pnpm run playwright:docker --grep 'Test name'` |
| Update all snapshots | `pnpm run playwright:docker:update` |
| Update specific snapshot | `pnpm run playwright:docker:update --grep 'Test name'` |
| Update only failed snapshots | `pnpm run playwright:docker:update --last-failed` |
| Clear test cache | `pnpm run playwright:docker:clear` |
| Show test report | `pnpm run playwright:docker:report` |
| Run from root | `nx playwright:docker @markdown-editor/demo` |
| Run unit tests | `pnpm test` (root) |

For more details on filtering and updating snapshots see [`docs/how-to-add-visual-test.md`](docs/how-to-add-visual-test.md).

### Never use

- `playwright` (local)
- `playwright:watch`
- `playwright:headed`

These run visual tests outside Docker and produce unreliable results.

### Screenshots

- A screenshot of editor content includes the toolbar.
- The viewport width and height fit the content, without empty space around it.
- A popup is captured in the real editor, in the test that opens it. A popup component mounted on its own misses changes in how the editor renders it.
- Each mode gets its own `test()` with the mode tag (`@wysiwyg`, `@markup`) in its name, without `for` loops.
- Locators and actions for a block live in its class in `demo/tests/playwright/core/editor.ts`, not in the test file.

## Code style

Prettier owns formatting, ESLint and Stylelint own the rest. One command applies the fixes of all three:

```bash
pnpm fix:lint
```

It covers `*.{js,jsx,mjs,ts,tsx,css,scss}` across the whole repository. Its output lists every file Prettier went through along with the problems that need a human. `pnpm lint` reports the problems alone, without touching files, and is what CI runs on every pull request.

- Never format code by hand, and never reformat lines you did not change.
- Read `git status` after a fix run and commit only the files your change belongs to.
- An `eslint-disable` comment that no longer suppresses anything is an error. Remove it instead of keeping it for safety.
- Write code the way the linter wants it from the start: `T[]` instead of `Array<T>`, object shorthand (`{foo}` instead of `{foo: foo}`), inline type imports (`import {type Foo} from './foo'`).
- Where the linter is silent, follow the file you are editing.
- Shared rules live in `infra/linters/`; per-package overrides are in the root `eslint.config.mjs`.

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
- `BlockSpecs/` holds the schema, the parser and the serializer; `const.ts` holds node and attribute names.
- A NodeView is a class in `BlockNodeView/`; its React components live in `components/`.
- Class names come from `cn`; element state is a modifier.
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

Editor packages split code by mode:

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
