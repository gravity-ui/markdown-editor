# AGENTS.md — demo

Visual (Playwright) tests live in `tests/visual-tests/`. Commands run in `demo/`.

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
| Run visual (Playwright) tests | `pnpm run playwright:docker` |
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
- Each mode gets its own `test()` with the mode tag (`@wysiwyg`, `@markup`) in its name, without `for` loops.
- Locators and actions for a block live in its class in `tests/playwright/core/editor.ts`, not in the test file.
