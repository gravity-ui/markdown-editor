# Label editor extension

Label for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a short caption on a colored background inside the text.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Label} from '@gravity-ui/markdown-editor-label-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Label)},
});
```

| Entry point                                                 | Exports                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@gravity-ui/markdown-editor-label-extension`               | `Label`, the Markdown command `insertLabel`, and the toolbar button `toolbarLabelItem` for both modes |
| `@gravity-ui/markdown-editor-label-extension/wysiwyg`       | `Label` and `toolbarLabelItem` for the visual editor                                                  |
| `@gravity-ui/markdown-editor-label-extension/wysiwyg/specs` | `LabelSpecs`, `LabelAttr`, `labelNodeName` and `labelNodeType`                                        |
| `@gravity-ui/markdown-editor-label-extension/markup`        | `insertLabel` and `toolbarLabelItem` for the Markdown editor                                          |

Syntax, colors, and the stylesheet for previews are in `@gravity-ui/markdown-plugin-label`.

## Visual editor

`toolbarLabelItem` inserts an empty gray label in place of the selection and opens its window; selected text becomes the caption.
The empty label shows the placeholder «Set status», which is never saved.

The window stands under the label by its left edge.
It holds the caption field with a clear button and a row of six color swatches; the selected swatch has a 2 px ring.
Below them, up to twenty other labels of the document are listed, nearest first; a click copies the caption and the color.

- A click on a label and an insertion open the window and move the focus to the caption field.
- A label reached with `ArrowLeft` or `ArrowRight` opens the window and keeps the focus in the editor; `Enter` moves the focus to the caption field.
- The clear button empties the caption and keeps the window open.
- `Escape`, `Enter` in the caption field, or a click outside closes the window and puts the cursor after the label.
- A label with an empty caption is removed when the window closes or the selection leaves it.

The arrows step through three positions around a label: before it, the label itself, after it.
At both edges the editor draws the cursor of inline code, and typed text goes outside the label.

The editor writes `color` only for a color other than `gray`.
In the caption it escapes `\`, `[`, `]`, `|` and `&` before an HTML entity, and writes a line break as a space, so the label stays inside a table cell.
A selected label is kept: the `addLabel` action opens it for editing.
`LabelSpecs` adds only the schema, Markdown parsing, and serialization, and runs in Node.js.

## Markdown editor

`insertLabel` wraps the selection into `:label[…]`; with an empty selection the cursor stays inside the brackets.
Unescaped brackets of the selected text are escaped.
