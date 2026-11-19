import {expect, test} from 'playwright/core';

import {CopyAsTextEditor, TableCellSelectionStories} from './TableCellSelection.helpers';

const markup = `
| Header A | Header B |
| --- | --- |
| First | Second |
| Third | Fourth |

#|
|| One | Two ||
|| Three | Four ||
|| Five | Six ||
|#
`;

test.describe('Table matrix clipboard @wysiwyg', () => {
    test('should keep the system clipboard and selected cells when a copy transform cancels cut', async ({
        mount,
        editor,
        page,
        helpers,
    }) => {
        await mount(
            <div>
                <input aria-label="Clipboard check" defaultValue="previous" />
                <CopyAsTextEditor />
            </div>,
        );
        const input = page.getByRole('textbox', {name: 'Clipboard check'});
        await input.press(helpers.keys.selectAll);
        await input.press(helpers.keys.copy);
        await input.fill('');
        const table = editor.tableCellSelection.getTable('markdown');
        const cells = editor.tableCellSelection.getBodyCells(table);
        await editor.tableCellSelection.selectCells(cells.first(), cells.last());
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(2);

        await editor.press(helpers.keys.cut);
        await input.press(helpers.keys.paste);

        await expect(input).toHaveValue('previous');
        await expect(cells).toHaveText(['One', 'Two']);
    });

    test('should move a row between tables with native cut and paste and undo each operation', async ({
        mount,
        editor,
        page,
        helpers,
    }) => {
        await mount(<TableCellSelectionStories.Clipboard initialMarkup={markup} />);
        const source = editor.tableCellSelection.getTable('yfm');
        const sourceCells = editor.tableCellSelection.getCells(source);
        const target = editor.tableCellSelection.getTable('markdown');
        const targetCells = editor.tableCellSelection.getBodyCells(target);
        await editor.tableCellSelection.selectCells(sourceCells.first(), sourceCells.nth(1));
        await expect(editor.tableCellSelection.getSelectedCells(source)).toHaveCount(2);

        await editor.press(helpers.keys.cut);

        await expect(sourceCells).toHaveText(['Three', 'Four', 'Five', 'Six']);
        const clipboard = await helpers.getClipboardData();
        expect(clipboard['text/plain']).toBe('One\tTwo');
        await editor.tableCellSelection.clickCell(targetCells.first());
        await editor.press(helpers.keys.paste);

        await expect(targetCells).toHaveText(['One', 'Two', 'Third', 'Fourth']);
        await expect(editor.tableCellSelection.getSelectedCells(target)).toHaveCount(2);
        await expect(editor.locators.contenteditable).toBeFocused();

        await page.keyboard.press('ControlOrMeta+z');
        await expect(targetCells).toHaveText(['First', 'Second', 'Third', 'Fourth']);
        await expect(sourceCells).toHaveCount(4);
        await page.keyboard.press('ControlOrMeta+z');
        await expect(sourceCells).toHaveText(['One', 'Two', 'Three', 'Four', 'Five', 'Six']);
        await expect(editor.tableCellSelection.getSelectedCells(source)).toHaveCount(2);
    });

    test('should copy a body row and paste its HTML into a native RTL table without extra rows', async ({
        mount,
        editor,
    }) => {
        await mount(
            <div dir="rtl">
                <TableCellSelectionStories.Clipboard controls={false} initialMarkup={markup} />
            </div>,
        );
        const source = editor.tableCellSelection.getTable('markdown');
        const sourceCells = editor.tableCellSelection.getBodyCells(source);
        const target = editor.tableCellSelection.tableWithoutControls;
        const targetCells = editor.tableCellSelection.getCells(target);
        const firstBox = await targetCells.nth(0).boundingBox();
        const secondBox = await targetCells.nth(1).boundingBox();
        expect(firstBox?.x).toBeGreaterThan(secondBox?.x ?? Infinity);
        await editor.tableCellSelection.selectCells(sourceCells.first(), sourceCells.nth(1));

        const data = await editor.dispatchClipboardEvent('copy');

        expect(data['text/plain']).toBe('First\tSecond');
        expect(data['application/x-g-md-editor+json']).toBeTruthy();
        await editor.tableCellSelection.clickCell(targetCells.nth(2));
        await editor.paste({'text/html': data['text/html']});

        await expect(targetCells).toHaveText(['One', 'Two', 'First', 'Second', 'Five', 'Six']);
        await expect(editor.tableCellSelection.getSelectedCells(target)).toHaveCount(2);
        await expect(editor.locators.contenteditable).toBeFocused();
    });
});
