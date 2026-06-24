# @gravity-ui/markdown-viewer &middot; [![npm package](https://img.shields.io/npm/v/@gravity-ui/markdown-viewer)](https://www.npmjs.com/package/@gravity-ui/markdown-viewer)

Markdown viewer component for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor). Renders pre-transformed HTML from `@diplodoc/transform` with support for YFM (Yandex Flavored Markdown) styles and runtime extensions.

## Installation

```bash
npm install @gravity-ui/markdown-viewer
```

### Required peer dependencies

```bash
npm install @gravity-ui/uikit react react-dom
```

## Usage

### Basic rendering

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';

export function Preview({html}: {html: string}) {
    return <MarkdownViewer html={html} />;
}
```

### With YFM styles

To apply YFM styles, pass the `cnYFM()` class to the `className` prop. Import the stylesheets manually:

```tsx
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';

import '@diplodoc/transform/dist/yfm.css';

export function Preview({html}: {html: string}) {
    return <MarkdownViewer html={html} className={cnYFM()} />;
}
```

### With YFM modifiers

`cnYFM()` accepts optional modifier flags:

```tsx
<MarkdownViewer html={html} className={cnYFM({'no-list-reset': true, 'no-stripe-table': true})} />
```

Available modifiers:

| Modifier | Description |
|---|---|
| `no-list-reset` | Disable list counter reset |
| `no-stripe-table` | Disable striped table rows |

## API

### `MarkdownViewer`

| Prop | Type | Description |
|---|---|---|
| `html` | `string` | Pre-transformed HTML string to render. The component does not sanitize it — make sure to sanitize before passing. |
| `className` | `string` | CSS class applied to the inner content element |
| `style` | `CSSProperties` | Inline styles applied to the inner content element |
| `ref` | `Ref<HTMLDivElement>` | Ref forwarded to the inner content element |
| `children` | `ReactNode` | Additional nodes rendered alongside the content (e.g. runtime extension portals) |
| `...props` | `HTMLAttributes<HTMLDivElement>` | Any other props are forwarded to the inner content `div` |

### `cnYFM(mods?, mix?)`

BEM class name helper for the `.yfm` scope. Use it to enable YFM styles and modifiers on the viewer.

```ts
import {cnYFM, type YFMMods} from '@gravity-ui/markdown-viewer';

cnYFM() // => 'yfm'
cnYFM({'no-list-reset': true}) // => 'yfm yfm_no-list-reset'
```

## License

MIT
