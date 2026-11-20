# @gravity-ui/markdown-viewer-yfm-html-extension

Render Diplodoc HTML blocks in `MarkdownViewer`.

## Installation

```sh
pnpm add @gravity-ui/markdown-viewer-yfm-html-extension @gravity-ui/markdown-viewer @diplodoc/html-extension
```

Requires React 18 or 19, MarkdownViewer `^0.1.0`, and the Diplodoc HTML
extension `^2.9.6`.

## Usage

Pass the HTML and metadata from the Diplodoc HTML transform to the viewer and extension.

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {YfmHtmlBlock} from '@gravity-ui/markdown-viewer-yfm-html-extension';

<MarkdownViewer html={result.html}>
  <YfmHtmlBlock meta={result.meta} />
</MarkdownViewer>;
```

### Iframe styles

Pass theme values to the iframe through `config.styles`.

```ts
import {toIframeCssVariables} from '@gravity-ui/markdown-viewer-yfm-html-extension';

const config = {
  styles: toIframeCssVariables({colorTextPrimary: '#222', fontSize: '16px'}),
};
```

## Options

| Prop            | Description                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `meta`          | Transform metadata. The runtime loads when `meta.script` includes the runtime asset name.                                 |
| `runtime`       | Asset name to match. Defaults to `_assets/html-extension.js`.                                                             |
| `config`        | Diplodoc iframe settings, including styles, classes and resize options.                                                   |
| `runtimeConfig` | Settings shared by the Diplodoc runtime. Defaults to `{disabledModes: ['shadow']}`. A custom value replaces this default. |
| `onError`       | Handles runtime loading and initialization errors while the extension is mounted. Defaults to `console.error`.            |

The package exports `YfmHtmlBlockProps`, `YfmHtmlBlockRuntime`, and `YfmHtmlRuntimeConfig` for TypeScript users.

Viewers on the same page share one Diplodoc controller. Choose a single `runtimeConfig`
before the HTML runtime first loads and pass it to every viewer. The controller reads
the policy once, when it is created.

Each time a viewer initializes HTML blocks, the controller applies that viewer's `config`
to all new blocks in the document, including blocks in other viewers. Use the same iframe
settings for viewers shown together. Existing blocks keep the settings they started with.
Unmounting a viewer keeps the controller available to other viewers.
