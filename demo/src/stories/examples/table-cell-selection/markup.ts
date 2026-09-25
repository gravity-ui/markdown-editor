export const markup = `
# Table cell selection

Drag across cells or use Shift+click to select a rectangle. Try selecting in both directions, whole rows and columns, and cells across the header boundary.

Backspace or Delete clears the selected cells. Type to replace their content, use Undo to restore it, and press Escape to return to a text cursor.

## Markdown: a larger grid

| Header A | Header B | Header C | Header D |
| :--- | :---: | ---: | --- |
| A1 | B1 | C1 | D1 |
| A2 | **Bold text** | 120 | D2 |
| A3 | *Italic text* | 240 | D3 |
| A4 | | 360 | Empty cell on the left |
| A5 | Inline \`code\` | 480 | A longer sentence that wraps when the editor is narrow |
| A6 | B6 | 600 | D6 |

Try selecting text inside one cell, then extending the selection into another cell.

## YFM: content and backgrounds

#|
||::{bg="yellow"} A1 | B1 | C1 | D1 ||
|| A2 | **Bold text** | 120 | D2 ||
|| A3 | *Italic text* | 240 | D3 ||
|| A4 | | 360 | Empty cell on the left ||
|| A5 | Inline \`code\` | 480 | A longer sentence that wraps when the editor is narrow ||
|| A6 | B6 | 600 | D6 ||
|#

Select the yellow cell and clear it: its background should remain. Compare cell selection with the highlight from the row or column menu when controls are enabled.

## YFM: multiple blocks in a cell

#|
|| Notes | Checklist | Result ||
||
First paragraph.

Second paragraph with **bold text**.
|
- Read the input
- Check the result
|
Ready
||
||
> A quote inside a cell.
|
1. Select several cells
2. Clear them
3. Undo the change
|
Pending
||
|| Short note | Another step | Done ||
|#
`;

export const mergedAndNestedMarkup = `
# Merged and nested cells

Drag across cells or use Shift+click. A selection that touches part of a merged cell expands to include the whole cell. Try Backspace, typing, and Undo.

## Horizontal spans

#|
|| A1 | > | C1 ||
|| A2 | B2 | C2 ||
|| A3 | B3 | C3 ||
|| A4 | B4 | C4 ||
|| A5 | B5 | C5 ||
|| A6 | B6 | C6 ||
|#

## Nested table

Start a drag in an outer cell and move across the inner table. The selection should stay in the outer table. Start inside the inner table to select its own cells.

#|
|| Outer A |

#|
|| Inner A | Inner B | Inner C ||
|| Inner D | Inner E | Inner F ||
|| Inner G | Inner H | Inner I ||
|#

| Outer B ||
|| Outer C | Outer D | Outer E ||
|| Outer F | Outer G | Outer H ||
|#

## Row and column spans together

Select a rectangle through the middle of this grid, then extend it in the opposite direction.

#|
|| A1 | B1 | C1 | D1 | E1 ||
|| A2 |::{bg="yellow"} Merged 2 × 2 | > | D2 | E2 ||
|| A3 | ^ | ^ | D3 | E3 ||
|| A4 | B4 | C4 | Vertical span | E4 ||
|| A5 | B5 | C5 | ^ | E5 ||
|| A6 | B6 | C6 | D6 | E6 ||
|#
`;
