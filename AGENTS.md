# AGENTS.md — gravity-ui/markdown-editor

## Testing

**Always run visual (Playwright) tests in Docker. Never run them locally.**

Unit tests use Vitest. Import `describe`, `it`, `expect`, hooks, and `vi` explicitly from `vitest`; globals are disabled.

Test names (`it`, `test`, and parameterized cases) must start with `should `, followed by a base-form verb.

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

## Code style

Prettier owns formatting, ESLint owns the rest. Both apply their fixes from one command:

```bash
pnpm fix
```

Run it after editing code; what it prints is what it could not fix.

- Never format code by hand, and never reformat lines you did not change.
- `pnpm fix` walks the whole repository — commit only the files your change belongs to.
- Write code the way the linter wants it from the start: `T[]` instead of `Array<T>`, object shorthand (`{foo}` instead of `{foo: foo}`), inline type imports (`import {type Foo} from './foo'`).
- Where the linter is silent, follow the file you are editing.
- Shared rules live in `infra/linters/`; per-package overrides are in the root `eslint.config.mjs`.

## Documentation

Project docs live in `docs/`. Read the relevant file before working on the corresponding area:

| When you're working on… | Read |
|--------------------------|------|
| Visual / Playwright tests | [`docs/how-to-add-visual-test.md`](docs/how-to-add-visual-test.md) |
| Creating a new extension | [`docs/how-to-create-extension.md`](docs/how-to-create-extension.md) |
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
