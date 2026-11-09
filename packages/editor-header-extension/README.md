# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block container with independent height and width, a title and a description.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header)},
});
```

`@gravity-ui/markdown-editor-header-extension/configs` exports the toolbar button that inserts the block: `headerItemView`, `headerItemWysiwyg`, and `headerItemMarkup`.
Hovering, focusing, or selecting the block shows a toolbar with settings, copy, and delete.
With the block selected or the cursor inside or next to it, Tab and Shift+Tab focus its controls.
The settings panel opens inside the block, 16 px from its top and right edges, and shrinks to fit narrow blocks.
The panel sets the height and width, shows or hides the title and the description, and sets the title size and color.
`Mod-Alt-1`…`Mod-Alt-6` set the title size while the cursor is in the title.
Each change is a separate undo step.

The editor writes `height` and `width`, including default values; other attributes only when they differ from the default.
A visible title or description that is empty and has default attributes is not written to Markdown.
Syntax, sizes, and the stylesheet for previews are in `@gravity-ui/markdown-plugin-header`.
The title and the description are edited in place.
Other child blocks remain editable and are preserved when changing dimensions, copying, or switching modes.
A new or empty block holds an empty title and description, and insertion puts the cursor into the title.

`HeaderSpecs` from `@gravity-ui/markdown-editor-header-extension/specs` adds only the schema and Markdown parsing and runs in Node.js.
`Header` also needs the editor's React renderer, which the standard presets include.
