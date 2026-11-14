# Header Markdown plugin

markdown-it plugins for the Header markup. Each block has its own plugin, and `headerPreset` enables all of them:

| Block                             | Plugin                | Markup                    |
| --------------------------------- | --------------------- | ------------------------- |
| [Header](#header)                 | `headerPlugin`        | `:::header{…}`            |
| [Header title](#header-title)     | `headerTitlePlugin`   | `::header-title[text]{…}` |
| [Header content](#header-content) | `headerContentPlugin` | `:::header-content{…}`    |
| [Header image](#header-image)     | `headerImagePlugin`   | `::header-image{…}`       |
| [Button](#button)                 | `buttonPlugin`        | `:button[label]{…}`       |

```ts
import MarkdownIt from 'markdown-it';
import {headerPreset} from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPreset);
```

A single block is enabled with its own plugin, for example `md.use(buttonPlugin)`, and has its own stylesheet, for example `import '@gravity-ui/markdown-plugin-header/button/styles.css'`: `header`, `header-title`, `header-content`, `header-image` and `button`. `styles.css` holds all five. The order of the stylesheets does not matter; a header with buttons needs the button stylesheet too.

## Exports

| Block          | Plugin                                                                     | Attributes ↔ model                                                                                                                                                                                       | Values                                                                                                                                                                                                                                 | Types                                                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header         | `headerPlugin`, `headerTokenName`, `headerClassName`                       | `headerAttrs`, `headerDimensions`, `headerDimensionsFromAttrs`, `headerLayout`, `headerLayoutValues`, `headerLayoutFromAttrs`, `headerBackground`, `headerBackgroundValues`, `headerBackgroundFromAttrs` | `headerDefaults`, `headerLayoutDefaults`, `headerBackgroundDefaults`, `headerHeights`, `headerWidths`, `headerAligns`, `headerVerticals`, `headerBgColors`, `headerBgColorFamilies`, `headerBgColorSaturations`, `headerBgImageThemes` | `HeaderDimensions`, `HeaderHeight`, `HeaderWidth`, `HeaderLayout`, `HeaderAlign`, `HeaderVertical`, `HeaderBackground`, `HeaderBgColor`, `HeaderBgColorFamily`, `HeaderBgColorSaturation`, `HeaderBgImageTheme` |
| Header title   | `headerTitlePlugin`, `headerTitleTokenName`, `headerTitleClassName`        | `headerTitleAttrs`, `headerTitle`, `headerTitleValues`, `headerTitleFromAttrs`                                                                                                                           | `headerTitleDefaults`, `headerTitleSizes`, `headerTitleColors`                                                                                                                                                                         | `HeaderTitle`, `HeaderTitleSize`, `HeaderTitleColor`                                                                                                                                                            |
| Header content | `headerContentPlugin`, `headerContentTokenName`, `headerContentClassName`  | `headerContentAttrs`, `headerContent`, `headerContentValues`, `headerContentFromAttrs`                                                                                                                   | `headerContentDefaults`, `headerContentSizes`                                                                                                                                                                                          | `HeaderContent`, `HeaderContentSize`                                                                                                                                                                            |
| Header image   | `headerImagePlugin`, `headerImageTokenName`, `headerImageClassName`        | `headerImageAttrs`, `headerImage`, `headerImageValues`, `headerImageFromAttrs`                                                                                                                           | `headerImageDefaults`                                                                                                                                                                                                                  | `HeaderImage`                                                                                                                                                                                                   |
| Button         | `buttonPlugin`, `buttonTokenName`, `buttonClassName`, `buttonRowClassName` | `buttonAttrs`, `buttonFromAttrs`                                                                                                                                                                         | `buttonDefaults`, `buttonViews`, `buttonColors`, `buttonViewColors`, `buttonTargets`                                                                                                                                                   | `ButtonModel`, `ButtonView`, `ButtonColor`, `ButtonTarget`                                                                                                                                                      |
| All blocks     | `headerPreset`                                                             | —                                                                                                                                                                                                        | —                                                                                                                                                                                                                                      | —                                                                                                                                                                                                               |
| Shared         | —                                                                          | `safeImageUrl`, `toCssUrl`                                                                                                                                                                               | `headerSanitizeAllowedAttributes`                                                                                                                                                                                                      | —                                                                                                                                                                                                               |

## Header

```markdown
:::header{height="s" width="m" align="left" vertical="center" bg-color="blue-light" bg-image="./.files/photo.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="./.files/team.jpg" alt="Team"}

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
| `bg-image`       | an `http:`, `https:`, `blob:` or relative address                                                          | none     |
| `bg-image-theme` | the theme of the content over the image: `system` as the page, `dark` light text, `light` dark text        | `system` |
| `bg-image-blur`  | `true`                                                                                                     | none     |

The block is rendered as `div.g-md-header-plugin` with the modifiers `_height_{s,m,l}` and `_width_{s,m,l,full}`; the `data-height` and `data-width` attributes of the element and of the opening token hold the same dimensions.
The alignment and the background are rendered when they differ from the defaults: the modifiers `_align_{center,right}`, `_vertical_{top,bottom}`, `_bg-color_<value>`, `_bg-image`, `_bg-image-blur` and the attributes `data-align`, `data-vertical`, `data-bg-*`.
The element also has `data-files-gallery-exclude="true"`: the files galleries of `@gravity-ui/markdown-viewer` (`FilesGallery`) and of `@gravity-ui/markdown-editor` (`useFilesGallery`) skip the images and the links inside an element with this attribute and leave the clicks on them alone, so a header image is not a gallery file and a button navigates as a link. The plugin does not depend on these packages; it writes the attribute name itself.

```html
<div
  class="g-md-header-plugin g-md-header-plugin_height_l g-md-header-plugin_width_full g-md-header-plugin_align_center g-md-header-plugin_vertical_bottom g-md-header-plugin_bg-color_blue-light"
  data-files-gallery-exclude="true"
  data-height="l"
  data-width="full"
  data-align="center"
  data-vertical="bottom"
  data-bg-color="blue-light"
>
  …
</div>
```

The block is a container directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::header{height="xl" color="red"}` is an `s` × `m` block.
An image address with another scheme, such as `javascript:` or `data:`, or with control characters, is skipped.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

### Layout

The block is left-aligned in its container; the width is a `max-width`, so the block never exceeds the container, and the height is a `min-height`, so tall content grows the block.

The block is a grid of one column, and its child blocks are the rows: the content keeps the order of the markup.
`vertical` places the rows in the height of the block, `align` aligns the text and the row of buttons.
The padding around the content is 32 px (`--g-spacing-8`), the gap between the blocks of text, such as the title and the description, is 16 px (`--g-spacing-4`), and a row of buttons stands 32 px (`--g-spacing-8`) below the text.
Long words wrap, so the content never widens the block.

An image beside the text, the [Header image](#header-image) block, takes half of the block and fills its height with 8 px (`--g-spacing-2`) around it: on the right of the text, and on the left of a right-aligned text. The image is cropped to its box (`object-fit: cover`), so its proportions never change the size of the header.
The corners of the image are concentric with the corners of the block: the radius of the block less the space around the image, 16 − 8 = 8 px by default. A host that changes `--g-md-header-plugin-border-radius` or `--g-md-header-plugin-image-padding` changes the corners of the image with them; `--g-md-header-image-plugin-border-radius` sets them directly.
A centered header has no place for an image: write an image with `align="left"` or `align="right"`.

`left` and `right` of `align` are the start and the end of the line (`text-align: start` and `end`, logical insets of the image), as the row of buttons: in a right-to-left page the sides swap, and `align="right"` puts the text and the buttons on the left and the image on the right.

A header narrower than 600 px has the narrow layout; it follows the width of the block itself (a container query), not of the window:

- the padding around the content is 16 px (`--g-spacing-4`);
- the image stands at the top, above the text, with 8 px (`--g-spacing-2`) around it, as wide as the block and 16:10 in proportions; `vertical` places only the text under it, and an image without text fills the height of the block;
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
| `--g-md-header-plugin-buttons-gap`                 | `var(--g-spacing-8)`, the text and buttons |
| `--g-md-header-plugin-image-width`                 | `50%`                                      |
| `--g-md-header-plugin-image-padding`               | `var(--g-spacing-2)`                       |
| `--g-md-header-plugin-blur`                        | `12px`                                     |
| `--g-md-header-plugin-blur-inset`                  | `24px`                                     |
| `--g-md-header-plugin-narrow-padding`              | `var(--g-spacing-4)`                       |
| `--g-md-header-plugin-narrow-image-aspect-ratio`   | `16 / 10`                                  |
| `--g-md-header-plugin-narrow-button-height`        | `44px`                                     |
| `--g-md-header-plugin-narrow-button-border-radius` | `var(--g-border-radius-xl)`                |
| `--g-md-header-plugin-narrow-button-padding`       | `var(--g-spacing-6)`                       |
| `--g-md-header-plugin-narrow-button-font-size`     | `var(--g-text-body-2-font-size)`           |
| `--g-md-header-plugin-narrow-button-line-height`   | `var(--g-text-body-2-line-height)`         |
| `--g-md-header-plugin-button-focus-outline-color`  | `var(--g-color-text-primary)`              |
| `--g-md-header-plugin-link-focus-outline-color`    | the focus ring color of the buttons        |
| `--g-md-header-plugin-link-color`                  | `currentColor`                             |
| `--g-md-header-plugin-link-hover-color`            | `currentColor`                             |
| `--g-md-header-plugin-link-decoration-line`        | `underline` (`text-decoration-line`)       |
| `--g-md-header-plugin-code-color`                  | `currentColor`                             |
| `--g-md-header-plugin-code-background`             | `var(--g-color-base-generic)`              |

The width at which the narrow layout starts is fixed: a container query takes no custom property.

In print the block keeps its fill and image (`print-color-adjust: exact`), so light text stays readable, and is not split across pages (`break-inside: avoid`). An `action` or `normal` button keeps its fill in print as well.

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

On every fill and on an image the links of the [description](#header-content) take the color of the text around them with an underline: the link color of the page is not readable on a fill (about 2:1 on the light fills of the default theme) or on an image. On an image and on the `medium` and `heavy` fills the links also show keyboard focus with the ring of the buttons, and the inline code takes the text color on a translucent fill (`--g-color-base-generic`). The block sets `--g-md-header-content-plugin-link-color`, `-link-hover-color`, `-link-decoration-line`, `-link-focus-outline-color`, `-code-color` and `-code-background` for that; a host changes them there with `--g-md-header-plugin-link-color`, `-link-hover-color`, `-link-decoration-line`, `-link-focus-outline-color`, `-code-color` and `-code-background`. Without a fill the links and the code are the ones of the page; on the light fills the code and the focus rings are.

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
A sanitizer has to allow `aria-level`: the default list of `@diplodoc/transform` keeps `role` and drops the level, and a heading without a level is read as a heading of level 2.
`headerSanitizeAllowedAttributes` lists the attributes of the header blocks to add to the allowed attributes of the sanitizer:

```ts
import {headerSanitizeAllowedAttributes} from '@gravity-ui/markdown-plugin-header';

const allowedAttributes = {iframe: ['srcdoc'], ...headerSanitizeAllowedAttributes};
```

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

These colors are the colored text of the editor and are not all readable as a title: on the page `yellow` and `orange` are below the WCAG AA contrast, `green` and `blue` too at sizes `4`–`6`, and a color is barely visible on a fill of its own family.
Use colored titles at sizes `1`–`3` on the page or on light fills, avoid the color of the fill's family, or set `--yfm-colorify-<color>` to the colors your theme needs.

| Property                                  | Default                               |
| ----------------------------------------- | ------------------------------------- |
| `--g-md-header-title-plugin-font-weight`  | the weight of the size, see the table |
| `--g-md-header-title-plugin-margin-block` | `0 var(--g-spacing-4)`                |

Inside Header the title is a row of the header layout: the header sets the space around it, 16 px to the description and 32 px to the buttons. The margin applies to a title outside Header.

## Header content

```markdown
:::header

:::header-content{size="3"}
Portal description with **bold**, _italic_, ++underlined++, ~~strikethrough~~ and `monospace` text and a [link](/page).

Second paragraph.
:::
:::
```

| Attribute | Values                                                               | Default      |
| --------- | -------------------------------------------------------------------- | ------------ |
| `size`    | `1`–`6`: the font size and the line height of the headings `h1`–`h6` | regular text |

```html
<div class="g-md-header-plugin …">
  <div class="g-md-header-content-plugin g-md-header-content-plugin_size_3" data-size="3">
    <p>
      Portal description with <strong>bold</strong>, <em>italic</em>, <ins>underlined</ins>,
      <s>strikethrough</s> and <code>monospace</code> text and a <a href="/page">link</a>.
    </p>
    <p>Second paragraph.</p>
  </div>
</div>
```

The block is a `div.g-md-header-content-plugin`; a size adds the `_size_<size>` modifier and the `data-size` attribute, and `headerContentFromAttrs` reads the size back. Regular text has neither.

The description is a container directive: the opening line, the paragraphs and the closing line `:::`.
Its content is ordinary Markdown of the same parser, so the marks and the links are the ones the parser has: `++underlined++` needs a plugin for it, such as `markdown-it-ins`, which YFM and the editor include.
A description without a text, `:::header-content` right before `:::`, keeps its tokens and renders nothing.

An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::header-content{size="7" color="red"}` is regular text.

### Content styles

| Size | Font size and line height                                        | Gravity UI typography |
| ---- | ---------------------------------------------------------------- | --------------------- |
| none | `--yfm-font-size`, `--yfm-font-line-height`: 15 px / 20 px       | `body-2`              |
| `1`  | `--yfm-font-size-h1`, `--yfm-font-line-height-h1`: 32 px / 40 px | `display-2`           |
| `2`  | `--yfm-font-size-h2`, `--yfm-font-line-height-h2`: 24 px / 28 px | `header-2`            |
| `3`  | `--yfm-font-size-h3`, `--yfm-font-line-height-h3`: 20 px / 24 px | `header-1`            |
| `4`  | `--yfm-font-size-h4`, `--yfm-font-line-height-h4`: 17 px / 24 px | `subheader-3`         |
| `5`  | `--yfm-font-size-h5`, `--yfm-font-line-height-h5`: 15 px / 20 px | `subheader-2`         |
| `6`  | `--yfm-font-size-h6`, `--yfm-font-line-height-h6`: 13 px / 18 px | `subheader-1`         |

Without a size the description is the regular text of the page. A size takes the font size and the line height of the YFM heading of that level, as the [title](#title-styles) does; where the variables are not set, it takes the Gravity UI typography of the same size.
The weight is the weight of regular text in every size, `--g-text-body-font-weight`: a description of size `2` is as large as the default title and is not bold. The color is the color of the text around the block.

The paragraphs stand 8 px (`--g-spacing-2`) apart. Inline code has the YFM colors, `--yfm-color-inline-code` and `--yfm-color-inline-code-background`, and scales with the size.
The links have the YFM link colors, `--yfm-color-link` and `--yfm-color-link-hover`, then `--g-color-text-link` and `--g-color-text-link-hover`, and on keyboard focus the 2 px `--g-color-line-focus` ring of the UIKit link. On a fill or an image a header gives the links the text color and an underline, and on an image and the `medium` and `heavy` fills the inline code the text color and the links the focus ring of the buttons, see [Background](#background).
A link underline is 2 px thick and 0.2 em below the text and thickens to 3 px on hover, so a link differs from `++underlined++` text, which keeps the thin underline of the browser. Buttons and fenced code blocks inside a description keep their own styles.

| Property                                                       | Default                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--g-md-header-content-plugin-font-weight`                     | `var(--g-text-body-font-weight)`                                                                |
| `--g-md-header-content-plugin-paragraph-gap`                   | `var(--g-spacing-2)`                                                                            |
| `--g-md-header-content-plugin-margin-block`                    | `0 var(--g-spacing-4)`                                                                          |
| `--g-md-header-content-plugin-link-color`                      | `var(--yfm-color-link)`; the text color on a fill or an image                                   |
| `--g-md-header-content-plugin-link-hover-color`                | `var(--yfm-color-link-hover)`; the text color on a fill or an image                             |
| `--g-md-header-content-plugin-link-decoration-line`            | `none`; `underline` on a fill or an image (`text-decoration-line`)                              |
| `--g-md-header-content-plugin-link-decoration-thickness`       | `2px`                                                                                           |
| `--g-md-header-content-plugin-link-hover-decoration-thickness` | `3px`                                                                                           |
| `--g-md-header-content-plugin-link-underline-offset`           | `0.2em`                                                                                         |
| `--g-md-header-content-plugin-link-focus-outline-width`        | `2px`                                                                                           |
| `--g-md-header-content-plugin-link-focus-outline-color`        | `var(--g-color-line-focus)`; the button ring on a header background                             |
| `--g-md-header-content-plugin-code-color`                      | `var(--yfm-color-inline-code)`; the text color on a header background                           |
| `--g-md-header-content-plugin-code-background`                 | `var(--yfm-color-inline-code-background)`; `var(--g-color-base-generic)` on a header background |

Inside Header the description is a row of the header layout: the header sets the space around it, 16 px below the title and 32 px to the buttons. The margin applies to a description outside Header.

## Header image

```markdown
:::header

::header-image{src="./.files/team.jpg" alt="Team" title="Project team"}

::header-title[Team portal]
:::
```

| Attribute | Values                                                      | Default |
| --------- | ----------------------------------------------------------- | ------- |
| `src`     | an `http:`, `https:`, `blob:` or relative address           | none    |
| `alt`     | the alternative text; an empty one marks a decorative image | empty   |
| `title`   | the native browser tooltip of the image                     | none    |

```html
<div class="g-md-header-plugin …">
  <img
    class="g-md-header-image-plugin"
    data-files-gallery-exclude="true"
    src="./.files/team.jpg"
    alt="Team"
    title="Project team"
  />
  <div
    class="g-md-header-title-plugin g-md-header-title-plugin_size_2"
    role="heading"
    aria-level="2"
  >
    Team portal
  </div>
</div>
```

The block is an `img.g-md-header-image-plugin` with the `src`, `alt` and `title` attributes; `headerImageFromAttrs` reads them back.
The image has `data-files-gallery-exclude="true"` of its own, as [Header](#header) does: it stays out of the files galleries outside a header too.
The `alt` attribute is always rendered: without it a screen reader announces the address of the image, and with an empty one it skips the image as decorative. An empty `title` is not rendered.
`title` is the native tooltip of the browser for pointer users: it is not shown on touch or keyboard focus, and it does not describe the image to screen readers. An image with `title` and without `alt` is still decorative (`alt="" title="…"`); an image that matters needs `alt`.

The image is a leaf block directive: one line with the attributes, no text in square brackets and no closing line. It stands after an empty line, as a paragraph does.

The address passes the same check as the background image of a header, `safeImageUrl`: an address with another scheme, such as `javascript:` or `data:`, or with control characters, is skipped.
An image without an address, or with a skipped one, keeps its token and renders nothing.
The values are taken as written: HTML entities in them are not decoded, so `/image?a=1&copy=2` stays this address, and `\"` writes a quote.
An unknown attribute is skipped; a repeated attribute counts as not set.

### Image styles

Inside Header the image has a box of its own, see [Layout](#layout): half of the block beside the text, or the full width above the text in the narrow layout. The image fills the box and is cropped to it (`object-fit: cover`), whatever its proportions are; an image that fails to load leaves the box with its fill and its alternative text, and the layout of the header stays the same.
Inside Header the corners of the image follow the corners of the header, see [Layout](#layout); outside Header they are `--g-border-radius-xl`.
The fill is the image placeholder of the mock, `--g-color-base-float-hover`: it is solid, so it also lies under the transparent parts of an image and hides the header there. A host that uses transparent images sets `--g-md-header-image-plugin-background` to `transparent` or to the translucent `--g-color-base-generic`.

Outside Header the image is a block of its own size, not wider than its container.

| Property                                   | Default                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `--g-md-header-image-plugin-border-radius` | `var(--g-border-radius-xl)`, in Header the radius of the header less `--g-md-header-plugin-image-padding` |
| `--g-md-header-image-plugin-background`    | `var(--g-color-base-float-hover)`                                                                         |
| `--g-md-header-image-plugin-margin-block`  | `0 var(--g-spacing-4)`                                                                                    |

The margin applies to an image outside Header.

## Button

```markdown
:button[Read more]{href="https://example.com" view="action" color="blue" target="\_blank"}

:button[Open]{href="/page" view="action" color="blue"} :button[Docs]{href="/docs" view="normal" color="gray"} :button[Skip]{view="flat" color="standard"}
```

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

The button is rendered as a link:

```html
<a
  class="g-md-button-plugin g-md-button-plugin_view_action g-md-button-plugin_color_blue"
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  data-view="action"
  data-color="blue"
  >Read more</a
>
```

- Without `href`, or with an unsafe one (`javascript:`, `data:`, `vbscript:`, `file:`), the `<a>` has no `href` and is not interactive.
- `target="_blank"` adds `rel="noopener noreferrer"`; `_self` is not rendered.
- The address is taken as written: HTML entities in it are not decoded, so `/page?a=1&copy=2` and `/image&copy;.png` keep their `&copy`. `\"` writes a quote.
- `data-view` and `data-color` of the element and of the token hold the resolved view and color.

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
  <p class="g-md-button-plugin-row">
    <a …>Open</a>
    <a …>Docs</a>
    <a …>Skip</a>
  </p>
</div>
```

The tokens stay as parsed: the paragraph tokens between the buttons are marked `hidden`, as in a tight list.
Outside Header each paragraph of buttons is a row of its own.

An unsupported value is replaced with the default, and a color the view lacks with the first color of the view. Unknown attributes are skipped.

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
