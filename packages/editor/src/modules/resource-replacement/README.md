# Resource replacement

This module owns asynchronous replacement of configured string resource values in both editor modes.
See the [architecture](../../../../../docs/pasted-resources-architecture.md) and
[configuration guide](../../../../../docs/how-to-resolve-pasted-resources.md).

Пошаговое объяснение на русском: [сбор и замена ресурсов в CodeMirror](./codemirror/resources.md).
Полный учебный разбор: [учебник в корне проекта](../../../../../RESOURCE_REPLACEMENT_TUTORIAL.md).

- `types.ts`: application configuration, requests, lifecycle events and cancellation.
- `controller.ts`: request deduplication, concurrent operations, complete-response validation,
  cancellation and timeout.
  It has no engine or React dependencies and retains no completed results.
- `prosemirror/`: accepted insertion collection, temporary protected ranges, decorations and global
  attribute replacement. No service attributes are added to the schema or serialized document.
- `codemirror/`: syntax handlers, temporary protected ranges, global source edits, and history amendment.
  Resource descriptions come directly from configuration. `syntax-tree.ts` reuses CodeMirror's
  complete tree for the same document or parses the required document in full, without a separate
  tree cache or constructing the WYSIWYG editor, schema or parser.
  Paste collection reads resource syntax within inserted ranges; responses scan all current resources.
- `urls.ts`: explicit URL resource semantics, validation/encoding and Markdown URL utilities.
  Custom values are opaque by default; `valueType: 'url'` opts in. Built-in image/src and file/href
  retain URL rules. CodeMirror matches provide `serialize(value)` for their concrete syntax.
- `indicator.tsx`: presentation shared with file uploads, independent of upload behavior.
- `integration/`: clipboard/drop trigger policy, plain-text/code/file exclusions.

`EditorImpl` owns the controller and cancels it on destruction. It checks `busy` at mode switching
and updates the UI through an internal callback independent of application lifecycle observers.
Requests start after accepted view updates. Responses apply atomically to every matching current
`(kind, value)` pair; temporary ranges never select the global replacements.

ProseMirror uses attribute steps with `addToHistory: false`. CodeMirror records originating paste
ranges in history effects and amends inverse events, separating global changes outside each paste.
Only this adapter depends on the internal CM history event shape. Completed requests release their
closures, indicators and protection; there are no generated resource identities, result caches or cross-mode snapshots.

The controller entry point does not load either engine. Engine-specific extensions and metadata
have separate module entry points. The package root exports configuration and CodeMirror resource
handler support; the low-level extensions remain internal. Standalone engine owners dispose their
controllers separately. External histories require their own adapter.

Tests cover both engines, acceptance, protected editing, global matching, concurrent results, history,
reference syntax, URL escaping and operation cleanup. Tests must run in containers.
