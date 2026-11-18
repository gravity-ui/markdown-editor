# @gravity-ui/markdown-viewer-yfm-mermaid-extension

Render Diplodoc Mermaid diagrams in `MarkdownViewer`, with theme switching and zoom.

## Installation

```sh
pnpm add @gravity-ui/markdown-viewer-yfm-mermaid-extension @gravity-ui/markdown-viewer @gravity-ui/uikit @diplodoc/mermaid-extension
```

Requires React 18 or 19, MarkdownViewer `^0.1.0`, UIKit `^7.39.0`, and Diplodoc
Mermaid extension `^2.0.0`. Your bundler must support CSS and dynamic JavaScript imports.

Styles are imported with the component. If your application handles styles
separately, import both stylesheets:

```ts
import '@diplodoc/mermaid-extension/styles/zoom.css';
import '@gravity-ui/markdown-viewer-yfm-mermaid-extension/styles.css';
```

The package's `styles.css` contains only its own styles. Zoom styles come from
the installed Diplodoc Mermaid extension. Server rendering needs a bundler that
handles CSS imports, like the built-in viewer extensions.

## Usage

Pass the HTML and metadata produced by the Diplodoc Mermaid transform.
Place the viewer inside your application's UIKit `ThemeProvider`:

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {YfmMermaid} from '@gravity-ui/markdown-viewer-yfm-mermaid-extension';

<MarkdownViewer html={result.html}>
  <YfmMermaid meta={result.meta} />
</MarkdownViewer>;
```

`meta` tells the extension when to load the runtime. Without matching metadata,
it does not load the runtime or render diagrams.

## Options

| Prop       | Description                                                                               |
| ---------- | ----------------------------------------------------------------------------------------- |
| `meta`     | Transform metadata with an optional `script` array.                                       |
| `runtime`  | Asset name to match in metadata. Defaults to `_assets/mermaid-extension.js`.              |
| `selector` | Diagram selector within the viewer. Defaults to `.mermaid[data-content]`.                 |
| `theme`    | Mermaid theme name or `{light, dark}` map. Defaults to `{light: 'forest', dark: 'dark'}`. |
| `options`  | Mermaid settings, including `zoom`, excluding `theme` and `startOnLoad`.                  |
| `nonce`    | Nonce for SVG styles. Not set by default.                                                 |
| `onError`  | Error handler. Defaults to `console.error`.                                               |

Set `runtime` only if you configured a custom asset name in the transform.
It selects a metadata entry; it does not set a download URL.

The package also exports `YfmMermaidProps`, `YfmMermaidRuntime`,
`YfmMermaidTheme`, and `YfmMermaidOptions` for TypeScript users.

## Updates and React content

Changes to HTML, theme, or options trigger rendering. Each diagram gets a child
container, so sibling React slots stay unchanged. Removing `YfmMermaid` removes
the pending diagram and leaves completed diagrams in place.

Keep `options` and `onError` references stable to avoid rendering diagrams again
on unrelated parent updates. Use `useMemo` for options and `useCallback` for the
error handler.

Rendering is queued across instances of this extension because Mermaid shares
configuration. Calls to Mermaid outside this extension are not part of that queue.
The Diplodoc runtime controls zoom handlers and does not expose a full cleanup API.
The `nonce` prop applies to SVG styles; it does not guarantee full CSP support.
