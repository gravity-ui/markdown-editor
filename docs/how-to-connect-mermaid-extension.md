##### Extensions / Mermaid Extension

## How to Connect the Mermaid Extension in the Editor

Mermaid support is shipped as a separate package, `@gravity-ui/markdown-editor-mermaid-extension`. It adds the WYSIWYG node, the toolbar buttons, the markup mode command and the static render HOC.

Requires `@gravity-ui/markdown-editor` 15.48.2 or higher. The editor no longer includes mermaid starting with version 16.

## Usage

### 1. Install the Packages

```bash
npm install @gravity-ui/markdown-editor-mermaid-extension
npm install @gravity-ui/markdown-editor @gravity-ui/uikit @diplodoc/mermaid-extension markdown-it react react-dom
```

### 2. Integrate the Plugin in the Transformer

The Markdown plugin comes from `@diplodoc/mermaid-extension` and is configured in the transformer:

```typescript
import {transform as transformMermaid} from '@diplodoc/mermaid-extension';

// Runtime marker, shared with the static render HOC
export const MERMAID_RUNTIME = 'extension:mermaid';

const plugins: PluginWithParams[] = [
  transformMermaid({bundle: false, runtime: MERMAID_RUNTIME}),

  // Add other plugins as needed
];
```

### 3. Add a Higher-Order Component (HOC) to the Static Render

The HOC loads the runtime script and renders the diagrams outside the editor, in split mode and in read-only preview.

```tsx
import {useEffect, useMemo} from 'react';

import {YfmStaticView} from '@gravity-ui/markdown-editor/view/components/YfmHtml';
import {
  type MermaidConfig,
  withMermaid,
} from '@gravity-ui/markdown-editor-mermaid-extension/view';
import {useThemeType} from '@gravity-ui/uikit';

const Preview = withMermaid({runtime: MERMAID_RUNTIME})(YfmStaticView);

// Keeps the diagram theme in sync with the editor theme
const useMermaidTheme = () => {
  const theme = useThemeType();

  useEffect(() => {
    window.mermaidJsonp = window.mermaidJsonp || [];

    window.mermaidJsonp.push((m: {initialize: (opts: {theme: string}) => void}) => {
      m.initialize({theme: theme === 'dark' ? 'dark' : 'default'});
    });
  }, [theme]);

  return theme;
};

const HtmlRenderer = ({html, meta}: HtmlRendererProps) => {
  const theme = useMermaidTheme();

  const mermaidConfig = useMemo<MermaidConfig>(
    () => ({
      theme,
      zoom: {showMenu: true, bindKeys: true, resetOnBlur: true},
    }),
    [theme],
  );

  return <Preview html={html} meta={meta} mermaidConfig={mermaidConfig} />;
};
```

### 4. Integrate the WYSIWYG Extension

```ts
import {MermaidExtension} from '@gravity-ui/markdown-editor-mermaid-extension';

// ...
builder.use(MermaidExtension, {
  loadRuntimeScript: () => {
    import('@diplodoc/mermaid-extension/runtime');
  },
  autoSave: {enabled: true, delay: 1000},
  theme: {dark: 'dark', light: 'forest'},
});
```

### 5. Add Buttons to the Toolbar

Add the button to the [toolbars preset](./how-to-customize-toolbars.md) and pass the preset to `MarkdownEditorView` through the `toolbarsPreset` prop. The example puts the diagram into the slash menu and extends the built-in `full` preset; the main toolbars come only from the preset, so extend the one matching your editor preset:

```tsx
import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar, full} from '@gravity-ui/markdown-editor/toolbars';
import {
  mermaidItemView,
  mermaidItemWysiwyg,
} from '@gravity-ui/markdown-editor-mermaid-extension/configs';

const mermaid = 'mermaid';

const toolbarsPreset: ToolbarsPreset = {
  items: {
    ...full.items,
    [mermaid]: {view: mermaidItemView, wysiwyg: mermaidItemWysiwyg},
  },
  orders: {
    ...full.orders,
    [Toolbar.wysiwygSlash]: [[...full.orders[Toolbar.wysiwygSlash].flat(), mermaid]],
  },
};
```

In markup mode the button runs `mermaidItemMarkup` from the same entry point.
