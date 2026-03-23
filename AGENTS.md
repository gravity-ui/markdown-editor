# AGENTS.md — gravity-ui/markdown-editor

## Testing

**Always run tests in Docker. Never run them locally.**

### Prerequisites

Start the Podman machine before any test run:

```bash
podman machine start
```

### Commands

| Task | Command |
|------|---------|
| Run visual (Playwright) tests | `pnpm run playwright:docker` (in `demo/`) |
| Update snapshots | `pnpm run playwright:docker:update` |
| Clear test cache | `pnpm run playwright:docker:clear` |
| Show test report | `pnpm run playwright:docker:report` |
| Run from root | `nx playwright:docker @markdown-editor/demo` |
| Run unit tests | `pnpm test` (root) |

### Never use

- `playwright` (local)
- `playwright:watch`
- `playwright:headed`

These run tests outside Docker and produce unreliable results.

## Stack

- TypeScript, React 18
- CodeMirror 6, ProseMirror
- Jest (unit), Playwright (visual/e2e)
- pnpm + nx monorepo
- Podman / Docker for containerized test runs
