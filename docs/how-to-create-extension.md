## How to Create Extension

Let us examine the process of creating an extension based on the Mermaid extension, which enables the insertion and manipulation of Mermaid diagrams.

### WYSIWYG and Markup Modes
The initial point of focus is the fact that the editor operates in two distinct modes: WYSIWYG (What You See Is What You Get) and markup. The extension of the editor refers to the enhancement of the WYSIWYG functionality. In markup mode, the editor executes the standard conversion of either markdown markup or advanced markdown markup ([YFM](https://diplodoc.com/docs/en/syntax/), for example), depending on the integrated plugins. In the markup mode, we can verify that the plugin functions properly, and that the syntax inputted into the editor is accurately reflected in the preview. It is crucial at this stage to ensure that the markup translates correctly into HTML code.

In our example with the `mermaid` plugin, the code for the markup mode [can be found](https://github.com/gravity-ui/markdown-editor/blob/main/demo/md-plugins.ts#L52) in the `demo/mdplugins.ts` file.

> The development of a markdown plugin is not the focus of this discussion, but we would like to draw your attention to the extensions [we have implemented for YFM](https://github.com/diplodoc-platform?q=-extension&type=all&language=&sort=). It has recently endorsed the syntax of [directives](https://github.com/makhnatkin/markdown-it-directive), which is a [proposal within the CommonMark specification](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444). We recommend incorporating this syntax into new Markdown plugins.

### Step by Step Guide

#### 1. Create a Specification

The specification should include the fields `fromMd`, `toMd`, and `spec`.

You can also add a `view` field, for example, if rendering through React is required.


```ts
const MermaidSpecsExtension: ExtensionAuto<MermaidSpecsOptions> = (builder, {nodeView}) => {
  builder
    .configureMd((md) => md.use(transform({runtime: 'mermaid', bundle: false}), {}))
    .addNode(mermaidNodeName, () => ({
      fromMd: {
        tokenSpec: {
          name: mermaidNodeName,
          type: 'node',
          getAttrs: ({content}) => ({content}),
        },
      },
      spec: {
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
      },
      toMd: (state, node) => {
        state.write('```mermaid\n');
        state.ensureNewLine();
        state.write(node.attrs.content);
        state.ensureNewLine();
        state.write('```');
        state.ensureNewLine();
      },
      view: nodeView,
    }));
};

```

#### 2. Add NodeView

To implement a custom NodeView, you need to implement the [prosemirror NodeView](https://prosemirror.net/docs/guide/#view.node_views) interface.

```ts
import {EditorView, NodeView} from 'prosemirror-view';
// ...

export class WMermaidNodeView implements NodeView {
  // ...
}
```

See the [full example of the extension](https://github.com/gravity-ui/markdown-editor/tree/main/src/extensions/yfm/Mermaid/MermaidNodeView) for more details.

#### 3. Add Plugins

The extension can be enhanced with [plugins](https://prosemirror.net/docs/guide/#state.plugins) as needed. Check out the [YfmTable extension](https://github.com/gravity-ui/markdown-editor/tree/main/src/extensions/yfm/YfmTable/plugins/YfmTableControls) example, where plugins add a panel (a pop-up window) for working with columns and rows.


