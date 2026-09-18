import type {Locator} from '@playwright/test';

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
