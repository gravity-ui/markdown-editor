import type {Locator, Page} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {TableCellSelectionStories} from './TableCellSelection.helpers';

test.describe('Table cell selection', () => {
    for (const kind of ['markdown', 'yfm'] as const) {
        test(`should select across rows, clear cells and undo in a ${kind} table`, async ({
            mount,
            page,
        }) => {
            await mount(<TableCellSelectionStories.BothTables />);
            const table = page
                .locator(
                    kind === 'markdown'
                        ? '.ProseMirror table:has(> thead)'
                        : '.ProseMirror .g-md-yfm-table-view',
                )
                .first();
            const cells = table.locator(':scope > thead > tr > th, :scope > tbody > tr > td');
            const contents = await cells.allTextContents();

            await cells.first().click();
            await cells.nth(5).click({modifiers: ['Shift']});
            await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(4);
            await expect(page.getByTestId('g-md-yfm-table-selection-btn')).toHaveCount(
                kind === 'yfm' ? 1 : 0,
            );
            await expect(page.locator('.table-cell-floating-button')).toBeHidden();
            await expect(page.getByTestId('g-md-yfm-table-plus-row')).toHaveCount(0);
            await expect(page.getByTestId('g-md-yfm-table-row-btn')).toHaveCount(0);

            await page.keyboard.press('Backspace');
            await expect(cells).toHaveCount(contents.length);
            await expect.poll(() => cellText(cells.nth(0))).toBe('');
            await expect.poll(() => cellText(cells.nth(5))).toBe('');
            await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(4);
            await page.keyboard.press('ControlOrMeta+z');
            await expect(cells).toHaveText(contents);
            await page.keyboard.press('Escape');
            await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(0);
        });
    }

    for (const kind of ['markdown', 'yfm'] as const) {
        test(`should place a cursor in the anchor cell after a ${kind} cell selection`, async ({
            mount,
            page,
        }) => {
            await mount(<TableCellSelectionStories.BothTables />);
            const table = pointerTable(page, kind);
            const cells = table.locator(':scope > thead > tr > th, :scope > tbody > tr > td');
            await cells.first().click();
            await cells.nth(5).click({modifiers: ['Shift']});
            await cells.first().click();
            await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(0);
            await expect
                .poll(() => page.evaluate(() => window.getSelection()?.isCollapsed))
                .toBe(true);
        });

        for (const direction of ['forward', 'backward'] as const) {
            test(`should select one ${kind} cell only after dragging beyond all text ${direction}`, async ({
                mount,
                page,
            }) => {
                await mount(<TableCellSelectionStories.BothTables />);
                const table = pointerTable(page, kind);
                const cell = table.locator('th, td').first();
                const rect = await textRect(cell);
                const forward = direction === 'forward';
                const start = forward ? rect.left : rect.right;
                const end = forward ? rect.right : rect.left;
                const y = (rect.top + rect.bottom) / 2;
                await page.mouse.move(start, y);
                await page.mouse.down();
                await page.mouse.move(end, y, {steps: 8});
                await expect
                    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
                    .toBe((await cellText(cell))?.trim());
                await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(0);
                await page.mouse.move(end + (forward ? 8 : -8), y, {steps: 4});
                await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(1);
                await page.mouse.up();
            });
        }
    }

    test.describe('actions from the floating menu', () => {
        test.beforeEach(async ({mount}) => {
            await mount(<TableCellSelectionStories.BothTables />);
        });

        for (const [side, index] of [
            ['before', 1],
            ['after', 3],
        ] as const) {
            test(`should insert a row ${side} the selected rectangle`, async ({page}) => {
                const {rows} = await openSelectionMenu(page, 5, 10);
                const contents = await tableText(rows);
                const expected = [...contents];
                expected.splice(index, 0, ['', '', '', '']);
                await page.getByTestId(`g-md-yfm-table-selection-add-row-${side}`).click();
                await expect.poll(() => tableText(rows)).toEqual(expected);
                await page.keyboard.press('ControlOrMeta+z');
                await expect.poll(() => tableText(rows)).toEqual(contents);
            });

            test(`should insert a column ${side} the selected rectangle`, async ({page}) => {
                const {rows} = await openSelectionMenu(page, 5, 10);
                const contents = await tableText(rows);
                const expected = contents.map((row) => {
                    const result = [...row];
                    result.splice(index, 0, '');
                    return result;
                });
                await page.getByTestId(`g-md-yfm-table-selection-add-column-${side}`).click();
                await expect.poll(() => tableText(rows)).toEqual(expected);
                await page.keyboard.press('ControlOrMeta+z');
                await expect.poll(() => tableText(rows)).toEqual(contents);
            });
        }

        test('should clear only the selected rectangle and undo', async ({page}) => {
            const {cells} = await openSelectionMenu(page, 5, 10);
            const contents = await cellsText(cells);
            await page.getByTestId('g-md-yfm-table-selection-clear-cells').click();
            await expect
                .poll(() => cellsText(cells))
                .toEqual(
                    contents.map((text, index) => ([5, 6, 9, 10].includes(index) ? '' : text)),
                );
            await page.keyboard.press('ControlOrMeta+z');
            await expect.poll(() => cellsText(cells)).toEqual(contents);
        });

        test.describe('cell background', () => {
            let initialBackgrounds: (string | null)[];

            test.beforeEach(async ({page}) => {
                const {cells} = await openSelectionMenu(page, 0, 5);
                initialBackgrounds = await cellBackgrounds(cells);
                await chooseCellBackground(page, 'blue');
            });

            test('should color only the selected cells', async ({page}) => {
                const cells = yfmTable(page).locator(':scope > tbody > tr > td');
                const expected = Array(await cells.count()).fill(null);
                for (const index of [0, 1, 4, 5]) expected[index] = 'blue';
                await expect.poll(() => cellBackgrounds(cells)).toEqual(expected);
            });

            test('should clear the selected cells background', async ({page}) => {
                await chooseCellBackground(page, 'none');
                await expect(yfmTable(page).locator('td[data-bg]')).toHaveCount(0);
            });

            test('should undo the background change', async ({page}) => {
                await page.keyboard.press('Escape');
                await yfmTable(page).locator('td').first().click();
                await page.keyboard.press('ControlOrMeta+z');
                const cells = yfmTable(page).locator(':scope > tbody > tr > td');
                await expect.poll(() => cellBackgrounds(cells)).toEqual(initialBackgrounds);
            });

            test('should preserve the cell selection after changing background', async ({page}) => {
                await expect(yfmTable(page).locator('.g-md-table-selected-cell')).toHaveCount(4);
            });

            test('should hide the control after leaving the cell selection', async ({page}) => {
                await page.keyboard.press('Escape');
                await page.keyboard.press('Escape');
                await expect(page.getByTestId('g-md-yfm-table-selection-btn')).toHaveCount(0);
            });
        });
    });

    test('should color a merged cell without changing the neighboring cells', async ({
        mount,
        page,
    }) => {
        await mount(<TableCellSelectionStories.MergedAndNested />);
        const table = page.locator('.ProseMirror .g-md-yfm-table-view').first();
        const cells = table.locator(':scope > tbody > tr > td');
        await cells.nth(3).click();
        await cells.nth(1).click({modifiers: ['Shift']});
        await page.getByTestId('g-md-yfm-table-selection-btn').click();
        await page.getByTestId('g-md-yfm-table-selection-cell-bg').hover();
        await page
            .locator(
                '.g-md-yfm-table-cell-bg-palette button:has(.g-md-yfm-table-cell-bg-palette__swatch_color_red)',
            )
            .click();
        await expect(table.locator('td[data-bg="red"]')).toHaveCount(5);
        await expect(cells.first()).toHaveAttribute('colspan', '2');
        await expect(cells.nth(5)).not.toHaveAttribute('data-bg');
    });

    test('should handle native IME with a text cursor', async ({mount, page}) => {
        await mount(<TableCellSelectionStories.BothTables />);
        const cell = page.locator('.ProseMirror table:has(> thead)').first().locator('td').first();
        await cell.click();
        await page.keyboard.press('End');
        const client = await page.context().newCDPSession(page);
        await client.send('Input.imeSetComposition', {
            text: 'あい',
            selectionStart: 2,
            selectionEnd: 2,
        });
        await client.send('Input.insertText', {text: 'あい'});
        await client.detach();
        await expect(cell).toHaveText('A1あい');
    });

    for (const kind of ['markdown', 'yfm'] as const) {
        for (const sameText of [false, true]) {
            test(`should replace selected ${kind} cells using native IME ${sameText ? 'with the same head text' : 'with new text'} in one undo step`, async ({
                mount,
                page,
            }) => {
                await mount(<TableCellSelectionStories.BothTables />);
                const table = page
                    .locator(
                        kind === 'markdown'
                            ? '.ProseMirror table:has(> thead)'
                            : '.ProseMirror .g-md-yfm-table-view',
                    )
                    .first();
                const cells = table.locator(':scope > thead > tr > th, :scope > tbody > tr > td');
                const contents = await cells.allTextContents();
                const text = sameText ? contents[5] : 'あい';
                await cells.first().click();
                await cells.nth(5).click({modifiers: ['Shift']});
                await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(4);
                const client = await page.context().newCDPSession(page);
                await client.send('Input.imeSetComposition', {
                    text,
                    selectionStart: text.length,
                    selectionEnd: text.length,
                });
                await client.send('Input.insertText', {text});
                await client.detach();
                await expect.poll(() => cellText(cells.nth(0))).toBe('');
                await expect.poll(() => cellText(cells.nth(1))).toBe('');
                await expect.poll(() => cellText(cells.nth(4))).toBe('');
                await expect(cells.nth(5)).toHaveText(text);
                await page.keyboard.press('ControlOrMeta+z');
                await expect(cells).toHaveText(contents);
                await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(4);
            });
        }
    }

    test('should support YFM without controls and typing into a group', async ({mount, page}) => {
        await mount(<TableCellSelectionStories.WithoutYfmControls />);
        const table = page.locator('.ProseMirror table:not(:has(> thead))').first();
        const cells = table.locator(':scope > tbody > tr > td');
        await cells.first().click();
        await cells.nth(5).click({modifiers: ['Shift']});
        await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(4);
        await expect(page.getByTestId('g-md-yfm-table-selection-btn')).toHaveCount(0);
        expect((await selectedStyles(cells.first())).border).toContain('1px solid');
        await page.keyboard.insertText('replacement');
        await expect.poll(() => cellText(cells.nth(0))).toBe('');
        await expect.poll(() => cellText(cells.nth(1))).toBe('');
        await expect.poll(() => cellText(cells.nth(4))).toBe('');
        await expect(cells.nth(5)).toHaveText('replacement');
        await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(0);
    });

    test('should select a Markdown rectangle across thead and tbody by dragging', async ({
        mount,
        page,
    }) => {
        await mount(<TableCellSelectionStories.BothTables />);
        const table = page.locator('.ProseMirror table:has(> thead)').first();
        const first = await table.locator('th').first().boundingBox();
        const last = await table.locator('td').nth(1).boundingBox();
        if (!first || !last) throw new Error('Table cells must be visible');
        await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
        await page.mouse.down();
        await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, {steps: 6});
        await page.mouse.up();
        await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(4);
    });

    test('should expand around merged cells', async ({mount, page}) => {
        await mount(<TableCellSelectionStories.MergedAndNested />);
        const table = page.locator('.ProseMirror .g-md-yfm-table-view').first();
        const cells = table.locator(':scope > tbody > tr > td');
        await expect(cells).toHaveCount(17);
        await expect(cells.first()).toHaveAttribute('colspan', '2');
        await cells.nth(3).click();
        await cells.nth(1).click({modifiers: ['Shift']});
        await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(5);
        await expect(cells.first()).toHaveClass(/g-md-table-selected-cell_first-column/);
    });

    test('should keep an outer drag scoped when it reaches a nested table', async ({
        mount,
        page,
    }) => {
        await mount(<TableCellSelectionStories.MergedAndNested />);
        const table = page.locator('.ProseMirror .g-md-yfm-table-view').nth(1);
        const cells = table.locator(':scope > tbody > tr > td');
        const inner = table.locator('table');
        await cells.first().scrollIntoViewIfNeeded();
        const first = await cells.first().boundingBox();
        const last = await inner.locator('td').last().boundingBox();
        if (!first || !last) throw new Error('Table cells must be visible');
        await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
        await page.mouse.down();
        await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, {steps: 6});
        await page.mouse.up();
        await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(2);
        await expect(inner.locator('.g-md-table-selected-cell')).toHaveCount(0);
    });

    for (const theme of ['light', 'dark'] as const) {
        test(`should match existing YFM row highlight in ${theme} theme`, async ({
            mount,
            page,
        }, testInfo) => {
            await mount(<TableCellSelectionStories.BothTables theme={theme} />);
            const table = page.locator('.ProseMirror .g-md-yfm-table-view').first();
            const cells = table.locator(':scope > tbody > tr > td');
            await cells.first().click();
            await cells.first().hover();
            await page.getByTestId('g-md-yfm-table-row-btn').first().click();
            await expect(table.locator('.g-md-yfm-table-selected-cell')).toHaveCount(4);
            const oldStyle = await selectedStyles(cells.first());
            const background = await cells.first().getAttribute('data-bg');
            await page.keyboard.press('Escape');
            await cells.first().click();
            await cells.nth(3).click({modifiers: ['Shift']});
            await expect(table.locator('.g-md-table-selected-cell')).toHaveCount(4);
            expect(await selectedStyles(cells.first())).toEqual(oldStyle);
            expect(await cells.first().getAttribute('data-bg')).toBe(background);
            await table.screenshot({path: testInfo.outputPath(`selected-table-${theme}.png`)});
        });
    }
});

async function selectedStyles(cell: Locator) {
    return cell.evaluate((element) => {
        const normal = getComputedStyle(element);
        const after = getComputedStyle(element, '::after');
        return {
            position: normal.position,
            overflow: normal.overflow,
            borderColor: normal.borderColor,
            top: after.top,
            bottom: after.bottom,
            left: after.left,
            right: after.right,
            border: after.border,
            borderRadius: after.borderRadius,
            zIndex: after.zIndex,
            pointerEvents: after.pointerEvents,
        };
    });
}

async function cellText(cell: Locator) {
    return cell.evaluate((element) => {
        const content = element.cloneNode(true) as Element;
        content
            .querySelectorAll('.g-md-placeholder')
            .forEach((placeholder) => placeholder.remove());
        return content.textContent;
    });
}

function yfmTable(page: Page) {
    return page.locator('.ProseMirror .g-md-yfm-table-view').first();
}

async function openSelectionMenu(page: Page, anchor: number, head: number) {
    const table = yfmTable(page);
    const rows = table.locator(':scope > tbody > tr');
    const cells = rows.locator(':scope > td');
    await cells.nth(anchor).click();
    await cells.nth(head).click({modifiers: ['Shift']});
    await page.getByTestId('g-md-yfm-table-selection-btn').click();
    return {rows, cells};
}

async function chooseCellBackground(page: Page, color: string) {
    await page.getByTestId('g-md-yfm-table-selection-cell-bg').hover();
    const swatch = color === 'none' ? 'none' : `color_${color}`;
    await page
        .locator(
            `.g-md-yfm-table-cell-bg-palette button:has(.g-md-yfm-table-cell-bg-palette__swatch_${swatch})`,
        )
        .click();
}

async function tableText(rows: Locator) {
    return Promise.all((await rows.all()).map((row) => cellsText(row.locator(':scope > td'))));
}

async function cellsText(cells: Locator) {
    return Promise.all((await cells.all()).map(cellText));
}

async function cellBackgrounds(cells: Locator) {
    return cells.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-bg')),
    );
}

function pointerTable(page: Page, kind: 'markdown' | 'yfm') {
    return page
        .locator(
            kind === 'markdown'
                ? '.ProseMirror table:has(> thead)'
                : '.ProseMirror .g-md-yfm-table-view',
        )
        .first();
}

async function textRect(cell: Locator) {
    await cell.scrollIntoViewIfNeeded();
    return cell.evaluate((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const text = walker.nextNode();
        if (!text) throw new Error('Cell text is missing');
        const range = document.createRange();
        range.selectNodeContents(text);
        return range.getBoundingClientRect().toJSON() as {
            left: number;
            right: number;
            top: number;
            bottom: number;
        };
    });
}
