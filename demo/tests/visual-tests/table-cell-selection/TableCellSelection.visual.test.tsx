import {expect, test} from 'playwright/core';

import {TableCellSelectionStories} from './TableCellSelection.helpers';

const mixedColorsMarkup = '#|\n|| A | B ||\n|| {red}(First) | {blue}(Second) ||\n|#';

test.describe('Table cell selection @wysiwyg', () => {
    for (const kind of ['markdown', 'yfm'] as const) {
        test(`should select across rows, clear cells and undo in a ${kind} table`, async ({
            mount,
            page,
            editor,
        }) => {
            await mount(<TableCellSelectionStories.BothTables initialMarkup={tableMarkup(kind)} />);
            const table = editor.tableCellSelection.getTable(kind);
            const cells = editor.tableCellSelection.getCells(table);
            const contents = await cells.allTextContents();

            await cells.first().click();
            await cells.nth(5).click({modifiers: ['Shift']});
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
            await expect(editor.tableCellSelection.selectionButton).toHaveCount(0);
            await expect(editor.tableCellSelection.markdownCellButton).toBeHidden();
            await expect(editor.locators.toolbars.selection).toBeHidden();
            await expect(editor.yfmTable.buttonPlusRowLocator).toHaveCount(0);
            await expect(await editor.yfmTable.getRowButtons()).toHaveCount(0);

            await page.keyboard.press('Backspace');
            await expect(cells).toHaveCount(contents.length);
            await expect.poll(() => editor.tableCellSelection.getCellText(cells.nth(0))).toBe('');
            await expect.poll(() => editor.tableCellSelection.getCellText(cells.nth(5))).toBe('');
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
            await page.keyboard.press('ControlOrMeta+z');
            await expect(cells).toHaveText(contents);
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
            await editor.tableCellSelection.clickCell(cells.first());
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
            await expect
                .poll(() => page.evaluate(() => window.getSelection()?.isCollapsed))
                .toBe(true);
        });
    }

    for (const kind of ['markdown', 'yfm'] as const) {
        for (const direction of ['forward', 'backward'] as const) {
            test(`should select one ${kind} cell only after dragging beyond all text ${direction}`, async ({
                mount,
                page,
                editor,
            }) => {
                await mount(
                    <TableCellSelectionStories.BothTables initialMarkup={tableMarkup(kind)} />,
                );
                const table = editor.tableCellSelection.getTable(kind);
                const cell = editor.tableCellSelection.getCells(table).first();
                const rect = await editor.tableCellSelection.getTextRect(cell);
                const forward = direction === 'forward';
                const start = forward ? rect.left : rect.right;
                const end = forward ? rect.right : rect.left;
                const y = (rect.top + rect.bottom) / 2;
                await page.mouse.move(start, y);
                await page.mouse.down();
                await page.mouse.move(end, y, {steps: 8});
                await expect
                    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
                    .toBe((await editor.tableCellSelection.getCellText(cell))?.trim());
                await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
                await page.mouse.move(end + (forward ? 12 : -12), y, {steps: 4});
                await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(1);
                await page.mouse.up();
            });
        }
    }

    for (const kind of ['markdown', 'yfm'] as const) {
        test(`should type a literal backtick into selected ${kind} cells`, async ({
            mount,
            page,
            editor,
        }) => {
            await mount(<TableCellSelectionStories.BothTables initialMarkup={tableMarkup(kind)} />);
            const table = editor.tableCellSelection.getTable(kind);
            const cells = editor.tableCellSelection.getCells(table);
            const contents = await cells.allTextContents();
            await cells.first().click();
            await cells.nth(5).click({modifiers: ['Shift']});
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
            await page.keyboard.press('Backquote');
            await expect.poll(() => editor.tableCellSelection.getCellText(cells.nth(5))).toBe('`');
            await expect(editor.tableCellSelection.getInlineCode(cells.nth(5))).toHaveCount(0);
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
            for (const index of [0, 1, 4])
                await expect
                    .poll(() => editor.tableCellSelection.getCellText(cells.nth(index)))
                    .toBe('');
            await page.keyboard.press('ControlOrMeta+z');
            await expect(cells).toHaveText(contents);
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
        });

        for (const empty of [false, true]) {
            test(`should type a literal backtick into one selected ${empty ? 'empty ' : ''}${kind} cell`, async ({
                mount,
                page,
                editor,
            }) => {
                const content = empty ? '' : 'word';
                const initialMarkup =
                    kind === 'markdown'
                        ? `| A | B |\n| --- | --- |\n| before | ${content} |`
                        : `#|\n|| before | ${content} ||\n|#`;
                await mount(<TableCellSelectionStories.BothTables initialMarkup={initialMarkup} />);
                const table = editor.tableCellSelection.getTable(kind);
                const cells = editor.tableCellSelection.getBodyCells(table);
                const head = cells.nth(1);
                await editor.tableCellSelection.clickCell(cells.first());
                await page.keyboard.press('Tab');
                await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(1);
                await expect(head).toHaveClass(/g-md-table-selected-cell/);
                await page.keyboard.press('Backquote');
                await expect.poll(() => editor.tableCellSelection.getCellText(head)).toBe('`');
                await expect(editor.tableCellSelection.getInlineCode(head)).toHaveCount(0);
                await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
                await expect(cells.first()).toHaveText('before');
                await page.keyboard.press('ControlOrMeta+z');
                await expect.poll(() => editor.tableCellSelection.getCellText(head)).toBe(content);
                await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(1);
                await expect(head).toHaveClass(/g-md-table-selected-cell/);
            });
        }

        test(`should enter ${kind} cell selection with Tab, navigate and resume typing`, async ({
            mount,
            page,
            editor,
        }) => {
            await mount(<TableCellSelectionStories.BothTables initialMarkup={tableMarkup(kind)} />);
            const table = editor.tableCellSelection.getTable(kind);
            const cells = editor.tableCellSelection.getCells(table);
            await editor.tableCellSelection.clickCell(cells.first());
            await page.keyboard.press('Tab');
            await expect(cells.nth(1)).toHaveClass(/g-md-table-selected-cell/);
            await cells.nth(5).click();
            await cells.first().click({modifiers: ['Shift']});
            await page.keyboard.press('Tab');
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(1);
            await expect(cells.nth(6)).toHaveClass(/g-md-table-selected-cell/);
            await page.keyboard.press('ArrowDown');
            await expect(cells.nth(10)).toHaveClass(/g-md-table-selected-cell/);
            await page.keyboard.press('Shift+ArrowLeft');
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(2);
            await page.keyboard.press('Shift+Tab');
            await expect(cells.nth(8)).toHaveClass(/g-md-table-selected-cell/);
            await page.keyboard.press('Enter');
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
            await page.keyboard.type('!');
            await expect(cells.nth(8)).toContainText('!');
        });

        test(`should preserve Codemark formatting and arrow navigation in ${kind} text`, async ({
            mount,
            page,
            editor,
        }) => {
            const initialMarkup =
                kind === 'markdown'
                    ? '| word tail | next |\n| --- | --- |\n| a | b |'
                    : '#|\n|| word tail | next ||\n|#';
            await mount(<TableCellSelectionStories.BothTables initialMarkup={initialMarkup} />);
            const table = editor.tableCellSelection.getTable(kind);
            const cell = editor.tableCellSelection.getCells(table).first();
            await editor.tableCellSelection.clickCell(cell);
            await page.keyboard.press('Home');
            for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight');
            await editor.tableCellSelection.waitForSelectedText('word');
            await page.keyboard.press('Backquote');
            await expect(editor.tableCellSelection.getInlineCode(cell)).toHaveText('word');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.type('!');
            await expect(cell).toHaveText('word !tail');
            await expect(editor.tableCellSelection.getInlineCode(cell)).toHaveText('word');
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
        });

        test(`should leave ${kind} text selection available when the feature is disabled`, async ({
            mount,
            page,
            editor,
        }) => {
            await mount(
                <TableCellSelectionStories.BothTables
                    enabled={false}
                    initialMarkup={tableMarkup(kind)}
                />,
            );
            const table = editor.tableCellSelection.getTable(kind);
            const cells = editor.tableCellSelection.getCells(table);
            await cells.first().click();
            await cells.nth(5).click({modifiers: ['Shift']});
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
            expect(
                await page.evaluate(
                    // @ts-expect-error Internal view is available in the demo.
                    () => window.mdEditor?._wysiwygView?.state.selection.toJSON().type,
                ),
            ).toBe('text');
        });

        test(`should preserve ${kind} content in read-only mode`, async ({mount, page, editor}) => {
            await mount(<TableCellSelectionStories.BothTables initialMarkup={tableMarkup(kind)} />);
            const table = editor.tableCellSelection.getTable(kind);
            const cells = editor.tableCellSelection.getCells(table);
            const contents = await cells.allTextContents();
            await page.evaluate(() =>
                // @ts-expect-error Internal view is available in the demo.
                window.mdEditor?._wysiwygView?.setProps({editable: () => false}),
            );
            await cells.first().click({clickCount: 3});
            await cells.nth(5).click({modifiers: ['Shift']});
            await page.keyboard.press('Backspace');
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
            await expect(cells).toHaveText(contents);
        });
    }

    test(`should set and toggle a uniform color across mixed yfm cells`, async ({
        mount,
        editor,
    }) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={mixedColorsMarkup} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await cells.nth(2).click();
        await cells.nth(3).click({modifiers: ['Shift']});
        await editor.clickMainToolbarButton('Text color', 'Red');
        await expect(editor.colorify.getMarks(table, 'red')).toHaveCount(2);
        await expect(editor.colorify.getMarks(table, 'blue')).toHaveCount(0);
        await editor.clickMainToolbarButton('Text color', 'Red');
        await expect(editor.colorify.getMarks(table)).toHaveCount(0);
    });

    test(`should clear mixed colors through the yfm toolbar`, async ({mount, editor}) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={mixedColorsMarkup} />);
        const cells = editor.tableCellSelection.getCells(editor.tableCellSelection.getTable('yfm'));
        await cells.nth(2).click();
        await cells.nth(3).click({modifiers: ['Shift']});
        await editor.clickMainToolbarButton('Text color', 'Default');
        await expect(editor.colorify.getMarks()).toHaveCount(0);
    });

    test('should close suggestions before navigating selected yfm cells', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<TableCellSelectionStories.BothTables initialMarkup={tableMarkup('yfm')} />);
        const table = editor.tableCellSelection.getTable('yfm');
        const cells = editor.tableCellSelection.getCells(table);
        await editor.tableCellSelection.clickCell(cells.nth(5));
        await page.keyboard.press('Home');
        await page.keyboard.press('Shift+End');
        await page.keyboard.type('/');
        await expect(editor.getCommandMenu()).toBeVisible();
        await cells.first().click({modifiers: ['Shift']});
        await expect(editor.getCommandMenu()).toBeHidden();
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
        await page.keyboard.press('Enter');
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
    });

    test('should handle native IME with a text cursor', async ({mount, page, editor}) => {
        await mount(
            <TableCellSelectionStories.BothTables initialMarkup={tableMarkup('markdown')} />,
        );
        const cell = editor.tableCellSelection
            .getBodyCells(editor.tableCellSelection.getTable('markdown'))
            .first();
        await cell.click();
        await page.keyboard.press('End');
        await editor.tableCellSelection.composeText('あい');
        await expect(cell).toHaveText('A1あい');
    });

    for (const kind of ['markdown', 'yfm'] as const) {
        for (const sameText of [false, true]) {
            test(`should replace selected ${kind} cells using native IME ${sameText ? 'with the same head text' : 'with new text'} in one undo step`, async ({
                mount,
                page,
                editor,
            }) => {
                await mount(
                    <TableCellSelectionStories.BothTables initialMarkup={tableMarkup(kind)} />,
                );
                const table = editor.tableCellSelection.getTable(kind);
                const cells = editor.tableCellSelection.getCells(table);
                const contents = await cells.allTextContents();
                const text = sameText ? contents[5] : 'あい';
                await cells.first().click();
                await cells.nth(5).click({modifiers: ['Shift']});
                await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
                await editor.tableCellSelection.composeText(text);
                for (const index of [0, 1, 4]) {
                    await expect
                        .poll(() => editor.tableCellSelection.getCellText(cells.nth(index)))
                        .toBe('');
                }
                await expect(cells.nth(5)).toHaveText(text);
                await page.keyboard.press('ControlOrMeta+z');
                await expect(cells).toHaveText(contents);
                await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
            });
        }
    }

    for (const text of ['replacement', 'Bold text plus', 'Bold text']) {
        test(`should replace cells without controls using the complete native input: ${text}`, async ({
            mount,
            page,
            editor,
        }) => {
            await mount(
                <TableCellSelectionStories.WithoutYfmControls initialMarkup={tableMarkup('yfm')} />,
            );
            const table = editor.tableCellSelection.tableWithoutControls;
            const cells = editor.tableCellSelection.getCells(table);
            const contents = await cells.allTextContents();
            await cells.first().click();
            await cells.nth(5).click({modifiers: ['Shift']});
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
            await expect(editor.tableCellSelection.selectionButton).toHaveCount(0);
            expect(
                (await editor.tableCellSelection.getSelectedStyles(cells.first())).border,
            ).toContain('1px solid');
            await page.keyboard.insertText(text);
            for (const index of [0, 1, 4]) {
                await expect
                    .poll(() => editor.tableCellSelection.getCellText(cells.nth(index)))
                    .toBe('');
            }
            await expect(cells.nth(5)).toHaveText(text);
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(0);
            await page.keyboard.press('ControlOrMeta+z');
            await expect(cells).toHaveText(contents);
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
        });
    }

    test('should select a Markdown rectangle across thead and tbody by dragging', async ({
        mount,
        editor,
    }) => {
        await mount(
            <TableCellSelectionStories.BothTables initialMarkup={tableMarkup('markdown')} />,
        );
        const table = editor.tableCellSelection.getTable('markdown');
        await editor.tableCellSelection.drag(
            editor.tableCellSelection.getCells(table).first(),
            editor.tableCellSelection.getBodyCells(table).nth(1),
        );
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
    });

    test('should keep an outer drag scoped when it reaches a nested table', async ({
        mount,
        editor,
    }) => {
        await mount(<TableCellSelectionStories.MergedAndNested />);
        const table = editor.tableCellSelection.getTable('yfm', 1);
        const cells = editor.tableCellSelection.getCells(table);
        const inner = editor.tableCellSelection.getNestedTable(table);
        await editor.tableCellSelection.drag(
            cells.first(),
            editor.tableCellSelection.getBodyCells(inner).last(),
        );
        await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(2);
        await expect(editor.tableCellSelection.getSelectedCells(inner)).toHaveCount(0);
    });

    for (const theme of ['light', 'dark'] as const) {
        test(`should match existing YFM row highlight in ${theme} theme`, async ({
            mount,
            page,
            editor,
            expectScreenshot,
        }) => {
            await page.setViewportSize({width: 360, height: 300});
            await page.emulateMedia({colorScheme: theme});
            await mount(
                <TableCellSelectionStories.BothTables
                    viewWidth={320}
                    initialMarkup={
                        '#|\n||::{bg="yellow"} A | B | C | D ||\n|| E | F | G | H ||\n|#'
                    }
                />,
            );
            await expect(page.locator('body')).toHaveClass(new RegExp(`g-root_theme_${theme}`));
            const table = editor.tableCellSelection.getTable('yfm');
            const cells = editor.tableCellSelection.getCells(table);
            await cells.first().click();
            await cells.first().hover();
            await (await editor.yfmTable.getRowButtons()).first().click();
            await expect(editor.yfmTable.getSelectedCells(table)).toHaveCount(4);
            const oldStyle = await editor.tableCellSelection.getSelectedStyles(cells.first());
            const background = await cells.first().getAttribute('data-bg');
            await page.keyboard.press('Escape');
            await cells.first().click();
            await cells.nth(3).click({modifiers: ['Shift']});
            await expect(editor.tableCellSelection.getSelectedCells(table)).toHaveCount(4);
            expect(await editor.tableCellSelection.getSelectedStyles(cells.first())).toEqual(
                oldStyle,
            );
            expect(await cells.first().getAttribute('data-bg')).toBe(background);
            await expectScreenshot({component: editor.tableCellSelection.editor, themes: [theme]});
        });
    }
});

function tableMarkup(kind: 'markdown' | 'yfm') {
    return kind === 'markdown'
        ? `| Header A | Header B | Header C | Header D |
| :--- | :---: | ---: | --- |
| A1 | B1 | C1 | D1 |
| A2 | B2 | C2 | D2 |`
        : `#|
||::{bg="yellow"} A1 | B1 | C1 | D1 ||
|| A2 | **Bold text** | C2 | D2 ||
|| A3 | B3 | C3 | D3 ||
|#`;
}
