# Header and Button Markdown plugins

markdown-it plugins for Header containers, their titles and descriptions, and inline buttons.

## Header

```ts
import MarkdownIt from 'markdown-it';
import {headerPlugin} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPlugin);
```

```markdown
:::header{height="s" width="m" bg-color="blue-light" bg-image="./.files/photo.jpg" bg-image-theme="dark" bg-image-blur="true"}

:::
```

| Attribute        | Values                                                                                                     | Default  |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `height`         | `s` 236 px, `m` 300 px, `l` 360 px (minimum height)                                                        | `s`      |
| `width`          | `s` 600 px, `m` 900 px, `l` 1200 px, `full` (container width)                                              | `m`      |
| `bg-color`       | `<family>-<saturation>`: `gray`, `green`, `yellow`, `blue`, `red`, `violet` and `light`, `medium`, `heavy` | none     |
| `bg-image`       | an `http:`, `https:`, `blob:` or relative address                                                          | none     |
| `bg-image-theme` | the theme of the content over the image: `system` as the page, `dark` light text, `light` dark text        | `system` |
| `bg-image-blur`  | `true`                                                                                                     | none     |

The block is rendered as `div.g-md-header-plugin` with the modifiers `_height_{s,m,l}` and `_width_{s,m,l,full}`.
The `data-height` and `data-width` attributes of the element and of the opening token hold the same dimensions.
The block is left-aligned; the width is a `max-width`, so the block never exceeds its container.
Sizes are set by `--g-md-header-plugin-height-{s,m,l}` and `--g-md-header-plugin-width-{s,m,l}`.
Margins are set by `--g-md-header-plugin-margin-block` (`0 var(--g-spacing-5)` by default) and `--g-md-header-plugin-margin-inline` (`0` by default).
The corner radius uses `--g-border-radius-2xl` (16 px by default).

### Background

The fill is the `background-color` of the block, set by the `_bg-color_<value>` modifier.
The fill colors are Gravity UI tokens, declared on `.g-root` as `--g-md-header-plugin-bg-color-<value>`.
`gray-heavy` uses `--g-color-base-neutral-heavy-hover`.

The image is the `background-image` of the block: the `_bg-image` modifier centers and scales it to cover the block, and the address is written into the `style` attribute as a percent-encoded `url("…")`.
In the `style` attribute a relative address resolves against the page; the address passes the scheme check first.
`bg-image-blur` adds the `_bg-image-blur` modifier: a `::before` layer under the content repeats the background blurred by 12 px and extends 24 px past the clipped edges.
`bg-image-theme` other than `system` adds `g-root g-root_theme_<theme>` to the block and sets the YFM text and link colors with Gravity UI tokens: text, links, and buttons use the fixed theme, and the image stays the same.
Without a fill, the page background of the fixed theme lies under the image.
The theme and blur belong to the image: without `bg-image` they are parsed as the defaults.
Background attributes with default values are not rendered; the others are copied to `data-bg-*` attributes of the element and of the opening token.

### Parsing

The block is a container directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::header{height="xl" color="red"}` is an `s` × `m` block.
An image address with another scheme, such as `javascript:` or `data:`, or with control characters, is skipped.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

## Header title

Register `headerTitlePlugin` with `headerPlugin`; outside a header the title is rendered as well:

```ts
import MarkdownIt from 'markdown-it';
import {headerPlugin, headerTitlePlugin} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPlugin).use(headerTitlePlugin);
```

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
    data-size="1"
    data-color="blue"
  >
    Team portal
  </div>
</div>
```

The size and the color other than the defaults are also written to `data-size` and `data-color` of the element and of the token; `headerTitleFromAttrs` reads them back.
The token is `g_md_header_title`, with the text as its `content` and no children.

The title is a leaf block directive: one line with the text in square brackets and no closing line. It stands after an empty line, as a paragraph does.
The text is plain: Markdown and HTML entities inside it are shown as written, and `\]` writes a closing bracket.
A title without a text, `::header-title[]`, keeps its token and renders nothing.
A header holds one title: a second title in the same header stays a paragraph of text.

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
| `--g-md-header-title-plugin-margin-block` | `0 var(--g-spacing-4, 16px)`          |

## Header content

The description of a banner. Register `headerContentPlugin` together with `headerPlugin`:

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
The description is a container directive: the opening line, the blocks and the closing line `:::`.
Its content is ordinary Markdown of the same parser, so the marks and the links are the ones the parser has: `++underlined++` needs a plugin for it, such as `markdown-it-ins`, which YFM and the editor include.
A description without a text, `:::header-content` right before `:::`, keeps its tokens and renders nothing, so it takes no space.
The block has no attributes, and an attribute in the markup is skipped: `:::header-content{size="1" color="red"}` is the same description.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

A banner holds one description: the first one among its child blocks.
Another description in the same banner, also one inside another block of the banner, is not a description: its container is dropped, and its blocks stay in place.
A description outside a banner is rendered as a description.

### Content styles

The font size and the line height are `--yfm-font-size` and `--yfm-font-line-height`, then the Gravity UI typography `body-2` (15 px / 20 px). The weight is `--g-text-body-font-weight`, and the color is the color of the text around the block.

The blocks of the description, such as paragraphs and lists, stand 8 px (`--g-spacing-2`) apart. Inline code has the YFM colors, `--yfm-color-inline-code` and `--yfm-color-inline-code-background`.
The links have the YFM link colors, `--yfm-color-link` and `--yfm-color-link-hover`, then `--g-color-text-link` and `--g-color-text-link-hover`, and on keyboard focus the 2 px `--g-color-line-focus` ring.
A link differs from the text by its color and has no underline. With `--g-md-header-content-plugin-link-decoration-line: underline`, the underline is 2 px thick and 0.2 em below the text and thickens to 3 px on hover, so a link differs from `++underlined++` text. Buttons inside a description keep their own styles.

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

## Button

Register `buttonPlugin` independently or together with `headerPlugin`:

```ts
import MarkdownIt from 'markdown-it';
import {buttonPlugin} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(buttonPlugin);
```

```markdown
Read the guide :button[Read more](https://example.com "Example link"){view="action" color="blue" target="_blank"} or ask a question.
```

The button is an inline directive: it stays in the line of text.
Buttons inside running text keep the spaces of the text.
The label in square brackets is plain text; Markdown inside it is shown as written, and `\]` writes a closing bracket.
The address and the title in parentheses are written and read like those of a Markdown link; the title becomes the `title` attribute.
A button without parentheses has no address. A button with an empty label renders an empty link.
Buttons work independently and inside Header.

| Attribute | Values                                                         | Default                                               |
| --------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `view`    | `action`, `normal`, `outline`, `flat`                          | `action`                                              |
| `color`   | `standard`, `gray`, `blue`, `green`, `yellow`, `red`, `violet` | `standard` for action/flat, `gray` for normal/outline |
| `target`  | `_self`, `_blank`, `_parent`, `_top`                           | `_self`                                               |

`action` does not support gray; `normal` and `outline` do not support standard.
Unsupported values use the defaults. Unknown attributes are ignored.
`md.normalizeLink` and `md.validateLink` check the address; an unsafe address is omitted. New-tab links include `rel="noopener noreferrer"`.
Colors use Gravity theme variables; the host application supplies their values.

A button with an address shows the hover fill of its color (`…-hover` variables, `--g-color-base-simple-hover` for `outline` and `flat`), shrinks while pressed and gets an outline on keyboard focus.
The fill and the label color change with a transition; `prefers-reduced-motion: reduce` turns it off.
Every view has a border, transparent except `outline`, so forced-colors mode keeps the boundary.

The size and typography are custom properties; a host overrides them:

| Property                                             | Default                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| `--g-md-button-plugin-height`                        | `36px`                                             |
| `--g-md-button-plugin-padding`                       | `var(--g-spacing-4)`                               |
| `--g-md-button-plugin-padding-block`                 | `var(--g-spacing-2)`                               |
| `--g-md-button-plugin-border-radius`                 | `var(--g-border-radius-l)`                         |
| `--g-md-button-plugin-font-size`                     | `var(--g-text-body-1-font-size)`                   |
| `--g-md-button-plugin-line-height`                   | `var(--g-text-body-1-line-height)`                 |
| `--g-md-button-plugin-border-width`                  | `1px`                                              |
| `--g-md-button-plugin-focus-outline-width`           | `2px`                                              |
| `--g-md-button-plugin-pressed-scale`                 | `0.96`                                             |
| `--g-md-button-plugin-focus-outline-color`           | `var(--g-color-line-focus)`                        |
| `--g-md-button-plugin-focus-outline-offset`          | `0`                                                |
| `--g-md-button-plugin-transition-duration-transform` | `0.1s`                                             |
| `--g-md-button-plugin-transition-duration-color`     | `0.15s`                                            |

The height is a minimum: a label that does not fit the line wraps, and the button grows.
