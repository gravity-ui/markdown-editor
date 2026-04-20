##### Extensions / Page Constructor Extension

## How to Connect the Page Constructor Extension in the Editor

This guide explains how to integrate the `@diplodoc/page-constructor-extension` into the markdown editor — both for WYSIWYG editing and for split/markup preview.

### Prerequisites

Ensure the following packages are installed:

```bash
npm install @gravity-ui/markdown-editor
npm install @diplodoc/page-constructor-extension
npm install @gravity-ui/page-constructor
```

- `@diplodoc/page-constructor-extension` — markdown-it plugin for parsing `::: page-constructor` blocks and a lightweight YAML loader (`loadPageContent`). Does **not** pull in React or any UI framework.
- `@gravity-ui/page-constructor` — React component library for rendering page-constructor content. Used directly for WYSIWYG preview.

Both are **optional peer dependencies** of `@gravity-ui/markdown-editor` — they are only needed if you use the `YfmPageConstructor` extension.

Check the [peer dependencies](../packages/editor/package.json) for the exact required versions.

---

### 1. Add the markdown-it Plugin (Preview Transform)

In your plugins configuration file (e.g., `md-plugins.ts`), import and register the transformer:

```typescript
import {transform as yfmPageConstructor} from '@diplodoc/page-constructor-extension';

export function getPlugins(): MarkdownIt.PluginWithParams[] {
    return [
        // ... other plugins
        yfmPageConstructor({bundle: false}),
    ];
}
```

The `bundle: false` option tells the plugin not to inline the runtime bundle — the runtime is loaded separately by the HOC (see step 3).

---

### 2. Add the WYSIWYG Extension

In your editor builder setup, register the `YfmPageConstructor` extension:

```typescript
import {YfmPageConstructor} from '@gravity-ui/markdown-editor/extensions/additional/YfmPageConstructor';

builder.use(YfmPageConstructor, {
    // Optional: enable auto-save when editing YAML content
    autoSave: {
        enabled: true,
        delay: 1000,
    },
});
```

To add a toolbar button for inserting a page-constructor block, pass the action to the command menu:

```typescript
import {YfmPageConstructorAction} from '@gravity-ui/markdown-editor/extensions/additional/YfmPageConstructor/const';

const mdEditor = useMarkdownEditor({
    // ...
    extensionOptions: {
        commandMenu: {actions: [YfmPageConstructorAction]},
    },
});
```

---

### 3. Add the Preview HOC

The preview uses a HOC chain. Add `withYfmPageConstructor` to your preview component:

```typescript
import {YfmStaticView} from '@gravity-ui/markdown-editor/view/components/YfmHtml/index.js';
import {withYfmPageConstructor} from '@gravity-ui/markdown-editor/view/hocs/withYfmPageConstructor/index.js';

// Wrap YfmStaticView (or compose with other HOCs)
const Preview = withYfmPageConstructor()(YfmStaticView);
```

A full composed example with other extensions:

```typescript
import {withLatex} from '@gravity-ui/markdown-editor/view/hocs/withLatex/index.js';
import {withMermaid} from '@gravity-ui/markdown-editor/view/hocs/withMermaid/index.js';
import {withYfmPageConstructor} from '@gravity-ui/markdown-editor/view/hocs/withYfmPageConstructor/index.js';
import {withYfmHtmlBlock} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml/index.js';

const Preview = withMermaid({runtime: MERMAID_RUNTIME})(
    withLatex({runtime: LATEX_RUNTIME})(
        withYfmPageConstructor()(
            withYfmHtmlBlock({runtime: YFM_HTML_BLOCK_RUNTIME})(YfmStaticView),
        ),
    ),
);
```

Then render the preview passing `html` and `meta` from `@diplodoc/transform`:

```typescript
const res = transform(markupValue, {plugins}).result;

<Preview
    html={res.html}
    meta={res.meta}
    // Optional: pass theme and preMountHook to the page-constructor renderer
    yfmPageConstructorConfig={{theme: 'dark'}}
/>
```

The `yfmPageConstructorConfig` prop is optional. It accepts `{theme?: string; preMountHook?: PreMountHook}`.

---

### How It Works

The extension uses a two-step rendering approach in preview mode:

1. **Transform step**: The markdown-it plugin converts `::: page-constructor` blocks into `<div class="yfm-page-constructor" data-content-encoded="...">` placeholders, where `data-content-encoded` contains the JSON-encoded page content.

2. **Runtime step**: The `withYfmPageConstructor` HOC loads the page-constructor runtime (via a static import). The runtime registers a `PageConstructorController` in a shared store. After the HTML is rendered into the DOM, the controller finds all `.yfm-page-constructor` placeholders and renders `<PageConstructorProvider><PageConstructor content={...} /></PageConstructorProvider>` into each one using React's `createRoot`.

This means the page-constructor preview is fully React-rendered — each block becomes a live React component tree.

---

### Markdown Syntax

```yaml
::: page-constructor
blocks:
  - type: "header-block"
    title: "Hello, World"
    description: "This is rendered by page-constructor"
:::
```

Refer to the [page-constructor documentation](https://gravity-ui.com/components/page-constructor) for supported block types and their YAML schema.
