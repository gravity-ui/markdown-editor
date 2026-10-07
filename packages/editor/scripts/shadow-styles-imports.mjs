// Non-relative CSS imports under packages/editor/src, inlined into shadow-styles in this order.
// The order is the rule order in cssText: `base.css` comes before `_yfm-only.css`.
// `check-shadow-styles-imports.js` compares the list with src as a set, order aside.

export const SHADOW_STYLE_IMPORTS = Object.freeze([
    '@diplodoc/transform/dist/css/base.css',
    '@diplodoc/transform/dist/css/_yfm-only.css',
    '@diplodoc/cut-extension/runtime/styles.css',
    '@diplodoc/file-extension/runtime/styles.css',
    '@diplodoc/tabs-extension/runtime/styles.css',
    '@diplodoc/quote-link-extension/runtime/styles.css',
    '@diplodoc/folding-headings-extension/runtime/styles.css',
]);
