# Header Markdown plugin

markdown-it plugin for the Header block: height, width, title and description.

```ts
import MarkdownIt from 'markdown-it';
import headerPlugin from '@gravity-ui/markdown-plugin-header';
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

The block is left-aligned and never wider than its container.
Sizes are set by `--g-md-header-height-{s,m,l}` and `--g-md-header-width-{s,m,l}`.
The border uses `--g-color-line-generic` and `--g-border-radius-2xl` (16 px by default).

The block is a container directive parsed with [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
It opens with `:::header` and an optional attribute list, and closes with a `:::` line.
Attribute values may be double-quoted, single-quoted or unquoted.

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
| `header`       | `title`       | `true`, `false`: `false` hides the title and keeps its text          | `true`  |
| `header`       | `description` | `true`, `false`: `false` hides the description and keeps its text    | `true`  |
| `header-title` | `size`        | `1`–`6`, the typography of a YFM heading of that level               | `2`     |
| `header-title` | `color`       | `auto`, `gray`, `yellow`, `orange`, `red`, `green`, `blue`, `violet` | `auto`  |

`header-title` and `header-content` are recognized only directly inside `header`; elsewhere they stay plain text.
The body of `header` holds at most one `header-title` followed by at most one `header-content`.
The title uses `--yfm-font-size-h{1-6}` and `--yfm-font-line-height-h{1-6}`, colors use `--yfm-colorify-{color}`.
The description uses `--g-md-header-content-font-size` (14 px) and `--g-md-header-content-line-height` (20 px).

Any other `:::header` container is rendered as escaped source text:
an unknown or repeated attribute, an unsupported value, text after the attributes, other content inside the block, or a missing closing line.
