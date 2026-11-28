# AGENTS.md — plugin-banner

Rules for this package. The root [`AGENTS.md`](../../AGENTS.md) applies as well.

The banner follows the [Banner Spec](https://htmlpreview.github.io/?https://gist.githubusercontent.com/makhnatkin/917908a474c40ab30e4cdbd0cac44b13/raw/banner-spec.html).

## ESLint

`eslint-disable` comments are forbidden, including `eslint-disable-next-line`. Write the code so that it passes the linter without them. Linter warnings follow [the root rule](../../AGENTS.md#code-style).

## Naming

The block is named banner.

- Syntax: `:::banner`, `::banner-image`, `::banner-title[…]`, `:::banner-content`.
- Packages: `@gravity-ui/markdown-plugin-banner` in `packages/plugin-banner`, `@gravity-ui/markdown-editor-banner-extension` in `packages/editor-banner-extension`.
- Demo stories: `demo/src/stories/banner/`.
- The button keeps the name `button`.

## markdown-it plugins

- One block is one folder with one plugin. The preset composes the block plugins with `md.use`.
- A block folder holds:
  - `const.ts`: the token name, the class name, value lists with `as const`, the types derived from them, and defaults.
  - `utils.ts`: functions that turn directive attributes into the block model.
  - `attrs.ts`: functions that turn the model into HTML attributes.
  - `plugin.ts`: the plugin.
  - `index.ts`: re-exports only.
- Every rule is a named constant at module level: a directive handler, a core rule, a render rule. The plugin passes it by name, not as an inline function.
- A plugin body follows this order:
  1. Dependencies, such as `md.use(directiveParser())`.
  2. Parse rules.
  3. Core rules.
  4. Render rules.
- Helper functions live in the block's `utils.ts`, or in `src/utils.ts` when several blocks use them.

## Styles

Shared styles follow `@gravity-ui/uikit`: Sass variables live in `variables.scss`, mixins in `mixins.scss`, above the blocks that use them. A block stylesheet imports them with `@use`.

## Border radius

A `border-radius` with a length takes one of these variables:

- `--g-border-radius-xs`
- `--g-border-radius-s`
- `--g-border-radius-m`
- `--g-border-radius-l`
- `--g-border-radius-xl`
- `--g-border-radius-2xl`

The variable comes from the binding of the layer in Figma, not from its px value: themes give one variable different values. `@gravity-ui/uikit` has no `--g-border-radius-2xl`, so it is written with a fallback: `var(--g-border-radius-2xl, 16px)`. `Popup` takes its radius from `--g-popup-border-radius`, so a popup or a panel sets its radius explicitly.

## Sizes

The button sizes follow `Button` of `@gravity-ui/uikit`: the `button-size-l` and `button-size-xl` mixins set the internal `--_--*` variables, as the uikit size classes do, and a property reads the public `--g-md-button-plugin-*` variable with the internal one as the fallback.

## Colors

Every color is a `--g-color-*` token of `@gravity-ui/uikit`, provided by the application theme. The block has no palette of its own, no HEX or `rgb()` values, and no rules per theme class such as `.g-root_theme_light`: the theme changes the token values. Without the tokens, fills and borders disappear and text inherits the surrounding color.

- The token comes from the variable bound to the layer in Figma, not from its HEX value. Figma HEX is a reference, and a theme may give a different shade.
- Before calling a design color missing, search `@gravity-ui/uikit` `main`. A token that uikit 7 lacks takes a token fallback: `var(--g-color-base-contrast, var(--g-color-text-primary))`, `var(--g-color-base-contrast-hover, var(--g-color-text-complementary))`.
- An attribute value names the color, the token names its meaning. `brand` tokens are not used: the brand color changes with the product theme.

| Color | Token family |
| --- | --- |
| `blue` | `info` |
| `green` | `positive` |
| `yellow` | `warning` |
| `red` | `danger` |
| `violet` | `utility` |
| `gray` | `generic` in the button, `neutral` in the banner background |

### Button

| View | Background | Border | Label |
| --- | --- | --- | --- |
| `action` | `base-<tone>-heavy`, hover `base-<tone>-heavy-hover` | | `text-light-primary`, `yellow`: `text-dark-primary` |
| `normal` | `base-<tone>-light`, hover `base-<tone>-light-hover` | | `text-<tone>-heavy` |
| `outline` | hover `base-simple-hover` | `line-<tone>` | `text-<tone>` |
| `flat` | hover `base-simple-hover` | | `text-<tone>` |

- `standard`: `action` background `base-contrast`, label `text-inverted-primary`; `flat` label `text-primary`.
- `gray`: `normal` background `base-generic`, border `line-generic`, label `text-primary`; `flat` label `text-secondary`, hover `text-primary`.

The button is an `<a>`, so the link rules of the page apply to it. The label keeps its color in two ways:

- `.yfm .g-md-button-plugin` is more specific than the Diplodoc rules `.yfm a` and `.yfm a:not([href])`.
- The button sets `--g-color-text-link`, `--g-color-text-link-hover`, `--g-color-text-link-visited` and `--g-color-text-link-visited-hover` to its label color on itself. A page link rule more specific than the button reads these tokens and gets the label color. The values reach only the button and its text.

A new color rule keeps this scheme and adds no selectors to win specificity.

### Banner background

`bg-color` takes `<color>-<shade>`, where the shade is `light`, `medium` or `heavy`, and maps to `base-<tone>-<shade>`. `gray` maps to `base-neutral-light`, `base-neutral-medium` and `base-neutral-heavy-hover`. Each value is exposed as `--g-md-banner-plugin-bg-color-<name>`, so the application can replace it.

### Check

A color change is checked in the light and the dark theme.

## Comments

No TSDoc and no comments. A comment stays only in a rare case that the code cannot express.
Fields of a public options type follow [the root rule](../../AGENTS.md#extensions): a short TSDoc with the behavior and the default.
