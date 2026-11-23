# Banner editor extension

Banner block for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a block container with independent height and width.

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Banner} from '@gravity-ui/markdown-editor-banner-extension';

const editor = useMarkdownEditor({
  handlers: {uploadFile},
  wysiwygConfig: {extensions: (builder) => builder.use(Banner, {fileUploadHandler: uploadFile})},
});
```

| Option              | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `fileUploadHandler` | Uploads a background image and returns its `url`; without it, the image is set by a link only    |
| `maxImageSize`      | Maximum background image size in bytes; without it, the size is not checked                      |
| `imageTypes`        | MIME types of background images, such as `['image/jpeg', 'image/png']`; any `image/*` without it |

| Entry point                                                  | Exports                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `@gravity-ui/markdown-editor-banner-extension`               | `Banner`, `Button`, the Markdown command `insertBanner`, and the toolbar button `toolbarBannerItem` for both modes |
| `@gravity-ui/markdown-editor-banner-extension/wysiwyg`       | `Banner`, `Button`, and `toolbarBannerItem` for the visual editor                                                  |
| `@gravity-ui/markdown-editor-banner-extension/wysiwyg/specs` | `BannerSpecs`, `bannerNodeName`, `ButtonSpecs`, and `buttonNodeName`                                               |
| `@gravity-ui/markdown-editor-banner-extension/markup`        | `insertBanner` and `toolbarBannerItem` for the Markdown editor                                                     |

`toolbarBannerItem` inserts the block.
In the visual editor, the button is disabled inside another banner.
A cursor in the block opens a toolbar with settings, copy, and delete.
With the block selected or the cursor inside or next to it, Tab and Shift+Tab focus its controls; lists, tables, and code blocks inside the block handle these keys first.
The settings panel opens inside the block, 16 px from its top and right edges, and stays within the viewport.
Opening the panel focuses the height select; Escape or the close button closes it and returns focus to the settings button.
Each height or width change is a separate undo step.
The Background field of the panel opens the Background popup with the Fill and Image tabs and the Reset button.
Choosing a color removes `bg-image`, `bg-image-theme`, and `bg-image-blur`; setting an image keeps the color; Reset and the clear button of the field remove all `bg-*` attributes.
Each background change is one undo step.
The popup opens with focus on the active tab; the palette has one Tab stop and supports arrow keys, Home, and End.
The Image tab holds the image form of the editor: a file goes to `fileUploadHandler`, and a link is written into `bg-image` as is; without `fileUploadHandler`, the form takes a link only.
A file of `imageTypes` up to `maxImageSize` is uploaded; another file shows an error and leaves the document unchanged.
The hint of the form lists the formats of `imageTypes` and the `maxImageSize` limit.
With an image, the Image tab shows a scaled-down banner in the light or dark page theme, the file with a replace button that opens the form again, and the text color.
An address is written into `bg-image` only if it passes the address check; an uploaded one also requires that the banner still exists, and a newer upload into the same banner discards the older one.
Cancel, closing the popup, choosing a fill or another address, and Reset discard a pending upload.
The form restores focus after a failed upload or a cancelled replacement.

The editor writes `height` and `width`, including default values, and background attributes other than the defaults.
Syntax, sizes, and shared styles for WYSIWYG and previews are in `@gravity-ui/markdown-plugin-banner`.
`Banner` imports those styles; previews import `@gravity-ui/markdown-plugin-banner/styles.css`.
Child blocks remain editable and are preserved when changing dimensions, copying, or switching modes.
A new or empty block holds an empty paragraph, and insertion puts the cursor into it.

### Banner parts

The image, the title, and the description of the banner are parts.
The Title, Description, and Image switches of the settings panel show whether the banner holds the part and insert or remove its block in one undo step. A switch of a part without a node type in the schema is not connected to the document.
A switched-on part goes after the parts before it in the order image → title → description; the parts of a document keep their order. A part replaces the only empty paragraph of the banner.
Switching a part back on restores the block removed by the switch, with its content and attributes, while the same banner block stays in the editor.

`BannerSpecs` adds only the schema, Markdown parsing, and serialization, and runs in Node.js.
`Banner` also needs the editor's React renderer, which the standard presets include.

## Button

`Button` is a separate extension from the same package:

```ts
import {Button, Banner} from '@gravity-ui/markdown-editor-banner-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Banner, {}).use(Button)},
});
```

Register `buttonPlugin` from `@gravity-ui/markdown-plugin-banner` in the Markdown preview.

A button is an inline node: `:button[Read more](/page){view="action" color="blue"}`.
The button is an atom: a click on it, or Enter while it is selected, opens the settings window under it.
The window holds the label field, the style list with a preview of the style under the pointer, the link field, and the "Open in a new tab" switch.
The label is plain text without formatting. Each change is a separate undo step.
The link field shows an error for an address that the Markdown parser of the editor rejects, such as `javascript:`, and keeps the previous address.
Closing the window saves the label and the link. Escape, Enter, Tab after the last field, and Shift+Tab before the first field return focus to the editor. Clicking the button does not follow the link.
Backspace after a button and Delete before it select the button; the next press removes it.

The editor always writes `view` and `color`, and `target` when it differs from `_self`. The address and the title are written in parentheses when the address is set.

An empty button shows the text "Button" in the visual editor and saves it as the label. Change the text with the editor `placeholder` option: `{placeholder: {button: 'Open'}}`.
