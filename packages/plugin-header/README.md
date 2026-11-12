# Header Markdown plugin

markdown-it plugin for a Header container.

```ts
import MarkdownIt from 'markdown-it';
import {headerPlugin} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPlugin);
```

```markdown
:::header{height="s" width="m"}

:::
```

| Attribute | Values                                                        | Default |
| --------- | ------------------------------------------------------------- | ------- |
| `height`  | `s` 236 px, `m` 300 px, `l` 360 px (minimum height)           | `s`     |
| `width`   | `s` 600 px, `m` 900 px, `l` 1200 px, `full` (container width) | `m`     |

The block is rendered as `div.g-md-header-plugin` with the modifiers `_height_{s,m,l}` and `_width_{s,m,l,full}`.
The `data-height` and `data-width` attributes of the element and of the opening token hold the same dimensions.
The block is left-aligned; the width is a `max-width`, so the block never exceeds its container.
Sizes are set by `--g-md-header-plugin-height-{s,m,l}` and `--g-md-header-plugin-width-{s,m,l}`.
Margins are set by `--g-md-header-plugin-margin-block` (`0 var(--g-spacing-5)` by default) and `--g-md-header-plugin-margin-inline` (`0` by default).
The corner radius uses `--g-border-radius-2xl` (16 px by default).

## Parsing

The block is a container directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::header{height="xl" color="red"}` is an `s` × `m` block.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

## Button

Register `buttonPlugin` independently or together with `headerPlugin`:

```ts
import {buttonPlugin} from '@gravity-ui/markdown-plugin-header';
md.use(buttonPlugin);
```

```markdown
:::button{href="https://example.com" view="action" color="brand" target="_blank"}
Read more
:::
```

The body is plain text. Buttons work independently and inside Header.

| Attribute | Values | Default |
| --- | --- | --- |
| `href` | Link address | Empty |
| `view` | `action`, `normal`, `outline`, `flat` | `action` |
| `color` | `standard`, `gray`, `brand`, `green`, `yellow`, `red`, `violet` | `standard` for action/flat, `gray` for normal/outline |
| `target` | `_self`, `_blank`, `_parent`, `_top` | `_self` |

`action` does not support gray; `normal` and `outline` do not support standard.
Unsupported values use the defaults. Unknown attributes are ignored.
Unsafe link addresses are omitted. New-tab links include `rel="noopener noreferrer"`.
Colors use Gravity theme variables; the host application supplies their values.
