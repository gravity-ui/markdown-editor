# @gravity-ui/markdown-viewer-yfm-page-constructor-extension

Render Diplodoc Page Constructor blocks in `MarkdownViewer`. The component and
its styles load on demand for matching blocks.

## Installation

```sh
pnpm add @gravity-ui/markdown-viewer-yfm-page-constructor-extension @gravity-ui/markdown-viewer @gravity-ui/page-constructor @gravity-ui/uikit @diplodoc/page-constructor-extension
```

Requires React 18 or 19, MarkdownViewer `^0.1.0`, Page Constructor `^7.21.0`,
UIKit `^7.39.0`, and the Diplodoc extension `^0.13.3`. Client and server builds
must support dynamic imports and handle CSS imports.

## Usage

Use the CSR plugin when transforming Markdown, including on the server. It leaves
each block empty so the viewer can render it once.

```ts
import {transform as pageConstructor} from '@diplodoc/page-constructor-extension/plugin/csr';
```

Add `pageConstructor({bundle: false})` to your transform plugins. Inside your
UIKit `ThemeProvider`, pass the resulting HTML and metadata to the viewer and extension.

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {YfmPageConstructor} from '@gravity-ui/markdown-viewer-yfm-page-constructor-extension';

<MarkdownViewer html={result.html}>
  <YfmPageConstructor meta={result.meta} />
</MarkdownViewer>;
```

## Options

| Prop       | Description                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `meta`     | Metadata from the transform.                                                                                            |
| `runtime`  | Script name to match in `meta.script`. For `{script, style}`, uses `script`. Defaults to `_assets/page-constructor.js`. |
| `selector` | Block selector within the viewer. Defaults to `.yfm-page-constructor`.                                                  |
| `theme`    | Defaults to the light or dark variant of the UIKit theme. `light-hc` maps to `light`, and `dark-hc` to `dark`.          |
| `onError`  | Handles loading and rendering errors. The affected block shows the error message. Defaults to `console.error`.          |

The package exports `YfmPageConstructorProps` and `YfmPageConstructorRuntime` for TypeScript users.
