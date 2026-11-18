# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block container with independent height and width and an optional image.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) =>
      builder.use(Header, {fileUploadHandler, imageTypes: ['image/png'], maxImageSize: 2 ** 21}),
  },
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

## Image

The «Image» switch in the settings panel adds an image at the start of the block or removes it from the markup.
Switching it on again restores the removed image until the page reloads.
A new image is a placeholder; a click on it or Enter on the selected image opens the image window.
The window sets the image by a link or by a file upload through `fileUploadHandler`; `imageTypes` and `maxImageSize` limit the files.
A failed upload keeps the previous image, and the response of an outdated upload is ignored.
«Reset» in the window returns the placeholder.
Backspace and Delete remove the selected image; each change is one undo step.
The schema allows one image, only as the first block of a header.
