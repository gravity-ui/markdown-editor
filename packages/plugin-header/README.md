# Header Markdown plugin

markdown-it plugin for an empty Header block with independent height and width.

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

Any other `:::header` container is rendered as escaped source text.
