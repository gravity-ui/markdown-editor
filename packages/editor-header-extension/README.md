# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block container with independent height and width.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header)},
});
```

| Entry point                                                  | Exports                                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `@gravity-ui/markdown-editor-header-extension`               | `Header`, the Markdown command `insertHeader`, and the toolbar button `toolbarHeaderItem` for both modes |
| `@gravity-ui/markdown-editor-header-extension/wysiwyg`       | `Header` and `toolbarHeaderItem` for the visual editor                                                   |
| `@gravity-ui/markdown-editor-header-extension/wysiwyg/specs` | `HeaderSpecs` and `headerNodeName`                                                                       |
| `@gravity-ui/markdown-editor-header-extension/markup`        | `insertHeader` and `toolbarHeaderItem` for the Markdown editor                                           |

`toolbarHeaderItem` inserts the block.
In the visual editor, the button is disabled inside another header.
A cursor in the block opens a toolbar with copy and delete.
With the block selected or the cursor inside or next to it, Tab and Shift+Tab focus its controls; lists, tables, and code blocks inside the block handle these keys first.

The editor writes both attributes, including default values.
Syntax, sizes, and the stylesheet for previews are in `@gravity-ui/markdown-plugin-header`.
Child blocks remain editable and are preserved when copying or switching modes.
A new or empty block holds an empty paragraph, and insertion puts the cursor into it.

`HeaderSpecs` adds only the schema, Markdown parsing, and serialization, and runs in Node.js.
`Header` also needs the editor's React renderer, which the standard presets include.
