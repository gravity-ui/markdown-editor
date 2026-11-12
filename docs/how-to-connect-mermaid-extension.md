##### Extensions / Mermaid Extension

## How to Connect the Mermaid Extension in the Editor

The Mermaid extension is the `@gravity-ui/markdown-editor-mermaid-extension` package. It contains the WYSIWYG extension, the toolbar button, the markup mode command and the HOC for the static render. Starting with version 16, `@gravity-ui/markdown-editor` does not include Mermaid.

The package requires the following versions:

- @gravity-ui/markdown-editor version 15.47.0 or higher
- @diplodoc/mermaid-extension version 1.2.3 or higher

## Usage

### 1. Install the Packages

First, ensure that you have all the necessary packages installed. You can use npm or yarn to add them to your project:

```bash
npm install @gravity-ui/markdown-editor
npm install @gravity-ui/markdown-editor-mermaid-extension
npm install @diplodoc/mermaid-extension@^1.2.3
```


### 2. Integrate the Plugin in the Transformer

You will need to import and configure the transformers in your editor setup. Below is an example of how to do this:

```typescript
import { transform as transformMermaid } from '@diplodoc/mermaid-extension';

// Define the runtime marker constant
const MERMAID_RUNTIME = 'mermaid-runtime';

// Configure the plugins in your transformer setup
const plugins: PluginWithParams[] = [
  // Add Mermaid transformer plugin
  transformMermaid({ bundle: false, runtime: MERMAID_RUNTIME }),

  // Add other plugins as needed
];
```

### 3. Integrate into Editor

Ensure that these plugins are integrated into your editor's initialization or configuration file. Below is a simplified example to illustrate how you might set them up with a markdown editor:

```ts
const editor = new MarkdownEditor({
  // Editor configuration
  plugins,
  // Other configurations
});
```

### 4. Adding a Higher-Order Component (HOC) in Static Render to Load Runtime and Apply Styling Hooks

```ts
import {useEffect, useMemo} from 'react';

import {YfmHtml} from '@gravity-ui/markdown-editor/view/components/YfmHtml';
import {type MermaidConfig, withMermaid} from '@gravity-ui/markdown-editor-mermaid-extension/view';
import {useThemeType} from '@gravity-ui/uikit';

// HOC
export const MERMAID_RUNTIME = 'mermaid';

const YfmStaticView = withMermaid({runtime: MERMAID_RUNTIME})(YfmHtml);

// hooks
export const useMermaidTheme = () => {
  const theme = useThemeType();

  useEffect(() => {
    window.mermaidJsonp = window.mermaidJsonp || [];

    window.mermaidJsonp.push((m: {initialize: (opts: {theme: string}) => void}) => {
      m.initialize({theme: theme === 'dark' ? 'dark' : 'default'});
    });
  }, [theme]);

  return theme;
};

// render
const HtmlRenderer = React.forwardRef<HTMLDivElement, HtmlRendererProps>((props, ref) => {
  // ...
  const theme = useThemeType(); // your hook for get theme

  const mermaidConfig = useMemo<MermaidConfig>(
    () => ({
      theme,
      zoom: {showMenu: true, bindKeys: true, resetOnBlur: true},
    }),
    [theme],
  );

  useMermaidTheme();

  // ...
  return (
    <div>
      <YfmStaticView
        html={html}
        meta={meta}
        ref={elementRef}
        mermaidConfig={mermaidConfig}

      />
      {props.children}
    </div>
  );
});

```


### 5. Integrate the WYSiWYG Extension

```ts
import {Mermaid} from '@gravity-ui/markdown-editor-mermaid-extension';

// ...
builder.use(Mermaid, {
  loadRuntimeScript: () => {
    import('@diplodoc/mermaid-extension/runtime');
  },
});
```

### 6. Add Buttons to the Toolbar

Add the button to the [toolbars preset](./how-to-customize-toolbars.md) and pass the preset to `MarkdownEditorView` through the `toolbarsPreset` prop. The example puts the diagram into the slash menu and extends the built-in `full` preset; the main toolbars come only from the preset, so extend the one matching your editor preset. `toolbarMermaidItem` works in both modes; `/wysiwyg` and `/markup` entry points export the same item for one mode:

```tsx
import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar, full} from '@gravity-ui/markdown-editor/toolbars';
import {toolbarMermaidItem} from '@gravity-ui/markdown-editor-mermaid-extension';

const mermaid = 'mermaid';

const toolbarsPreset: ToolbarsPreset = {
  items: {
    ...full.items,
    [mermaid]: toolbarMermaidItem,
  },
  orders: {
    ...full.orders,
    [Toolbar.wysiwygSlash]: [[...full.orders[Toolbar.wysiwygSlash].flat(), mermaid]],
  },
};
```

### 7. Migrate from `@gravity-ui/markdown-editor` 15

The entities keep their names, only the import path changes. The full table is in the [package README](https://github.com/gravity-ui/markdown-editor/tree/main/packages/editor-mermaid-extension#migration-from-gravity-uimarkdown-editor).

