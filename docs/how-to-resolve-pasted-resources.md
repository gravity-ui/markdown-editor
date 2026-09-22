# Resolve resources after paste

Configure `resourceReplacement` in `useMarkdownEditor` to asynchronously copy or resolve string resource values (URLs or opaque identifiers) in both editor modes. The normal paste/drop pipeline inserts the original content first. Once the resolver finishes, the editor replaces **every current resource with the matching kind and old value**, including resources that existed before the paste or were added while the request ran.

```tsx
const editor = useMarkdownEditor({
  resourceReplacement: {
    resources: {
      image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
    },
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
      return response.json();
      // {replacements: [{kind: 'image', oldValue: '/old.png', newValue: '/new.png'}]}
    },
    onChange({operationId, status, error}) {
      // Optional application progress/error reporting.
    },
  },
});
```

The application owns resource copying, authorization and server cleanup. Relative URLs are passed as parsed; the editor does not infer the source page or download them. Binary clipboard and dropped files continue through `handlers.uploadFile`, without an additional call to `resolve`.

## Configuration

`resources` explicitly maps registered node names to `{kind, valueAttribute, nameAttribute?, valueType?: 'url'}`. Each entry supplies the complete description; `false` disables that node. Omitted or empty resources track nothing, even if a consumer extension declared resource metadata. Ordinary links and code are excluded. For file attachments, configure the node named by `FILE_TOKEN` from `@diplodoc/file-extension`, with `valueAttribute: 'href'` and `nameAttribute: 'download'`.

Custom resources are opaque strings by default. Set `valueType: 'url'` for a custom
resource whose value is an address. Built-in `image`/`src` and `FILE_TOKEN`/`href`
always use URL rules, regardless of the application's `kind`. Neither `kind: 'image'`
nor an attribute named `src` alone makes a custom resource a URL.

```ts
resources: {
  asset: {kind: 'asset', valueAttribute: 'assetId', nameAttribute: 'title'},
}
// resolve receives [{kind: 'asset', value: 'asset:ABC/123', name: 'Схема'}]
// and returns {replacements: [{kind: 'asset', oldValue: 'asset:ABC/123', newValue: 'asset:XYZ/456'}]}
```

`name` is only an optional display label; loaders fall back to `value`. Objects and
numbers are not supported as values. No compatibility aliases for the old contract are provided.

`triggers` accepts `'paste'`, `'drop'`, `{name: 'paste'}` and `{name: 'drop'}`. Omitted or empty triggers disable the integrations. Without `resolve`, no controller or resource plugin is installed. Pasting as plain text and pasting into code do not resolve resources.

Copying into the same editor follows the same rules as any other paste. There is no editor `id`, clipboard identity, `source.sameEditor` or `allowSameOrigin` option.

In Markdown mode, a reference image starts a request only when both the image and its selected reference definition are inserted in the same transaction. Pasting `![Photo][id]` using an existing `[id]: /image.png` definition adds no resource to `resolve` and no indicator or protection. Such images still participate in global replacement if another pasted resource starts a request for their URL.

Resources are deduplicated by `(kind, value)` within each request; the first occurrence supplies the optional name. Returned `(kind, oldValue)` pairs must belong to that request. The complete response is checked before any changes: malformed records, conflicting duplicates and unknown pairs fail the operation. New values must be nonempty strings. URL resources additionally validate and normalize their replacements, including requested URL pairs with no remaining matches; opaque values are matched exactly, without trimming, case folding, entity decoding or URL encoding. Syntax preparation can also fail before dispatch. A partial response changes only its listed pairs; `{replacements: []}` succeeds without document changes.

## Pending presentation and editing

Only resources inserted by a pending operation are hidden behind indicators and protected from edits or deletion. Existing resources with the same value remain visible and editable. Markdown replaces the resource syntax visually with a loading label; WYSIWYG shows an image skeleton or file loading label. These decorations never enter saved Markdown or Undo history.

Saving before resolution preserves the original resource values. Reopening that Markdown restores the resources without restarting the pending requests. Configured image resources remain image nodes even if their URL fails to load; a network error does not turn them into plain text.

Undo/Redo and all editor mode switches are blocked until the last active operation finishes applying its answer. Toolbar controls reflect these locks even without an application `onChange` callback. A rejected mode switch is not queued. The rest of the document remains editable, and additional pastes may start concurrent requests.

Answers apply in completion order to the current document, using its current kind/value pairs. One answer cannot cascade its own substitutions. If another answer already changed a value, a later answer for the original value skips it. Each operation retains its own indicator and protection until completion, including when another response updates its resource.

CodeMirror uses the current Markdown syntax tree and changes source value ranges without rebuilding the document through ProseMirror. URL resources are normalized and escaped so Markdown entities cannot change their meaning. Opaque values go directly to the syntax handler’s serializer. All replacements are prepared before dispatch; a serialization error leaves the entire document unchanged. Reference images are converted individually to inline images, preserving label and title. Shared definitions stay unchanged, so ordinary reference links retain their targets. ProseMirror changes only the configured value attribute, preserving other node attributes.

## History

Resolution creates no separate Undo event. Undo of the original paste removes all its content; Redo restores successfully replaced values without invoking `resolve` again. Edits made while waiting keep their own events and normal order.

Global replacements outside the paste are not part of its undo. If A already existed and B was pasted, both become `/new.png`; undoing B removes only B, leaving A at `/new.png`. Older, unrelated history events may restore an older URL. There is no persistent replacement cache or normalization after Undo/Redo.

The guarantees apply to the standard ProseMirror and CodeMirror histories. The CodeMirror history adapter amends the paste event and depends on the internal `@codemirror/commands` history representation. Run the resource integration tests when updating CodeMirror. External collaboration histories require their own history adapter.

## Lifecycle and cancellation

Each operation emits `pending` and exactly one of `succeeded`, `failed` or `cancelled`. Success includes answers with no remaining matches. Failure, cancellation and timeout remove indicators and protection while keeping the inserted content and other completed changes.

```ts
for (const {operationId} of editor.getPendingResourceReplacements()) {
  editor.cancelResourceReplacement(operationId);
}
```

Cancellation aborts the signal and releases locks immediately even if the resolver ignores abort. Its late result is ignored. Destroying the owning editor cancels all active operations. There is no timeout unless `timeoutMs` is supplied; it must be finite and positive. Cancellation does not guarantee rollback of server-side copying.

## Engine integration

The bundle creates a shared controller and passes it directly to each adapter through a type exposing only `enabled`, `busy` and `start({resources, apply, release})`. The controller deduplicates requests and stores no resource identities or cross-mode snapshots.

`ResourceReplacement` is an optional ProseMirror extension. Standalone integrations configure `NodeSpec._resource`, then supply `{controller, shouldTrack}`. `shouldTrack(transaction, previousState)` must be pure. The bundle's policy selects accepted clipboard transactions; requests start in `PluginView.update`, after normalizing appended transactions. History, code, remote and service transactions never launch a request.

The CodeMirror extension likewise accepts a pure `shouldTrack(transaction)` predicate and starts requests in an update listener after acceptance. Temporary resource ranges support only presentation/protection. Its global matching always reparses the current tree. Native CodeMirror history commands bypass transaction filters, so the adapter also guards their dispatch while pending.

`useMarkdownEditor` supplies CodeMirror with the configured markup parser's URL rules automatically. Its preset, Markdown options and `wysiwygConfig.extensions` form one shared configuration. Wiki extensions can add to that configuration; Wiki and Yjs are not required. Consumers do not need additional parser settings for resource replacement.

The shared schema and parsers are prepared lazily, without constructing a ProseMirror document, plugins or view, changing the editor mode, or displaying WYSIWYG. When WYSIWYG is opened, it reuses those dependencies and creates its plugins and view. Extension registration and `configureMd` run once per editor configuration; view-dependent work belongs in plugin/view factories.

Standalone CodeMirror integrations must explicitly supply `urls: {normalizeLink, validateLink}` alongside `controller`, `resources` and `shouldTrack`. Pass the configured markup parser itself or a compatible URL codec. A standalone editor can use standard Markdown rules explicitly:

```ts
import MarkdownIt from 'markdown-it';

const urls = new MarkdownIt('zero');
// Pass urls to codeMirrorResourceReplacement({controller, resources, shouldTrack, urls}).
```

CodeMirror still receives resource descriptions directly and uses its own syntax tree and handlers for source ranges. Sharing URL rules does not replace the CodeMirror grammar or require parsing the document through ProseMirror.

HTML-only attachments retain the existing conversion: in Markdown, `<a class="yfm-file">` becomes an ordinary link, not a resource. Image and file Markdown syntax is supported by built-in handlers. Legacy files use `{% file src="/report.pdf" name="Report" %}`; `:file[Report](/report.pdf)` requires enabling the file directive syntax.

## Custom CodeMirror resource handlers

New node types need an explicit CodeMirror handler. Register it through
`markupConfig.extensions`; no changes to the replacement controller are needed.
For example, suppose a consumer extension provides an `asset` node and a Markdown
parser/serializer for `:asset["asset:ABC/123"]`. Its value is a JSON string inside
brackets, so quotes, backslashes and newlines must use JSON escaping:

```ts
import {codeMirrorResourceSupport, useMarkdownEditor} from '@gravity-ui/markdown-editor';

const assetSupport = codeMirrorResourceSupport({
  nodeType: 'asset',
  valueAttribute: 'assetId',
  syntaxNodes: ['AssetResource'],
  syntax: {
    defineNodes: ['AssetResource'],
    parseInline: [{
      name: 'AssetResource',
      before: 'Link',
      parse(cx, next, pos) {
        if (next !== 58) return -1; // ':'
        const match = /^:asset\[("(?:[^"\\\r\n]|\\.)*")\]/.exec(cx.slice(pos, cx.end));
        if (!match) return -1;
        return cx.addElement(cx.elt('AssetResource', pos, pos + match[0].length));
      },
    }],
  },
  read({node, doc}) {
    const valueRange = {from: node.from + 7, to: node.to - 1};
    return {
      range: {from: node.from, to: node.to},
      valueRange,
      attrs: {assetId: JSON.parse(doc.sliceString(valueRange.from, valueRange.to))},
      serialize: (value) => JSON.stringify(value),
    };
  },
});

useMarkdownEditor({
  // Register the matching WYSIWYG asset node/parser/serializer as usual.
  markupConfig: {extensions: [assetSupport]},
  resourceReplacement: {
    resources: {asset: {kind: 'asset', valueAttribute: 'assetId'}},
    triggers: ['paste', 'drop'],
    resolve: copyResources,
  },
});
```

`syntax` is optional when the editor language already produces the required nodes.
`read` returns parsed attributes, source ranges and a mandatory pure `serialize(value)`
function. The handler must match both the node type and configured `valueAttribute`.
All positions refer to `doc`, which is the updated document during a transaction;
`state` supplies configuration. `range` includes the complete resource. `valueRange`
contains precisely the text replaced by `serialize`: in this example it includes the
JSON quotes. The serializer must escape for its concrete syntax or throw if the
value cannot be represented. Reading the resulting syntax must restore the exact
opaque value. Decoding JSON escapes here is syntax decoding, not URL decoding.

URL handlers read parsed URLs (using `urls` when necessary), opt into `valueType: 'url'`
and serialize the prepared URL for their syntax. Built-ins escape entities for Markdown
destinations and preserve literal ampersands in legacy file attributes. `urlSyntax`
is replaced by `serialize`; there is no implicit Markdown serialization for custom ids.
Reference-image handlers serialize an inline destination; the adapter constructs their
suffix while preserving the shared definition.

One string value per resource is supported. Code and ordinary links are excluded.
Custom handlers precede built-ins. A configured node without a matching handler causes
an explicit error; there is no fallback to the WYSIWYG parser. Matching PM parsing and
serialization remain necessary for mode conversion.

A complete CodeMirror tree is reused when it matches the document being scanned. Otherwise, the required document is parsed synchronously in full, without a separate tree cache or incremental fragments. Insertion collection invokes resource handlers only within inserted ranges; a separate block traversal finds reference definitions. Responses collect resources across the whole document. No ProseMirror document is constructed for Markdown collection or replacement.

## Verification

See the [architecture](pasted-resources-architecture.md), unit/integration tests in `packages/editor/src/modules/resource-replacement`, and browser tests in `demo/tests/visual-tests/PasteResources.visual.test.tsx`. Run tests only in containers as described in [the testing guide](how-to-add-visual-test.md).
