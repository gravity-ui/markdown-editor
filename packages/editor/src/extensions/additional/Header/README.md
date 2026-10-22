# Cover block

The cover contains named YFM containers and up to three reusable buttons. It supports visual editing and sanitized Markdown preview.

```md
:::header{height="m" image="/background.jpg" bg-image-theme="dark" effect="blur"}

:::header-image{src="/content.jpg" alt="Mountain landscape"}
:::

:::header-title
Your title
:::

:::header-content
A paragraph with **formatting**, {red}(text color) and [a link](/page).
:::

:::button{href="/page" view="action" new-tab="true"}
Read more
:::

:::
```

Only the first direct `header-image`, `header-title` and `header-content` and the first three direct `button` containers are used. Other direct nodes and excess containers are ignored entirely. The `header-*` containers require a `header` parent; `button` also works independently.

The title and button labels contain plain text. Description content supports paragraphs, H1–H6 headings and standard text formatting. Images, buttons, HTML and other blocks are excluded from the description. The title is a `div` and does not enter the document outline.

The editor uses a fixed internal slot order. Markdown serialization emits the content image, title, description and buttons in that order. Missing title and description containers become empty slots. Ignored content is discarded when switching to visual editing.

## Title attributes

```md
:::header-title{size="1" color="red"}
Your title
:::
```

`size` accepts `1` through `6`, using the corresponding YFM heading typography without adding a heading to the document outline. The default is `2` (24 px in the standard theme). `color` accepts `auto` and the seven standard text colors listed below. `auto` inherits the cover text color. Invalid values use defaults; default attributes are omitted from Markdown. Both attributes are editable in the cover settings and in the toolbar shown when title text is selected. These controls update the whole title while keeping it a named container. The usual heading shortcuts (`Mod-Alt-1` through `Mod-Alt-6`) change its size. Attributes survive HTML and Markdown round trips.

## Appearance

| Attribute | Values | Default |
| --- | --- | --- |
| `height` | `s`, `m`, `l` | `s` |
| `width` | `s`, `m`, `l`, `full` | `m` |
| `align` | `left`, `center`, `right` | `left` |
| `vertical` | `top`, `center`, `bottom` | `center` |
| `title`, `description` | `true`, `false` | `true` |
| `fill` | `none` or the standard table background palette | `none` |
| `text` | `auto`, `gray`, `yellow`, `orange`, `red`, `green`, `blue`, `violet` | `auto` |
| `image` | Background image URL | Empty |
| `image-name` | Background filename | Empty |
| `image-enabled` | `true`, `false` | `true` |
| `bg-image-theme` | `system`, `light`, `dark` | `system` |
| `effect` | `none`, `blur` | `none` |
| `shapes` | `none`, `diagonal`, `corner`, `edges`, `bottom`, `scatter` | `none` |

Unknown attributes are discarded; unknown values use defaults. Default values are omitted from serialized Markdown. Gradients, mesh gradients, patterns, tiled images, fading and brightness effects are not supported.

S and M heights are minimum heights of 236 and 300 px. S and M widths are 600 and 900 px, limited by the available column. L currently uses provisional values of 360 px height and 1200 px width, customizable with `--g-md-header-height-l` and `--g-md-header-width-l`. Full width fills the containing column. Content grows naturally without text truncation. The outer radius is 24 px, content padding is 32 px, image inset is 8 px and image radius is 16 px.

The content image is independent of the background image. Its attributes are `src`, `alt`, `name` and `enabled` (`true` by default when present). It occupies the half opposite the text. Center alignment hides it and disables its setting without discarding its content. At container widths below 600 px it moves above the text. This also works inside split preview or a narrow parent at a wide viewport.

The empty content image opens the shared image form with device upload and URL tabs. Its compact mode offers a single URL field and accepts one file. A loaded image has a persistent delete button with a light icon on an opaque dark background in its top corner; hovering or clicking the photo leaves it unchanged. Deleting the image restores the placeholder and supports undo. The settings panel reuses the same form for replacement.

Settings open beside the right edge of the cover, with fallback placement when space is limited. The background popup shows the same image with text in light and dark themes together. A fixed image text theme applies to both previews. Text colors use a compact labeled list; background colors reuse the standard table palette.

Disabled title, description, buttons and images retain their content. Image text theme preferences remain stored when no background image is active. Blur affects only the background image. Shapes remain outside the local text theme and stop animating under `prefers-reduced-motion`.

## Integration

```ts
builder.use(Header, {fileUploadHandler});
```

`Header` includes the reusable `Button` extension. File uploads use the host handler and accept images up to 2 MB. The content image form accepts URLs independently of the upload handler; its upload tab requires a handler. Background upload controls also require a handler. Background and content uploads track document changes and discard results after their target is removed or replaced. URLs returned by the handler are stored as provided; durable attachment storage is the host's responsibility.

For a schema without UI, use `HeaderSpecs` with optional `titlePlaceholder` and `contentPlaceholder` functions. Specs do not import React, UIKit or translations.

For preview, use `@gravity-ui/markdown-editor/markdown-it/header`. Import the cover and button styles separately from `extensions/additional/Header/index.css` and `extensions/additional/Button/index.css`. Keep the default HTML sanitizer enabled. Static rendering requires no JavaScript runtime.

See [image text themes](../../../../../../docs/header-image-text-theme.md) for the CSS inheritance mechanism and host theme requirements.
