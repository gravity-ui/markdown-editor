# @gravity-ui/markdown-editor-mermaid-extension &middot; [![npm package](https://img.shields.io/npm/v/@gravity-ui/markdown-editor-mermaid-extension)](https://www.npmjs.com/package/@gravity-ui/markdown-editor-mermaid-extension)

Mermaid extension for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor). Adds editing and rendering of Mermaid diagrams written in fenced `mermaid` code blocks.

Requires `@gravity-ui/markdown-editor` 15.48.2 or higher. The editor no longer includes mermaid starting with version 16.

## Installation

```bash
npm install @gravity-ui/markdown-editor-mermaid-extension
```

### Required peer dependencies

```bash
npm install @gravity-ui/markdown-editor @gravity-ui/uikit @diplodoc/mermaid-extension markdown-it react react-dom
```

`mermaid` is an optional peer dependency, needed only for the types of the `theme` option.

## Usage

### WYSIWYG extension

```typescript
import {MermaidExtension} from '@gravity-ui/markdown-editor-mermaid-extension';

builder.use(MermaidExtension, {
    loadRuntimeScript: () => {
        import('@diplodoc/mermaid-extension/runtime');
    },
    autoSave: {enabled: true, delay: 1000},
    theme: {dark: 'dark', light: 'forest'},
});
```

### Toolbar button

```typescript
import {ToolbarName} from '@gravity-ui/markdown-editor/toolbars';
import {
    mermaidItemMarkup,
    mermaidItemView,
    mermaidItemWysiwyg,
} from '@gravity-ui/markdown-editor-mermaid-extension/configs';

const mermaid = 'mermaid';

const toolbarsPreset = {
    items: {
        [mermaid]: {
            view: mermaidItemView,
            wysiwyg: mermaidItemWysiwyg,
            markup: mermaidItemMarkup,
        },
    },
    orders: {
        [ToolbarName.wysiwygSlash]: [[mermaid]],
    },
};
```

### Markup mode command

```typescript
import {insertMermaidDiagram} from '@gravity-ui/markdown-editor-mermaid-extension/configs';
```

### Static render HOC

```typescript
import {withMermaid} from '@gravity-ui/markdown-editor-mermaid-extension/view';

const MERMAID_RUNTIME = 'extension:mermaid';

const Preview = withMermaid({runtime: MERMAID_RUNTIME})(YfmStaticView);
```

### Markdown specs only

```typescript
import {MermaidSpecsExtension} from '@gravity-ui/markdown-editor-mermaid-extension/specs';

builder.use(MermaidSpecsExtension, {});
```

## License

MIT
