# @gravity-ui/markdown-viewer-yfm-mermaid-extension

Render Diplodoc Mermaid diagrams in `MarkdownViewer`, with theme switching and zoom.

## Installation

```sh
pnpm add @gravity-ui/markdown-viewer-yfm-mermaid-extension @gravity-ui/markdown-viewer @gravity-ui/uikit @diplodoc/mermaid-extension
```

Requires React 18 or 19, MarkdownViewer `^0.1.0`, UIKit `^7.39.0`, and Diplodoc
Mermaid extension `^2.0.0`. Your bundler must support dynamic JavaScript imports
and handle CSS imports during both client and server builds.

## Usage

Inside your application's UIKit `ThemeProvider`, pass the HTML and metadata
from the Diplodoc Mermaid transform to the viewer and extension.

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {YfmMermaid} from '@gravity-ui/markdown-viewer-yfm-mermaid-extension';

<MarkdownViewer html={result.html}>
  <YfmMermaid meta={result.meta} />
</MarkdownViewer>;
```

`YfmMermaid` loads the runtime when `meta.script` includes the configured asset name.

### Styles

Importing `YfmMermaid` also includes its styles and the zoom controls' styles
from the installed Diplodoc extension. No extra imports are needed, even if
your bundler extracts CSS into a separate file.

Only if your client build ignores CSS imports from JavaScript, add both
stylesheets to your application's CSS entry point:

```css
@import '@diplodoc/mermaid-extension/styles/zoom.css';
@import '@gravity-ui/markdown-viewer-yfm-mermaid-extension/styles.css';
```

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

The package also exports `YfmMermaidProps`, `YfmMermaidRuntime`,
`YfmMermaidTheme`, and `YfmMermaidOptions` for TypeScript users.

## Updates and React content

Diagrams update when the HTML, theme, or options change. Keep `options` and
`onError` references stable to avoid extra renders on parent updates.

The extension preserves React slots. On unmount it removes the diagram still
being rendered and leaves completed diagrams in place. Diplodoc manages their
zoom handlers.

Mermaid shares its configuration across viewers. `YfmMermaid` renders one viewer
at a time. Direct calls to Mermaid run outside this queue.
