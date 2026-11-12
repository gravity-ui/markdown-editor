# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block container with independent height and width.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header, {fileUploadHandler})},
});
```

| Option              | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `fileUploadHandler` | Uploads a background image and returns its `url`; without it, the Image tab is hidden            |
| `maxImageSize`      | Maximum background image size in bytes; without it, the size is not checked                      |
| `imageTypes`        | MIME types of background images, such as `['image/jpeg', 'image/png']`; any `image/*` without it |

| Entry point         | Exports                                                                                          |
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
The Background field of the panel opens the Background popup with the Fill and Image tabs and the Reset button.
Choosing a color removes `bg-image`, `bg-image-theme`, and `bg-image-blur`; setting an image keeps the color; Reset and the clear button of the field remove all `bg-*` attributes.
Each background change is one undo step.
The Image tab holds the image form of the editor: a file goes to `fileUploadHandler`, and a link is written into `bg-image` as is; without `fileUploadHandler`, the form takes a link only.
A file of `imageTypes` up to `maxImageSize` is uploaded; another file shows an error and leaves the document unchanged.
The hint of the form lists the formats of `imageTypes` and the `maxImageSize` limit.
With an image, the Image tab shows a scaled-down banner in the light or dark page theme, the file with a replace button that opens the form again, and the text color.
An address is written into `bg-image` only if it passes the address check; an uploaded one also requires that the banner still exists, and a newer upload into the same banner discards the older one.

The editor writes `height` and `width`, including default values, and background attributes other than the defaults.
Syntax, sizes, and shared styles for WYSIWYG and previews are in `@gravity-ui/markdown-plugin-header`.
`Header` imports those styles; previews import `@gravity-ui/markdown-plugin-header/styles.css`.
Child blocks remain editable and are preserved when changing dimensions, copying, or switching modes.
A new or empty block holds an empty paragraph, and insertion puts the cursor into it.

`HeaderSpecs` adds only the schema, Markdown parsing, and serialization, and runs in Node.js.
`Header` also needs the editor's React renderer, which the standard presets include.
