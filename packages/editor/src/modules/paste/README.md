# Pasted resource resolution

See the [detailed architecture diagrams](../../../../../docs/pasted-resources-architecture.md)
for wiring, transaction flows, resource identity, history, and mode switching.

This module owns asynchronous resource resolution across editor modes. It does not
parse clipboard contents or depend on ProseMirror, CodeMirror, or React.

- `controller.ts` manages concurrent operations, cancellation, timeouts, and results.
- `types.ts` defines the application callback and public operation controls.
- `tracking.ts` defines resource identities and the `PasteEngine` adapter contract.

`bundle/Editor.ts` creates one controller per editor, passes it to both engines, and
transfers tracked resource occurrences when switching modes.

## Engine integrations

- `extensions/behavior/Clipboard/resources/adapter.ts` tracks ProseMirror resources,
  applies replacements through transactions, and integrates with history.
- `extensions/behavior/Clipboard/resources/resources.ts` contains document traversal,
  resource URL validation, and document comparison helpers.
- `markup/codemirror/paste-resources/` tracks Markdown source ranges, applies text
  changes, and integrates with CodeMirror history.

The Markdown integration uses the configured document parser and the ProseMirror
document helpers to verify that replacing a URL preserves document structure. The
ProseMirror integration does not depend on CodeMirror.

The existing clipboard handlers continue to choose and parse clipboard formats.
Resource resolution runs after insertion. Binary file uploads still use
`handlers.uploadFile`.

Controller tests live next to the implementation. Tests exercising both engines,
history, and mode switches live in `tests/paste/integration.test.ts`.
