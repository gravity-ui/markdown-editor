# Header Markdown plugin

markdown-it plugins for a Header container and its description.

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

## Header content

```ts
import MarkdownIt from 'markdown-it';
import {headerContentPlugin, headerPlugin} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPlugin).use(headerContentPlugin);
```

```markdown
:::header

:::header-content
Portal description with **bold**, _italic_, ++underlined++, ~~strikethrough~~ and `monospace` text and a [link](/page).

Second paragraph.
:::
:::
```

```html
<div class="g-md-header-plugin …">
  <div class="g-md-header-content-plugin">
    <p>
      Portal description with <strong>bold</strong>, <em>italic</em>, <ins>underlined</ins>,
      <s>strikethrough</s> and <code>monospace</code> text and a <a href="/page">link</a>.
    </p>
    <p>Second paragraph.</p>
  </div>
</div>
```

The block is a `div.g-md-header-content-plugin`.
The exports are `headerContentPlugin`, `headerContentTokenName` and `headerContentClassName`.

The description is a container directive: the opening line, the paragraphs and the closing line `:::`.
Its content is ordinary Markdown of the same parser, so the marks and the links are the ones the parser has: `++underlined++` needs a plugin for it, such as `markdown-it-ins`, which YFM and the editor include.
A description without a text, `:::header-content` right before `:::`, keeps its tokens and renders nothing.

The block has no attributes, and an attribute in the markup is skipped: `:::header-content{size="1" color="red"}` is the same description.

### Content styles

The font size and the line height are `--yfm-font-size` and `--yfm-font-line-height`, then the Gravity UI typography `body-2`. The weight is `--g-text-body-font-weight`, and the color is the color of the text around the block.

The paragraphs stand 8 px (`--g-spacing-2`) apart. Inline code has the YFM colors, `--yfm-color-inline-code` and `--yfm-color-inline-code-background`.
The links have the YFM link colors, `--yfm-color-link` and `--yfm-color-link-hover`, then `--g-color-text-link` and `--g-color-text-link-hover`, and on keyboard focus the 2 px `--g-color-line-focus` ring.
A link differs from the text by its color and has no underline. With `--g-md-header-content-plugin-link-decoration-line: underline`, the underline is 2 px thick and 0.2 em below the text and thickens to 3 px on hover.

| Property                                                       | Default                                   |
| -------------------------------------------------------------- | ----------------------------------------- |
| `--g-md-header-content-plugin-font-weight`                     | `var(--g-text-body-font-weight)`          |
| `--g-md-header-content-plugin-paragraph-gap`                   | `var(--g-spacing-2)`                      |
| `--g-md-header-content-plugin-margin-block`                    | `0 var(--g-spacing-4)`                    |
| `--g-md-header-content-plugin-link-color`                      | `var(--yfm-color-link)`                   |
| `--g-md-header-content-plugin-link-hover-color`                | `var(--yfm-color-link-hover)`             |
| `--g-md-header-content-plugin-link-decoration-line`            | `none`                                    |
| `--g-md-header-content-plugin-link-decoration-thickness`       | `2px`                                     |
| `--g-md-header-content-plugin-link-hover-decoration-thickness` | `3px`                                     |
| `--g-md-header-content-plugin-link-underline-offset`           | `0.2em`                                   |
| `--g-md-header-content-plugin-link-focus-outline-width`        | `2px`                                     |
| `--g-md-header-content-plugin-link-focus-outline-color`        | `var(--g-color-line-focus)`               |
| `--g-md-header-content-plugin-code-color`                      | `var(--yfm-color-inline-code)`            |
| `--g-md-header-content-plugin-code-background`                 | `var(--yfm-color-inline-code-background)` |
