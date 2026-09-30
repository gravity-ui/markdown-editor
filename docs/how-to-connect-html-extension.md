##### Extensions / Html block

## How to Connect the HTML Extension in the Editor

To integrate the HTML extensions in your editor, you will use the specified versions of the necessary packages. Here’s a detailed guide:

First to integrate this extension, you need to use the following versions of the packages:

- @gravity-ui/markdown-editor version 15.48.0 or higher
- @diplodoc/html-extension version 1.2.7 or higher

## Usage

### 1. Install the Packages

First, ensure that you have all the necessary packages installed. You can use npm or yarn to add them to your project:

```bash
npm install @gravity-ui/markdown-editor@^15.48.0
npm install @diplodoc/html-extension@^1.2.7
```


### 2. Integrate the Plugin in the Transformer

You will need to import and configure the transformers in your editor setup. Below is an example of how to do this:

```typescript
import { transform as transformHTML } from '@diplodoc/html-extension';

// Define the runtime marker constant
const HTML_RUNTIME = 'html-runtime';

// Configure the plugins in your transformer setup
const plugins: PluginWithParams[] = [
  // Add HTML transformer plugin
  transformHTML({ bundle: false, runtimeJsPath: HTML_RUNTIME }),

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
import type {WithYfmHtmlBlockProps} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml';
import {withYfmHtmlBlock} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml';
import {useEffect, useState} from 'react';

import {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {getYfmHtmlBlockCssVariables} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml/utils';
import {useThemeValue} from '@gravity-ui/uikit';

// HOC
export const YFM_HTML_BLOCK_RUNTIME = 'yfm-html-block';

const YfmStaticView = withYfmHtmlBlock({runtime: YFM_HTML_BLOCK_RUNTIME})(YfmHtml);

const variablesMapping = {
  colorBackground: '--g-color-base-background',
  colorTextPrimary: '--g-color-text-primary',
  colorTextSecondary: '--g-color-text-secondary',
  fontFamily: '--g-font-family-sans',
  fontSize: '--g-text-body-1-font-size',
};

// hooks
export const useYfmHtmlBlockStyles = () => {
  const theme = useThemeValue();
  const [config, setConfig] = useState<IHTMLIFrameElementConfig | undefined>();

  useEffect(() => {
    const bodyStyles = window.getComputedStyle(document.body);

    const styles = Object.entries(variablesMapping).reduce(
      (acc, [key, cssVariable]) => {
        acc[key] = bodyStyles.getPropertyValue(cssVariable);
        return acc;
      },
      {} as Record<string, string>,
    );

    setConfig({
      styles: getYfmHtmlBlockCssVariables(styles),
      classNames: [theme],
      resizePadding: 50,
      resizeDelay: 100,
    });
  }, [theme]);

  return config;
};

// render
const HtmlRenderer = React.forwardRef<HTMLDivElement, HtmlRendererProps>((props, ref) => {
  // ...
  const theme = useThemeType(); // your hook for get theme

  const yfmHtmlBlockConfig = useYfmHtmlBlockStyles();
    () => ({
      theme,
      zoom: {showMenu: true, bindKeys: true, resetOnBlur: true},
    }),
    [theme],
  );

  // ...
  return (
    <div>
      <YfmStaticView
        html={html}
        meta={meta}
        ref={elementRef}
        yfmHtmlBlockConfig={yfmHtmlBlockConfig}
      />
      {props.children}
    </div>
  );
});

```


### 5. Integrate the WYSiWYG Extension

```ts
import {YfmHtmlBlock} from '@gravity-ui/markdown-editor/extensions/yfm/YfmHtmlBlock';

// ...
builder.use(YfmHtmlBlock, { useConfig: useYfmHtmlBlockStyles });

```

### 6. Add Buttons to the Toolbar

Add the button to the [toolbars preset](./how-to-customize-toolbars.md) and pass the preset to `MarkdownEditorView` through the `toolbarsPreset` prop. The example puts the HTML block into the slash menu and extends the built-in `full` preset; the main toolbars come only from the preset, so extend the one matching your editor preset:

```tsx
import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
  ActionName as Action,
  ToolbarName as Toolbar,
  full,
  yfmHtmlBlockItemView,
  yfmHtmlBlockItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';

const toolbarsPreset: ToolbarsPreset = {
  items: {
    ...full.items,
    [Action.htmlBlock]: {view: yfmHtmlBlockItemView, wysiwyg: yfmHtmlBlockItemWysiwyg},
  },
  orders: {
    ...full.orders,
    [Toolbar.wysiwygSlash]: [[...full.orders[Toolbar.wysiwygSlash].flat(), Action.htmlBlock]],
  },
};
```

