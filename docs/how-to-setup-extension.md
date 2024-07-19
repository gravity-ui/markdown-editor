To integrate the Mermaid, LaTeX, and HTML extensions in your editor, you will use the specified versions of the necessary packages. Here’s a detailed guide:

## How to Integrate the Mermaid, Latex, HTML Extensions in the Editor

To integrate these extensions, you need to use the following versions of the packages:

- @gravity-ui/markdown-editor version 13.4.0 or higher
- @diplodoc/html-extension version 1.2.7 or higher
- @diplodoc/mermaid-extension version 1.2.3 or higher
- @diplodoc/latex-extension version 1.1.0 or higher

## Usage

### 1. Install the Packages

First, ensure that you have all the necessary packages installed. You can use npm or yarn to add them to your project:

```bash
npm install @gravity-ui/markdown-editor@^13.4.0
npm install @diplodoc/html-extension@^1.2.7
npm install @diplodoc/mermaid-extension@^1.2.3
npm install @diplodoc/latex-extension@^1.1.0
```


### 2. Integrate the Plugin in the Transformer

You will need to import and configure the transformers in your editor setup. Below is an example of how to do this:

```typescript
import { transform as transformHTML } from '@diplodoc/html-extension';
import { transform as transformMermaid } from '@diplodoc/mermaid-extension';
import { transform as transformLatex } from '@diplodoc/latex-extension';

// Define the runtime marker constant
const HTML_RUNTIME = 'html-runtime';
const LATEX_RUNTIME = 'latex-runtime';
const MERMAID_RUNTIME = 'mermaid-runtime';

// Configure the plugins in your transformer setup
const plugins: PluginWithParams[] = [
  // Add HTML transformer plugin
  transformHTML({ bundle: false, runtimeJsPath: HTML_RUNTIME }),

  // Add Mermaid transformer plugin
  transformMermaid({ bundle: false, runtime: MERMAID_RUNTIME }),

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
import type {WithYfmHtmlBlockProps} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml';
import {withYfmHtmlBlock} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml';
import {useEffect, useState} from 'react';

import {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {getYfmHtmlBlockCssVariables} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml/utils';
import {useThemeValue} from '@gravity-ui/uikit';

// HOC
export const LATEX_RUNTIME = 'latex';
export const MERMAID_RUNTIME = 'mermaid';
export const YFM_HTML_BLOCK_RUNTIME = 'yfm-html-block';

const YfmStaticView = withLatex({runtime: LATEX_RUNTIME})(
  withMermaid({runtime: MERMAID_RUNTIME})(
    withYfmHtmlBlock({runtime: YFM_HTML_BLOCK_RUNTIME})(YfmHtml),
  ),
);

const variablesMapping = {
  colorBackground: '--g-color-base-background',
  colorTextPrimary: '--g-color-text-primary',
  colorTextSecondary: '--g-color-text-secondary',
  fontFamily: '--g-font-family-sans',
  fontSize: '--g-text-body-1-font-size',
};

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
        yfmHtmlBlockConfig={yfmHtmlBlockConfig}
        mermaidConfig={mermaidConfig}

      />
      {props.children}
    </div>
  );
});

```


### 5. Integrate the WYSiWYG Extension

```ts
import { YfmHtmlBlock } from '@gravity-ui/markdown-editor/extensions/yfm/YfmHtmlBlock';
import {Math} from '@gravity-ui/markdown-editor/extensions/yfm/Math';
import {Mermaid} from '@gravity-ui/markdown-editor/extensions/yfm/Mermaid';

// ...
builder.use(YfmHtmlBlock, { useConfig: useYfmHtmlBlockStyles });

builder.use(Mermaid, {
  loadRuntimeScript: () => {
    import('@diplodoc/mermaid-extension/runtime');
  },
});

builder.use(Math, {
  loadRuntimeScript: () => {
    import('@diplodoc/latex-extension/runtime');
    // @ts-expect-error no types for styles
    import('@diplodoc/latex-extension/runtime/styles');
  },
});
```

### 5. Add Buttons to the Toolbar

```ts
import {
  mMathListItem,
  mMermaidButton,
  mYfmHtmlBlockButton,
} from '@gravity-ui/markdown-editor/bundle/config/markup';

import {
  wMathBlockItemData,
  wMathInlineItemData,
  wMermaidItemData,
  wYfmHtmlBlockItemData,
} from '@gravity-ui/markdown-editor';
// ...

```


