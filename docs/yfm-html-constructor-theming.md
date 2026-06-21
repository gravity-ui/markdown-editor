# YFM HTML Constructor — theming contract

The HTML Constructor block exposes its quick-style controls (background, text
color, corner rounding, border) as **CSS custom properties** instead of writing
concrete CSS properties. This is the contract that connects what a user does in
the block toolbar to the CSS a theme author writes. Themes are authored by users
as plain CSS, so they need a stable, documented set of variables to target.

## How it works

Every styleable aspect is backed by four CSS variables:

| Variable                   | Who sets it        | Purpose                                                         |
| -------------------------- | ------------------ | --------------------------------------------------------------- |
| `--g-md-hc-<name>`         | block toolbar      | The quick-style **override** (inline on the element).           |
| `--g-md-hc-<name>-light`   | theme author       | Value for the **light** color theme.                            |
| `--g-md-hc-<name>-dark`    | theme author       | Value for the **dark** color theme.                             |
| `--g-md-hc-<name>-current` | constructor (auto) | The light/dark value resolved for the active theme. Do not set. |

The block resolves the final value as a fallback chain:

```
--g-md-hc-<name>                       (toolbar override, highest priority)
  └─ --g-md-hc-<name>-current          (theme value for the active light/dark theme)
       └─ neutral fallback             (transparent / inherit / 0 / none)
```

`*-current` is computed automatically from the `*-light` / `*-dark` companions
depending on the active Gravity UI theme (`.g-root_theme_dark` /
`.g-root_theme_dark-hc` switch to the dark companions, everything else uses the
light ones).

### Available aspects

| `<name>`        | Consumed property | Notes                                                     |
| --------------- | ----------------- | --------------------------------------------------------- |
| `background`    | `background`      | Any CSS color.                                            |
| `text-color`    | `color`           | Any CSS color.                                            |
| `border-radius` | `border-radius`   | Any length, e.g. `12px`, `999px`.                         |
| `border`        | `border`          | A full border shorthand, e.g. `1px solid #ccc` or `none`. |

## Writing a theme

A theme is a CSS rule scoped to a block (or structure). To stay compatible with
the toolbar **and** support light/dark, set the `*-light` / `*-dark` companions
rather than the final properties:

```css
/* Good: themable + toolbar-overridable + dark-aware */
& {
  --g-md-hc-background-light: #ffffff;
  --g-md-hc-background-dark: #1c1c20;
  --g-md-hc-text-color-light: #1c1c20;
  --g-md-hc-text-color-dark: #f0f0f0;
  --g-md-hc-border-radius-light: 16px;
  --g-md-hc-border-radius-dark: 16px;
  --g-md-hc-border-light: 1px solid #e7e9ec;
  --g-md-hc-border-dark: 1px solid #34343a;
}
```

You can set only one companion if a value should be the same in both themes —
the dark companion falls back to the light one when it is not provided.

If you set a property **directly** (e.g. `background: red`) the block can no
longer override it from the toolbar and it will not adapt to light/dark. That is
sometimes intentional (a fixed brand look), but for general-purpose themes prefer
the companion variables above.

## Where the contract lives

- Variable names and helpers: `cssVariables.ts`.
- In-editor resolution/consumption (with editor chrome fallbacks): the
  `&__item` / `&__structure` rules in `YfmHtmlConstructorNodeView/YfmHtmlConstructor.scss`.
- Output markdown and template previews prepend the generated contract
  stylesheet (`HTML_CONSTRUCTOR_VARIABLES_CSS`) so the variables resolve outside
  the editor too.
