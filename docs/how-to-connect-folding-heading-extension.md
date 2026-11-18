##### Extensions / Folding heading extension

## How to Connect the Folding Heading Extension in the Editor

The folding heading extension is the `@gravity-ui/markdown-editor-folding-heading-extension` package. It contains the WYSIWYG extension and the toolbar button. Starting with version 16, `@gravity-ui/markdown-editor` does not include the folding heading extension.

The package requires the following versions:

- @gravity-ui/markdown-editor version 15.47.0 or higher
- @diplodoc/folding-headings-extension version 0.1.0 or higher

## Usage

### 1. Install the Packages

```bash
npm install @gravity-ui/markdown-editor
npm install @gravity-ui/markdown-editor-folding-heading-extension
npm install @diplodoc/folding-headings-extension
```

### 2. Integrate the Plugin in the Preview

The markup mode preview renders folding headings with the Markdown plugin from `@diplodoc/folding-headings-extension`. The runtime and its styles collapse and expand the sections:

```ts
import {transform as foldingHeadings} from '@diplodoc/folding-headings-extension';
import '@diplodoc/folding-headings-extension/runtime';
import '@diplodoc/folding-headings-extension/runtime/styles.css';

const plugins: PluginWithParams[] = [foldingHeadings({bundle: false})];
```

Pass the plugins to the renderer of the preview, see [How to add preview](./how-to-add-preview.md).

### 3. Integrate the WYSIWYG Extension

`FoldingHeading` extends the heading of `YfmHeading`, so add it after the editor preset:

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {FoldingHeading} from '@gravity-ui/markdown-editor-folding-heading-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) => builder.use(FoldingHeading),
  },
});
```

For parsing and serialization without the editor UI, for example in Node.js, use `FoldingHeadingSpecs` from `@gravity-ui/markdown-editor-folding-heading-extension/wysiwyg/specs` after `YfmHeadingSpecs`.

### 4. Add the Button to the Toolbar

The button turns the heading under the cursor into a folding heading and back. Add it to the selection toolbar of the [toolbars preset](./how-to-customize-toolbars.md) and pass the preset to `MarkdownEditorView` through the `toolbarsPreset` prop:

```tsx
import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
  ActionName as Action,
  ToolbarName as Toolbar,
  full,
} from '@gravity-ui/markdown-editor/toolbars';
import {toolbarFoldingHeadingItem} from '@gravity-ui/markdown-editor-folding-heading-extension';

const foldingHeading = 'foldingHeading';

const toolbarsPreset: ToolbarsPreset = {
  items: {
    ...full.items,
    [foldingHeading]: toolbarFoldingHeadingItem,
  },
  orders: {
    ...full.orders,
    [Toolbar.wysiwygSelection]: [
      [foldingHeading, Action.text],
      ...full.orders[Toolbar.wysiwygSelection].slice(1),
    ],
  },
};
```

### 5. Migrate from `@gravity-ui/markdown-editor` 15

The entities keep their names, only the import path changes. The full table is in the [package README](https://github.com/gravity-ui/markdown-editor/tree/main/packages/editor-folding-heading-extension#migration-from-gravity-uimarkdown-editor).
