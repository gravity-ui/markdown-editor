# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

@gravity-ui/markdown-editor is a React-based markdown editor component that combines WYSIWYG and Markup modes. It uses ProseMirror for rich text editing and CodeMirror for markup editing. Supports standard Markdown and YFM (Yandex Flavored Markdown) syntax.

## Common Commands

```bash
npm start              # Start Storybook dev server (port 8888)
npm run build          # Build for production
npm run typecheck      # TypeScript type checking
npm run lint           # Run all linters (ESLint, Stylelint, Prettier)
npm test               # Run Jest unit tests
npm run test:watch     # Run tests in watch mode
npm run playwright     # Run Playwright E2E tests
```

## Architecture

### Core Modules (`/src`)

- **`/bundle`** - High-level React API
  - `useMarkdownEditor()` hook creates editor instance
  - `MarkdownEditorView` component renders the editor
  - `/config` contains toolbar and preset configurations

- **`/core`** - Core editor engine
  - `Editor.ts` - WysiwygEditor class (ProseMirror-based)
  - `ContentHandler.ts` - Markdown serialization/deserialization
  - `ExtensionBuilder.ts` / `ExtensionsManager.ts` - Extension system

- **`/extensions`** - Built-in extensions organized by category
  - `/base` - Base extension implementations
  - `/markdown` - Standard markdown features (headings, lists, code blocks, tables)
  - `/yfm` - YFM-specific features (alerts, tabs, notes)
  - `/behavior` - Editor behaviors (history, links, images)

- **`/pm`** - ProseMirror abstraction layer (re-exports prosemirror-* modules)
- **`/cm`** - CodeMirror 6 abstraction layer (re-exports @codemirror/* modules)

- **`/presets`** - Editor configurations: `default`, `full`, `yfm`, `commonmark`, `zero`

- **`/toolbar`** - Toolbar UI components
- **`/forms`** - Dialog/form components for links, images, files
- **`/view`** - React view layer (components, hooks, HOCs)

### Package Exports

The package provides subpath exports for tree-shaking:
- `@gravity-ui/markdown-editor` - Main bundle
- `@gravity-ui/markdown-editor/core` - Core engine only
- `@gravity-ui/markdown-editor/extensions` - Extension system
- `@gravity-ui/markdown-editor/view` - React components
- `@gravity-ui/markdown-editor/cm/*` - CodeMirror utilities
- `@gravity-ui/markdown-editor/pm/*` - ProseMirror utilities

### Editor Modes

- **WYSIWYG**: ProseMirror-based rich editing
- **Markup**: CodeMirror-based raw markdown editing
- **Split**: Both modes side-by-side with synchronized content

### Basic Usage Pattern

```tsx
import {useMarkdownEditor, MarkdownEditorView} from '@gravity-ui/markdown-editor';

function Editor() {
  const editor = useMarkdownEditor({allowHTML: false});
  return <MarkdownEditorView editor={editor} />;
}
```

## Tech Stack

- React 16-19, TypeScript, SCSS
- ProseMirror (WYSIWYG), CodeMirror 6 (Markup)
- markdown-it (parsing), @gravity-ui/* UI components
- Jest (unit tests), Playwright (E2E tests)
- Gulp (build), Storybook (development/docs)
