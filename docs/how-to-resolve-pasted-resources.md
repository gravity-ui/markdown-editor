# Resolve resources after paste

For implementation details, see the [architecture diagrams](pasted-resources-architecture.md).

Configure `resourceReplacement` in `useMarkdownEditor` to asynchronously copy or resolve image and attachment URLs. The editor **inserts the original content immediately**, then calls the application. When the callback finishes, the editor updates the corresponding resources in the current document. Both WYSIWYG and Markdown support this API.

```tsx
const editor = useMarkdownEditor({
  resourceReplacement: {
    resources: {image: {kind: 'image', urlAttribute: 'src', nameAttribute: 'alt'}},
    triggers: ['paste', 'drop'],
    timeoutMs: 120_000,
    async resolve(resources, {operationId, signal}) {
      const response = await fetch('/api/copy-resources', {
        method: 'POST',
        signal,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({operationId, resources}),
      });
      if (!response.ok) throw new Error('Cannot copy resources');
      // {replacements: [{kind: resources[0].kind, oldPath: resources[0].path, newPath: '/new/resource'}]}
      return response.json();
    },
    onChange({operationId, status, error}) {
      // Show application-owned progress or errors for this operation.
      // "pending" does not lock editing or commands.
    },
  },
});
```

Each resource has the configured `kind` (for example `image` or `file`), `path`, and optional `name`. The path may be relative or a full URL. Identical kind/path pairs are deduplicated **within one paste operation**. The application returns `{kind, oldPath, newPath}`; `kind` and `oldPath` must exactly match an input resource. Omitted pairs and `{replacements: []}` retain original paths. The editor applies the replacements.

The application owns authorization, source-page detection, resource copying and server cleanup. Descriptions are not downloaded files. Relative URLs are passed as represented in the fragment; the editor does not guess a source page. Binary clipboard `File` objects continue through `handlers.uploadFile`.

## Configure resources explicitly in the hook

Built-in node specs contain no resource defaults. Select node names and their resource
attributes through `resourceReplacement.resources` when initializing the editor:

```ts
useMarkdownEditor({
  resourceReplacement: {
    resources: {
      image: {kind: 'asset', urlAttribute: 'src', nameAttribute: 'alt'},
      // image: false, // Alternatively, disable image replacement.
    },
    triggers: ['paste', 'drop'],
    resolve: copyResources,
  },
});
```

Each entry supplies that node's complete resource description; `false` disables it.
Only listed nodes are tracked. Omitted `resources` or `{}` means no resources are tracked,
even if a custom extension declared its own metadata. Keys must name registered
node specs. Overrides apply after consumer extensions and before the replacement plugin,
so both editor modes use the same final schema. These are initialization options, following
the usual `useMarkdownEditor` dependency/recreation lifecycle, not live schema updates.

## Skip replacements copied from the same editor

Pass an application-owned `id` to `useMarkdownEditor`. Keep it stable
for the lifetime of the editor and distinct for different instances. The library
does not generate an ID. Both modes use this ID when writing clipboard metadata
on copy/cut and comparing it on paste, including copying between modes.

```tsx
const editor = useMarkdownEditor({
  id: editorId,
  resourceReplacement: {
    resources: {image: {kind: 'image', urlAttribute: 'src', nameAttribute: 'alt'}},
    triggers: ['paste'],
    async resolve(resources, {signal}) {
      return copyResources(resources, {signal});
    },
  },
});
```

`source.sameEditor` is `true` when the clipboard ID matches, and `false` when a
recognized clipboard ID differs. `source` is absent if either ID is missing or
the clipboard metadata is invalid, unsupported or stripped by another application.
The ID compares editor instances; it does not identify a document or authorize
access to its resources. Copy metadata is written even without a resolver or
enabled triggers. Copying still preserves the usual text/HTML/YFM formats.

Both modes also write the same metadata to `dataTransfer` on `dragstart`, after
the editor's native handler. With the `drop` trigger enabled, the receiving editor
reads this source and applies the same `allowSameOrigin` policy. Shift only bypasses
replacement on paste; on drop it retains its native drag modifier behavior.

By default, matching IDs skip resource replacement for the operation entirely:
the content is inserted normally, but resources are not registered for replacement,
and neither `resolve` nor operation status callbacks run. Unknown origins are still
processed. String triggers such as `'paste'` use this default, as does
`{name: 'paste'}`.

To process same-editor pastes, opt in for that trigger:

```ts
triggers: [{name: 'paste', allowSameOrigin: true}]
```

With this option, `resolve` receives `source.sameEditor: true` and can still return
`{replacements: []}` to preserve the inserted URLs. `allowSameOrigin` defaults to
`false` and compares editor IDs, not URL origins. Origin metadata is captured per
operation, so concurrent pastes keep independent sources.

## Immediate insertion and concurrent operations

The normal clipboard pipeline chooses and parses HTML/YFM/Markdown. After accepting the paste transaction, the editor registers its resources and starts the callback. Alternate clipboard representations do not produce duplicate calls. Without `resolve`, the bundle creates no resource controller or ProseMirror resource plugin, and paste behavior is unchanged. `getPendingResourceReplacements()` returns an empty list and `cancelResourceReplacement()` is a no-op. Ordinary links, code and plain text are not resources. Pasting into code or pasting as plain text bypasses resolution.

Input, paste, cut, drop, toolbar commands, public mutation methods, Undo/Redo, submit, preview and mode switches remain available. Several operations can run simultaneously and finish in any order. Their tracked instances and results are independent, even when kind/path pairs match.

Only instances from the corresponding paste are updated, not every matching URL in the document. Local and remote edits may move them. Changed labels, image sizes, surrounding text, focus and selection are preserved. Deleted resources are skipped; the response never recreates deleted content. A URL explicitly changed by the user is not overwritten. The response may therefore update fewer live instances than originally pasted.

Internal WYSIWYG resource IDs are retained in editor state for history and identity. They are excluded from HTML and Markdown serialization. Markdown uses mapped URL ranges and parser checks, preserving surrounding source formatting. Structural comparisons disregard generated tab and checkbox DOM identities, which change on every parse; resource paths, text and other content attributes remain checked.

Mode conversion transfers identities through the complete ordered resource list. If custom conversion changes that list, uncertain bindings are not transferred. Reference images are resolved in the context of the full document, including existing definitions. A replaced reference image is converted to an inline image; its label and title are preserved, and the shared definition is unchanged. Other uses of that definition, including images added while the callback runs, keep their paths. Unsupported source spans retain their original value.

HTML-only file attachments pasted into Markdown keep the existing conversion behavior:
`<a class="yfm-file">` becomes an ordinary Markdown link and is not passed to the
resolver when only image and file nodes are configured. Files copied between editor modes
retain their resource markup through `text/yfm` or Markdown in `text/plain`.

## Lifecycle and cancellation

Each operation emits `pending`, followed by exactly one of `succeeded`, `failed` or `cancelled`. `succeeded` means the result was handled and applicable live resources were updated; deleted or manually changed resources may have been skipped. The entire response is checked using the configured parser’s URL validation before any replacements are cached, even if the paste has been undone. Callback failures, invalid results, timeouts and cancellation keep the already inserted content. They do not roll back later edits or server-side copying.

```ts
for (const operation of editor.getPendingResourceReplacements()) {
  editor.cancelResourceReplacement(operation.operationId);
}
```

Cancelling an operation aborts its signal; it does not cancel other pastes. Late responses are ignored. Destroying the owning editor (`EditorImpl`) cancels all pending operations. Removing the ProseMirror plugin or destroying an individual engine only unregisters that engine; it does not dispose the shared controller. Cancelling client work does not guarantee server rollback.

The default timeout is 120 seconds. Set a finite positive `timeoutMs`. Applications can choose their own save/navigation policy using the lifecycle events; the editor imposes no pending-operation lock.

## History and collaboration

The automatic URL update is part of the original paste for Undo/Redo; it is not a separate user history step. Later typing remains separately undoable. Undo during a request removes the paste normally. A completed result is retained for Redo without another callback. Cached replacements are collected once neither mode's document nor standard Undo/Redo history references them; pending operations retain their targets. Failed, cancelled and omitted replacements release their targets after completion without removing pasted content. Cached replacements and internal identities are not a persistent cross-session operation log.

WYSIWYG uses ProseMirror history. Markdown uses CodeMirror history effects and a narrowly scoped history adapter to amend the original event. That adapter depends on the `@codemirror/commands` history-state representation; run the paste integration tests when updating CodeMirror.

The editor has no dependency on Yjs or its editor bindings. Resource tracking follows editor transactions, including remote changes. Internally, remote changes are recognized through CodeMirror's `Transaction.remote` annotation or ProseMirror's `remoteTransactionMeta` and `rebased` metadata. `remoteTransactionMeta` is not exported from the package root.

The history guarantees above apply to the standard ProseMirror and CodeMirror histories. A custom collaboration history needs an application-owned adapter to preserve resource identity across its Undo/Redo and attach automatic replacements to the original paste. This integration is not provided by the core paste implementation. The internal `pasteHistoryBoundary` facet supports closing history groups before and after paste; it does not amend external history. ProseMirror replacements carry the internal `resolvedResourceMeta` metadata. Neither is exported from the package root.

## ProseMirror integration

The optional `ResourceReplacement` extension registers its plugin through
`builder.addPlugin` and `ExtensionsManager`, with `Priority.Lowest`. The bundle
registers it after existing clipboard extensions via
`builder.use(createProseMirrorResourceIntegration({host, triggers}))`,
only when a resolver is configured. The integration assembles the clipboard policy
and connects `ResourceReplacement` with its `shouldTrack` predicate.
The extension assumes its host is ready; `ResourceReplacementHost` has no `enabled` flag.
`host` implements `ResourceReplacementHost`: `active`, engine registration, target lookup
and resolution. The plugin has no access to controller disposal or
application-wide cancellation/subscriptions through this interface. The bundle passes
a mode-bound adapter created by `createResourceReplacementHost(controller, 'wysiwyg')`.
The adapter registers targets, deduplicates resources and activates its mode.
Low-level integrations own and dispose their controller separately from the plugin.
`WysiwygEditor` has no paste-specific options or plugin installation logic.
The plugin uses standard ProseMirror hooks and works with the default
`EditorView` dispatcher. Clipboard handlers do not depend on the replacement extension:
they dispatch parsed content with standard `paste: true` metadata. Native ProseMirror
paste already sets this flag. Custom handlers can opt in with
`view.dispatch(transaction.setMeta('paste', true))`.

Standalone integrations that bypass `useMarkdownEditor` configure node metadata directly.
For example, a custom extension can declare:

```ts
builder.addNodeSpec('video', () => ({
  inline: true,
  group: 'inline',
  atom: true,
  attrs: {src: {}},
  resource: {kind: 'video', urlAttribute: 'src'},
  toDOM: (node) => ['video', {src: node.attrs.src}],
}));
// Register its Markdown parser and serializer as usual.
```

Then connect the replacement extension with the desired transaction predicate:

```ts
builder.use(ResourceReplacement, {
  host,
  shouldTrack: (tr, _state) => tr.getMeta('import-resource') === true,
});
```

Register the node specs and serializers before this extension. It adds the internal tracking ID attribute
and wraps node HTML/Markdown serializers to omit it using a private node copy, leaving editor state intact.
Descriptions support one URL attribute
per node type, not link marks. Empty kinds and missing URL attributes are rejected. `kind` is an arbitrary nonempty string returned unchanged to the resolver;
responses may only replace kind/path pairs included in the request. `shouldTrack` receives
the transaction and previous state and must be pure. Own service transactions, history,
remote changes and code are excluded even when the predicate returns true. The bundle's separate transaction policy excludes Shift-paste; standalone predicates
control that decision themselves. Attribute-only URL changes can be selected as well as insertions.

`useMarkdownEditor({resourceReplacement: {resources, triggers, resolve}})` is the common
configuration entry point; `resources` selects which node types to track.
Image and file extensions declare no resource defaults. The hook populates `NodeSpec.resource`
only for node names explicitly listed in `resourceReplacement.resources`.
Unlisted types and entries set to `false` are excluded. Omitting `triggers`
or passing `[]` prevents both resource replacement integrations from being installed.
`['paste', 'drop']` enables both clipboard paste and dropped content; `['drop']`
enables only the latter. Both accept `{name, allowSameOrigin}` configuration.
File uploads remain controlled by `handlers.uploadFile` and do not start resource
replacement. Drop into code is excluded based on the destination.

Both engines read `node.type.spec.resource`. CodeMirror uses the configured
Markdown parser to create temporary ProseMirror nodes with the same schema metadata;
reference-image handling also respects the selected image description and kind.
A custom resource node needs a corresponding Markdown parser/serializer to work in
markup mode and across mode switches. These are node descriptions, not MIME filters.
The controller does not inspect engine transactions: each integration selects its
own events according to `triggers`.

The plugin maps inserted ranges through subsequent steps and normalizing transactions,
then assigns resource IDs in `appendTransaction`. It adds a history boundary to the
original paste metadata in `filterTransaction`. After all appended changes, its
`PluginView.update` clears the pending batch and closes history before calling the host.
State computation alone never starts requests. Transactions rejected by the predicate
and remote transactions are ignored. `appendTransaction` also detaches IDs when users edit URLs and reapplies
cached replacements after Undo/Redo. Detachment belongs to the user's history event;
automatic URL replacements do not create a separate event.

## Internal CodeMirror integration

The bundle connects the extension through the internal module entry point
`modules/resource-replacement/codemirror`. The extension and its options are not
exported from the package root; applications use `useMarkdownEditor` with
`resourceReplacement`. Implementation details are described in the
[architecture](pasted-resources-architecture.md#7-markdown-отслеживание-и-применение).

No controller or dispatch wrapper is required. The extension excludes remote changes,
Undo/Redo and its own URL updates. It creates targets and anchors during transaction
computation, then calls the host from an update listener only after the view accepts
those transactions. Its ViewPlugin owns engine registration and unregisters on removal
or destruction without cancelling the owner's operations. To reinstall after removal,
the owner can restore a previously captured resource snapshot.

The bundle separately supplies paste/drop/Shift/code policy. External `pasteHistoryBoundary`
callbacks belong to that DOM event integration: they run before an eligible paste/drop and after its
accepted document update. Custom/programmatic sources must manage external history
boundaries themselves. Built-in CodeMirror history remains integrated with the generic
extension. Both engines share parser helpers from `modules/resource-replacement/prosemirror/document-utils.ts`.

## Verification

Unit/integration tests cover both engines, concurrent requests, editing/deletion, errors, cancellation, mode transfer, standard history and remote editor transactions. The browser suite is `demo/tests/visual-tests/PasteResources.visual.test.tsx`, configured by `demo/tests/playwright/paste-resources.config.ts`. Run tests in a container as described in [the testing guide](how-to-add-visual-test.md).

Native copy/paste is tested in Chromium and Firefox. Linux headless WebKit emits an empty native clipboard in this harness, so WebKit uses explicit clipboard events. The mobile profile is emulation; actual Safari/iOS clipboard menus still require device verification.

`createProseMirrorResourceIntegration` assembles resource replacement and a per-editor policy in
`modules/resource-replacement/integration/prosemirror-policy.ts`. Its small plugin observes Shift and resets
on blur/destruction; its predicate interprets the configured triggers and paste/drop metadata.
`ResourceReplacement` has no clipboard data access or keyboard handlers of its own.
CodeMirror assembles its event selection separately in
`modules/resource-replacement/integration/codemirror-policy.ts`; the reusable extension only calls the supplied
`shouldTrack` predicate.
