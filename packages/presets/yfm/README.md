# @gravity-ui/markdown-editor-preset-yfm

YFM (Yandex Flavored Markdown) preset for Gravity UI Markdown Editor.

## Description

This preset includes all YFM extensions:

- **YfmCut** - collapsible content blocks
- **YfmTabs** - tabbed content
- **YfmNote** - note/warning/tip blocks
- **YfmTable** - enhanced tables
- **YfmHeading** - headings with anchors
- **YfmFile** - file attachments
- **Checkbox** - interactive checkboxes
- **Emoji** - emoji support
- And more...

## Installation

```bash
npm install @gravity-ui/markdown-editor-preset-yfm
# or
pnpm add @gravity-ui/markdown-editor-preset-yfm
```

## Usage

```typescript
import {useMarkdownEditor} from '@gravity-ui/markdown-editor-core';
import {yfmPreset} from '@gravity-ui/markdown-editor-preset-yfm';

const editor = useMarkdownEditor({
  extensions: (builder) => builder.use(yfmPreset),
});
```

## Peer Dependencies

- `@gravity-ui/markdown-editor-core` workspace:^
- `@diplodoc/cut-extension` ^0.5.0 || ^0.6.1 || ^0.7.1 || ^1.0.0
- `@diplodoc/tabs-extension` ^3.5.1
- `@diplodoc/transform` ^4.43.0
- `react` ^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0
- `react-dom` ^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0

