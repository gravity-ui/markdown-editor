# @gravity-ui/markdown-editor-core

Core package for Gravity UI Markdown Editor.

## Description

This package contains the core editor functionality:

- `ExtensionsManager` - manages editor extensions
- Editor views (markup and wysiwyg modes)
- Base types and utilities

## Installation

```bash
npm install @gravity-ui/markdown-editor-core
# or
pnpm add @gravity-ui/markdown-editor-core
```

## Usage

```typescript
import {ExtensionsManager} from '@gravity-ui/markdown-editor-core';

const manager = new ExtensionsManager({
  extensions: (builder) => {
    // Add your extensions here
  },
});
```

## Peer Dependencies

- `react` ^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0
- `react-dom` ^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0

