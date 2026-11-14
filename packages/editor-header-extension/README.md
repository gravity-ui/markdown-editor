# Header editor extension

Header block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block container with independent height and width.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  handlers: {uploadFile},
  wysiwygConfig: {extensions: (builder) => builder.use(Header, {fileUploadHandler: uploadFile})},
});
```

| Option              | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `fileUploadHandler` | Uploads a background image and returns its `url`; without it, the image is set by a link only    |
| `maxImageSize`      | Maximum background image size in bytes; without it, the size is not checked                      |
| `imageTypes`        | MIME types of background images, such as `['image/jpeg', 'image/png']`; any `image/*` without it |

| Entry point                                                  | Exports                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `@gravity-ui/markdown-editor-header-extension`               | `Header`, `Button`, the Markdown commands `insertHeader` and `insertButton`, and the toolbar buttons `toolbarHeaderItem` and `toolbarButtonItem` for both modes |
| `@gravity-ui/markdown-editor-header-extension/wysiwyg`       | `Header`, `Button`, `toolbarHeaderItem`, and `toolbarButtonItem` for the visual editor |
| `@gravity-ui/markdown-editor-header-extension/wysiwyg/specs` | `HeaderSpecs`, `headerNodeName`, `HeaderTitleSpecs`, `headerTitleNodeName`, `ButtonSpecs`, and `buttonNodeName`    |
| `@gravity-ui/markdown-editor-header-extension/markup`        | `insertHeader`, `insertButton`, `toolbarHeaderItem`, and `toolbarButtonItem` for the Markdown editor |

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

`Header` includes `HeaderTitleSpecs`: the title `::header-title[text]{size color}` is a block of plain text with its size and color, so it is not escaped as ordinary text and survives switching modes.
The editor has no controls for the title yet; its text is edited in place, and the size and the color are kept as written. Default values are not written.

## Button

`Button` is a separate extension from the same package:

```ts
import {Button, Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header, {}).use(Button)},
});
```

Register `buttonPlugin` from `@gravity-ui/markdown-plugin-header` in the Markdown preview.

A button is an inline node: `:button[Read more]{href="/page" view="action" color="blue"}`.
The button is an atom: a click on it, or Enter while it is selected, opens the settings window under it.
The window holds the label field, the style list with a preview of the style under the pointer, the link field, and the "Open in a new tab" switch.
The label is plain text without formatting. Each change is a separate undo step.
Escape closes the window and returns focus to the editor. Clicking the button does not follow the link.

`toolbarButtonItem` inserts `:button[Button]{view="action" color="standard"}` at the cursor in both modes.
In the visual editor, the cursor moves after the new button.

The editor always writes `view` and `color`; `href` is written when set, and `target` when it differs from `_self`.

An empty button shows the text "Button" in the visual editor and saves it as the label. Change the text with the editor `placeholder` option: `{placeholder: {button: 'Open'}}`.
