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

## Popup lifecycle

Both editor modes use the same popup and dialog. The dialog owns an independent
request session; editor adapters own selection, replacement, undo and editor
focus. Changing the document or selection dismisses the session so an answer
cannot overwrite text edited after the request started.

Only one request runs per session at a time. Resetting or closing invalidates
pending answers and feedback; the consumer's asynchronous operation itself is
not cancelled. Retry receives the original request payload. `onUpdate` receives
the active request's answer, or `undefined` after an error, an undefined result,
or a reset. Invalidated requests do not notify the consumer. An empty `rawText`
is a valid answer; an undefined answer returns to the prompt screen.

Applying a result invokes `onApplyResult` once in either editor mode. Explicit
close invokes `onClose`; dismissing because the document changed does not invoke
it. `gptAlertProps` is never mutated. Dismissal lasts for the current dialog
session. Feedback buttons are shown only when their callbacks are provided.
