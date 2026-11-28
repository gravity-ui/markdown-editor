# Banner editor extension

Banner and Button extensions for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a banner with a title, a description, an image, buttons and a background, edited in place in the visual editor, and buttons that can also stand on their own.

## Installation

This package and `@gravity-ui/markdown-plugin-banner` are not published to npm yet. Use them from this repository as workspace packages, as the demo does:

```json
{
  "dependencies": {
    "@gravity-ui/markdown-editor-banner-extension": "workspace:*",
    "@gravity-ui/markdown-plugin-banner": "workspace:*"
  }
}
```

The host also needs `@gravity-ui/markdown-editor`, `@gravity-ui/uikit`, `react` and `react-dom`. `@gravity-ui/markdown-plugin-banner` renders the Markdown-mode [preview](#preview) and needs `markdown-it`.

## Usage

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Banner} from '@gravity-ui/markdown-editor-banner-extension';

const editor = useMarkdownEditor({
  handlers: {uploadFile},
  wysiwygConfig: {extensions: (builder) => builder.use(Banner)},
});
```

`Banner` options (`BannerOptions`):

| Option         | Description                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `maxImageSize` | Maximum size of an uploaded image in bytes; without it, the size is not checked                |
| `imageTypes`   | MIME types of uploaded images, such as `['image/jpeg', 'image/png']`; any `image/*` without it |

| Entry point                                                  | Exports                                                                                                                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@gravity-ui/markdown-editor-banner-extension`               | `Banner`, `Button`, the Markdown commands `insertBanner` and `insertButton`, and the toolbar buttons `toolbarBannerItem` and `toolbarButtonItem` for both modes |
| `@gravity-ui/markdown-editor-banner-extension/wysiwyg`       | `Banner`, `Button`, `toolbarBannerItem`, and `toolbarButtonItem` for the visual editor                                                                          |
| `@gravity-ui/markdown-editor-banner-extension/wysiwyg/specs` | `BannerSpecs`, `ButtonSpecs`, the node names `bannerNodeName`, `bannerTitleNodeName`, `bannerContentNodeName`, `bannerImageNodeName`, `buttonNodeName`          |
| `@gravity-ui/markdown-editor-banner-extension/markup`        | `insertBanner`, `insertButton`, `toolbarBannerItem`, and `toolbarButtonItem` for the Markdown editor                                                            |

The background image and the banner image are uploaded with the `uploadFile` handler of the editor (`handlers.uploadFile`), which the extension reads as `fileUploadHandler` from `builder.context`. The `url` it returns is set only if it passes the Markdown link check of the editor; another address, such as `javascript:`, is an upload error. Without the handler, images are set by a link only.

`BannerSpecs` adds only the schema, Markdown parsing, and serialization of the banner, the title, the description and the image, and runs in Node.js; `ButtonSpecs` does the same for buttons.
`Banner` also needs the editor's React renderer, which the standard presets include.

`toolbarBannerItem` inserts a banner with a title, a description and one button; in the visual editor the title text is selected, so typing replaces it.
In the visual editor, the button is disabled inside another banner.
Both items can also go into the `wysiwygSlash` order of a toolbars preset, so that the "/" menu of the visual editor finds them.

### Preview

For the Markdown preview, register `bannerPreset` from `@gravity-ui/markdown-plugin-banner` and import its styles. The preset includes the banner directives and buttons.

```ts
import MarkdownIt from 'markdown-it';
import {bannerPreset} from '@gravity-ui/markdown-plugin-banner';
import '@gravity-ui/markdown-plugin-banner/styles.css';

const md = new MarkdownIt().use(bannerPreset);
```

`Banner` and `Button` import `@gravity-ui/markdown-plugin-banner/styles.css` for the visual editor. Syntax, sizes, and shared styles for WYSIWYG and previews are in `@gravity-ui/markdown-plugin-banner`.

## Banner

A cursor in the block opens a toolbar with settings, copy, and delete. The copy button is the `ClipboardButton` of `@gravity-ui/uikit`: it writes the Markdown of the banner to the clipboard as plain text and leaves the document unchanged, so pasting it into either mode adds the same banner. Like the copy button of a code block, it keeps the focus after a click and shows that the text is copied. The toolbars of the banner and its blocks appear once the editor has the focus, so a document that starts with a banner opens without floating toolbars. A toolbar hidden by a click outside it, such as a button of another block toolbar, comes back when the editor gets the focus again, and stays hidden while the focus is outside the editor, also when a change in the settings panel moves its block or the cursor into it.
With the block selected or the cursor inside or next to it, Tab and Shift+Tab focus its controls, and Shift+Tab from the first button of a block toolbar or Tab from its last one returns the focus to the editor with the selection and the toolbar kept, and Escape on a toolbar button hides the toolbar and returns the focus to the editor; lists, tables, and code blocks inside the block handle these keys first. In a banner placed in a list item or a table cell, these keys belong to the banner: they never indent or lift the item or move to another cell.
The settings panel opens to the right of the block, level with its top edge; where the window has no room there, it stays within the viewport, 16 px from its edges, over the right side of the block. The image popup is drawn in a layer above the other popups of the editor.
Opening the panel focuses the height select; Escape, the close button, Tab from its last control, and Shift+Tab from the close button close it and return focus to the settings button.
Each height or width change is a separate undo step. The undo and redo keys work in the editor text only: as the other windows of the editor, the settings panel, the Background popup and the image popup do not pass them to the editor, and a text field keeps its own undo.
The Text section of the panel holds the Title and Description switches and the alignment: horizontal (`align`: left, center, right) and vertical (`vertical`: top, center, bottom).
The Buttons section holds the switches Button 1–3, and the Image and background section holds the Image switch and the Background field.
A switch shows whether the banner has the block. Turning it on inserts the block with default content in the order image, title, description, buttons; turning it off removes the block, every copy of it when the banner holds two titles or two descriptions, and undo brings it back. A block removed with the Title, Description or Image switch is kept until the page reloads, and turning the switch on again inserts it back with its text and settings instead of the default content.
Otherwise, in a banner that holds only one paragraph of text, such as text typed into an empty banner, the Title switch turns that paragraph into the title (its formatting is dropped) and the Description switch turns it into the description, instead of inserting the default text. Text with a button or another inline element becomes the description only, and a row of buttons stays a row of buttons.
The panel shows the first image, title and description of the banner and up to three buttons; the switch of the next button is enabled after the previous one is on.
Without the `Button` extension, the Buttons section is hidden.
The Background field of the panel opens the Background popup with the Fill and Image tabs and the Reset button; the popup opens with the focus on the active tab. The palette has one Tab stop; the arrow keys, Home and End move the focus between the fills as they appear on the screen, also in a right-to-left layout, and select the fill. Tab from its last control and Shift+Tab from its close button close it and return the focus to the Background field.
Choosing a color removes `bg-image`, `bg-theme`, and `bg-image-blur`; setting an image keeps the color; Reset and the clear button of the field remove all `bg-*` attributes.
Each background change is one undo step.
The Image tab holds the image form of the editor without its size fields: a file goes to the `uploadFile` handler of the editor, and a link is written into `bg-image` after the Markdown link check of the editor; without the handler, the form takes a link only.
A file of `imageTypes` up to `maxImageSize` is uploaded; another file shows an error and leaves the document unchanged.
The hint of the form lists the formats of `imageTypes` and the `maxImageSize` limit.
With an image, the Image tab shows a scaled-down banner in the light or dark page theme, the file with a replace button that opens the form again, and the text color.
An address is written into `bg-image` only if it passes the address check; an uploaded one also requires that the banner still exists, and a newer upload into the same banner discards the older one.
Reset, a fill, another address, removing the background and any other change of the image or the fill, such as Undo, discard a pending upload, and so do Cancel, Escape and closing the window while it runs; changing the text color or the blur keeps it. A failed upload shows an error and returns the focus to the upload button when it was lost.

The editor writes `height` and `width`, including default values, and background attributes other than the defaults.
Child blocks remain editable and are preserved when changing dimensions or switching modes.
A copied banner pastes as a banner. Pasted text copied across the title and the description, or from a part of a banner, becomes plain paragraphs, so the paste never adds a second title or description or a description outside a banner; text pasted into the title joins the title as one line, with the spaces at its edges kept as one space.
Backspace at the start of the block after a banner, and Delete at the end of the block before it, keep both blocks; an empty paragraph there is removed and the cursor moves into the banner. The same applies to a banner at the end of a quote, a note, a cut or a list item before the block, and at the start of a quote after it.
Enter in an empty paragraph at the end of a banner moves that paragraph below the banner, so Enter twice at the end of the last button row continues the text after the banner.
The title and the description are parts of the banner for the editor's block commands, as in YFM notes: Quote with the cursor in the title quotes the whole banner, Cut and the horizontal rule are not available there, and in the description they act on its paragraphs. The title never turns into another block: block shortcuts (lists, headings, code block) do nothing there, and typed text such as `# ` or a triple backtick stays text.
An empty block holds an empty paragraph.
The block looks like its preview: it has the classes and the `data-*` attributes of the plugin, and consecutive button paragraphs of a banner are one paragraph shown as one row. The editor writes each button of such a row as its own paragraph.

## Banner title

`Banner` includes the title: the title `::banner-title[text]{size color}` is a block of plain text with its size and color, so it is not escaped as ordinary text and survives switching modes.
The title looks like its preview and is edited in place as plain text: marks, links and line breaks are not allowed, pasted text loses its inline formatting (bold, code, links) while list, quote and other block markers stay in it as text, code copied from a code editor stays as written, and selecting its text does not open the selection toolbar.
An empty title shows a placeholder. Change its text with the editor `placeholder` option: `{placeholder: {g_md_banner_title: 'Title'}}`.
Deleting a selection that covers the whole title empties the title and keeps the block; a triple click selects only the text of the title.
Enter in the title moves the cursor to the description that follows it and never splits the title. In a title outside a banner, such as one written in Markdown inside a quote, a list item or a table cell, Enter at its end starts an empty paragraph after it.
A cursor in the title opens a toolbar with two menus: the size (Heading 1–6, `size`) and the title color (`color`: default, gray, yellow, orange, red, green, blue, violet); the size button shows the icon of the current size, the color menu and its button show the colors of the title, and each button names its current value, for example "Title size: Heading 3".
The toolbar follows the alignment of the banner: it sits above the start, the center or the end of the title.
Each choice is a separate change of the attribute and keeps the text and the cursor. Default values are not written.
With the cursor in the title, Tab focuses the title toolbar, and Shift+Tab focuses the banner toolbar.

## Banner description

`Banner` also includes the description: the description `:::banner-content` is a container of blocks without attributes, so its lines are not escaped as ordinary text and it survives switching modes.
The description looks like its preview and is edited in place as rich text: paragraphs with the marks and links of the editor (bold, italic, underline, strikethrough, monospace) and its selection toolbar; other blocks written in Markdown, such as lists, are kept. The editor writes the blocks of the description between empty lines, as it writes the blocks of the banner.
An empty description shows a placeholder. Change its text with the editor `placeholder` option: `{placeholder: {g_md_banner_content: 'Text'}}`.
The description is an isolated block: Enter starts a paragraph inside it and does nothing in an empty paragraph, so the text never leaves the block; Backspace at its start and Delete at its end keep it and do not join it with the blocks around it, and an empty paragraph next to it is removed instead. Deleting everything selected in the description leaves an empty description; a selection that runs from the description to the start of the next block stays inside the description.
The description has no toolbar of its own and no settings: an attribute written on `:::banner-content` in Markdown, such as `size`, is dropped. The text type select of the selection toolbar turns the selected paragraph into a heading block inside the description.
With the cursor anywhere in the description, Tab and Shift+Tab focus the banner toolbar unless a list, a code block or a table inside it uses the key. In a description outside a banner, these keys work as elsewhere in the editor: they indent or lift a list item and move to another table cell.

## Banner image

`Banner` also includes the image: the image `::banner-image[alt](src "title")` is a block without content with its address, alternative text and title, so it is not escaped as ordinary text and survives switching modes.
The image looks like its preview: it takes its half of the banner, is cropped to cover it, and moves above the text in a narrow banner. An image without an address is a gray placeholder with an icon, named "Add image" for screen readers: a click anywhere on it selects it and shows the image popup under it, and Enter on the selected placeholder moves the focus to the first control of the form. The colors of the placeholder follow the page theme only: the fill, the background image and the text color of the banner do not change them.
The image has no toolbar. A click selects the image and shows its popup under it right away, and the popup does not take the focus. The popup is aligned with the outer edge of the image (its start edge when the image is on the start side of the banner, its end edge otherwise), and it moves to the other edge or above the image when the window has no room. A selected image has only the selection ring of the editor.
The popup adds or replaces the file: "Upload from device" sends it to the `uploadFile` handler of the editor, with the same `imageTypes` and `maxImageSize` limits as the background, and "Add by link" takes an address. The address passes the same check as the background image: one that the Markdown link check of the editor rejects, such as `javascript:`, is rejected with an error. The form is the image form of the editor with only its source: the title, alternative text and size fields are hidden, here and in the Image tab of the Background popup. An error of the link or of the file is announced to screen readers.
With an image set, the popup shows the file with the replace button, which opens the form again, and the "Reset" button in its top right corner, the same button as in the Background popup. Reset removes the address, the alternative text and the title in one undo step, so the placeholder comes back; the popup stays open on the form, with the focus on its first control when the button had it. The popup has the corner radius and the paddings of the button settings window. The alternative text and the title are not edited in the visual editor: `alt` and `title` written in Markdown are kept when the file is replaced and when switching modes.
The result of an upload goes to the image that started it, also when the image has moved; it is dropped when the image is removed or gets another address first, or when Cancel, Escape or hiding the popup stops it while it runs. A failed upload shows an error and returns the focus to the upload button when it was lost.
In the editor, an image without an alternative text is named "Image" for screen readers, so selecting it is announced; the Markdown and the preview keep it decorative.
The image is selected as a whole, also by the first click into an editor that has not had the focus yet; an image selected in a new document, or by a change in the settings panel, shows its popup once the editor has the focus. While the image is selected, the banner toolbar stays centered under the banner and, unlike with the cursor in its text, never moves above the banner, so the editor toolbar never covers it; it stays shown while the focus is in the image popup, as it does for the settings panel; in a banner too narrow for both, the image popup is placed under the toolbar. Backspace at the start of the block after the image, and Delete at the end of the block before it, select the image and delete nothing; Backspace or Delete then removes only the selected image, and a banner whose only block was the image keeps an empty paragraph. The Image switch of the settings panel removes the image as well.
Escape, a click outside the popup and the image, and moving the focus to another element of the page hide the popup until the image is clicked or selected again. Whenever the popup is shown, the banner toolbar is shown with it, also after Escape hid the toolbar in the title or the description. Escape in the popup also returns the focus to the editor and keeps the banner toolbar; Escape in the editor hides both. With the image selected, Enter shows the popup and moves the focus to its first control, and Tab does the same while the popup is shown; with the popup hidden by Escape in it, Tab focuses the banner toolbar, and with both hidden, Tab does not focus it until a click on the image or Enter shows them again. Tab from the last control of the popup and Shift+Tab from its first control hide it and return the focus to the editor with the image still selected. Enter in the link field sets the image and keeps the popup on the file with the focus on the replace button, as the Submit button does; the same applies to the Image tab of the Background popup.

## Button

`Button` is a separate extension from the same package:

```ts
import {Button, Banner} from '@gravity-ui/markdown-editor-banner-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Banner).use(Button)},
});
```

A preview without banners can register `buttonPlugin` from `@gravity-ui/markdown-plugin-banner` alone.

A button is an indivisible inline node, like an image: `:button[Read more](/page "Title"){view="action" color="blue"}`. Its label, link, title, style and target are attributes of the node.
The button looks like its preview. The cursor never enters it: a click selects the whole button and does not follow its link, the arrow keys step onto it and over it, and typing with a button selected replaces it, as with any selected node. Backspace after a button and Delete before it select the button first; the next press removes it.
The label is plain text, changed only in the settings window: Markdown markers such as `` ` `` and `*` stay in it as written, `[`, `]`, `\` and `|` are escaped in Markdown, so a label keeps its text in a table cell, a label with `{…}` keeps it after a reread, and line breaks become spaces. Adjacent buttons are separate nodes.
Bold, italic and other text marks apply to the button as a whole, as Markdown writes them around it. A link, inline code, subscript and superscript never apply to a button, since Markdown cannot write a button inside them: a link added over a text with a button, by a pasted address or another command, links the text on each side and skips the button; inline code, subscript and superscript apply to the text on each side, skip the button and keep its other marks. Markdown that puts a button inside a link is read as the preview shows it: the link ends before the button (`[Intro :button[Go] end](/x)` becomes `[Intro ](/x):button[Go] end`).
A button with an empty label is allowed: it shows the placeholder "Button" dimmed (the `button` entry of the editor's `placeholder` option replaces the text), and the editor writes the placeholder as the label, so the preview shows the same button.

A click on a button, or Enter on a selected button, opens the settings window under it. The window is a dialog named "Button settings", built like the other windows of the extension: it opens with the focus in the label field, Tab moves through the label field, its clear button, the style list, the link field and the "Open in a new tab" switch, and Tab after the last control or Shift+Tab before the first one closes the window, saves the fields and returns the focus to the editor. Escape does the same; a click outside the window saves the fields and closes it, and a click on its button keeps it open. The button stays selected, so Enter opens the window again. In a banner, the banner toolbar is hidden while the window is open.
The window and its lists are drawn over the toolbars of other blocks, such as a note, a cut or a table around the button. They are rendered, as the settings panel and the image popup are, in the portal container that the host gives the editor (the `PortalProvider` of `@gravity-ui/uikit`).
The style list shows every view and color with a preview of the style under the pointer; choosing a style or switching the target changes the button at once and keeps the window open. A text field is saved on Enter, which closes the window, and when it loses the focus. Each change is a separate undo step.
The link field uses the address check of the editor's Markdown parser (`normalizeLinkUrl` of `@gravity-ui/markdown-plugin-banner`): an address that Markdown would drop (`javascript:`, `vbscript:`, `file:`, `data:` other than an image, or one that a custom `validateLink` rejects) is not saved, the field shows an error and the previous address is kept. An accepted address is saved normalized, as Markdown writes it (`/docs page` becomes `/docs%20page`).
The editor's link action does nothing on a selected button. Over a selection that holds a button, the link form opens for the text at the end of the selection, after the last button (or before it, when the selection ends with a button); the buttons and the rest of the text are skipped, so the form never leaves an empty link.

A paragraph that holds only buttons and spaces with no marks is a row, as in the preview (a bold or italic button is a button in a paragraph of text); inside a banner the row follows the alignment of the banner and becomes a column in a narrow banner. In the editor the row stays a line of text with the same button boxes, and the arrow keys leave the row as they leave a paragraph (into the gap cursor after the last banner). A text typed between the buttons turns the row into a paragraph of text.
A copied button pastes as a button. A button pasted into the title joins it as the text of its label.

`toolbarButtonItem` inserts a button at the cursor in both modes.
In the visual editor, the new button has an empty label, is selected, and its settings window opens with the focus in the label field; with a text selected inside one paragraph, the toolbar button turns that text, without the spaces around it, into the label. With a button selected or right before the cursor, the new button is added after it, behind a space. The item is disabled where a button cannot stand, such as in a title or a code block, and for a selection that holds more than text.
The Markdown editor inserts `:button[Button]{view="action" color="standard"}`.
In the Markdown editor, a text selected on one line becomes the label: it is trimmed, `[`, `]` and `\` in it are escaped, and the spaces around it stay outside the button. Otherwise the button is added at the end of the selection, and the selected text is kept. When the cursor or the selection touches a button of the line, or is inside it, nothing becomes a label: the new button is added after that button (the last one the selection touches), behind a space, so a second click adds a second button. The label of the new button is selected, so typing replaces it.

The editor always writes `view` and `color`, and `target` when it differs from `_self`. The address and the title are written in parentheses when the address is set.
