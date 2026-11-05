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

- A screenshot shows the editor together with its toolbar: call `expectScreenshot()` without `component`, or pass a locator that contains the toolbar.
- Fit the frame to the content with the page size, as in `playground/Headings.visual.test.tsx`: the `width` and `style` props of `Playground` and `page.setViewportSize({height, width})`.

## Extensions

Follow the layout of neighbouring extensions, such as `Mermaid` and `YfmCut`.

- Specs live in a `<Name>Specs/` folder. A small spec fits in `index.ts` (`YfmFileSpecs`); a larger one is split into `const.ts`, `schema.ts`, `parser.ts`, `serializer.ts` and `index.ts` (`YfmCutSpecs`).
- A NodeView is a class that implements `NodeView` from `prosemirror-view`. It lives in a `<Name>NodeView/` folder with `NodeView.tsx` and `index.ts` (`WMermaidNodeView`, `WYfmPageConstructorNodeView`) and is registered with `builder.addNodeView`.
- Class names come from `cn`: `src/classname` inside `packages/editor`, `@gravity-ui/markdown-editor` in other packages. Element state is a `cn` modifier, and styles select it by the modifier class.

### markdown-it plugins

- A plugin emits one token stream: the same token types in the same order for every input it accepts, such as `<name>_open` and `<name>_close`. Other token types appear only when the task requires them.
- Extra data for the editor goes to `token.meta`, and the parser spec reads it in `getAttrs`: `token.meta?.headerRows` in `YfmTableSpecs/parser.ts`, `token.meta?.folding` in `YfmHeadingSpecs/index.ts`.
- The plugin only parses Markdown. Serialization belongs to the editor extension, `<Name>Specs/serializer.ts`, and writes through `state`: `write`, `ensureNewLine`, `renderContent`, `closeBlock` (`YfmCutSpecs/serializer.ts`).

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
