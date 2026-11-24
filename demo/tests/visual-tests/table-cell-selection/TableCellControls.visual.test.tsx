import {expect, test} from 'playwright/core';

import {TableCellSelectionStories} from './TableCellSelection.helpers';

const markup = '#|\n|| A1 | B1 | C1 ||\n|| A2 | B2 | C2 ||\n|| A3 | B3 | C3 ||\n|#';
const mixedMarkup = '#|\n||::{bg="yellow"} A1 | B1 | C1 ||\n|| A2 | B2 | C2 ||\n|#';
const scrollingMarkup = `${markup}\n\n${'A paragraph below the table.\n\n'.repeat(20)}`;

test.describe('Table cell controls @wysiwyg', () => {
    test('should show ordered actions for one cell inside the editor', async ({
        mount,
        editor,
        expectScreenshot,
    }) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={markup} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await editor.tableCellSelection.selectCell(cells.nth(4));
        await expect(editor.tableCellSelection.selectionButton).toHaveAccessibleName(
            'Cell actions',
        );
        await editor.tableCellSelection.openSelectionMenu();
        await expect(editor.tableCellSelection.getSelectionMenuItems()).toHaveText([
            'Background color',
            'Add row before',
            'Add row after',
            'Add column before',
            'Add column after',
            'Clear cells',
            'Remove row',
            'Remove column',
        ]);
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(1);
        await expectScreenshot({
            component: editor.tableCellSelection.selectionMenu,
            themes: ['light'],
        });
    });

    for (const selection of [
        {name: 'rows', first: 3, last: 8, action: 'row', hidden: 'column', label: 'Remove rows'},
        {
            name: 'columns',
            first: 1,
            last: 8,
            action: 'column',
            hidden: 'row',
            label: 'Remove columns',
        },
    ]) {
        test(`should offer only ${selection.name} removal for complete ${selection.name}`, async ({
            mount,
            editor,
        }) => {
            await mount(<TableCellSelectionStories.BothTables initialMarkup={markup} />);
            const cells = editor.tableCellSelection.getCells(
                editor.tableCellSelection.getTable('yfm'),
            );
            await editor.tableCellSelection.selectCells(
                cells.nth(selection.first),
                cells.nth(selection.last),
            );
            await editor.tableCellSelection.openSelectionMenu();
            await expect(
                editor.tableCellSelection.getSelectionAction(`remove-${selection.action}`),
            ).toHaveText(selection.label);
            await expect(
                editor.tableCellSelection.getSelectionAction(`remove-${selection.hidden}`),
            ).toHaveCount(0);
            await expect(editor.tableCellSelection.getSelectionAction('remove-table')).toHaveCount(
                0,
            );
        });
    }

    test('should omit the background group when disabled', async ({mount, editor}) => {
        await mount(<TableCellSelectionStories.WithoutCellBackground initialMarkup={markup} />);
        const cells = editor.tableCellSelection.getCells(editor.tableCellSelection.getTable('yfm'));
        await editor.tableCellSelection.selectCells(cells.first(), cells.nth(4));
        await editor.tableCellSelection.openSelectionMenu();
        await expect(editor.tableCellSelection.getSelectionMenuItems().first()).toHaveText(
            'Add row before',
        );
        await expect(editor.tableCellSelection.getSelectionMenuItems()).toHaveCount(7);
    });

    test('should show mixed backgrounds and preserve selection after a color change', async ({
        mount,
        editor,
    }) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={mixedMarkup} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await editor.tableCellSelection.selectCells(cells.first(), cells.nth(1));
        await editor.tableCellSelection.openSelectionPalette();
        await expect(editor.tableCellSelection.getSelectedBackgroundSwatches()).toHaveCount(0);
        await editor.tableCellSelection.getBackgroundSwatch('Red').click({scroll: 'none'});
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(2);
        await editor.tableCellSelection.openSelectionPalette();
        await expect(editor.tableCellSelection.getBackgroundSwatch('Red')).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        await editor.tableCellSelection.getBackgroundSwatch('No color').click({scroll: 'none'});
        await editor.tableCellSelection.openSelectionPalette();
        await expect(editor.tableCellSelection.getBackgroundSwatch('No color')).toHaveAttribute(
            'aria-pressed',
            'true',
        );
    });

    test('should insert one row and type at the selected left column', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={markup} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await editor.tableCellSelection.selectCells(cells.nth(4), cells.nth(8));
        await editor.tableCellSelection.openSelectionMenu();
        await editor.tableCellSelection.getSelectionAction('add-row-before').click();
        await expect(editor.tableCellSelection.selectionButton).toHaveCount(0);
        await expect(editor.locators.contenteditable).toBeFocused();
        await page.keyboard.type('New');
        await expect(cells.nth(4)).toHaveText('New');
    });

    test('should close the menu with Escape and leave cell selection until a second Escape', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={markup} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await editor.tableCellSelection.selectCells(cells.first(), cells.nth(4));
        await editor.tableCellSelection.openSelectionMenu();
        await page.keyboard.press('Escape');
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
        await page.keyboard.press('Escape');
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
    });

    test('should leave focus on an outside input after dismissing the menu', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(
            <div>
                <input aria-label="Outside editor" />
                <TableCellSelectionStories.BothTables initialMarkup={markup} />
            </div>,
        );
        const cells = editor.tableCellSelection.getCells(editor.tableCellSelection.getTable('yfm'));
        await editor.tableCellSelection.selectCells(cells.first(), cells.nth(4));
        await editor.tableCellSelection.openSelectionMenu();
        const input = page.getByRole('textbox', {name: 'Outside editor'});
        await input.click();
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
        await expect(input).toBeFocused();
    });

    test('should show the control only after releasing the selection drag', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={markup} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await editor.tableCellSelection.startDrag(cells.first(), cells.nth(4));
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
        await expect(editor.tableCellSelection.selectionButton).toBeHidden();
        await page.mouse.up();
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
    });

    test('should remove only the selected nested table', async ({mount, editor}) => {
        await mount(
            <TableCellSelectionStories.BothTables
                initialMarkup={'#|\n|| Outer |\n\n#|\n|| Inner A | Inner B ||\n|#\n\n||\n|#'}
            />,
        );
        const outer = editor.tableCellSelection.getTable('yfm');
        const inner = editor.tableCellSelection.getNestedTable(outer);
        const cells = editor.tableCellSelection.getCells(inner);
        await editor.tableCellSelection.selectCells(cells.first(), cells.last());
        await expect(editor.tableCellSelection.selectionButton).toHaveCount(1);
        await editor.tableCellSelection.openSelectionMenu();
        await expect(editor.tableCellSelection.getSelectionAction('remove-row')).toHaveCount(0);
        await expect(editor.tableCellSelection.getSelectionAction('remove-column')).toHaveCount(0);
        await editor.tableCellSelection.getSelectionAction('remove-table').click();
        await expect(inner).toHaveCount(0);
        await expect(outer).toHaveCount(1);
        await expect(outer).toContainText('Outer');
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    test('should close on container scroll and restore only the button after hidden selection returns', async ({
        mount,
        editor,
    }) => {
        await mount(<TableCellSelectionStories.ScrollContainer initialMarkup={scrollingMarkup} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await editor.tableCellSelection.selectCells(cells.first(), cells.last());
        await editor.tableCellSelection.openSelectionMenu();
        await editor.tableCellSelection.scrollBy(20);
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await editor.tableCellSelection.scrollBy(500);
        await expect(editor.tableCellSelection.selectionButton).toBeHidden();
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(9);
        await editor.tableCellSelection.scrollBy(-1000);
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
    });

    test('should close on page scroll without returning focus to the editor', async ({
        mount,
        editor,
        page,
    }) => {
        await page.setViewportSize({width: 800, height: 500});
        await mount(
            <TableCellSelectionStories.BothTables
                initialMarkup={scrollingMarkup}
                viewWidth={740}
            />,
        );
        const cells = editor.tableCellSelection.getCells(editor.tableCellSelection.getTable('yfm'));
        await editor.tableCellSelection.selectCells(cells.first(), cells.last());
        await editor.tableCellSelection.openSelectionMenu();
        const menuItem = editor.tableCellSelection.getSelectionAction('add-row-before');
        await menuItem.focus();
        await expect(menuItem).toBeFocused();
        await page.evaluate(() => window.scrollBy(0, 25));
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
        await expect(editor.locators.contenteditable).not.toBeFocused();
        await page.evaluate(() => window.scrollBy(0, 500));
        await expect(editor.tableCellSelection.selectionButton).toBeHidden();
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
    });

    test('should follow horizontal scrolling inside the table and restore only the button', async ({
        mount,
        editor,
    }) => {
        await mount(
            <TableCellSelectionStories.BothTables
                initialMarkup={
                    '#|\n|| First | Second | Third | Fourth | Fifth | Sixth | Seventh | Eighth ||\n|#'
                }
                viewWidth={360}
            />,
        );
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await expect(table).toHaveCSS('overflow-x', 'auto');
        expect(
            await table.evaluate((element) => element.scrollWidth - element.clientWidth),
        ).toBeGreaterThan(200);
        await editor.tableCellSelection.selectCell(cells.first());
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        const initialLeft = await editor.tableCellSelection.selectionButton.evaluate(
            (element) => element.getBoundingClientRect().left,
        );
        await editor.tableCellSelection.openSelectionMenu();

        await editor.tableCellSelection.scrollTableBy(table, 20);
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await expect
            .poll(() =>
                editor.tableCellSelection.selectionButton.evaluate(
                    (element) => element.getBoundingClientRect().left,
                ),
            )
            .toBeCloseTo(initialLeft - 20, 0);

        await editor.tableCellSelection.scrollTableBy(table, 10000);
        await expect(editor.tableCellSelection.selectionButton).toBeHidden();
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(1);
        await editor.tableCellSelection.scrollTableBy(table, -10000);
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await expect(editor.tableCellSelection.selectionMenu).toBeHidden();
    });

    test('should reposition the control after a container resize', async ({mount, editor}) => {
        await mount(<TableCellSelectionStories.ScrollContainer initialMarkup={markup} />);
        const cells = editor.tableCellSelection.getCells(editor.tableCellSelection.getTable('yfm'));
        await editor.tableCellSelection.selectCells(cells.first(), cells.last());
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await editor.tableCellSelection.scrollContainer.evaluate((element) => {
            element.style.setProperty('width', '120px');
        });
        await expect
            .poll(async () => {
                const container = await editor.tableCellSelection.scrollContainer.boundingBox();
                const button = await editor.tableCellSelection.selectionButton.boundingBox();
                return container && button
                    ? button.x + button.width <= container.x + container.width + 1
                    : false;
            })
            .toBe(true);
    });

    test('should keep each control scoped to its editor and remove portals on destroy', async ({
        mount,
        editor,
    }) => {
        const component = await mount(
            <div>
                <TableCellSelectionStories.BothTables initialMarkup={markup} />
                <TableCellSelectionStories.BothTables initialMarkup={markup} />
            </div>,
        );
        const first = editor.tableCellSelection.getTable('yfm', 0);
        const second = editor.tableCellSelection.getTable('yfm', 1);
        const firstCells = editor.tableCellSelection.getCells(first);
        const secondCells = editor.tableCellSelection.getCells(second);
        await editor.tableCellSelection.selectCells(firstCells.first(), firstCells.nth(4));
        await editor.tableCellSelection.openSelectionMenu();
        await editor.tableCellSelection.clearSelectedCells();
        await expect.poll(() => editor.tableCellSelection.getCellText(firstCells.first())).toBe('');
        await expect(secondCells.first()).toHaveText('A1');
        await expect(editor.tableCellSelection.getSelectedCells(first)).toHaveCount(4);
        await expect(editor.locators.contenteditable.first()).toBeFocused();
        await first.scrollIntoViewIfNeeded();
        await expect(first).toBeInViewport();
        await expect(editor.tableCellSelection.selectionButton).toBeVisible();
        await editor.tableCellSelection.openSelectionMenu();
        await component.unmount();
        await expect(editor.tableCellSelection.selectionButton).toHaveCount(0);
        await expect(editor.tableCellSelection.selectionMenu).toHaveCount(0);
    });
});
