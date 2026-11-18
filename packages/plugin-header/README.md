# Header Markdown plugin

markdown-it plugins for a Header container and its image.

```ts
import MarkdownIt from 'markdown-it';
import {headerImagePlugin, headerPlugin} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPlugin).use(headerImagePlugin);
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

## Image

```markdown
:::header{height="s" width="m"}

::header-image{src="/team.png" alt="Team" title="Project team"}

Text beside the image.

:::
```

| Attribute | Values                                                                 | Default |
| --------- | ---------------------------------------------------------------------- | ------- |
| `src`     | an `http:`, `https:`, `blob:` or relative address; others are rejected | none    |
| `alt`     | alternative text                                                       | empty   |
| `title`   | tooltip text                                                           | none    |

The image is a leaf block directive without a label or a body, rendered as `img.g-md-header-image-plugin`.
The address is decoded and checked like a link address (`md.normalizeLink`, `md.validateLink`).
An image without a supported address renders nothing.
The image is only the first block of a header; elsewhere the directive stays text.
Inside a header, the image takes the right half of the block, 8 px (`--g-spacing-2`) from its edges, and the other blocks stay in the left half.
A header narrower than 600 px puts the image above the other blocks.
The image width is set by `--g-md-header-plugin-image-width` (`50%`), its inset by `--g-md-header-plugin-image-padding`.

The header and the image carry the `data-files-gallery-exclude` attribute, so the files gallery of the editor skips them.
