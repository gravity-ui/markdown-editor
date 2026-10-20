##### Extensions / Latex extension

## How to Connect the Latex Extension in the Editor

To integrate the LaTeX extension in your editor, you will use the specified versions of the necessary packages. Here’s a detailed guide:

First to integrate this extension, you need to use the following versions of the packages:

- @gravity-ui/markdown-editor version 15.48.0 or higher
- @diplodoc/latex-extension version 1.1.0 or higher

## Usage

### 1. Install the Packages

First, ensure that you have all the necessary packages installed. You can use npm or yarn to add them to your project:

```bash
npm install @gravity-ui/markdown-editor@^15.48.0
npm install @diplodoc/latex-extension@^1.1.0
```


### 2. Integrate the Plugin in the Transformer

You will need to import and configure the transformers in your editor setup. Below is an example of how to do this:

```typescript
import { transform as transformLatex } from '@diplodoc/latex-extension';

// Define the runtime marker constant
const LATEX_RUNTIME = 'latex-runtime';

// Configure the plugins in your transformer setup
const plugins: PluginWithParams[] = [
  // Add LaTeX transformer plugin
  transformLatex({ bundle: false, runtime: LATEX_RUNTIME }),

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
import {useEffect} from 'react';

import {YfmHtml} from '@gravity-ui/markdown-editor/view/components/YfmHtml';
import {useEffect, useState} from 'react';

import {useThemeValue} from '@gravity-ui/uikit';

// HOC
export const LATEX_RUNTIME = 'latex';

const YfmStaticView = withLatex({runtime: LATEX_RUNTIME})(YfmHtml);

// render
const HtmlRenderer = React.forwardRef<HTMLDivElement, HtmlRendererProps>((props, ref) => {
  // ...
  const theme = useThemeType(); // your hook for get theme

  // ...
  return (
    <div>
      <YfmStaticView
        html={html}
        meta={meta}
        ref={elementRef}
      />
      {props.children}
    </div>
  );
});

```


### 5. Integrate the WYSiWYG Extension

```ts
import {Math} from '@gravity-ui/markdown-editor/extensions/yfm/Math';

// ...
builder.use(Math, {
  loadRuntimeScript: () => {
    import('@diplodoc/latex-extension/runtime');
    // @ts-expect-error no types for styles
    import('@diplodoc/latex-extension/runtime/styles');
  },
});
```

### 6. Add Buttons to the Toolbar

Add the buttons to the [toolbars preset](./how-to-customize-toolbars.md) and pass the preset to `MarkdownEditorView` through the `toolbarsPreset` prop. The example puts both formulas into the slash menu and extends the built-in `full` preset; the main toolbars come only from the preset, so extend the one matching your editor preset:

```tsx
import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
  ActionName as Action,
  ToolbarName as Toolbar,
  full,
  mathBlockItemView,
  mathBlockItemWysiwyg,
  mathInlineItemView,
  mathInlineItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';

const toolbarsPreset: ToolbarsPreset = {
  items: {
    ...full.items,
    [Action.mathInline]: {view: mathInlineItemView, wysiwyg: mathInlineItemWysiwyg},
    [Action.mathBlock]: {view: mathBlockItemView, wysiwyg: mathBlockItemWysiwyg},
  },
  orders: {
    ...full.orders,
    [Toolbar.wysiwygSlash]: [
      [...full.orders[Toolbar.wysiwygSlash].flat(), Action.mathInline, Action.mathBlock],
    ],
  },
};
```

