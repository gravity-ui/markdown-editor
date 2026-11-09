# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block container with independent height and width.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header)},
});
```

`@gravity-ui/markdown-editor-header-extension/configs` exports the toolbar button that inserts the block: `headerItemView`, `headerItemWysiwyg`, and `headerItemMarkup`.
In the visual editor, the button is disabled inside another header.
Hovering, focusing, or selecting the block shows a toolbar with settings, copy, and delete.
With the block selected or the cursor inside or next to it, Tab and Shift+Tab focus its controls; lists, tables, and code blocks inside the block handle these keys first.
The settings panel opens inside the block, 16 px from its top and right edges, and shrinks to fit narrow blocks.
Opening the panel focuses the height select; Escape or the close button closes it and returns focus to the settings button.
Each height or width change is a separate undo step.

The editor writes both attributes, including default values.
Syntax, sizes, and the stylesheet for previews are in `@gravity-ui/markdown-plugin-header`.
Child blocks remain editable and are preserved when changing dimensions, copying, or switching modes.
A new or empty block holds an empty paragraph, and insertion puts the cursor into it.

`HeaderSpecs` from `@gravity-ui/markdown-editor-header-extension/specs` adds only the schema and Markdown parsing and runs in Node.js.
`Header` also needs the editor's React renderer, which the standard presets include.
