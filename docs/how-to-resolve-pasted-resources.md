# Resolve resources after paste

For implementation details, see the [architecture diagrams](pasted-resources-architecture.md).

Configure `paste` in `useMarkdownEditor` to asynchronously copy or resolve image and attachment URLs. The editor **inserts the original content immediately**, then calls the application. When the callback finishes, the editor updates the corresponding resources in the current document. Both WYSIWYG and Markdown support this API.

```tsx
const editor = useMarkdownEditor({
    paste: {
        timeoutMs: 120_000,
        async resolvePastedResources(resources, {operationId, signal}) {
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
        onPasteOperationChange({operationId, status, error}) {
            // Show application-owned progress or errors for this operation.
            // "pending" does not lock editing or commands.
        },
    },
});
```

Each resource has `kind` (`image` or `file`), `path`, and optional `name`. The path may be relative or a full URL. Identical kind/path pairs are deduplicated **within one paste operation**. The application returns `{kind, oldPath, newPath}`; `kind` and `oldPath` must exactly match an input resource. Omitted pairs and `{replacements: []}` retain original paths. The editor applies the replacements.

The application owns authorization, source-page detection, resource copying and server cleanup. Descriptions are not downloaded files. Relative URLs are passed as represented in the fragment; the editor does not guess a source page. Binary clipboard `File` objects continue through `handlers.uploadFile`.

## Immediate insertion and concurrent operations

The normal clipboard pipeline chooses and parses HTML/YFM/Markdown. After accepting the paste transaction, the editor registers its resources and starts the callback. Alternate clipboard representations do not produce duplicate calls. Without `resolvePastedResources`, paste behavior is unchanged. Ordinary links, code and plain text are not resources. Pasting into code or pasting as plain text bypasses resolution.

Input, paste, cut, drop, toolbar commands, public mutation methods, Undo/Redo, submit, preview and mode switches remain available. Several operations can run simultaneously and finish in any order. Their tracked instances and results are independent, even when kind/path pairs match.

Only instances from the corresponding paste are updated, not every matching URL in the document. Local and remote edits may move them. Changed labels, image sizes, surrounding text, focus and selection are preserved. Deleted resources are skipped; the response never recreates deleted content. A URL explicitly changed by the user is not overwritten. The response may therefore update fewer live instances than originally pasted.

Internal WYSIWYG resource IDs are retained in editor state for history and identity. They are excluded from HTML and Markdown serialization. Markdown uses mapped URL ranges and parser checks, preserving surrounding source formatting. Structural comparisons disregard generated tab and checkbox DOM identities, which change on every parse; resource paths, text and other content attributes remain checked.

Mode conversion transfers identities through the complete ordered resource list. If custom conversion changes that list, uncertain bindings are not transferred. Reference images are resolved in the context of the full document, including existing definitions. A replaced reference image is converted to an inline image; its label and title are preserved, and the shared definition is unchanged. Other uses of that definition, including images added while the callback runs, keep their paths. Unsupported source spans retain their original value.

## Lifecycle and cancellation

Each operation emits `pending`, followed by exactly one of `succeeded`, `failed` or `cancelled`. `succeeded` means the result was handled and applicable live resources were updated; deleted or manually changed resources may have been skipped. The entire response is checked using the configured parser’s URL validation before any replacements are cached, even if the paste has been undone. Callback failures, invalid results, timeouts and cancellation keep the already inserted content. They do not roll back later edits or server-side copying.

```ts
for (const operation of editor.getPendingPasteOperations()) {
    editor.cancelPaste(operation.operationId);
}
```

Cancelling an operation aborts its signal; it does not cancel other pastes. Late responses are ignored. Destroying the editor cancels all pending operations. Cancelling client work does not guarantee server rollback.

The default timeout is 120 seconds. Set a finite positive `timeoutMs`. Applications can choose their own save/navigation policy using the lifecycle events; the editor imposes no pending-operation lock.

## History and collaboration

The automatic URL update is part of the original paste for Undo/Redo; it is not a separate user history step. Later typing remains separately undoable. Undo during a request removes the paste normally. A completed result is retained for Redo without another callback. Cached replacements and internal identities live with the editor instance and are not a persistent cross-session operation log.

WYSIWYG uses ProseMirror history. Markdown uses CodeMirror history effects and a narrowly scoped history adapter to amend the original event. That adapter depends on the `@codemirror/commands` history-state representation; run the paste integration tests when updating CodeMirror.

The editor has no dependency on Yjs or its editor bindings. Resource tracking follows editor transactions, including remote changes. Integrations should mark remote CodeMirror transactions with `Transaction.remote.of(true)`, or remote ProseMirror transactions with `remotePasteTransactionMeta` (exported by this package). The ProseMirror collaboration `rebased` metadata is also recognized.

The history guarantees above apply to the standard ProseMirror and CodeMirror histories. A custom collaboration history needs an application-owned adapter to preserve resource identity across its Undo/Redo and attach automatic replacements to the original paste. This integration is not provided by the core paste implementation. `pasteHistoryBoundary` lets a CodeMirror integration close its history group before and after paste; it does not amend external history. ProseMirror replacements carry the exported `resolvedPasteMeta` metadata.

## Verification

Unit/integration tests cover both engines, concurrent requests, editing/deletion, errors, cancellation, mode transfer, standard history and remote editor transactions. The browser suite is `demo/tests/visual-tests/PasteResources.visual.test.tsx`, configured by `demo/tests/playwright/paste-resources.config.ts`. Run tests in a container as described in [the testing guide](how-to-add-visual-test.md).

Native copy/paste is tested in Chromium and Firefox. Linux headless WebKit emits an empty native clipboard in this harness, so WebKit uses explicit clipboard events. The mobile profile is emulation; actual Safari/iOS clipboard menus still require device verification.
