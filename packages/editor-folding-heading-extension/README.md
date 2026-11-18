# Folding heading editor extension

Folding headings for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a heading with `+` after the `#` signs starts a section that the reader can collapse and expand. The section ends at the next heading of the same or a higher level:

```md
##+ Collapsed section

The text under the heading
```

Supports `@gravity-ui/markdown-editor` 15.47.0 and higher. Starting with version 16, the editor does not include the folding heading extension, and this package provides it.

## Installation

```bash
npm install @gravity-ui/markdown-editor-folding-heading-extension @diplodoc/folding-headings-extension
```

## Usage

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {FoldingHeading} from '@gravity-ui/markdown-editor-folding-heading-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) => builder.use(FoldingHeading),
  },
});
```

`FoldingHeading` extends the heading of `YfmHeading`, so add it after the editor preset or after `YfmHeading`.
The Markdown plugin and the runtime for the markup preview are in `@diplodoc/folding-headings-extension`.
The setup of the preview and the toolbar is described in [How to connect the folding heading extension](https://gravity-ui.github.io/markdown-editor/extensions/folding-heading-extension.html).

| Entry point                                                           | Exports                                                                                                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@gravity-ui/markdown-editor-folding-heading-extension`               | `FoldingHeading`, the toolbar button `toolbarFoldingHeadingItem` and its parts `toggleHeadingFoldingItemView`, `toggleHeadingFoldingItemWysiwyg` |
| `@gravity-ui/markdown-editor-folding-heading-extension/wysiwyg`       | `FoldingHeading`, `toggleHeadingFoldingItemWysiwyg` and `toolbarFoldingHeadingItem` for the visual editor                                        |
| `@gravity-ui/markdown-editor-folding-heading-extension/wysiwyg/specs` | `FoldingHeadingSpecs` and `FoldingHeadingAttr`                                                                                                   |

`FoldingHeadingSpecs` adds the `folded` attribute to the heading, the `#+` Markdown syntax and the `data-folded` HTML attribute, and runs in Node.js without a DOM or styles.
`FoldingHeading` also adds the `#+ ` input rule, the `toggleHeadingFolding` action, the `Enter` and `Backspace` keys, collapsing by a click on the chevron of the heading and the styles.

## Migration from `@gravity-ui/markdown-editor`

The entities keep their names. Only the import path changes.

| In `@gravity-ui/markdown-editor` 15                                                   | In this package                                                   |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `FoldingHeading` from `/extensions/additional/FoldingHeading`                         | `FoldingHeading` from `.` or `/wysiwyg`                           |
| `FoldingHeadingSpecs` from `/extensions/additional/FoldingHeading/FoldingHeadingSpec` | `FoldingHeadingSpecs` from `/wysiwyg/specs`                       |
| `YfmHeadingAttr.Folding`                                                              | `FoldingHeadingAttr.Folding` from `/wysiwyg/specs`                |
| `toggleHeadingFoldingItemView` from `/toolbars`                                       | `toggleHeadingFoldingItemView` from `.`                           |
| `toggleHeadingFoldingItemWysiwyg` from `/toolbars`                                    | `toggleHeadingFoldingItemWysiwyg` from `.` or `/wysiwyg`          |
| `{view: toggleHeadingFoldingItemView, wysiwyg: toggleHeadingFoldingItemWysiwyg}`      | `toolbarFoldingHeadingItem` from `.` or `/wysiwyg`                |
| `wToggleHeadingFoldingItemData`                                                       | `toolbarFoldingHeadingItem` in a toolbars preset                  |
| `ActionName.foldingHeading`                                                           | any string key of the preset item, for example `'foldingHeading'` |
| `icons.foldingHeading`, `FoldingHeadingIcon`                                          | `ArrowChevronRight` from `@gravity-ui/icons`                      |

The `full` toolbars preset of the editor no longer has the button in the selection toolbar. Add `toolbarFoldingHeadingItem` to your preset.
`YfmHeadingSpecs` of the editor no longer has the `folded` attribute: without this package, the `data-folded` HTML attribute is ignored and `renderYfmHeadingMarkup` writes no `+`.
The `folding-heading` and `folding-heading__hint` keys of the editor's `menubar` keyset are removed. The package registers its own keyset.
`@gravity-ui/markdown-editor` no longer lists `@diplodoc/folding-headings-extension` as an optional peer dependency; this package requires it.
`useYfmShowElemWithId` of the editor and the viewer still open the folded sections that contain the target element.
