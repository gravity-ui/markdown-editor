# Resource replacement

This directory owns asynchronous resource replacement in both editor modes:
tracking, resolution, application, history, and the policies used by the bundle.
See the [architecture](../../../../../docs/pasted-resources-architecture.md)
for detailed flows and the [configuration guide](../../../../../docs/how-to-resolve-pasted-resources.md)
for the application API.

## Public module entry points

| Entry point            | Exports                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `index.ts`             | Controller, host factory, application types and engine/target contracts |
| `prosemirror/index.ts` | `ResourceReplacement`, options and public transaction metadata |
| `codemirror/index.ts`  | `codeMirrorResourceReplacement`, options, `pasteHistoryBoundary`, `codeMirrorResourceSupport` and handler types                           |
| `integration/index.ts` | PM and CM integration factories used by the bundle                                            |

Consumers outside this module import from these entry points, not implementation
files. The shared entry point does not re-export the engine layers: importing the
controller must not load either engine. These are repository module boundaries;
they do not automatically add every export to the package-root API.

`remoteTransactionMeta`, `resolvedResourceMeta` and `pasteHistoryBoundary` remain
module exports and are not exported from the package root.

Production files within the module use direct implementation imports to avoid
cycles through their own entry points. Private plugin keys, state fields, history
implementation, document helpers and tracking attribute names are not part of the
public API. Tests may access them to assert internal state; integration tests use
the public entry points for constructing controllers and extensions.

The CM extension and its options are internal module exports, not package-root API.
Applications configure resource replacement through `useMarkdownEditor`; the bundle
connects the CM extension through this module's integration layer.
`codeMirrorResourceSupport` and its handler types are exported from the package root
so applications can register new resource syntax through `markupConfig.extensions`.

## Layout and dependencies

- `types.ts`, `tracking.ts`: application contracts, target identity, and engine callbacks.
  `NodeSpec.resource` stores resource metadata supplied through hook configuration; no built-in defaults.
- `controller.ts`: concurrent operations, validation, cancellation, timeout, and
  cached results. It has no ProseMirror, CodeMirror, or React dependencies.
- `host.ts`, `create-host.ts`: the engine-facing contract and its mode-bound adapter.
  The adapter registers targets and deduplicates each request.
- `prosemirror/`: optional extension, plugin state, commands, metadata, and document
  helpers. The extension installs tracking attributes and wraps HTML/Markdown
  serializers to hide them without changing editor state.
- `codemirror/`: extension, mapped anchors, source-range detection, history amendment,
  and the external history-boundary facet. Resource handlers read CodeMirror/Lezer trees,
  not temporary PM documents. `syntax-tree.ts` completes missing tree portions using
  incremental fragments; `builtins.ts` provides image/reference/YFM file handlers.
  New resource node types require explicit CM handlers. It uses shared URL helpers in
  `prosemirror/document-utils.ts`, but does not import the PM plugin or controller.
- `integration/`: PM and CM integration factories that assemble transaction policies
  and resource replacement extensions.
  The reusable extensions receive `shouldTrack`; clipboard selection stays in
  these policies, alongside drop selection and source comparison.
- `tests/integration.test.ts`: both engines, history, mode transfer, serialization,
  custom resources, and edits. Controller and host tests live beside their sources.

Both engine extensions depend on `ResourceReplacementHost`. Avoid importing the
bundle or its presets into production files in this module. Integration tests may
use them to exercise real editor configurations. Import the appropriate layer entry point so
that controller consumers do not load either engine unnecessarily.

## Wiring outside the module

`bundle/Editor.ts` creates the controller only when `resolve` is configured,
connects the extensions, transfers snapshots on mode changes, and owns disposal.
`resourceReplacement.resources` explicitly configures `NodeSpec.resource` by node name
before the replacement plugin is installed. Unlisted nodes and `false` entries have no
resource metadata. Omitted or empty resources means no tracking; built-in node specs
provide no defaults. Both engines consume the resulting schema metadata.
Standalone engine integrations can configure their schema directly.
Public exports and option types remain in their existing package entry points.
The application can supply `id` to the bundle. Separate clipboard
observers write that ID after normal copy/cut/dragstart handling, even without a resolver.
Drag source metadata is recorded in `dataTransfer` and read by the drop integration.
Paste integrations capture the comparison result per transaction and pass it as
optional `source.sameEditor` to `resolve`; missing IDs or metadata mean unknown origin.
Matching IDs skip replacement by default. Use
`triggers: [{name: 'paste', allowSameOrigin: true}]` to process them as well.
String triggers use `allowSameOrigin: false`; unknown origins remain eligible.
The image and file extensions do not import resource tracking.

Clipboard handlers continue to parse and insert their selected format, marking
PM transactions with standard `paste: true` metadata. No request is started during
speculative state computation: PM calls the host from `PluginView.update`, and CM
from an update listener after the view accepts the transactions.

## Lifetimes

Unregistering an engine does not cancel shared operations. Its last document/history
references are retained until a replacement engine registers for that mode or the
controller is destroyed. Destroying the owner aborts pending operations and clears state.

Collection runs in a coalesced microtask after accepted view updates and operation
completion. Pending targets are pinned. Successful results remain while referenced
by either mode's document or Undo/Redo history. Results without remaining references
are collected, including after Redo is discarded or history is trimmed. Failed,
cancelled and unanswered targets from partial responses are released after completion;
their live node IDs/anchors are removed without adding an Undo step. Old IDs may still
occur in history, but they no longer resolve to cached resources.

The ProseMirror history adapter reads IDs from inverse steps and slices; CodeMirror
reads anchor effects in both history branches. These adapters assume the standard
histories. An engine can report unknown retention (or omit `retainedTargets`) to
preserve successful results conservatively. External history requires its own
retention adapter; without a standard history field the built-in adapters only
inspect the live document. Timeout is a failed operation; explicit cancellation
reports cancelled.
