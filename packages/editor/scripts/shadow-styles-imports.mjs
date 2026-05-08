// Single source of truth for non-relative CSS imports inlined into shadow-styles.
// Imported by both gulpfile.mjs (build task) and check-shadow-styles-imports.js
// (CI drift check). Keep this list aligned with imports under packages/editor/src.

export const SHADOW_STYLE_IMPORTS = Object.freeze([
    '@diplodoc/transform/dist/css/base.css',
    '@diplodoc/transform/dist/css/_yfm-only.css',
    '@diplodoc/cut-extension/runtime/styles.css',
    '@diplodoc/file-extension/runtime/styles.css',
    '@diplodoc/tabs-extension/runtime/styles.css',
    '@diplodoc/quote-link-extension/runtime/styles.css',
    '@diplodoc/folding-headings-extension/runtime/styles.css',
]);
