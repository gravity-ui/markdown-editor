# Scoped image text themes

A cover uses the standard editor text palette. Its colors follow the editor theme unless an author chooses a fixed palette for a background image.

```md
:::header{image="/cover.jpg" bg-image-theme="dark"}

:::header-title
Your title
:::

:::header-content
Plain text, {red}(colored text) and [a link](/page).
:::

:::button{href="/page"}
Read more
:::

:::
```

`bg-image-theme` accepts `system`, `light` and `dark`. System is the default and is omitted during serialization. Invalid values use system. A fixed palette is active only for a nonempty safe background URL with the background enabled. The preference remains stored after removing or disabling the image. The separate content image does not activate it.

## CSS inheritance

The editor theme defines custom properties on its root. Text and buttons consume those properties with `var(...)`.

```html
<body class="g-root g-root_theme_light">
  <div class="g-md-header">
    <!-- Background and shapes remain outside the local theme. -->
    <div class="g-md-header__container">
      <div class="g-md-header__content g-root g-root_theme_dark">
        <!-- Text, buttons and the independent content image. -->
      </div>
    </div>
  </div>
</body>
```

The inner element declares the same theme properties with dark values. Its own declarations replace inherited values; overriding the specificity of the body selector is unnecessary. Changing the editor theme changes the properties on the outer root while the inner root keeps its own values. In system mode the local root classes are absent, so normal inheritance applies.

Dependent properties require special care:

```css
--yfm-colorify-red: var(--g-color-text-danger);
```

A custom property reference resolves on the element where it is declared. A descendant inherits the resolved value. Changing only `--g-color-text-danger` on that descendant does not recalculate an inherited `--yfm-colorify-red`.

The local `g-root` therefore redeclares standard editor palette aliases. The cover also applies the official Diplodoc theme mixins for link variables and declares its text color inside the scope. All dependencies resolve against the selected local palette. Choosing explicit light or dark primary-text tokens alone would not freeze the entire palette, and their values also vary between themes.

The inner background stays transparent so it does not obscure the background image. Theme scope includes text and buttons, including button backgrounds. Cover background and shapes keep the outer theme. React theme context remains unchanged, so settings retain the editor theme.

This works through CSS without a theme-change listener, both in visual editing and sanitized static preview. Custom host palettes must declare overrides on `.g-root_theme_light` and `.g-root_theme_dark` usable in a nested scope; rules limited to `body` cannot supply nested theme values.

## Verification

Unit coverage includes container parsing, Markdown and HTML round trips, palette values, inactive preferences, sanitizer-compatible shape geometry and unsafe URLs. Browser coverage switches the editor theme, compares all seven colors and links, checks independent covers and verifies sanitized preview and visual editing.
