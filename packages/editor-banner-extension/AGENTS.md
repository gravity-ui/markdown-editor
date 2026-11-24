# AGENTS.md — editor-banner-extension

Rules for this package. The root [`AGENTS.md`](../../AGENTS.md) applies as well.

The banner follows the [Banner Spec](https://htmlpreview.github.io/?https://gist.githubusercontent.com/makhnatkin/917908a474c40ab30e4cdbd0cac44b13/raw/banner-spec.html).

## React

- Split the UI into small components and compose them instead of writing the whole view in one component.
- Shared styles follow `@gravity-ui/uikit`: Sass variables live in `variables.scss`, mixins in `mixins.scss`, above the components that use them. A component stylesheet imports them with `@use`.
- Every handler is a named constant in the component body. JSX receives it by name, not as an inline function.
- A component body follows this order:
  1. Early hooks, if needed: `useState`, `useRef`.
  2. Constants.
  3. Handlers.
  4. Other hooks.
  5. `return`.
- Helper functions live in `utils.ts` next to the components, or in the shared `utils/` folder when several folders use them.

## Shared rules

These sections of [`plugin-banner/AGENTS.md`](../plugin-banner/AGENTS.md) apply here as well:

- [ESLint](../plugin-banner/AGENTS.md#eslint)
- [Naming](../plugin-banner/AGENTS.md#naming)
- [Border radius](../plugin-banner/AGENTS.md#border-radius)
- [Colors](../plugin-banner/AGENTS.md#colors), including the swatches of the style list
- [Comments](../plugin-banner/AGENTS.md#comments)
