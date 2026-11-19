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

| Entry point                                                  | Exports                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `@gravity-ui/markdown-editor-header-extension`               | `Header`, `Button`, the Markdown command `insertHeader`, and the toolbar button `toolbarHeaderItem` for both modes |
| `@gravity-ui/markdown-editor-header-extension/wysiwyg`       | `Header`, `Button`, and `toolbarHeaderItem` for the visual editor                                                  |
| `@gravity-ui/markdown-editor-header-extension/wysiwyg/specs` | `HeaderSpecs`, `headerNodeName`, `ButtonSpecs`, and `buttonNodeName`                                               |
| `@gravity-ui/markdown-editor-header-extension/markup`        | `insertHeader` and `toolbarHeaderItem` for the Markdown editor                                                     |

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

## Button

`Button` is a separate extension from the same package:

```ts
import {Button, Header} from '@gravity-ui/markdown-editor-header-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {extensions: (builder) => builder.use(Header, {}).use(Button)},
});
```

Register `buttonPlugin` from `@gravity-ui/markdown-plugin-header` in the Markdown preview.

A button is an inline node: `:button[Read more](/page){view="action" color="blue"}`.
The button is an atom: a click on it, or Enter while it is selected, opens the settings window under it.
The window holds the label field, the style list with a preview of the style under the pointer, the link field, and the "Open in a new tab" switch.
The label is plain text without formatting. Each change is a separate undo step.
The link field shows an error for an address that the Markdown parser of the editor rejects, such as `javascript:`, and keeps the previous address.
Closing the window saves the label and the link. Escape, Enter, Tab after the last field, and Shift+Tab before the first field return focus to the editor. Clicking the button does not follow the link.
Backspace after a button and Delete before it select the button; the next press removes it.

The editor always writes `view` and `color`, and `target` when it differs from `_self`. The address and the title are written in parentheses when the address is set.

An empty button shows the text "Button" in the visual editor and saves it as the label. Change the text with the editor `placeholder` option: `{placeholder: {button: 'Open'}}`.
