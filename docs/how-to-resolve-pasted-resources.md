# Replacing resources on paste

`resourceReplacement` passes resources from a local paste/drop insertion to the
application so that it can copy them and return new values. Binary file uploads
use a separate mechanism. The library does not require Wiki or Yjs.

## Setup

```tsx
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import type {Extension, ResourceReplacementConfig} from '@gravity-ui/markdown-editor';

// Application implementation; the contract is described below.
declare const copyResources: NonNullable<ResourceReplacementConfig['resolve']>;

const AppResources: Extension = (builder) => {
    builder.overrideNodeSpec('image', (spec) => ({
        ...spec,
        _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
    }));
    builder.overrideNodeSpec('yfm_file', (spec) => ({
        ...spec,
        _resource: {kind: 'file', valueAttribute: 'href', nameAttribute: 'download'},
    }));
};

const editor = useMarkdownEditor({
    preset: 'full', // Registers image and yfm_file before AppResources.
    initial: {mode: 'markup'},
    wysiwygConfig: {extensions: AppResources},
    resourceReplacement: {
        triggers: ['paste', 'drop'],
        resolve: copyResources,
    },
});
```

With `useMarkdownEditor`, processing requires both `resolve` and a nonempty
`triggers` list. Each trigger is `'paste'` or `'drop'`. Shift does not disable processing.
Insertions containing binary files are excluded.

`NodeSpec._resource` is the only source of resource descriptions for both modes:

| Field | Purpose |
| --- | --- |
| `kind` | A nonempty string identifying the application's resource category. |
| `valueAttribute` | A nonempty name of an attribute in `NodeSpec.attrs` that holds a string value. |
| `nameAttribute` | An optional label attribute; a nonempty string is passed as `name`. |
| `valueType: 'url'` | Enables URL rules for a custom resource. |

The `ResourceDescription` type is exported from the package. Set metadata after
registering the node; a third-party extension can also set it itself. Built-in
images and files **are not enabled automatically**. Nodes without `_resource`
are skipped; to disable a type, remove its `_resource` using `overrideNodeSpec`.
For an optional node, check `builder.hasNodeSpec(name)` first.
An invalid `kind` or `valueAttribute`, or an attribute missing from the schema,
causes an error. The bundle validates the schema when initializing resource
processing; standalone PM validates it when initializing the plugin, and standalone
CM on the first parse.

Register a custom node through a regular extension with `spec`, `fromMd`, and `toMd`.
For example, `_resource: {kind: 'asset', valueAttribute: 'id'}` describes an opaque ID,
while `{kind: 'video', valueAttribute: 'src', valueType: 'url'}` describes a URL.
The extension's parser and serializer handle the syntax and escaping of values.
Resource replacement does not require a separate CM syntax handler.

`useMarkdownEditor` automatically uses the shared configuration for the preset,
`md`, extensions, directive syntax, PM transformers, modifiers, and serialization.
There is no need to pass a second extension list or parser; `markup` mode works
without opening WYSIWYG.

## The resolve contract

```ts
declare function resolve(
    resources: readonly {kind: string; value: string; name?: string}[],
    context: {operationId: string; signal: AbortSignal},
): Promise<{
    replacements: {kind: string; oldValue: string; newValue: string}[];
}>;
```

`value` is the parsed attribute value, not a fragment of the original Markdown.
`oldValue` must exactly match a `value` from the request. The key is the pair
`(kind, value)`; `name` is not part of it. Duplicates within one operation are
merged, preserving the first occurrence and its label. Opaque IDs are not trimmed,
case-converted, decoded, or normalized as URLs.

`newValue` must be a nonempty string. Only requested pairs are allowed in the
response; two different new values for the same pair cause an error. An empty
list or a partial response is successful: resources not listed remain unchanged.

For `image/src` and `yfm_file/href`, URL rules apply regardless of `kind`.
For other nodes, enable them with `valueType: 'url'`. Source URLs are validated
by the parser during collection; new URLs are normalized, escaped, and validated
before writing, even if the requested resource has already been deleted.
An opaque ID is not transformed as a URL even if it shares a `kind` with a URL resource.

## General behavior and operation completion

Each accepted insertion containing resources creates one request. New insertions
can start concurrent requests. Undo/redo, incoming synchronization, and applying
a response do not trigger `resolve` again.

A response changes **all current matches** of `(kind, oldValue)` in the document,
including resources that existed before the insertion. Code nodes/marks and
regular links are excluded. Monospace (`##...##`) is formatting, not a code mark:
resources inside it are collected and replaced normally. A value edited by the user
participates only under its current key. Deleting a resource does not cancel the request or restore the
node; if there are no matches, the operation succeeds without writing. Replacements
do not cascade within a response: with `A → B, B → C`, the original `A` becomes `B`.
The first of several concurrent responses may remove matches for the next one;
cancelling one operation does not roll back another operation's result.

While waiting, the entire document can be edited, deleted from, and rearranged.
There are no resource loaders or protected ranges. In WYSIWYG, the built-in
`ImgSize` node view converts an image to text on load failure, including while
`resolve` is pending. Resource replacement does not restore it from text.
If no current matches remain, the operation succeeds without changes.
Local undo/redo and mode switching are locked from the moment the insertion is
accepted, including the interval before `resolve`, until the last operation
completes, subject to the [cleanup contract](#service-dispatch-acceptance).
Binary uploads use their own indicators and protection.

- `editor.getPendingResourceReplacements()` returns an array of `{operationId}`.
- `editor.cancelResourceReplacement(operationId)` cancels the selected operation.
- `onChange` receives `{operationId, status, error?}` with a status of `pending`,
  `succeeded`, `failed`, or `cancelled`.
- `timeoutMs` sets the waiting limit in milliseconds and must be a finite positive
  number. Without it, there is no timeout; exceeding the limit ends the operation
  with `failed` status.

An exception from `resolve`, an invalid response, or an error while preparing the
result ends the operation with `failed` status. Transformation and validation
happen before writing: a parsing, URL, or serialization error cannot leave a
partially applied response. Writing checks whether the editor is editable.
On completion, the controller removes its pending entry before notifying the
application; releasing the adapter's lock requires the cleanup contract above.
Cancellation, failure, and timeout abort the signal; a late response is ignored
even if the application did not handle the abort. Destroying the editor cancels
its operations.

Until the response is applied, the document contains the old values. The application
decides whether saving is allowed at this point. Cancellation does not delete the
inserted text and does not itself undo copying already performed on the server.

## CodeMirror: collection, serialization, and history

Inserted fragments of an accepted transaction are parsed by the shared Markdown → PM
parser **separately, without the surrounding insertion context**. All candidates
are included in one request. Collection is approximate: an image inserted into
an existing code block may be included in the request, while a reference image
whose definition is outside the fragment may be missed. An extra candidate may
cause server-side copying and replacement of a matching resource outside code;
resources inside code are not replaced when applying the response.

To apply a nonempty response, the entire current Markdown document is parsed again.
If attributes change, the document **is serialized in full**: byte-for-byte
preservation is not guaranteed, formatting may change, and reference constructs
may become inline. There is no serialization if attributes do not change.
Both modes use the existing resource serializers. URLs containing literal HTML
entities may change after serialization and reparsing. Fixing HTML entity handling
in image and file URLs is outside the scope of resource replacement.

CM receives a single replacement between the common prefix and suffix of the
current and new text. When changes are spread apart, the text between them is
also rewritten, including through the binding to Y.Text. Selection may shift,
and widgets inside that span may move or disappear even where text is unchanged.
The result enters regular history as a separate change: undo can restore the old
values, and redo does not repeat the request.

## ProseMirror: collection and history

Collection targets inserted resources at their final transaction coordinates,
subject to the [normalization constraints](#normalization-before-collection) below.
After the request is prepared, the original resource positions are no longer
tracked; applying the response uses the current document.

Replacement is not added to regular PM history (`addToHistory: false`); the
insertion is separated by `closeHistory` boundaries. Undo/redo of an insertion
preserves the new value of a resource that remained in the document and was
replaced. Undoing the insertion does not roll back the replacement of a resource
that already existed.

Resources that exist only in history are not updated. For example: insertion →
deletion while `resolve` is pending → response with no matches → undoing the
deletion restores the old value. The history of URL/ID edits and moves implemented
as deletion/insertion can also restore old values. History is not rewritten separately.

## External history and collaborative editing

An integration with external history is responsible for the following:

- Check the public `isCodeMirrorHistoryLocked(state)` or
  `isProseMirrorHistoryLocked(state)` **before modifying the external document**
  during undo/redo. The guard must cover keyboard actions, `beforeinput`, and
  direct manager calls, including the interval before `resolve` starts.
  Filtering editor transactions is insufficient if the manager has already
  modified, for example, Y.Doc.
- Mark incoming changes, including received undo/redo, as remote:
  `Transaction.remote` in CM, `remoteTransactionMeta` in PM (exported from
  `@gravity-ui/markdown-editor/_/extensions/behavior/ResourceReplacement/index.js`).
  Set these markers **before the history transaction filter runs**. In CM a
  `transactionExtender` runs after filters: its remote annotation can prevent
  resource collection, but cannot make an already rejected undo/redo acceptable.
  In PM a classification plugin must run before the resource history filter.
  PM also recognizes the existing `rebased` metadata. Only local history is
  blocked while an insertion is queued or a request is pending.
  Preserve the original annotations, origin, and history manager settings.
- Apply the response through the active editor and its standard binding.
  Do not directly modify the other mode's document or block other participants' actions.
- When implementing custom mode switching, recheck the lock after asynchronous
  confirmation. Release subscriptions and any history manager owned by the
  integration when it is destroyed.

The guarantees of regular PM history do not imply rewriting external history
manager events.

## Standalone CodeMirror

```ts
import {codeMirrorResourceReplacement} from '@gravity-ui/markdown-editor/_/markup/codemirror/resource-replacement-plugin/index.js';
import {ResourceReplacementController} from '@gravity-ui/markdown-editor/_/modules/resource-replacement/index.js';

// Reuse the editor's configured manager and the application's resolver above.
const {markupParser: parser, serializer} = extensionsManager.buildDeps();
const controller = new ResourceReplacementController({resolve: copyResources});
const extension = codeMirrorResourceReplacement({
    parser,
    serializer,
    controller,
    shouldProcessTransaction: (tr) =>
        tr.isUserEvent('input.paste') || tr.isUserEvent('input.drop') || tr.isUserEvent('move.drop'),
    // escapeConfig: serialization settings, if needed
});
```

The parser and serializer must use the editor's shared extension configuration.
The manager can be created with the internal factory from
`@gravity-ui/markdown-editor/_/core/createEditorExtensionsManager.js`.
The factory, controller, and CM plugin require direct imports, not package-root
imports. Here `shouldProcessTransaction` selects insertions instead of the bundle's
`triggers`; also exclude binary uploads when integrating the plugin yourself.
The controller's owner is responsible for destroying it.

## Internal architecture and lifecycle

Dependencies flow from `EditorImpl` through the engine adapter to the shared
resource replacement module. The shared module does not import adapters, DOM,
React, or Yjs. Resource reading and replacement use the PM model and Transform,
without the behavior plugin, EditorState, or EditorView. The CM adapter owns
Markdown parsing and serialization; both adapters use shared resource reading
and replacement logic.

`EditorImpl` lazily creates a shared `ExtensionsManager`. `buildDeps()` registers
extensions and prepares the schema, markup/text parsers, serializer, and actions
without PM plugins, NodeView, or EditorView; a later `build()` reuses these
dependencies for WYSIWYG. DOM access belongs in plugin and view factories.
Unless both `resolve` and a nonempty `triggers` list are provided, no controller,
adapters, or dependencies are created for resource replacement.

`useMarkdownEditor` preserves `EditorImpl` when React StrictMode reconnects effects.
The controller, shared manager, and both adapters belong to one attachment
lifecycle and are created lazily. Cleanup preserves the current content, cancels
pending operations, clears timers, destroys views, and resets the controller and
manager references. The next editor access creates a fresh lifecycle; markup
still does not create a WYSIWYG EditorView. The old controller remains destroyed,
releases callbacks, and ignores late responses. Owners must remove subscriptions
to the stable `EditorImpl` with `off`; `destroy()` does not clear them globally.


### Service dispatch acceptance

A service replacement must be applied synchronously through the editor's standard
transaction pipeline. In PM the adapter confirms that the installed `view.state`
descends from the specific service transaction; speculative states that never
reach the view do not count. In CM the adapter observes that transaction in the
view's update listener. Filters can reject a service replacement, which fails the
operation. CM also verifies the prepared transaction's text before dispatch.

Subsequent `appendTransaction` normalization or synchronous edits may change the
final document without turning an accepted replacement into a failure. Acceptance
confirms the transaction was applied; it does not promise that later changes
preserve every replacement value. Dispatch errors still fail the operation, without
rolling back changes already applied: `failed` does not imply an unchanged document.
Custom dispatch implementations that defer application or reconstruct an unrelated
state from document JSON are outside this contract.

CM releases a completed operation with an effect-only transaction using
`filter: false` and `addToHistory: false`. Transaction and change filters cannot
reject this cleanup; it does not change the document or selection and creates no
history event. Insertions and resource replacements still pass through the usual
filters. A custom dispatch must synchronously apply cleanup transactions as well:
`filter: false` cannot bypass a dispatch implementation that drops them.

PM has no equivalent of CM's `filter: false`. **Every application/plugin
`filterTransaction` must accept pure resource cleanup transactions**, including
filters that otherwise reject all transactions while read-only:

```ts
import {Plugin} from 'prosemirror-state';
import {isResourceReplacementCleanupTransaction} from '@gravity-ui/markdown-editor/_/extensions/behavior/ResourceReplacement/index.js';

const plugin = new Plugin({
    filterTransaction(tr, state) {
        if (isResourceReplacementCleanupTransaction(tr)) return true;
        return applicationFilter(tr, state);
    },
});
```

The predicate recognizes release metadata only on a transaction with no document,
selection, stored-mark, scrolling, or history action and with `addToHistory: false`.
It does not exempt paste, start, or resource-value replacement transactions.
Normalizers must not append document or selection changes in response to cleanup.
Custom dispatch must synchronously apply cleanup to the current view through the
normal transaction pipeline. No plugin state is changed outside transactions.

Under this contract, completion removes only its own batch, preserves the document,
selection, and history, and unlocks the editor after the last operation. This also
applies when collection is empty or starting the request is declined. Preliminary
batches still lock history and mode switching before the controller starts.

Returning `true` from the resource plugin's own filter cannot override another
plugin's rejection. A filter or dispatch that violates this contract can still
leave the adapter locked after the controller has finished. The adapter reports
rejected cleanup as an error; this diagnostic does not release the batch. There
is no automatic retry, filter bypass, or direct plugin-state mutation in PM.

### Normalization before collection

Before resolve starts, inserted resource positions follow ordinary transaction
mapping. If a normalizer replaces a parent subtree, positions can be recovered
only when it retains the same immutable resource node object exactly once in the
replaced region, both before and after the step. `CollapseListsPlugin` preserves
these objects. With identity preserved, existing neighbors are not added, removed
resources are omitted, and final attributes are read after normalization, including
parent reconstruction within the original insertion transaction.

A normalizer that recreates resource nodes, or reuses a node object ambiguously,
cannot be matched reliably without additional provenance. In appended transactions,
such resources are omitted. Recreating nodes within the original multistep insertion
may incorrectly collect existing neighbors: this is a potential implementation bug,
not supported normalization behavior. Attribute steps that preserve positions can
run before or after parent reconstruction. Appended transactions create no requests.
Position tracking ends when the request starts; responses replace all current matches.
