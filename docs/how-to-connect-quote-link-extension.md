##### Extensions / Quote link extension

## How to Connect the Quote Link Extension in the Editor

The quote link extension is the `@gravity-ui/markdown-editor-quote-link-extension` package. It contains the WYSIWYG extension, the toolbar button and the markup mode command. Starting with version 16, `@gravity-ui/markdown-editor` does not include the quote link extension.

The package requires the following versions:

- @gravity-ui/markdown-editor version 15.47.0 or higher
- @diplodoc/quote-link-extension version 0.1.3 or higher

## Usage

### 1. Install the Packages

```bash
npm install @gravity-ui/markdown-editor
npm install @gravity-ui/markdown-editor-quote-link-extension
npm install @diplodoc/quote-link-extension@^0.1.3
```

### 2. Integrate the Plugin in the Preview

The markup mode preview renders quote links with the Markdown plugin from `@diplodoc/quote-link-extension`:

```ts
import {transform as quoteLink} from '@diplodoc/quote-link-extension';

const plugins: PluginWithParams[] = [quoteLink({bundle: false})];
```

Pass the plugins to the renderer of the preview, see [How to add preview](./how-to-add-preview.md).

### 3. Integrate the WYSIWYG Extension

The `data-quotelink` attribute marks the link of a quote link, so add it to the allowed attributes:

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {QuoteLink} from '@gravity-ui/markdown-editor-quote-link-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) => builder.use(QuoteLink),
    extensionOptions: {
      yfmConfigs: {attrs: {allowedAttributes: ['data-quotelink']}},
    },
  },
});
```

For parsing and serialization without the editor UI, for example in Node.js, use `QuoteLinkSpecs` from `@gravity-ui/markdown-editor-quote-link-extension/wysiwyg/specs`.

### 4. Add Buttons to the Toolbar

Add the button to the [toolbars preset](./how-to-customize-toolbars.md) and pass the preset to `MarkdownEditorView` through the `toolbarsPreset` prop. `toolbarQuoteLinkItem` works in both modes; `/wysiwyg` and `/markup` entry points export the same item for one mode:

```tsx
import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar, defaultPreset} from '@gravity-ui/markdown-editor/toolbars';
import {toolbarQuoteLinkItem} from '@gravity-ui/markdown-editor-quote-link-extension';

const quoteLink = 'quoteLink';

const toolbarsPreset: ToolbarsPreset = {
  items: {
    ...defaultPreset.items,
    [quoteLink]: toolbarQuoteLinkItem,
  },
  orders: {
    ...defaultPreset.orders,
    [Toolbar.wysiwygMain]: [...defaultPreset.orders[Toolbar.wysiwygMain], [quoteLink]],
    [Toolbar.markupMain]: [...defaultPreset.orders[Toolbar.markupMain], [quoteLink]],
  },
};
```

### 5. Migrate from `@gravity-ui/markdown-editor` 15

The entities keep their names, only the import path changes. The full table is in the [package README](https://github.com/gravity-ui/markdown-editor/tree/main/packages/editor-quote-link-extension#migration-from-gravity-uimarkdown-editor).
