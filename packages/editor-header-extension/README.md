# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block with height, width, title and description.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header)},
});
```

`headerItem` is the toolbar button that inserts the block.
Clicking the block opens a panel with height and width; the panel is hidden in readonly mode.
The title and the description are edited in place.
The same panel shows or hides each of them, and sets the title size and color.
`Mod-Alt-1`…`Mod-Alt-6` set the title size while the cursor is in the title.
Actions: `setHeaderTitleSize({size})`, `setHeaderTitleColor({color})`, `toggleHeaderText({slot, visible})` with `slot` `title` or `description`.
Each change is a separate undo step.
Empty text fields with default attributes are not written to Markdown.

The editor writes `height` and `width`, including default values; other attributes only when they differ from the default.
Syntax, sizes, and the stylesheet for previews are in `@gravity-ui/markdown-plugin-header`.
A container the plugin keeps as source stays unchanged when switching modes.

`HeaderSpecs` adds only the schema and Markdown parsing.
`Header` also needs the editor's React renderer, which the standard presets include.
