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

| Option              | Description                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `fileUploadHandler` | Uploads a background or banner image and returns its `url`; without it, images are set by a link only |
| `maxImageSize`      | Maximum size of uploaded images in bytes; without it, the size is not checked                         |
| `imageTypes`        | MIME types of uploaded images, such as `['image/jpeg', 'image/png']`; any `image/*` without it        |

| Entry point                                                  | Exports                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@gravity-ui/markdown-editor-banner-extension`               | `Banner`, `Button`, the Markdown command `insertBanner`, and the toolbar button `toolbarBannerItem` for both modes                          |
| `@gravity-ui/markdown-editor-banner-extension/wysiwyg`       | `Banner`, `Button`, and `toolbarBannerItem` for the visual editor                                                                           |
| `@gravity-ui/markdown-editor-banner-extension/wysiwyg/specs` | `BannerSpecs`, `bannerNodeName`, `bannerImageNodeName`, `bannerTitleNodeName`, `bannerContentNodeName`, `ButtonSpecs`, and `buttonNodeName` |
| `@gravity-ui/markdown-editor-banner-extension/markup`        | `insertBanner` and `toolbarBannerItem` for the Markdown editor                                                                              |

`toolbarBannerItem` inserts the block.
In the visual editor, the button is disabled inside another banner.
A cursor in the block opens a toolbar with settings, copy, and delete.
With the block selected or the cursor inside or next to it, Tab and Shift+Tab focus its controls; lists, tables, and code blocks inside the block handle these keys first.
The settings panel opens inside the block, 16 px from its top and right edges, and stays within the viewport.
Its alignment controls show and change `vertical` and `align` of the banner; each change is a separate undo step, and default values are not written.
The banner has the layout of its preview, including the narrow layout below 600 px; the dashed frame of a banner without a background is an outline, so it takes no space.
Opening the panel focuses the height select; Escape or the close button closes it and returns focus to the settings button.
Each height or width change is a separate undo step.
The Background field of the panel opens the Background popup with the Fill and Image tabs and the Reset button.
When an image is set, the Blur background checkbox appears below the Background field in the settings panel.
Choosing a color removes `bg-image`, `bg-theme`, and `bg-image-blur`; setting an image keeps the color; Reset and the clear button of the field remove all `bg-*` attributes.
Each background change is one undo step.
The popup opens with focus on the active tab. The palette has one Tab stop, and arrow keys, Home, and End move focus and select a color.
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

### Banner image

The image is a part of the banner: `::banner-image{src="..." alt="..." title="..."}` (see `@gravity-ui/markdown-plugin-banner`).
It is an atom block among the child blocks of the banner and keeps its place in the Markdown.
The editor writes `src`, `alt`, and `title` when they are set; an unsafe address is not kept.
An image without an address is a placeholder; the Image switch inserts a placeholder before the other blocks.
A click on the image selects it, and so do the arrow keys from the next text, Backspace at the start of the block after the image, and Delete at the end of the block before it.
Backspace or Delete removes the selected image in one undo step; the cursor goes to the nearest text.
A banner holds one image: a change that would put a second image into a banner is rejected.

A click on the image or Enter on the selected image opens the Image window under it, with focus on its first control.
The window holds the image form of the editor: a link is written into `src` if it passes the address check, and a file goes to `fileUploadHandler` with the `imageTypes` and `maxImageSize` limits.
With an image, the window shows its file with a replace button and Reset, which turns the image back into a placeholder.
Each change of the image is one undo step.
An uploaded address is written into the image at its current position; it is ignored when the image is removed, when a link or Reset sets another source, and when the window closes during the upload.
Escape, the close button, and Tab after the last control or Shift+Tab before the first one close the window and return focus to the editor with the image selected.

`BannerSpecs` adds only the schema, Markdown parsing, and serialization of the banner and its parts, and runs in Node.js.
`Banner` also needs the editor's React renderer, which the standard presets include.

## Banner title

`Banner` includes the banner title: `BannerSpecs` adds its schema, Markdown parsing, and serialization, and `Banner` adds its editing.

Register `bannerTitlePlugin` from `@gravity-ui/markdown-plugin-banner` in the Markdown preview, next to `bannerPlugin`.

The title `::banner-title[Text]{size="1" color="blue"}` is a block of plain text with its size and color, so it survives switching modes; the editor writes `size` and `color` other than the defaults.
The title looks like its preview and is edited in place as plain text: marks and line breaks are not allowed, and pasted or dropped content becomes one line of text without formatting.
An empty title shows a placeholder. Change its text with the editor `placeholder` option: `{placeholder: {banner_title: 'Title'}}`.
Deleting a selection that starts at the title start and goes past its end empties the title and keeps the block; a selection dragged from the title stays inside it.
Enter in the title never splits it. In a title outside a banner, such as one written in Markdown inside a quote, a list item or a table cell, Enter at its end starts an empty paragraph after it.
The title never turns into another block: block shortcuts do nothing there, and typed text such as `# ` stays text. Backspace and Delete at its edges do not join it with the blocks next to it.

A cursor in the title opens a toolbar under its start with two menus: the size (Heading 1–6, `size`) and the color (`color`: default, gray, yellow, orange, red, green, blue, violet).
The size button shows the icon of the current size, the color menu and its button show the colors of the title, and each button names its current value, for example "Title size: Heading 3".
Each choice is a separate undo step and keeps the text and the cursor; default values are not written.
With the cursor in the title, Tab focuses the size button. Left and Right arrows move between the buttons, Enter opens a menu, Tab moves focus into the open menu, and Enter on an item chooses it and returns focus to the title.
Escape closes an open menu; Escape on a button hides the toolbar and returns focus to the title. Tab after the last button and Shift+Tab before the first one return focus to the title.

The title is the `title` part of the banner. The Title switch of the settings panel inserts a title with the default text after the image; a banner that holds only one paragraph of plain text without formatting turns it into the title.
Turning the switch off removes the title; turning it on again restores the removed title with its text, size and color, also after the panel is closed.
A banner holds one title: a second title in the Markdown of a banner stays a paragraph of text, and an edit that adds a second title to a banner is rejected.

## Banner description

`Banner` includes the description of the banner: the container `:::banner-content` with paragraphs, marks, links, and other blocks.
`BannerSpecs` adds its schema, Markdown parsing, and serialization; its syntax and styles are in `@gravity-ui/markdown-plugin-banner`, and the preview needs `bannerContentPlugin`.
The description has no attributes: an attribute written on `:::banner-content` in Markdown, such as `size`, is dropped.
A banner holds one description as its child block. A description outside a banner, inside another block, or after the first one in a banner becomes its blocks, without the container: when Markdown is parsed, and when such a description is pasted, dropped, or left outside a banner by an edit.
The description is edited in place as rich text with the marks and links of the editor and its selection toolbar.
An empty description shows a placeholder. Change its text with the editor `placeholder` option: `{placeholder: {banner_content: 'Text'}}`.
Enter starts a paragraph inside the description and does nothing in an empty paragraph, so the text never leaves the block.
Backspace at its start and Delete at its end keep it and do not join it with the blocks around it; an empty paragraph next to it is removed instead.
Deleting all the selected text of the description leaves an empty paragraph in it; a selection that runs from the description to the start of the next block stays inside the description.

The description is the `content` part of the banner, and the Description switch of the settings panel is connected to it.
Switching it on adds a description with a sample text after the image and the title, or turns the only non-empty paragraph of the banner into the description with its marks and links.
Switching it off removes the description; switching it on again restores the removed description with its text and formatting until the page reloads. Each switch is one undo step.

## Button

`Button` is a separate extension from the same package:

```ts
import {Button, Banner} from '@gravity-ui/markdown-editor-banner-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Banner).use(Button)},
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
