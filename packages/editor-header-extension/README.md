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
| `@gravity-ui/markdown-editor-header-extension/wysiwyg/specs` | `HeaderSpecs`, `headerNodeName` and `headerTitleNodeName`                                                |
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

`HeaderSpecs` adds only the schema, Markdown parsing, and serialization of the header and the title, and runs in Node.js.
`Header` also needs the editor's React renderer, which the standard presets include.

## Header title

`Header` includes the title: the title `::header-title[text]{size color}` is a block of plain text with its size and color, so it is not escaped as ordinary text and survives switching modes.
The title looks like its preview and is edited in place as plain text: marks, links and line breaks are not allowed, pasted text loses its inline formatting (bold, code, links) while list, quote and other block markers stay in it as text, and selecting its text does not open the selection toolbar.
An empty title shows a placeholder. Change its text with the editor `placeholder` option: `{placeholder: {header_title: 'Title'}}`.
Deleting a selection that covers the whole title empties the title and keeps the block; a triple click selects only the text of the title.
Enter in the title never splits it. In a title outside a header, such as one written in Markdown inside a quote, a list item or a table cell, Enter at its end starts an empty paragraph after it.
The title never turns into another block: block shortcuts (lists, headings, code block) do nothing there, and typed text such as `# ` or a triple backtick stays text.
A cursor in the title opens a toolbar above its start with two menus: the size (Heading 1–6, `size`) and the title color (`color`: default, gray, yellow, orange, red, green, blue, violet); the size button shows the icon of the current size, the color menu and its button show the colors of the title, and each button names its current value, for example "Title size: Heading 3".
Each choice is a separate change of the attribute and keeps the text and the cursor. Default values are not written.
With the cursor in the title, Tab focuses the title toolbar.

The Title switch in the Text section of the settings panel shows whether the header has a title.
Turning it on inserts a title with default text at the start of the header; in a header that holds only one paragraph of plain text without formatting, that paragraph becomes the title. Turning it off removes the title, and undo brings it back.
Until the page reloads, turning the switch on again restores the removed title of that header with its text, size and color, also after the panel is closed.
A header holds one title: a second title in the Markdown of a header stays a paragraph of text, and an edit that adds a second title to a header is rejected.
