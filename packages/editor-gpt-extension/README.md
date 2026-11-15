# GPT extension for Markdown Editor

GPT dialog and integrations for ProseMirror and CodeMirror, extracted from
`@gravity-ui/markdown-editor`. Existing editor imports and callback props continue
to work through compatibility adapters.

## Entry points

- `.`: dialog, integrations, types and combined toolbar item.
- `./dialog`: standalone `GptDialog` and its original props.
- `./wysiwyg`: ProseMirror integration and WYSIWYG toolbar items.
- `./markup`: CodeMirror integration and markup toolbar items.
- `./configure`: language configuration (`configure({lang: 'en' | 'ru'})`).
- `./compatibility`: legacy editor adapters; not intended for new integrations.
- `./styles/*`: stylesheet compatibility paths.

The package has no dependency on the editor. `createGptExtension(getRenderer)`
receives a renderer accessor and registers the WYSIWYG action and plugin through
an extension builder. The builder supplies the Markdown parser and serializer.
`mGptExtension(options, {getRenderer})` receives the CodeMirror renderer accessor.
The renderer needs `createItem(id, render)` returning `rerender()` and `remove()`.

Consumers using the editor should keep using its `gptExtension` and
`mGptExtension` adapters: they connect these capabilities automatically.
`GptWidgetOptions<AnswerData, PromptData>` and `GptDialogProps<AnswerData, PromptData>`
retain their existing fields and callback signatures.

## Release

Publish this package before publishing an editor version that depends on it.
