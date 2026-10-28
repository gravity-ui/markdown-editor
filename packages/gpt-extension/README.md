# Markdown Editor GPT extension

GPT dialog, request lifecycle, and ProseMirror/CodeMirror plugins extracted from
`@gravity-ui/markdown-editor`. The package has no dependency on the editor package.
Applications provide their request callbacks; this package does not contact a model
provider or store credentials.

## Existing editor integrations

The editor continues to export `gptExtension`, `mGptExtension`, `wGptItemData`,
`mGptToolbarItem`, `showMarkupGpt`, `hideMarkupGpt`, and `GptWidgetOptions`.
These adapters use this package. Existing options and callback signatures do not
need to change. Editor `configure({lang})` also configures the GPT translations.
Existing CSS class names are preserved.

## Direct integration

Install this package alongside the matching ProseMirror, CodeMirror, React, and
Gravity UI peer dependencies. Import `GptWidgetOptions` for the request/response
contract and `GptDialog` to embed the dialog in a custom host.

For editor plugins, pass a renderer and Markdown conversion functions explicitly:

```ts
import {
    createGptExtension,
    mGptExtension,
    type GptWidgetOptions,
} from '@gravity-ui/markdown-editor-gpt-extension';
import {
    getReactRendererFromState,
    ReactRendererFacet,
} from '@gravity-ui/markdown-editor/react-renderer';

const gptExtension = createGptExtension(getReactRendererFromState);
// Register with builder.use(gptExtension, options), just like the legacy adapter.

function markupGpt(options: GptWidgetOptions) {
    return mGptExtension(options, {
        getRenderer: (state) => state.facet(ReactRendererFacet),
    });
}
```

The render host must render each item's callback, rerender it when requested, and
unmount it when removed. The editor's existing renderer satisfies this contract.
For modal or drawer editors, pass `gptPopupContainer` in the options to keep the
popup within the host focus boundary. For standalone use, call `configure({lang: 'en' | 'ru'})` from this package.

## Behavior

- Each mounted dialog owns its request and feedback state.
- A newer request, reset, or unmount invalidates pending responses. Existing
  callback signatures cannot cancel network transport; stale responses are ignored.
- Retry uses the original request data. An undefined response clears the previous
  answer. Applying is disabled while loading or after an error.
- Closing the popup restores editor focus. Opening focuses the prompt without
  centering the document or dispatching synthetic scroll events.
- Editing the document or changing its selection closes the dialog, so a response
  cannot replace a range that has changed in the meantime.

## Development and release

Run `pnpm --filter @gravity-ui/markdown-editor-gpt-extension build`, `typecheck`, and
`test` from the monorepo root. Browser regression tests live in
`demo/tests/visual-tests/GPT.visual.test.tsx` and run through the demo's Docker helper.

Publish this package before publishing an editor release that depends on it.
Workspace dependency ranges are converted by pnpm when packing the editor.
