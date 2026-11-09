# Header Markdown plugin

markdown-it plugin for a Header container with a title and a description.

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

## Title and description

```markdown
:::header{height="m" width="m"}

:::header-title{size="1" color="blue"}
Team portal
:::

:::header-content
First paragraph of the description.

Second paragraph.
:::

:::
```

| Block          | Attribute     | Values                                                               | Default |
| -------------- | ------------- | -------------------------------------------------------------------- | ------- |
| `header`       | `title`       | `false` hides the title and keeps its text                           | `true`  |
| `header`       | `description` | `false` hides the description and keeps its text                     | `true`  |
| `header-title` | `size`        | `1`–`6`, the typography of a YFM heading of that level               | `2`     |
| `header-title` | `color`       | `auto`, `gray`, `yellow`, `orange`, `red`, `green`, `blue`, `violet` | `auto`  |

`header-title` is recognized only as the first block of `header`, and `header-content` only once per `header`; elsewhere they remain ordinary Markdown.
The title is rendered as `div.g-md-header-plugin__title` with the modifiers `_size_{1-6}` and `_color_{color}`, the description as `div.g-md-header-plugin__content`.
The `data-size` and `data-color` attributes of the title element and of its opening token hold the same values.
A hidden title or description gets the modifier `_hidden` and the attribute `data-hidden="true"`.
The title uses `--yfm-font-size-h{1-6}` and `--yfm-font-line-height-h{1-6}`, colors use `--yfm-colorify-{color}`, and an 8 px bottom margin separates it from the next block.
The description uses `--g-md-header-plugin-content-font-size` (14 px) and `--g-md-header-plugin-content-line-height` (20 px).

## Parsing

The block is a container directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::header{height="xl" color="red"}` is an `s` × `m` block.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.
