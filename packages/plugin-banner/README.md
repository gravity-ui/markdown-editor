# Banner Markdown plugin

markdown-it plugins for the Banner markup. Each block has its own plugin, and `bannerPreset` enables all of them:

| Block                             | Plugin                | Markup                    |
| --------------------------------- | --------------------- | ------------------------- |
| [Banner](#banner)                 | `bannerPlugin`        | `:::banner{…}`            |
| [Banner title](#banner-title)     | `bannerTitlePlugin`   | `::banner-title[text]{…}` |
| [Banner content](#banner-content) | `bannerContentPlugin` | `:::banner-content`       |
| [Banner image](#banner-image)     | `bannerImagePlugin`   | `::banner-image{…}`       |
| [Button](#button)                 | `buttonPlugin`        | `:button[label]{…}`       |

```ts
import MarkdownIt from 'markdown-it';
import {bannerPreset} from '@gravity-ui/markdown-plugin-banner';
import '@gravity-ui/markdown-plugin-banner/styles.css';

const md = new MarkdownIt().use(bannerPreset);
```

A single block is enabled with its own plugin, for example `md.use(buttonPlugin)`, and has its own stylesheet, for example `import '@gravity-ui/markdown-plugin-banner/button/styles.css'`: `banner`, `banner-title`, `banner-content`, `banner-image` and `button`. `styles.css` holds all five. The order of the stylesheets does not matter; a banner with buttons needs the button stylesheet too.

## Browser support

The styles use container queries with `cqi` units (Chrome 105, Safari 16, Firefox 110), `:has()` (Chrome 105, Safari 15.4, Firefox 121) and `:nth-child(… of S)` (Chrome 111, Safari 9, Firefox 113): the minimum is Chrome 111, Safari 16 and Firefox 121. In an older browser a banner with an image has no image column, and the image covers the text.

## Sanitizer

`bannerSanitizeAllowedAttributes` holds only what the defaults of the `@diplodoc/transform` sanitizer lack (`aria-level` on `div`, for the [title](#banner-title) heading); add it to the allowed attributes of that sanitizer:

```ts
import {bannerSanitizeAllowedAttributes} from '@gravity-ui/markdown-plugin-banner';

const allowedAttributes = {iframe: ['srcdoc'], ...bannerSanitizeAllowedAttributes};
```

Another allow-list sanitizer has to keep every attribute the blocks use, otherwise they lose their look or behavior without an error: `class` (all styles), `style` with `background-image` (the background image), `data-*` (the values that the editor reads back from HTML, and `data-files-gallery-exclude` on the banner and the banner image), `role` and `aria-level` (the title heading), `href`, `target` and `rel` (buttons), `src`, `alt` and `title` (images).

## Exports

| Block          | Plugin                                                                                                | Attributes ↔ model                                                             | Values                                                                                                                                                                                                                                                        | Types                                                                                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Banner         | `bannerPlugin`, `bannerTokenName`, `bannerClassName`                                                  | `bannerAttrs`, `bannerModel`, `bannerModelValues`, `bannerModelFromAttrs`      | `bannerDefaults`, `bannerLayoutDefaults`, `bannerBackgroundDefaults`, `bannerModelDefaults`, `bannerHeights`, `bannerWidths`, `bannerAligns`, `bannerVerticals`, `bannerBgColors`, `bannerBgColorFamilies`, `bannerBgColorSaturations`, `bannerBgImageThemes` | `BannerDimensions`, `BannerHeight`, `BannerWidth`, `BannerLayout`, `BannerAlign`, `BannerVertical`, `BannerBackground`, `BannerBgColor`, `BannerBgColorFamily`, `BannerBgColorSaturation`, `BannerBgImageTheme`, `BannerModel` |
| Banner title   | `bannerTitlePlugin`, `bannerTitleTokenName`, `bannerTitleClassName`                                   | `bannerTitleAttrs`, `bannerTitle`, `bannerTitleValues`, `bannerTitleFromAttrs` | `bannerTitleDefaults`, `bannerTitleSizes`, `bannerTitleColors`                                                                                                                                                                                                | `BannerTitle`, `BannerTitleSize`, `BannerTitleColor`                                                                                                                                                                           |
| Banner content | `bannerContentPlugin`, `bannerContentTokenName`, `bannerContentClassName`                             | —                                                                              | —                                                                                                                                                                                                                                                             | —                                                                                                                                                                                                                              |
| Banner image   | `bannerImagePlugin`, `bannerImageTokenName`, `bannerImageClassName`                                   | `bannerImageAttrs`, `bannerImage`, `bannerImageValues`, `bannerImageFromAttrs` | `bannerImageDefaults`                                                                                                                                                                                                                                         | `BannerImage`                                                                                                                                                                                                                  |
| Button         | `buttonPlugin`, `buttonTokenName`, `buttonClassName`, `buttonRowClassName`, `buttonRowBreakTokenName` | `buttonAttrs`, `buttonModel`, `buttonFromAttrs`, `normalizeButtonHref`         | `buttonDefaults`, `buttonViews`, `buttonColors`, `buttonViewColors`, `buttonTargets`                                                                                                                                                                          | `ButtonModel`, `ButtonView`, `ButtonColor`, `ButtonTarget`                                                                                                                                                                     |
| All blocks     | `bannerPreset`                                                                                        | —                                                                              | —                                                                                                                                                                                                                                                             | —                                                                                                                                                                                                                              |
| Shared         | —                                                                                                     | `safeImageUrl`, `safeLinkUrl`, `toCssUrl`                                      | `bannerSanitizeAllowedAttributes`                                                                                                                                                                                                                             | —                                                                                                                                                                                                                              |

## Banner

```markdown
:::banner{height="s" width="m" align="left" vertical="center" bg-color="blue-light" bg-image="./.files/photo.jpg" bg-image-theme="dark" bg-image-blur="true"}

::banner-image{src="./.files/team.jpg" alt="Team"}

::banner-title[Team portal]

:::banner-content
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

The block is rendered as `div.g-md-banner-plugin` with the modifiers `_height_{s,m,l}` and `_width_{s,m,l,full}`; the `data-height` and `data-width` attributes of the element and of the opening token hold the same dimensions.
The alignment and the background are rendered when they differ from the defaults: the modifiers `_align_{center,right}`, `_vertical_{top,bottom}`, `_bg-color_<value>`, `_bg-image`, `_bg-image-blur` and the attributes `data-align`, `data-vertical`, `data-bg-*`; `bannerModelFromAttrs` reads all of them back.
The element also has `data-files-gallery-exclude="true"`: the files galleries of `@gravity-ui/markdown-viewer` (`FilesGallery`) and of `@gravity-ui/markdown-editor` (`useFilesGallery`) skip the images and the links inside an element with this attribute and leave the clicks on them alone, so a banner image is not a gallery file and a button navigates as a link. The plugin does not depend on these packages; it writes the attribute name itself.

```html
<div
  class="g-md-banner-plugin g-md-banner-plugin_height_l g-md-banner-plugin_width_full g-md-banner-plugin_align_center g-md-banner-plugin_vertical_bottom g-md-banner-plugin_bg-color_blue-light"
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
An unknown attribute is skipped, and an unsupported value is replaced with the default: `:::banner{height="xl" color="red"}` is an `s` × `m` block.
An image address with another scheme, such as `javascript:` or `data:`, or with control characters, is skipped, and so is an address that `md.validateLink` of the parser rejects.
The container parses its child blocks in the same Markdown token stream.
Inline titles and destinations in the opening directive are not supported and remain ordinary Markdown.

### Layout

The width is a `max-width` and the height a `min-height`: the block never exceeds its container, and tall content grows it.
An image beside the text, the [Banner image](#banner-image) block, takes half of the block: on the right of the text, and on the left of a right-aligned text. A centered banner has no place for an image: write an image with `align="left"` or `align="right"`.
`left` and `right` of `align` are the start and the end of the line: in a right-to-left page the sides swap.

A banner narrower than 600 px has the narrow layout: the image stands above the text, and the buttons stand in a column of the full width. The width is the one of the block itself, not of the window: the block is a query container named `g-md-banner-plugin`, and the 600 px takes no custom property.

The numbers are custom properties; a host overrides them:

| Property                                           | Default                                    |
| -------------------------------------------------- | ------------------------------------------ |
| `--g-md-banner-plugin-height-{s,m,l}`              | `236px`, `300px`, `360px`                  |
| `--g-md-banner-plugin-width-{s,m,l}`               | `600px`, `900px`, `1200px`                 |
| `--g-md-banner-plugin-margin-block`                | `0 var(--g-spacing-5)`                     |
| `--g-md-banner-plugin-margin-inline`               | `0`                                        |
| `--g-md-banner-plugin-border-radius`               | `var(--g-border-radius-2xl)`, 16 px        |
| `--g-md-banner-plugin-padding`                     | `var(--g-spacing-8)`                       |
| `--g-md-banner-plugin-text-gap`                    | `var(--g-spacing-4)`                       |
| `--g-md-banner-plugin-buttons-gap`                 | `var(--g-spacing-8)`, the text and buttons |
| `--g-md-banner-plugin-image-width`                 | `50%`, at most `50%`                       |
| `--g-md-banner-plugin-image-padding`               | `var(--g-spacing-2)`                       |
| `--g-md-banner-plugin-blur`                        | `12px`                                     |
| `--g-md-banner-plugin-blur-inset`                  | `24px`                                     |
| `--g-md-banner-plugin-narrow-padding`              | `var(--g-spacing-4)`                       |
| `--g-md-banner-plugin-narrow-image-aspect-ratio`   | `16 / 10`                                  |
| `--g-md-banner-plugin-narrow-button-height`        | `44px`                                     |
| `--g-md-banner-plugin-narrow-button-padding-block` | `12px`, a wrapped label                    |
| `--g-md-banner-plugin-narrow-button-border-radius` | `var(--g-border-radius-xl)`                |
| `--g-md-banner-plugin-narrow-button-padding`       | `var(--g-spacing-6)`                       |
| `--g-md-banner-plugin-narrow-button-font-size`     | `var(--g-text-body-2-font-size)`           |
| `--g-md-banner-plugin-narrow-button-line-height`   | `var(--g-text-body-2-line-height)`         |
| `--g-md-banner-plugin-button-focus-outline-color`  | `var(--g-color-text-primary)`              |
| `--g-md-banner-plugin-link-focus-outline-color`    | the focus ring color of the buttons        |
| `--g-md-banner-plugin-link-color`                  | `currentColor`                             |
| `--g-md-banner-plugin-link-hover-color`            | `currentColor`                             |
| `--g-md-banner-plugin-link-decoration-line`        | `underline` (`text-decoration-line`)       |
| `--g-md-banner-plugin-code-color`                  | `currentColor`                             |
| `--g-md-banner-plugin-code-background`             | `var(--g-color-base-generic)`              |

The block is a size container (`container-type: inline-size`), so its width comes from its parent, never from its content. Where the parent sizes its children by their content, such as a table cell with automatic layout or a flex item without a width, the block has no width of its own: give the parent or the block a width there.

### Background

The fill is the `_bg-color_<value>` modifier; its colors are Gravity UI tokens declared on `.g-root` as `--g-md-banner-plugin-bg-color-<value>`.
The image is written into the `style` attribute as a percent-encoded `url("…")` after the scheme check, and the `_bg-image` modifier covers the block with it. The address is taken as written: HTML entities in it are not decoded, so `/image&copy;.png` and `/a.png?x=1&copy=2` keep their `&copy`. `\"` writes a quote.
`bg-image-blur` adds the `_bg-image-blur` modifier: a blurred copy of the image under the content.

`bg-image-theme` other than `system` adds `g-root g-root_theme_<theme>` to the block: text, links, inline code and buttons use the fixed theme, and the image stays the same.
The block is then a nested Gravity UI theme root, as a nested `ThemeProvider`: `.g-root` also declares the spacing, radius and typography tokens with the UIKit defaults. A host that changes these tokens declares them on `.g-root`, as the UIKit theming guide says, so they reach the nested root too.
Without a fill, the page background of the fixed theme lies under the image.
The theme and blur belong to the image: without `bg-image` they are parsed as the defaults.

On a fill or an image the links of the [description](#banner-content) take the color of the text with an underline: the link color of the page is not readable there (about 2:1 on the light fills of the default theme). On an image and on the `medium` and `heavy` fills the buttons and the links show keyboard focus with a ring of the text color, and inline code takes the text color. A host changes them with the `--g-md-banner-plugin-button-focus-outline-color`, `-link-*` and `-code-*` properties of [Layout](#layout).

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

```html
<div class="g-md-banner-plugin …">
  <div
    class="g-md-banner-title-plugin g-md-banner-title-plugin_size_1 g-md-banner-title-plugin_color_blue"
    role="heading"
    aria-level="1"
    data-size="1"
    data-color="blue"
  >
    Team portal
  </div>
</div>
```

The title is a `div` with `role="heading"` and `aria-level` of its size, so it is a heading for assistive technology and stays out of the heading tags of the page. The size and the color other than the defaults are also written to `data-size` and `data-color`; `bannerTitleFromAttrs` reads them back.
A sanitizer has to allow `aria-level`: the default list of `@diplodoc/transform` keeps `role` and drops the level, and a heading without a level is read as a heading of level 2 (see [Sanitizer](#sanitizer)).

The title is a leaf block directive: one line with the text in square brackets and no closing line. It stands after an empty line, as a paragraph does.
The text is plain: Markdown and HTML entities inside it are shown as written, and `\]` writes a closing bracket.
A title without a text, `::banner-title[]`, keeps its token and renders nothing.

An unknown attribute is skipped, and an unsupported value is replaced with the default: `::banner-title[Team portal]{size="7" color="pink"}` is a title of size `2` in the `auto` color.

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

The `auto` color is the color of the text around the title. The other colors are the colors of colored text in YFM, `--yfm-colorify-<color>`; where they are not set, the title takes the Gravity UI tokens those colors use in the editor:

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
| `--g-md-banner-title-plugin-font-weight`  | the weight of the size, see the table |
| `--g-md-banner-title-plugin-margin-block` | `0 var(--g-spacing-4)`                |

The margin applies to a title outside Banner.

## Banner content

```markdown
:::banner

:::banner-content
Portal description with **bold**, _italic_, ++underlined++, ~~strikethrough~~ and `monospace` text and a [link](/page).

Second paragraph.
:::
:::
```

```html
<div class="g-md-banner-plugin …">
  <div class="g-md-banner-content-plugin">
    <p>
      Portal description with <strong>bold</strong>, <em>italic</em>, <ins>underlined</ins>,
      <s>strikethrough</s> and <code>monospace</code> text and a <a href="/page">link</a>.
    </p>
    <p>Second paragraph.</p>
  </div>
</div>
```

The block is a `div.g-md-banner-content-plugin`.

The description is a container directive: the opening line, the paragraphs and the closing line `:::`.
Its content is ordinary Markdown of the same parser, so the marks and the links are the ones the parser has: `++underlined++` needs a plugin for it, such as `markdown-it-ins`, which YFM and the editor include.
A description without a text, `:::banner-content` right before `:::`, keeps its tokens and renders nothing.

The block has no attributes, and an attribute in the markup is skipped: `:::banner-content{size="1" color="red"}` is the same description.

### Content styles

The description is the regular text of the page: `--yfm-font-size` and `--yfm-font-line-height`, then the Gravity UI `body-2`. Inline code and links take the YFM colors, `--yfm-color-inline-code*` and `--yfm-color-link*`, then the Gravity UI link tokens; on a fill or an image the banner changes them, see [Background](#background).
A link is underlined only on a fill, on an image or with `--g-md-banner-content-plugin-link-decoration-line`, and its underline is thicker than the one of `++underlined++` text.

| Property                                                       | Default                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--g-md-banner-content-plugin-font-weight`                     | `var(--g-text-body-font-weight)`                                                                |
| `--g-md-banner-content-plugin-paragraph-gap`                   | `var(--g-spacing-2)`                                                                            |
| `--g-md-banner-content-plugin-margin-block`                    | `0 var(--g-spacing-4)`                                                                          |
| `--g-md-banner-content-plugin-link-color`                      | `var(--yfm-color-link)`; the text color on a fill or an image                                   |
| `--g-md-banner-content-plugin-link-hover-color`                | `var(--yfm-color-link-hover)`; the text color on a fill or an image                             |
| `--g-md-banner-content-plugin-link-decoration-line`            | `none`; `underline` on a fill or an image (`text-decoration-line`)                              |
| `--g-md-banner-content-plugin-link-decoration-thickness`       | `2px`                                                                                           |
| `--g-md-banner-content-plugin-link-hover-decoration-thickness` | `3px`                                                                                           |
| `--g-md-banner-content-plugin-link-underline-offset`           | `0.2em`                                                                                         |
| `--g-md-banner-content-plugin-link-focus-outline-width`        | `2px`                                                                                           |
| `--g-md-banner-content-plugin-link-focus-outline-color`        | `var(--g-color-line-focus)`; the button ring on a banner background                             |
| `--g-md-banner-content-plugin-code-color`                      | `var(--yfm-color-inline-code)`; the text color on a banner background                           |
| `--g-md-banner-content-plugin-code-background`                 | `var(--yfm-color-inline-code-background)`; `var(--g-color-base-generic)` on a banner background |

The margin applies to a description outside Banner.

## Banner image

```markdown
:::banner

::banner-image{src="./.files/team.jpg" alt="Team" title="Project team"}

::banner-title[Team portal]
:::
```

| Attribute | Values                                                      | Default |
| --------- | ----------------------------------------------------------- | ------- |
| `src`     | an `http:`, `https:`, `blob:` or relative address           | none    |
| `alt`     | the alternative text; an empty one marks a decorative image | empty   |
| `title`   | the native browser tooltip of the image                     | none    |

```html
<div class="g-md-banner-plugin …">
  <img
    class="g-md-banner-image-plugin"
    data-files-gallery-exclude="true"
    src="./.files/team.jpg"
    alt="Team"
    title="Project team"
  />
  <div
    class="g-md-banner-title-plugin g-md-banner-title-plugin_size_2"
    role="heading"
    aria-level="2"
  >
    Team portal
  </div>
</div>
```

The block is an `img.g-md-banner-image-plugin` with the `src`, `alt` and `title` attributes; `bannerImageFromAttrs` reads them back.
The image has `data-files-gallery-exclude="true"` of its own, as [Banner](#banner) does: it stays out of the files galleries outside a banner too.
The `alt` attribute is always rendered: without it a screen reader announces the address of the image, and with an empty one it skips the image as decorative. An empty `title` is not rendered.
`title` is the native tooltip of the browser for pointer users: it is not shown on touch or keyboard focus, and it does not describe the image to screen readers. An image with `title` and without `alt` is still decorative (`alt="" title="…"`); an image that matters needs `alt`.

The image is a leaf block directive: one line with the attributes, no text in square brackets and no closing line. It stands after an empty line, as a paragraph does.

The address passes the same check as the background image of a banner, `safeImageUrl`: an address with another scheme, such as `javascript:` or `data:`, or with control characters, is skipped, and so is an address that `md.validateLink` of the parser rejects.
An image without an address, or with a skipped one, keeps its token and renders nothing.
The values are taken as written: HTML entities in them are not decoded, so `/image?a=1&copy=2` stays this address, and `\"` writes a quote.
An unknown attribute is skipped; a repeated attribute counts as not set.

In a Diplodoc build the images plugin of `@diplodoc/transform` processes only Markdown images. The `src` of a banner image and the `bg-image` of a banner are not copied to the build output and not rebased, and a missing file is not reported: use absolute addresses there.

### Image styles

Inside Banner the image fills its box and is cropped to it (`object-fit: cover`), and its corners follow the corners of the banner. Outside Banner the image is a block of its own size, not wider than its container.
The fill under the image is solid, so it hides the banner under the transparent parts of an image: a host that uses transparent images sets `--g-md-banner-image-plugin-background` to `transparent`.

| Property                                   | Default                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `--g-md-banner-image-plugin-border-radius` | `var(--g-border-radius-xl)`; in Banner the radius of the banner less `--g-md-banner-plugin-image-padding` |
| `--g-md-banner-image-plugin-background`    | `var(--g-color-base-float-hover)`                                                                         |
| `--g-md-banner-image-plugin-margin-block`  | `0 var(--g-spacing-4)`                                                                                    |

The margin applies to an image outside Banner.

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

- Without `href`, or with an unsafe one (`javascript:`, `data:`, `vbscript:`, `file:`), the `<a>` has no `href` and is not interactive. `normalizeButtonHref(md, value)` is the check of the Markdown path: it normalizes the address with `md.normalizeLink` and returns it when `md.validateLink` accepts it and it is not a `data:` address, or an empty string; an editor that checks a typed address with its own parser gets the same result as Markdown. `safeLinkUrl` is the guard for an address that comes from neither (HTML, the DOM): it returns the trimmed address, or `null` for an empty or unsafe one or one with control characters; `buttonModel`, `buttonAttrs` and `buttonFromAttrs` apply it.
- `target="_blank"` adds `rel="noopener noreferrer"`; `_self` is not rendered.
- The address is taken as written: HTML entities in it are not decoded, so `/page?a=1&copy=2` and `/image&copy;.png` keep their `&copy`. `\"` writes a quote.
- `data-view` and `data-color` of the element and of the token hold the resolved view and color.
- The button is its own token (`button`), not a Markdown link. Plugins that work on `link_open` tokens skip it: the Diplodoc links plugin does not turn a `.md` address of a button into `.html`, does not check it and does not add `target="_blank"` to an external one. Write the final address and the target in the button.
- The label is the `content` of the token and also `meta.label`; the renderer writes `meta.label`, so a later rule that changes `content`, such as markdown-it-attrs reading a trailing `{…}` as attributes, does not change the label.

The button is an inline directive: it stays in the line of text, and buttons written one after another in a paragraph, separated by spaces, form a row.
A paragraph that holds only buttons, spaces and line breaks gets the class `g-md-button-plugin-row` (`buttonRowClassName`): a wrapping flex row with a gap between the buttons and between the lines.
Buttons inside running text keep the spaces of the text.
The label in square brackets is plain text: Markdown and HTML entities inside it are shown as written, and `\]` writes a closing bracket.
A button with an empty label renders nothing, and a paragraph of such buttons renders no `<p>`.

Inside Banner every button may stand in its own paragraph; paragraphs of buttons that follow one another render as one row:

```markdown
:::banner

:button[Open]{href="/page" view="action" color="blue"}

:button[Docs]{href="/docs" view="normal" color="gray"}

:button[Skip]{view="flat" color="standard"}
:::
```

```html
<div class="g-md-banner-plugin …">
  <p class="g-md-button-plugin-row">
    <a …>Open</a>
    <a …>Docs</a>
    <a …>Skip</a>
  </p>
</div>
```

The token stream has one paragraph per row: the inline tokens of the joined paragraphs are appended to the first one, each after a `buttonRowBreakTokenName` token. That token renders a line break; a consumer that builds its own document from the tokens can skip it.
Outside Banner each paragraph of buttons is a row of its own.

An unsupported value is replaced with the default, and a color the view lacks with the first color of the view. Unknown attributes are skipped.

### Button styles

The size and the text of the button are Gravity UI tokens with fallback values, so a button keeps its size and shape on a page without the Gravity UI theme.
Colors are Gravity UI theme tokens without fallbacks; the host application supplies their values. `blue` uses the `info` family, `green` `positive`, `yellow` `warning`, `red` `danger`, `violet` `utility`, `gray` `generic`, and `standard` the contrast fill of `action` and the primary text of `flat`.

The light `action` labels on the `blue`, `green`, `red` and `violet` fills follow the mock; with the default Gravity UI themes their contrast is below WCAG AA, and a host theme can raise it through the fill tokens.

The size and typography are custom properties; a host overrides them:

| Property                                             | Default                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `--g-md-button-plugin-height`                        | `36px`                                                   |
| `--g-md-button-plugin-padding`                       | `var(--g-spacing-4, 16px)`                               |
| `--g-md-button-plugin-padding-block`                 | `9px`, above and below a wrapped label                   |
| `--g-md-button-plugin-border-radius`                 | `var(--g-border-radius-l, 8px)`                          |
| `--g-md-button-plugin-font-size`                     | `var(--g-text-body-1-font-size, 13px)`                   |
| `--g-md-button-plugin-line-height`                   | `var(--g-text-body-1-line-height, 18px)`                 |
| `--g-md-button-plugin-border-width`                  | `1px`                                                    |
| `--g-md-button-plugin-focus-outline-width`           | `2px`                                                    |
| `--g-md-button-plugin-pressed-scale`                 | `0.96`                                                   |
| `--g-md-button-plugin-focus-outline-color`           | `var(--g-color-line-focus)`; the fill color for `action` |
| `--g-md-button-plugin-focus-outline-offset`          | `0`; `1px` for `action`                                  |
| `--g-md-button-plugin-transition-duration-transform` | `0.1s`                                                   |
| `--g-md-button-plugin-transition-duration-color`     | `0.15s`                                                  |
| `--g-md-button-plugin-gap`                           | `var(--g-spacing-4, 16px)`, between the buttons of a row |

The height is a minimum: a label that does not fit the line wraps, and the button grows.
