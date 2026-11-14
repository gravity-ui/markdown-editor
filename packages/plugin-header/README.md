# Header Markdown plugin

markdown-it plugins for the Header markup. Each block has its own plugin, and `headerPreset` enables all of them:

| Block                         | Plugin              | Markup                    |
| ----------------------------- | ------------------- | ------------------------- |
| [Header](#header)             | `headerPlugin`      | `:::header{…}`            |
| [Header title](#header-title) | `headerTitlePlugin` | `::header-title[text]{…}` |
| [Button](#button)             | `buttonPlugin`      | `:button[label]{…}`       |

```ts
import MarkdownIt from 'markdown-it';
import {headerPreset} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPreset);
```

A single block is enabled with its own plugin, for example `md.use(buttonPlugin)`.

## Header

```markdown
:::header{height="s" width="m" align="left" vertical="center" bg-color="blue-light" bg-image="./.files/photo.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Open]{href="/page" view="action" color="blue"}
:::
```

| Attribute        | Values                                                                                                     | Default  |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `height`         | `s` 236 px, `m` 300 px, `l` 360 px (minimum height)                                                        | `s`      |
| `width`          | `s` 600 px, `m` 900 px, `l` 1200 px, `full` (container width)                                              | `m`      |
| `align`          | `left`, `center`, `right`: the text and the buttons along the line                                         | `left`   |
| `vertical`       | `top`, `center`, `bottom`: the content in the height of the block                                          | `center` |
| `bg-color`       | `<family>-<saturation>`: `gray`, `green`, `yellow`, `blue`, `red`, `violet` and `light`, `medium`, `heavy` | none     |
| `bg-image`       | an `http:`, `https:` or relative address                                                                   | none     |
| `bg-image-theme` | the theme of the content over the image: `system` as the page, `dark` light text, `light` dark text        | `system` |
| `bg-image-blur`  | `true`                                                                                                     | none     |

The block is rendered as `div.g-md-header-plugin` with the modifiers `_height_{s,m,l}` and `_width_{s,m,l,full}`; the `data-height` and `data-width` attributes of the element and of the opening token hold the same dimensions.
The alignment and the background are rendered when they differ from the defaults: the modifiers `_align_{center,right}`, `_vertical_{top,bottom}`, `_bg-color_<value>`, `_bg-image`, `_bg-image-blur` and the attributes `data-align`, `data-vertical`, `data-bg-*`.

```html
<div class="g-md-header-plugin g-md-header-plugin_height_l g-md-header-plugin_width_full g-md-header-plugin_align_center g-md-header-plugin_vertical_bottom g-md-header-plugin_bg-color_blue-light"
     data-height="l" data-width="full" data-align="center" data-vertical="bottom" data-bg-color="blue-light">
…
</div>
```

### Layout

The block is left-aligned in its container; the width is a `max-width`, so the block never exceeds the container, and the height is a `min-height`, so tall content grows the block.

The block is a grid of one column, and its child blocks are the rows: the content keeps the order of the markup.
`vertical` places the rows in the height of the block, `align` aligns the text and the row of buttons.
The padding around the content is 32 px (`--g-spacing-8`), the gap between the blocks of text is 16 px (`--g-spacing-4`), and a row of buttons stands 32 px (`--g-spacing-8`) below the text.
Long words wrap, so the content never widens the block.

An image beside the text, an element with the class `g-md-header-image-plugin`, takes half of the block and fills its height with 8 px (`--g-spacing-2`) around it: on the right of the text, and on the left of a right-aligned text.

`left` and `right` of `align` are the start and the end of the line (`text-align: start` and `end`, logical insets of the image), as the row of buttons: in a right-to-left page the sides swap, and `align="right"` puts the text and the buttons on the left and the image on the right.

A header narrower than 600 px has the narrow layout; it follows the width of the block itself (a container query), not of the window:

- the padding around the content is 16 px (`--g-spacing-4`);
- the image stands above the text;
- the buttons stand in a column of the full width and have the size `xl` of the UIKit button: 44 px high, the `--g-border-radius-xl` corners, 24 px (`--g-spacing-6`) padding and the `body-2` text.

The alignment stays as set. The block is a query container named `g-md-header-plugin`.

The numbers are custom properties; a host overrides them:

| Property                                           | Default                                    |
| -------------------------------------------------- | ------------------------------------------ |
| `--g-md-header-plugin-height-{s,m,l}`              | `236px`, `300px`, `360px`                  |
| `--g-md-header-plugin-width-{s,m,l}`               | `600px`, `900px`, `1200px`                 |
| `--g-md-header-plugin-margin-block`                | `0 var(--g-spacing-5)`                     |
| `--g-md-header-plugin-margin-inline`               | `0`                                        |
| `--g-md-header-plugin-border-radius`               | `var(--g-border-radius-2xl)`, 16 px        |
| `--g-md-header-plugin-padding`                     | `var(--g-spacing-8)`                       |
| `--g-md-header-plugin-text-gap`                    | `var(--g-spacing-4)`                       |
| `--g-md-header-plugin-gap`                         | `var(--g-spacing-8)`, the text and buttons |
| `--g-md-header-plugin-image-width`                 | `50%`                                      |
| `--g-md-header-plugin-image-padding`               | `var(--g-spacing-2)`                       |
| `--g-md-header-plugin-blur`                        | `12px`                                     |
| `--g-md-header-plugin-blur-inset`                  | `24px`                                     |
| `--g-md-header-plugin-narrow-padding`              | `var(--g-spacing-4)`                       |
| `--g-md-header-plugin-narrow-button-height`        | `44px`                                     |
| `--g-md-header-plugin-narrow-button-border-radius` | `var(--g-border-radius-xl)`                |
| `--g-md-header-plugin-narrow-button-padding`       | `var(--g-spacing-6)`                       |
| `--g-md-header-plugin-narrow-button-font-size`     | `var(--g-text-body-2-font-size)`           |
| `--g-md-header-plugin-narrow-button-line-height`   | `var(--g-text-body-2-line-height)`         |
| `--g-md-header-plugin-button-focus-outline-color`  | `var(--g-color-text-primary)`              |

The width at which the narrow layout starts is fixed: a container query takes no custom property.

### Background

The fill is the `background-color` of the block, set by the `_bg-color_<value>` modifier.
The fill colors are Gravity UI tokens, declared on `.g-root` as `--g-md-header-plugin-bg-color-<value>`.
`gray-heavy` uses `--g-color-base-neutral-heavy-hover`.

The image is the `background-image` of the block: the `_bg-image` modifier centers and scales it to cover the block, and the address is written into the `style` attribute as a percent-encoded `url("…")`.
In the `style` attribute a relative address resolves against the page; the address passes the scheme check first.
The address is taken as written: HTML entities in it are not decoded, so `/image&copy;.png` and `/a.png?x=1&copy=2` keep their `&copy`. `\"` writes a quote.

`bg-image-blur` adds the `_bg-image-blur` modifier: a `::before` layer under the content repeats the background blurred by 12 px and extends 24 px past the edges, so the blur has no transparent border.
The block clips the layer (`overflow: clip`), and the allowance adds nothing to the scroll area of the page.

`bg-image-theme` other than `system` adds `g-root g-root_theme_<theme>` to the block and sets the YFM text, link and inline code colors with Gravity UI tokens: text, links, inline code and buttons use the fixed theme, and the image stays the same.
The block is then a nested Gravity UI theme root, as a nested `ThemeProvider`: `.g-root` also declares the spacing, radius and typography tokens with the UIKit defaults. A host that changes these tokens declares them on `.g-root`, as the UIKit theming guide says, so they reach the nested root too.
The typography stays as in the place of the block: the font of `.g-root` is not applied.
Without a fill, the page background of the fixed theme lies under the image.
The theme and blur belong to the image: without `bg-image` they are parsed as the defaults.

On an image and on the `medium` and `heavy` fills every button shows its keyboard focus with a ring of the text color (`--g-color-text-primary`): neither `--g-color-line-focus` nor the fill color of `action` would be seen there. The block sets `--g-md-button-plugin-focus-outline-color` for that; a host changes the ring there with `--g-md-header-plugin-button-focus-outline-color`. The light fills keep the rings of the page.

### Parsing

The block is a container directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::header{height="xl" color="red"}` is an `s` × `m` block.
An image address with another scheme, such as `javascript:` or `data:`, or with control characters, is skipped.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

## Header title

```markdown
:::header

::header-title[Team portal]{size="1" color="blue"}
:::
```

```html
<div class="g-md-header-plugin …">
<div class="g-md-header-title-plugin g-md-header-title-plugin_size_1 g-md-header-title-plugin_color_blue" role="heading" aria-level="1" data-size="1" data-color="blue">Team portal</div>
</div>
```

The title is a leaf block directive: one line with the text in square brackets and no closing line. It stands after an empty line, as a paragraph does.
The text is plain: Markdown and HTML entities inside it are shown as written, and `\]` writes a closing bracket.
A title without a text, `::header-title[]`, keeps its token and renders nothing.

| Attribute | Values                                                               | Default |
| --------- | -------------------------------------------------------------------- | ------- |
| `size`    | `1`–`6`: the typography of the headings `h1`–`h6`                    | `2`     |
| `color`   | `auto`, `gray`, `yellow`, `orange`, `red`, `green`, `blue`, `violet` | `auto`  |

An unknown attribute is skipped, and an unsupported value is replaced with the default: `::header-title[Team portal]{size="7" color="pink"}` is a title of size `2` in the `auto` color.

The title is a `div` with `role="heading"` and `aria-level` of its size, so it is a heading for assistive technology and stays out of the heading tags of the page. The size and the color other than the defaults are also written to `data-size` and `data-color`; `headerTitleFromAttrs` reads them back.
A sanitizer has to allow `aria-level`: the default list of `@diplodoc/transform` keeps `role` and drops the level, and a heading without a level is read as a heading of level 2.

### Title styles

| Size | Font size and line height                                        | Gravity UI typography |
| ---- | ---------------------------------------------------------------- | --------------------- |
| `1`  | `--yfm-font-size-h1`, `--yfm-font-line-height-h1`: 32 px / 40 px | `display-2`           |
| `2`  | `--yfm-font-size-h2`, `--yfm-font-line-height-h2`: 24 px / 28 px | `header-2`            |
| `3`  | `--yfm-font-size-h3`, `--yfm-font-line-height-h3`: 20 px / 24 px | `header-1`            |
| `4`  | `--yfm-font-size-h4`, `--yfm-font-line-height-h4`: 17 px / 24 px | `subheader-3`         |
| `5`  | `--yfm-font-size-h5`, `--yfm-font-line-height-h5`: 15 px / 20 px | `subheader-2`         |
| `6`  | `--yfm-font-size-h6`, `--yfm-font-line-height-h6`: 13 px / 18 px | `subheader-1`         |

A size takes the variables of the YFM heading of that level; where they are not set, it takes the Gravity UI typography of the same size.
The weight is `--g-text-header-font-weight`.

The `auto` color is the color of the text around the title: in a header it follows the page theme, and over a background image the theme of the image.
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

| Property                                  | Default                            |
| ----------------------------------------- | ---------------------------------- |
| `--g-md-header-title-plugin-font-weight`  | `var(--g-text-header-font-weight)` |
| `--g-md-header-title-plugin-margin-block` | `0 var(--g-spacing-4)`             |

Inside Header the title is a row of the header layout: the header sets the space around it, 16 px to the description and 32 px to the buttons. The margin applies to a title outside Header.

## Button

`buttonPlugin` works on its own and inside Header:

```ts
import {buttonPlugin} from '@gravity-ui/markdown-plugin-header';

md.use(buttonPlugin);
```

```markdown
:button[Read more]{href="https://example.com" view="action" color="blue" target="_blank"}

:button[Open]{href="/page" view="action" color="blue"} :button[Docs]{href="/docs" view="normal" color="gray"} :button[Skip]{view="flat" color="standard"}
```

The button is an inline directive: it stays in the line of text, and buttons written one after another in a paragraph, separated by spaces, form a row.
A paragraph that holds only buttons, spaces and line breaks gets the class `g-md-button-plugin-row` (`buttonRowClassName`): a wrapping flex row with a gap between the buttons and between the lines.
Buttons inside running text keep the spaces of the text.
The label in square brackets is plain text: Markdown and HTML entities inside it are shown as written, and `\]` writes a closing bracket.
A button with an empty label renders nothing, and a paragraph of such buttons renders no `<p>`.

Inside Header every button may stand in its own paragraph; paragraphs of buttons that follow one another render as one row:

```markdown
:::header

:button[Open]{href="/page" view="action" color="blue"}

:button[Docs]{href="/docs" view="normal" color="gray"}

:button[Skip]{view="flat" color="standard"}
:::
```

```html
<div class="g-md-header-plugin …">
<p class="g-md-button-plugin-row"><a …>Open</a>
<a …>Docs</a>
<a …>Skip</a></p>
</div>
```

The tokens stay as parsed: the paragraph tokens between the buttons are marked `hidden`, as in a tight list.
Outside Header each paragraph of buttons is a row of its own.

| Attribute | Values                                                         | Default                                                               |
| --------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| `href`    | a link address                                                 | none                                                                  |
| `view`    | `action`, `normal`, `outline`, `flat`                          | `action`                                                              |
| `color`   | `standard`, `gray`, `blue`, `green`, `yellow`, `red`, `violet` | `standard` for `action` and `flat`, `gray` for `normal` and `outline` |
| `target`  | `_self`, `_blank`, `_parent`, `_top`                           | `_self`                                                               |

Each view has its own colors:

| View      | Look            | Colors                                                         |
| --------- | --------------- | -------------------------------------------------------------- |
| `action`  | solid fill      | `standard`, `blue`, `green`, `yellow`, `red`, `violet`         |
| `normal`  | light fill      | `gray`, `blue`, `green`, `yellow`, `red`, `violet`             |
| `outline` | border, no fill | `gray`, `blue`, `green`, `yellow`, `red`, `violet`             |
| `flat`    | label only      | `standard`, `gray`, `blue`, `green`, `yellow`, `red`, `violet` |

An unsupported value is replaced with the default, and a color the view lacks with the first color of the view. Unknown attributes are skipped.

The button is rendered as a link:

```html
<a class="g-md-button-plugin g-md-button-plugin_view_action g-md-button-plugin_color_blue"
   href="https://example.com" target="_blank" rel="noopener noreferrer"
   data-view="action" data-color="blue">Read more</a>
```

- Without `href`, or with an unsafe one (`javascript:`, `data:`, `vbscript:`, `file:`), the `<a>` has no `href` and is not interactive.
- `target="_blank"` adds `rel="noopener noreferrer"`; `_self` is not rendered.
- The address is taken as written: HTML entities in it are not decoded, so `/page?a=1&copy=2` and `/image&copy;.png` keep their `&copy`. `\"` writes a quote.
- `data-view` and `data-color` of the element and of the token hold the resolved view and color.

### Button styles

Colors are Gravity UI theme tokens; the host application supplies their values. `blue` uses the `info` family, `green` `positive`, `yellow` `warning`, `red` `danger`, `violet` `utility`:

| View      | Fill                            | Label                                           | Border                    |
| --------- | ------------------------------- | ----------------------------------------------- | ------------------------- |
| `action`  | `--g-color-base-<family>-heavy` | `--g-color-text-light-primary` (dark on yellow) | none                      |
| `normal`  | `--g-color-base-<family>-light` | `--g-color-text-<family>-heavy`                 | none                      |
| `outline` | none                            | `--g-color-text-<family>`                       | `--g-color-line-<family>` |
| `flat`    | none                            | `--g-color-text-<family>`                       | none                      |

`standard` is the contrast fill with inverted text for `action` and the primary text color for `flat`; `gray` uses the generic fill and line with the primary text, and the secondary text for `flat`.

A button with an address shows the hover fill of its family (`…-hover` tokens, `--g-color-base-simple-hover` for `outline` and `flat`), shrinks while pressed and gets a `--g-color-line-focus` outline on keyboard focus.
As in the UIKit button, the outline of `action` has the fill color and a 1 px gap, the fill and the label color change with a transition (none with `prefers-reduced-motion: reduce`), and every view has a real border, transparent except `outline`, so forced-colors mode keeps the boundary.

The light `action` labels on the `blue`, `green`, `red` and `violet` fills follow the mock; with the default Gravity UI themes their contrast is below WCAG AA, and a host theme can raise it through the fill tokens.

The size and typography are custom properties; a host overrides them:

| Property                                             | Default                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `--g-md-button-plugin-height`                        | `36px`                                                   |
| `--g-md-button-plugin-padding`                       | `var(--g-spacing-4)`                                     |
| `--g-md-button-plugin-border-radius`                 | `var(--g-border-radius-l)`                               |
| `--g-md-button-plugin-font-size`                     | `var(--g-text-body-1-font-size)`                         |
| `--g-md-button-plugin-line-height`                   | `var(--g-text-body-1-line-height)`                       |
| `--g-md-button-plugin-border-width`                  | `1px`                                                    |
| `--g-md-button-plugin-focus-outline-width`           | `2px`                                                    |
| `--g-md-button-plugin-pressed-scale`                 | `0.96`                                                   |
| `--g-md-button-plugin-focus-outline-color`           | `var(--g-color-line-focus)`; the fill color for `action` |
| `--g-md-button-plugin-focus-outline-offset`          | `0`; `1px` for `action`                                  |
| `--g-md-button-plugin-transition-duration-transform` | `0.1s`                                                   |
| `--g-md-button-plugin-transition-duration-color`     | `0.15s`                                                  |
| `--g-md-button-plugin-gap`                           | `var(--g-spacing-4)`, between the buttons of a row       |

The height is a minimum: a label that does not fit the line wraps, and the button grows.
