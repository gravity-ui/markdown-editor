##### Getting started / Editor customization

## How to customize the editor
You can use CSS variables to make editor contents fit your own needs

| **Variable** | **Description** | **CSS Property Type** | **Default** |
| :---:  | :---: | :---: | :---: |
| `--g-md-toolbar-padding` | Toolbar padding | padding | 0px |
| `--g-md-toolbar-sticky-padding` | Toolbar padding in sticky mode | padding | -4px |
| `--g-md-toolbar-sticky-inset` | Toolbar inset in sticky mode | inset | -4px |
| `--g-md-toolbar-sticky-offset` | Toolbar offset in sticky mode | top | 0px |
| `--g-md-toolbar-sticky-border` | Toolbar border in sticky mode | border | 1px solid var(--g-color-line-generic-solid) |
| `--g-md-editor-padding` | Editor contents padding | padding | 0px |

## Table matrix selection and clipboard

Enable selection of whole cells in Markdown and YFM tables with the existing opt-in option:

```ts
const editor = useMarkdownEditor({
    wysiwygConfig: {tableCellSelection: true},
});
```

The option defaults to `false`. It also works with YFM table controls disabled. Drag across cells or use Shift+click to select a rectangle. Copy works in read-only editors; Cut and Paste do not change their content.

Copy includes cell content, formatting and supported table attributes. Cut removes a selected whole table, complete rows or complete columns, in that order; other rectangles have their content cleared. Delete and Backspace always clear cells and keep the table structure.

Paste inserts a copied matrix once from the first selected row and column. A smaller source leaves the rest of the selection unchanged. A larger source can replace cells outside the selection, but never grows the table. Overflow combines into the last available row or column: YFM keeps the sequence of blocks; Markdown joins inline content with spaces.

Existing merged cells are preserved when the pasted area only partly covers them. Otherwise, compatible source spans can replace the destination grid. Paste selects the result; when that result cannot form an exact rectangle, the cursor stays in the starting cell. Cut and Paste each have their own Undo step.

A standalone table can also be pasted at a text cursor in a Markdown cell or a YFM cell containing one paragraph. In a YFM cell with several blocks, ordinary text selection must touch every block for matrix paste; a cursor or partial selection keeps ordinary rich paste. Selection across several cells of one table starts at the first cell whose content is touched. A fragment containing a table and other blocks keeps ordinary rich paste.

Moving between Markdown and YFM tables preserves compatible content. A single paragraph can move into a Markdown cell. Rich content that cannot fit the destination is inserted as a separate table immediately after it, when that parent and the editor schema allow it; otherwise the document stays unchanged. Outside tables, a recognized table becomes a standalone block; code keeps its usual paste behavior. Content without a recognized table follows the ordinary paste behavior; tabs alone do not enable matrix paste.

The editor reads copied cells using its active schema. If the source table type is unavailable, it tries the HTML from the clipboard. When Markdown handles a pasted HTML table, merged cells expand into a rectangle: the first cell keeps the content and the other covered positions stay empty. Multiple paragraphs in one cell are joined with spaces. A copied body row occupies one row when pasted into a table.

A table extension that parses standard HTML `<table>` elements can set `handlesHtmlTablePaste: true` on its matrix adapter to disable Markdown table normalization. Register the HTML parse rules in the extension. Extensions that only parse a custom tag can omit this option and keep Markdown table normalization available. The cell content kind (`inline` or `block`) is independent of this option.

Copy plugins can transform the selected rectangle with `transformCopied`. The editor writes all clipboard formats from the resulting matrix. If the result is ordinary text or another fragment without a matrix, Copy and Cut stop before writing to the clipboard or changing the document.

Paste plugins receive the entire slice before the editor distributes its cells. A mixed fragment such as a paragraph followed by a table uses ordinary paste priorities, including the editor's own markup when available. With cell selection enabled, dragging a complete one-cell YFM table keeps it as a table.

Try **Examples / Table cell selection / Clipboard** and **Merged and Nested** in Storybook.
