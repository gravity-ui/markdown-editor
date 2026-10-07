##### Develop / Extension creation

## How to Create Extension

Let us examine the process of creating an extension based on the Mermaid extension, which enables the insertion and manipulation of Mermaid diagrams.

### WYSIWYG and Markup Modes

The initial point of focus is the fact that the editor operates in two distinct modes: WYSIWYG (What You See Is What You Get) and markup. The extension of the editor refers to the enhancement of the WYSIWYG functionality. In markup mode, the editor executes the standard conversion of either markdown markup or advanced markdown markup ([YFM](https://diplodoc.com/docs/en/syntax/), for example), depending on the integrated plugins. In the markup mode, we can verify that the plugin functions properly, and that the syntax inputted into the editor is accurately reflected in the preview. It is crucial at this stage to ensure that the markup translates correctly into HTML code.

In our example with the `mermaid` plugin, the code for the markup mode [can be found](https://github.com/gravity-ui/markdown-editor/blob/main/demo/md-plugins.ts#L52) in the `demo/mdplugins.ts` file.

> The development of a markdown plugin is not the focus of this discussion, but we would like to draw your attention to the extensions [we have implemented for YFM](https://github.com/diplodoc-platform?q=-extension&type=all&language=&sort=). It has recently endorsed the syntax of [directives](https://github.com/makhnatkin/markdown-it-directive), which is a [proposal within the CommonMark specification](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444). We recommend incorporating this syntax into new Markdown plugins.

### Step by Step Guide

#### 1. Create a Specification

Register each part separately: `addNodeSpec` for the schema, `addMarkdownTokenParserSpec` for parsing Markdown tokens, and `addNodeSerializerSpec` for serialization.

Register a custom NodeView separately with `addNodeView`, as shown in the next step.

````ts
const MermaidSpecsExtension: ExtensionAuto = (builder) => {
  builder
    .configureMd((md) => md.use(transform({runtime: 'mermaid', bundle: false}), {}))
    .addNodeSpec(mermaidNodeName, () => ({
      selectable: true,
      atom: true,
      group: 'block',
      attrs: {
        [MermaidConsts.NodeAttrs.content]: {default: ''},
        [MermaidConsts.NodeAttrs.class]: {default: 'mermaid'},
        [MermaidConsts.NodeAttrs.newCreated]: {default: null},
      },
      parseDOM: [],
      toDOM(node) {
        return ['div', node.attrs];
      },
      dnd: {props: {offset: [8, 1]}},
    }))
    .addMarkdownTokenParserSpec(mermaidNodeName, () => ({
      name: mermaidNodeName,
      type: 'node',
      getAttrs: ({content}) => ({content}),
    }))
    .addNodeSerializerSpec(mermaidNodeName, () => (state, node) => {
      state.write('```mermaid\n');
      state.ensureNewLine();
      state.write(node.attrs.content);
      state.ensureNewLine();
      state.write('```');
      state.ensureNewLine();
    });
};
````

#### 2. Add NodeView

To implement a custom NodeView, you need to implement the [prosemirror NodeView](https://prosemirror.net/docs/guide/#view.node_views) interface.

```ts
import {EditorView, NodeView} from 'prosemirror-view';
// ...

export class WMermaidNodeView implements NodeView {
  // ...
}
```

Register the NodeView with `addNodeView` in the extension that uses the specifications:

```ts
const MermaidExtension: ExtensionAuto<MermaidOptions> = (builder, options) => {
  builder
    .use(MermaidSpecsExtension)
    .addNodeView(
      mermaidNodeName,
      () => (node, view, getPos) => new WMermaidNodeView(node, view, getPos, options),
    );
};
```

The factory receives the extension dependencies (`schema`, `textParser`, `markupParser`, `serializer`, `actions`) and returns a `NodeViewConstructor`; it runs after the schema is built. Marks are registered the same way with `addMarkView`, which expects a `MarkViewConstructor`.

A node or mark can have only one view; a second registration throws. `ExtensionsManager` checks that each view targets a schema entity of the correct type.

See the [full example of the extension](https://github.com/gravity-ui/markdown-editor/tree/main/src/extensions/yfm/Mermaid/MermaidNodeView) for more details.

#### 3. Add Plugins

The extension can be enhanced with [plugins](https://prosemirror.net/docs/guide/#state.plugins) as needed. Check out the [YfmTable extension](https://github.com/gravity-ui/markdown-editor/tree/main/src/extensions/yfm/YfmTable/plugins/YfmTableControls) example, where plugins add a panel (a pop-up window) for working with columns and rows.

### Registration and Validation

Schema specs, Markdown token parsers, serializers, and views are registered independently. Multiple Markdown tokens can target the same schema entity without adding extra nodes or marks to the schema.

- `addNodeSpec` and `addMarkSpec` register schema specs. Mark priority controls the order of marks in the schema; equal priorities keep registration order.
- `addMarkdownTokenParserSpec` uses a Markdown token name as its key. The returned spec's `name` is the target schema entity; `node` and `block` require a node, and `mark` requires a mark. An ignored token (`ignore: true`) does not need a schema entity or serializer.
- `addNodeSerializerSpec` and `addMarkSerializerSpec` use schema entity names as keys. Every schema node and mark needs a serializer, except the root node.
- Duplicate registrations throw immediately. Each `override*` method requires a previous registration in the same collection. Overrides run in registration order and receive the previous result.

`ExtensionsManager` resolves spec callbacks after extensions are registered, then validates their final values against the registered schema specs before creating the ProseMirror schema. Unknown non-ignored parser targets and missing serializers cause a build error. Serializers and views whose target is absent from the corresponding schema collection are skipped with a warning. Skipped view factories are not called. A schema entity without a non-ignored parser spec emits a warning through the configured logger. Root and text nodes are excluded from these warnings because the parser handles them directly.
