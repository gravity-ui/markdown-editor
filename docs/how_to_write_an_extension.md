
Let us examine the process of creating an extension based on the Mermaid extension, which enables the insertion and manipulation of Mermaid diagrams.

## WYSIWYG and markup modes
The initial point of focus is the fact that the editor operates in two distinct modes: WYSIWYG (What You See Is What You Get) and markup. The extension of the editor refers to the enhancement of the WYSIWYG functionality. In markup mode, the editor executes the standard conversion of either markdown markup or advanced markdown markup ([YFM](https://diplodoc.com/docs/en/syntax/), for example), depending on the integrated plugins. In the markup mode, we can verify that the plugin functions properly, and that the syntax inputted into the editor is accurately reflected in the preview. It is crucial at this stage to ensure that the markup translates correctly into HTML code.

In our example with the `mermaid` plugin, the code for the markup mode [can be found](https://github.com/gravity-ui/markdown-editor/blob/main/demo/md-plugins.ts#L52) in the `demo/mdplugins.ts` file.

> The development of a markdown plugin is not the focus of this discussion, but we would like to draw your attention to the extensions [we have implemented for YFM](https://github.com/diplodoc-platform?q=-extension&type=all&language=&sort=). It has recently endorsed the syntax of [directives](https://github.com/makhnatkin/markdown-it-directive), which is a [proposal within the CommonMark specification](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444). We recommend incorporating this syntax into new Markdown plugins.

