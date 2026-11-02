# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): an empty block with independent height and width.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header)},
});
```

`headerItem` is the toolbar button that inserts the block.
Clicking the block opens a panel with height and width; the panel is hidden in readonly mode.
Each change is a separate undo step.

The editor writes both attributes, including default values.
Syntax, sizes, and the stylesheet for previews are in `@gravity-ui/markdown-plugin-header`.
A container the plugin keeps as source stays unchanged when switching modes.

`HeaderSpecs` adds only the schema and Markdown parsing.
`Header` also needs the editor's React renderer, which the standard presets include.
