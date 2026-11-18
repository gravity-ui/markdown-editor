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
| `@gravity-ui/markdown-editor-header-extension/wysiwyg/specs` | `HeaderSpecs`, `headerNodeName` and `headerContentNodeName`                                              |
| `@gravity-ui/markdown-editor-header-extension/markup`        | `insertHeader` and `toolbarHeaderItem` for the Markdown editor                                           |

`toolbarHeaderItem` inserts the block.
In the visual editor, the button is disabled inside another header.
A cursor in the block opens a toolbar with settings, copy, and delete.
With the block selected or the cursor inside or next to it, Tab and Shift+Tab focus its controls; lists, tables, and code blocks inside the block handle these keys first.
The settings panel opens inside the block, 16 px from its top and right edges, and stays within the viewport.
Opening the panel focuses the height select; Escape or the close button closes it and returns focus to the settings button.
Each height or width change is a separate undo step.

The editor writes both attributes, including default values.
Syntax, sizes, and shared styles for WYSIWYG and previews are in `@gravity-ui/markdown-plugin-header`.
`Header` imports those styles; previews import `@gravity-ui/markdown-plugin-header/styles.css`.
Child blocks remain editable and are preserved when changing dimensions, copying, or switching modes.
A new or empty block holds an empty paragraph, and insertion puts the cursor into it.

`HeaderSpecs` adds only the schema, Markdown parsing, and serialization, and runs in Node.js.
`Header` also needs the editor's React renderer, which the standard presets include.

## Header description

`Header` also includes the description: the container `:::header-content` with paragraphs, marks and links.
`HeaderSpecs` adds its schema, Markdown parsing, and serialization; its syntax and styles are in `@gravity-ui/markdown-plugin-header`.
The description has no attributes: an attribute written on `:::header-content` in Markdown, such as `size`, is dropped.
A banner holds one description. A description outside a banner, inside another block, or after the first one in a banner is parsed as its blocks, without the container.
The description is edited in place as rich text with the marks and links of the editor and its selection toolbar; other blocks written in Markdown, such as lists, are kept.
An empty description shows a placeholder. Change its text with the editor `placeholder` option: `{placeholder: {header_content: 'Text'}}`.
Enter starts a paragraph inside the description and does nothing in an empty paragraph, so the text never leaves the block.
Backspace at its start and Delete at its end keep it and do not join it with the blocks around it; an empty paragraph next to it is removed instead.
Deleting all the selected text of the description leaves an empty paragraph in it, and blocks without text at its edges stay; a selection that runs from the description to the start of the next block stays inside the description.

The Description switch of the banner settings removes the description or adds it as the first block of the banner.
A removed description is kept until the page reloads, and the switch inserts it back with its text.
Without a removed description, the switch turns the only paragraph of the banner into the description or adds a description with a sample text.
Each switch change is a separate undo step.
