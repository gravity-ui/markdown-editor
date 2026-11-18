# @gravity-ui/markdown-viewer-yfm-latex-extension

Render Diplodoc LaTeX formulas in `MarkdownViewer`. The extension loads the
LaTeX runtime, styles, and fonts when needed.

## Installation

```sh
pnpm add @gravity-ui/markdown-viewer-yfm-latex-extension @gravity-ui/markdown-viewer @diplodoc/latex-extension katex
```

Requires React 18 or 19, MarkdownViewer 1.x, and Diplodoc LaTeX SDK
`^1.3.4 || ^2.0.0`. Your bundler must support dynamic JavaScript and CSS imports.

## Usage

Pass the HTML and metadata produced by the Diplodoc LaTeX transform:

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {YfmLatex} from '@gravity-ui/markdown-viewer-yfm-latex-extension';

<MarkdownViewer html={result.html}>
  <YfmLatex meta={result.meta} />
</MarkdownViewer>;
```

`meta` tells the extension which assets to load. Without matching metadata,
it does not load assets or render formulas. Importing the package alone does
not load browser assets.

## Options

| Prop       | Description                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `meta`     | Transform metadata with optional `script` and `style` arrays.                                                                                       |
| `runtime`  | Asset names to match in metadata: a shared string or `{script, style}`. Defaults to `_assets/latex-extension.js` and `_assets/latex-extension.css`. |
| `selector` | Formula selector within the viewer. Defaults to `.yfm-latex`.                                                                                       |
| `options`  | Diplodoc runtime options, excluding `nodes` and `querySelector`. Defaults to `throwOnError: false` and the theme error color.                       |
| `onError`  | Error handler. Defaults to `console.error`.                                                                                                         |

Set `runtime` only if you configured custom asset names in the transform.
It selects metadata entries; it does not set a download URL.

The package also exports `YfmLatexProps`, `YfmLatexRuntime`, and
`YfmLatexOptions` for TypeScript users.

## Updates and React content

Changes to HTML, metadata, or options trigger rendering. The extension skips
React slots and formula nodes containing them. Pending asset loads are ignored
after cleanup. Removing `YfmLatex` leaves rendered formulas in place and keeps
the shared runtime available.
