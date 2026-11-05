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
Hovering the block shows a toolbar with settings, copy, and delete, and a drag handle on the left.
The handle takes 20 px to the left of the block; `--g-md-editor-padding` provides this space.
The settings panel on the right side of the page changes the height and width; each change is a separate undo step.

The editor writes both attributes, including default values.
Syntax, sizes, and the stylesheet for previews are in `@gravity-ui/markdown-plugin-header`.
A block with text inside or a title keeps its Markdown when switching modes, and its size cannot be changed.

`HeaderSpecs` from `@gravity-ui/markdown-editor-header-extension/specs` adds only the schema and Markdown parsing and runs in Node.js.
`Header` also needs the editor's React renderer, which the standard presets include.
