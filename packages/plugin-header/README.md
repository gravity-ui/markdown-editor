# Header Markdown plugin

markdown-it plugins for the Header markup. Each block has its own plugin, and `headerPreset` enables all of them:

| Block             | Plugin         | Markup              |
| ----------------- | -------------- | ------------------- |
| [Header](#header) | `headerPlugin` | `:::header{…}`      |
| [Button](#button) | `buttonPlugin` | `:button[label]{…}` |

```ts
import MarkdownIt from 'markdown-it';
import {headerPreset} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPreset);
```

A single block is enabled with its own plugin, for example `md.use(buttonPlugin)`.

## Header

```markdown
:::header{height="s" width="m" bg-color="blue-light" bg-image="./.files/photo.jpg" bg-image-theme="dark" bg-image-blur="true"}

:::
```

| Attribute        | Values                                                                                                     | Default  |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `height`         | `s` 236 px, `m` 300 px, `l` 360 px (minimum height)                                                        | `s`      |
| `width`          | `s` 600 px, `m` 900 px, `l` 1200 px, `full` (container width)                                              | `m`      |
| `bg-color`       | `<family>-<saturation>`: `gray`, `green`, `yellow`, `blue`, `red`, `violet` and `light`, `medium`, `heavy` | none     |
| `bg-image`       | an `http:`, `https:` or relative address                                                                   | none     |
| `bg-image-theme` | the theme of the content over the image: `system` as the page, `dark` light text, `light` dark text        | `system` |
| `bg-image-blur`  | `true`                                                                                                     | none     |

The block is rendered as `div.g-md-header-plugin` with the modifiers `_height_{s,m,l}` and `_width_{s,m,l,full}`.
The `data-height` and `data-width` attributes of the element and of the opening token hold the same dimensions.
The block is left-aligned; the width is a `max-width`, so the block never exceeds its container.
Sizes are set by `--g-md-header-plugin-height-{s,m,l}` and `--g-md-header-plugin-width-{s,m,l}`.
Margins are set by `--g-md-header-plugin-margin-block` (`0 var(--g-spacing-5)` by default) and `--g-md-header-plugin-margin-inline` (`0` by default).
The corner radius uses `--g-border-radius-2xl` (16 px by default).

## Background

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

## Parsing

The block is a container directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::header{height="xl" color="red"}` is an `s` × `m` block.
An image address with another scheme, such as `javascript:` or `data:`, or with control characters, is skipped.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

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
A button with an empty label renders nothing.

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
| `--g-md-button-plugin-focus-outline-offset`          | `0`                                                      |
| `--g-md-button-plugin-action-focus-outline-offset`   | `1px`                                                    |
| `--g-md-button-plugin-transition-duration-transform` | `0.1s`                                                   |
| `--g-md-button-plugin-transition-duration-color`     | `0.15s`                                                  |
| `--g-md-button-plugin-gap`                           | `var(--g-spacing-4)`, between the buttons of a row       |

The height is a minimum: a label that does not fit the line wraps, and the button grows.
