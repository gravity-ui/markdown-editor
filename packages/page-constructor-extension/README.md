# @gravity-ui/markdown-editor-page-constructor-extension

Page Constructor extension for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor).

Provides a WYSIWYG editing experience for [Page Constructor](https://github.com/gravity-ui/page-constructor) blocks inside the Markdown editor, as well as a preview HOC for split-mode rendering.

## Installation

```bash
npm install @gravity-ui/markdown-editor-page-constructor-extension
```

### Required peer dependencies

```bash
npm install @gravity-ui/markdown-editor @gravity-ui/uikit @gravity-ui/icons @gravity-ui/page-constructor @diplodoc/page-constructor-extension react react-dom react-error-boundary
```

## Usage

### WYSIWYG extension

```typescript
import {YfmPageConstructor} from '@gravity-ui/markdown-editor-page-constructor-extension';

builder.use(YfmPageConstructor, {
    autoSave: {enabled: true, delay: 1000},
});
```

### Toolbar button

```typescript
import {wYfmPageConstructorItemData} from '@gravity-ui/markdown-editor-page-constructor-extension/configs';
```

### Split-mode preview HOC

```typescript
import {withYfmPageConstructor} from '@gravity-ui/markdown-editor-page-constructor-extension/view';

const Preview = withYfmPageConstructor()(YfmStaticView);
```

## License

MIT
