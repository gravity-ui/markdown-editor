# Image background text themes

An image background can use the editor's text theme or keep a light or dark text palette while the editor theme changes.

```md
:::header[Cover]{image="cover.jpg" bg-image-theme="dark"}

Plain text, {red}(red text) and [a link](/page).

:::
```

`bg-image-theme` accepts `system`, `light` and `dark`. The default `system` is omitted from Markdown. Unknown values normalize to `system`.

The preference applies to an enabled image with `layer="full"`. It stays in the document while the image is disabled, removed or placed beside the text, so enabling a background image restores the selection.

## Implementation

The content wrapper receives `g-root g-root_theme_light` or `g-root g-root_theme_dark`. The cover's outer background and decorative layers remain outside this scope. The wrapper has a transparent background so the UIKit root background does not obscure the image.

`g-root` recalculates the editor's standard color aliases inside the selected theme. The matching Diplodoc theme mixin also recalculates YFM text and link variables there. Reusing values inherited from the page would retain the page theme's already resolved colors.

The same DOM helper creates the editor and rendered Markdown wrappers. The resulting HTML works with the default sanitizer and requires no client-side script to apply the theme.

Text settings use the standard seven-color editor palette. Image upload preserves the selected theme and text color instead of estimating a text color from image brightness.

## Why a local theme

An explicit light or dark primary text token covers only one text role. Those tokens can themselves have different opacity in different themes, and do not select the remaining standard palette or link colors. Local theme classes use the same theme definitions as UIKit and preserve the named text roles.

Theme customization should target the shared `.g-root_theme_light` and `.g-root_theme_dark` classes. Overrides restricted to `body` cannot define values for a nested theme scope. CSS scoping does not change React theme context; the settings popup keeps the editor's theme.

## Verification

The `Examples / Header / Image Themes` story compares system, light and dark covers with every standard text color and a link. Browser tests switch the editor theme, compare computed colors, check transparent content backgrounds, exercise the settings control, and compare editor rendering with sanitized preview. Unit tests cover Markdown and HTML persistence, invalid values and inactive image preferences.
