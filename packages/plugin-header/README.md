# Header Markdown plugin

markdown-it plugins for a Header container and its title.

```ts
import MarkdownIt from 'markdown-it';
import {headerPlugin, headerTitlePlugin} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPlugin).use(headerTitlePlugin);
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

## Header title

```markdown
:::header

::header-title[Team portal]{size="1" color="blue"}
:::
```

| Attribute | Values                                                               | Default |
| --------- | -------------------------------------------------------------------- | ------- |
| `size`    | `1`–`6`: the typography of the headings `h1`–`h6`                    | `2`     |
| `color`   | `auto`, `gray`, `yellow`, `orange`, `red`, `green`, `blue`, `violet` | `auto`  |

```html
<div class="g-md-header-plugin …">
  <div
    class="g-md-header-title-plugin g-md-header-title-plugin_size_1 g-md-header-title-plugin_color_blue"
    role="heading"
    aria-level="1"
    data-size="1"
    data-color="blue"
  >
    Team portal
  </div>
</div>
```

The title is a `div` with `role="heading"` and `aria-level` of its size, so it is a heading for assistive technology and stays out of the heading tags of the page. The size and the color other than the defaults are also written to `data-size` and `data-color`; `headerTitleFromAttrs` reads them back.
A sanitizer has to allow `aria-level`: the default list of `@diplodoc/transform` keeps `role` and drops the level, and a heading without a level is read as a heading of level 2 (see [Sanitizer](#sanitizer)).

The title is a leaf block directive: one line with the text in square brackets and no closing line. It stands after an empty line, as a paragraph does.
The text is plain: Markdown and HTML entities inside it are shown as written, and `\]` writes a closing bracket.
A title without a text, `::header-title[]`, keeps its token and renders nothing.

An unknown attribute is skipped, and an unsupported value is replaced with the default: `::header-title[Team portal]{size="7" color="pink"}` is a title of size `2` in the `auto` color.

### Title styles

| Size | Font size and line height                                        | Gravity UI typography | Weight                           |
| ---- | ---------------------------------------------------------------- | --------------------- | -------------------------------- |
| `1`  | `--yfm-font-size-h1`, `--yfm-font-line-height-h1`: 32 px / 40 px | `display-2`           | `--g-text-display-font-weight`   |
| `2`  | `--yfm-font-size-h2`, `--yfm-font-line-height-h2`: 24 px / 28 px | `header-2`            | `--g-text-header-font-weight`    |
| `3`  | `--yfm-font-size-h3`, `--yfm-font-line-height-h3`: 20 px / 24 px | `header-1`            | `--g-text-header-font-weight`    |
| `4`  | `--yfm-font-size-h4`, `--yfm-font-line-height-h4`: 17 px / 24 px | `subheader-3`         | `--g-text-subheader-font-weight` |
| `5`  | `--yfm-font-size-h5`, `--yfm-font-line-height-h5`: 15 px / 20 px | `subheader-2`         | `--g-text-subheader-font-weight` |
| `6`  | `--yfm-font-size-h6`, `--yfm-font-line-height-h6`: 13 px / 18 px | `subheader-1`         | `--g-text-subheader-font-weight` |

A size takes the variables of the YFM heading of that level; where they are not set, it takes the Gravity UI typography of the same size.
The weight is the one of the Gravity UI typography group of the size; it follows Gravity UI, not the YFM headings, which have no variable for their weight.

The `auto` color is the color of the text around the title, so it follows the page theme.
The other colors are the colors of colored text in YFM, `--yfm-colorify-<color>`; where they are not set, the title takes the Gravity UI tokens those colors use in the editor:

| Color    | Variable                | Gravity UI token                     |
| -------- | ----------------------- | ------------------------------------ |
| `gray`   | `--yfm-colorify-gray`   | `--g-color-text-secondary`           |
| `yellow` | `--yfm-colorify-yellow` | `--g-color-private-yellow-600-solid` |
| `orange` | `--yfm-colorify-orange` | `--g-color-private-orange-500-solid` |
| `red`    | `--yfm-colorify-red`    | `--g-color-text-danger`              |
| `green`  | `--yfm-colorify-green`  | `--g-color-text-positive`            |
| `blue`   | `--yfm-colorify-blue`   | `--g-color-text-info`                |
| `violet` | `--yfm-colorify-violet` | `--g-color-text-utility`             |

These colors are the colored text of the editor and are not all readable as a title: on the page `yellow` and `orange` are below the WCAG AA contrast, `green` and `blue` too at sizes `4`–`6`.
Use colored titles at sizes `1`–`3`, or set `--yfm-colorify-<color>` to the colors your theme needs.

| Property                                  | Default                               |
| ----------------------------------------- | ------------------------------------- |
| `--g-md-header-title-plugin-font-weight`  | the weight of the size, see the table |
| `--g-md-header-title-plugin-margin-block` | `0 var(--g-spacing-4)`                |

## Sanitizer

`headerSanitizeAllowedAttributes` holds only what the defaults of the `@diplodoc/transform` sanitizer lack (`aria-level` on `div`, for the [title](#header-title) heading); add it to the allowed attributes of that sanitizer:

```ts
import {headerSanitizeAllowedAttributes} from '@gravity-ui/markdown-plugin-header';

const allowedAttributes = {iframe: ['srcdoc'], ...headerSanitizeAllowedAttributes};
```
