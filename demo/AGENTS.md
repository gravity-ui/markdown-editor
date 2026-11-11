# AGENTS.md — demo

Visual (Playwright) tests of all packages live here. The root [`AGENTS.md`](../AGENTS.md) applies as well.

**Always run visual tests in Docker. Never run them locally.**

## Prerequisites

Before each visual test run, start the Podman machine:

```bash
podman machine start
```

> First-time setup (install Podman, init, configure resources) — see [`docs/how-to-add-visual-test.md#setup`](../docs/how-to-add-visual-test.md#setup).

## Commands

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

For more details on filtering and updating snapshots see [`docs/how-to-add-visual-test.md`](../docs/how-to-add-visual-test.md).

## Never use

- `playwright` (local)
- `playwright:watch`
- `playwright:headed`

These run visual tests outside Docker and produce unreliable results.

## Screenshots

- A screenshot of editor content includes the toolbar.
- The viewport width and height fit the content, without empty space around it.
- A popup is captured in the real editor, in the test that opens it. A popup component mounted on its own misses changes in how the editor renders it.
- Each mode gets its own `test()`, without `for` loops. The test name carries the tag of the mode it checks, `@wysiwyg` or `@markup`; a test that switches modes carries both. The tag is part of the screenshot file name, so renaming a test renames its screenshots.
- Locators and actions for a block live in its class, not in the test file. A block of `packages/editor` has its class in `demo/tests/playwright/core/editor.ts`; a block of an extension package has its class and fixture in `demo/tests/playwright/core/extensions/<block>.ts`.
- Logic repeated across visual tests, such as waiting for a tooltip to hide, is a helper in `demo/tests/visual-tests/utils/`.

## Stories

- A story renders the editor inside `PlaygroundLayout`.
- Usage examples live in `demo/src/stories/examples/`.
