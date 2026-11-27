# Banner and Button Markdown plugins

markdown-it plugins for Banner containers and inline buttons.

## Sanitizer

`bannerSanitizeAllowedAttributes` holds only what the defaults of the `@diplodoc/transform` sanitizer lack (`aria-level` on `div`, for the [title](#banner-title) heading); add it to the allowed attributes of that sanitizer:

```ts
import {buildYfmHtmlBlockOptions} from '@diplodoc/html-extension';
import {bannerSanitizeAllowedAttributes} from '@gravity-ui/markdown-plugin-banner';

const sanitizeOptions = buildYfmHtmlBlockOptions({allowedAttributes: {iframe: ['srcdoc']}});
const {allowedAttributes} = sanitizeOptions;
if (allowedAttributes) {
    allowedAttributes.div = [...(allowedAttributes.div ?? []), ...bannerSanitizeAllowedAttributes.div];
}
```

## Banner

```ts
import MarkdownIt from 'markdown-it';
import {bannerPlugin} from '@gravity-ui/markdown-plugin-banner';
import '@gravity-ui/markdown-plugin-banner/styles.css';

const md = new MarkdownIt().use(bannerPlugin);
```

```markdown
:::banner{height="s" width="m" bg-color="blue-light" bg-image="./.files/photo.jpg" bg-theme="dark" bg-image-blur="true"}

:::
```

| Attribute       | Values                                                                                                     | Default  |
| --------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `height`        | `s` 236 px, `m` 300 px, `l` 420 px (minimum height)                                                        | `s`      |
| `width`         | `s` 740 px, `m` 900 px, `l` 1200 px, `full` (container width)                                              | `m`      |
| `bg-color`      | `<family>-<saturation>`: `gray`, `green`, `yellow`, `blue`, `red`, `violet` and `light`, `medium`, `heavy` | none     |
| `bg-image`      | an image address, checked as the address of a Markdown image                                               | none     |
| `bg-theme`      | the theme of the content over the image: `system` as the page, `dark` light text, `light` dark text        | `system` |
| `bg-image-blur` | `true`                                                                                                     | none     |

The block is rendered as `div.g-md-banner-plugin` with the modifiers `_height_{s,m,l}` and `_width_{s,m,l,full}`.
The `data-height` and `data-width` attributes of the element and of the opening token hold the same dimensions.
The block is left-aligned; the width is a `max-width`, so the block never exceeds its container.
Sizes are set by `--g-md-banner-plugin-height-{s,m,l}` and `--g-md-banner-plugin-width-{s,m,l}`.
Margins are set by `--g-md-banner-plugin-margin-block` (`0 var(--g-spacing-5)` by default) and `--g-md-banner-plugin-margin-inline` (`0` by default).
The corner radius uses `--g-border-radius-2xl` (16 px by default).

### Background

The fill is the `background-color` of the block, set by the `_bg-color_<value>` modifier.
The fill colors are Gravity UI tokens, declared on `.g-root` as `--g-md-banner-plugin-bg-color-<value>`.
`gray-heavy` uses `--g-color-base-neutral-heavy-hover`.

The image is the `background-image` of the block: the `_bg-image` modifier centers and scales it to cover the block, and the address is written into the `style` attribute as `url("…")`: quotes, parentheses, `*` and `\` become CSS escapes.
In the `style` attribute a relative address resolves against the page.
`bg-image-blur` adds the `_bg-image-blur` modifier: a `::before` layer under the content blurs the background of the block by 12 px within the block bounds.
`bg-theme` other than `system` adds `g-root g-root_theme_<theme>` to the block and sets the YFM text, link and inline code colors with Gravity UI tokens: text, links, inline code, and buttons use the fixed theme, and the image stays the same.
Without a fill, the page background of the fixed theme lies under the image.
The theme and blur belong to the image: without `bg-image` they are parsed as the defaults.
Background attributes with default values are not rendered; the others are copied to `data-bg-*` attributes of the element and of the opening token.

### Parsing

The block is a container directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::banner{height="xl" color="red"}` is an `s` × `m` block.
The image address goes through `md.normalizeLink` and `md.validateLink`, as the address of a Markdown image; an address they reject, such as `javascript:`, is skipped.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

## Banner title

```markdown
:::banner

::banner-title[Team portal]{size="1" color="blue"}
:::
```

| Attribute | Values                                                               | Default |
| --------- | -------------------------------------------------------------------- | ------- |
| `size`    | `1`–`6`: the typography of the headings `h1`–`h6`                    | `2`     |
| `color`   | `auto`, `gray`, `yellow`, `orange`, `red`, `green`, `blue`, `violet` | `auto`  |

The title renders as a `div` with the heading role and a level equal to its size. It stays out of the Diplodoc table of contents. In sanitized previews, [allow the heading level](#sanitizer).

The title contains plain text. Use `\[` and `\]` for literal brackets. Empty titles are hidden. Unsupported values use the defaults.

Use `--g-md-banner-title-plugin-font-weight` and `--g-md-banner-title-plugin-margin-block` to customize the title. Check the contrast of colored titles against the banner background.

## Banner content

```markdown
:::banner

:::banner-content
Read the **guide** and open the [portal](/portal).

A second paragraph with ++underlined++ text.
:::

:::
```

The description uses the same Markdown parser as the page. Underlining with `++` requires a plugin such as `markdown-it-ins`. Opening attributes are ignored. Empty descriptions are hidden.

## Button

Register `buttonPlugin` independently or together with `bannerPlugin`:

```ts
import MarkdownIt from 'markdown-it';
import {buttonPlugin} from '@gravity-ui/markdown-plugin-banner';
import '@gravity-ui/markdown-plugin-banner/styles.css';

const md = new MarkdownIt().use(buttonPlugin);
```

```markdown
Read the guide :button[Read more](https://example.com "Example link"){view="action" color="blue" target="_blank"} or ask a question.
```

The button is an inline directive: it stays in the line of text.
Buttons inside running text keep the spaces of the text.
The label in square brackets is plain text; Markdown inside it is shown as written, and `\]` writes a closing bracket.
The address and the title in parentheses are written and read like those of a Markdown link; the title becomes the `title` attribute.
A button without parentheses has no address. A button without square brackets or with an empty label renders an empty link.
Buttons work independently and inside Banner.

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
