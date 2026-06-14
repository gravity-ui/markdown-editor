import type {YfmMods} from '@gravity-ui/markdown-editor';
import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('YfmTable', () => {
    test.describe('insert', () => {
        test.beforeEach(async ({mount}) => {
            await mount(<Playground initial="" />);
        });

        test('should insert via toolbar in @wysiwyg mode', async ({
            page,
            wait,
            editor,
            expectScreenshot,
        }) => {
            const tableLocator = editor.getBySelectorInContenteditable(
                await editor.yfmTable.getTable(),
            );

            await editor.switchMode('wysiwyg');

            await editor.clickAdditionalToolbarButton('Table');
            await wait.timeout();

            await tableLocator.waitFor({state: 'visible'});

            await editor.assertAdditionalToolbarButtonEnabled('Table');
            await editor.hideToolbarMoreMenu();

            await page.mouse.move(-50, -50);

            await expect(tableLocator).toHaveCount(1);
            await wait.timeout(500); //waiting for changes in .playground__markup
            await expectScreenshot();
        });

        test('should insert via toolbar in @markup mode', async ({
            page,
            editor,
            expectScreenshot,
            wait,
        }) => {
            await editor.switchMode('markup');

            await editor.clickAdditionalToolbarButton('Table');
            await wait.timeout();

            await editor.assertAdditionalToolbarButtonEnabled('Table');
            await editor.hideToolbarMoreMenu();

            await page.mouse.move(-50, -50);

            await expectScreenshot();
        });

        test('should insert via command menu in @wysiwyg mode', async ({
            page,
            wait,
            editor,
            expectScreenshot,
        }) => {
            const tableLocator = editor.getBySelectorInContenteditable(
                await editor.yfmTable.getTable(),
            );

            await editor.switchMode('wysiwyg');

            await editor.selectFromCommandMenu('tab', 'Table');

            await page.mouse.move(-50, -50);

            await tableLocator.waitFor({state: 'visible'});
            await expect(tableLocator).toHaveCount(1);
            await wait.timeout(500); //waiting for changes in .playground__markup
            await expectScreenshot();
        });
    });

    test('should move focus to the adjacent cell @wysiwyg', async ({
        mount,
        page,
        editor,
        browserName,
        platform,
    }) => {
        test.skip(browserName === 'webkit' && platform === 'linux', 'dont work in webkit at linux');

        const initial = dd`
        #|
        || one   | two  ||
        || three | four ||
        |#
        `;

        await mount(<Playground initial={initial} />);

        const tableLocator = (
            await editor.yfmTable.getTable(editor.locators.contenteditable)
        ).first();
        await editor.yfmTable.focusFirstCell(tableLocator);

        await page.keyboard.press('Tab');
        let selText = await page.evaluate(getSelText);
        expect(selText).toBe('two');

        await page.keyboard.press('Tab');
        selText = await page.evaluate(getSelText);
        expect(selText).toBe('three');

        await page.keyboard.press('Tab');
        selText = await page.evaluate(getSelText);
        expect(selText).toBe('four');

        await page.keyboard.press('Shift+Tab');
        selText = await page.evaluate(getSelText);
        expect(selText).toBe('three');

        await page.keyboard.press('Shift+Tab');
        selText = await page.evaluate(getSelText);
        expect(selText).toBe('two');

        await page.keyboard.press('Shift+Tab');
        selText = await page.evaluate(getSelText);
        expect(selText).toBe('one');

        function getSelText() {
            return document.getSelection()?.toString();
        }
    });

    test('should show floating plus buttons only if table is focused @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        const initial = dd`
        zero

        #|
        || one   | two  ||
        || three | four ||
        |#
        `;

        await mount(<Playground initial={initial} />);

        const rowPlusBtn = editor.yfmTable.buttonPlusRowLocator;
        const columnPlusBtn = editor.yfmTable.buttonPlusColumnLocator;

        await expect(rowPlusBtn).toBeHidden();
        await expect(columnPlusBtn).toBeHidden();

        await page.keyboard.press('ArrowDown');

        for (const loc of [...(await rowPlusBtn.all()), ...(await columnPlusBtn.all())]) {
            await expect(loc).toBeVisible();
        }
    });

    test('should add row via click on floating plus button @wysiwyg', async ({
        page,
        wait,
        mount,
        editor,
        expectScreenshot,
    }) => {
        const initial = dd`
        #|
        || one   | two  ||
        || three | four ||
        |#
        `;

        await mount(<Playground initial={initial} />);

        const tableLocator = (
            await editor.yfmTable.getTable(editor.locators.contenteditable)
        ).first();
        const rowsLocator = await editor.yfmTable.getRows(tableLocator);
        const cellsLocator = await editor.yfmTable.getCells(tableLocator);

        await editor.yfmTable.focusFirstCell(tableLocator);

        await editor.yfmTable.clickPlusRow(tableLocator);
        await expect(rowsLocator).toHaveCount(3);
        await expect(cellsLocator).toHaveCount(6);

        await editor.yfmTable.clickPlusRow(tableLocator);
        await expect(rowsLocator).toHaveCount(4);
        await expect(cellsLocator).toHaveCount(8);

        await editor.focus();
        await page.keyboard.press('Escape');
        await editor.blur();

        await page.mouse.move(-50, -50);
        await wait.timeout(500); //waiting for changes in .playground__markup
        await expectScreenshot();
    });

    test('should add column via click on floating plus button @wysiwyg', async ({
        page,
        wait,
        mount,
        editor,
        expectScreenshot,
    }) => {
        const initial = dd`
        #|
        || one   | two  ||
        || three | four ||
        |#
        `;

        await mount(<Playground initial={initial} />);

        const tableLocator = (
            await editor.yfmTable.getTable(editor.locators.contenteditable)
        ).first();
        const rowsLocator = await editor.yfmTable.getRows(tableLocator);
        const cellsLocator = await editor.yfmTable.getCells(tableLocator);

        await editor.yfmTable.focusFirstCell(tableLocator);

        await editor.yfmTable.clickPlusColumn(tableLocator);
        await expect(rowsLocator).toHaveCount(2);
        await expect(cellsLocator).toHaveCount(6);

        await editor.yfmTable.clickPlusColumn(tableLocator);
        await expect(rowsLocator).toHaveCount(2);
        await expect(cellsLocator).toHaveCount(8);

        await editor.focus();
        await page.keyboard.press('Escape');
        await editor.blur();

        await page.mouse.move(-50, -50);
        await wait.timeout(500); //waiting for changes in .playground__markup
        await expectScreenshot();
    });

    test.skip('should show menu buttons only for current cell @wysiwyg', async ({
        mount,
        wait,
        page,
        editor,
    }) => {
        const initial = dd`
        #|
        || one   | two   | three ||
        || four  | five  | six   ||
        || seven | eight | nine  ||
        |#
        `;

        await mount(<Playground initial={initial} />);

        const tableLocator = (
            await editor.yfmTable.getTable(editor.locators.contenteditable)
        ).first();
        const cellsLocator = await editor.yfmTable.getCells(tableLocator);

        const rowButtons = await editor.yfmTable.getRowButtons();
        const columnButtons = await editor.yfmTable.getColumnButtons();

        await page.mouse.move(-50, -50);
        await wait.timeout(100);

        await expectRowButtonsIsHidden(-1);
        await expectColumnButtonsIsHidden(-1);

        await cellsLocator.first().hover();
        await rowButtons.first().waitFor({state: 'visible'});
        await columnButtons.first().waitFor({state: 'visible'});
        await expectRowButtonsIsHidden(0);
        await expectColumnButtonsIsHidden(0);

        await cellsLocator.nth(4).hover(); // fifth cell
        await rowButtons.nth(1).waitFor({state: 'visible'});
        await columnButtons.nth(1).waitFor({state: 'visible'});
        await expectRowButtonsIsHidden(1);
        await expectColumnButtonsIsHidden(1);

        await cellsLocator.last().hover();
        await rowButtons.last().waitFor({state: 'visible'});
        await columnButtons.last().waitFor({state: 'visible'});
        await expectRowButtonsIsHidden(2);
        await expectColumnButtonsIsHidden(2);

        async function expectRowButtonsIsHidden(exclude: number) {
            const all = await rowButtons.all();
            for (let i = 0; i < all.length; i++) {
                if (i !== exclude) await expect(all[i]).toBeHidden();
            }
        }

        async function expectColumnButtonsIsHidden(exclude: number) {
            const all = await columnButtons.all();
            for (let i = 0; i < all.length; i++) {
                if (i !== exclude) await expect(all[i]).toBeHidden();
            }
        }
    });

    test.describe('cell menu @wysiwyg', () => {
        test.beforeEach(async ({mount, editor}) => {
            const initial = dd`
            #|
            || one   | two  ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();

            await tableLocator.waitFor({state: 'visible'});
            await editor.yfmTable.focusFirstCell(tableLocator);
        });

        test('row menu', async ({editor, expectScreenshot}) => {
            await (await editor.yfmTable.getCells()).first().hover();
            const rowButton = (await editor.yfmTable.getRowButtons()).first();
            await rowButton.waitFor({state: 'visible'});
            await rowButton.click();

            const menu = editor.yfmTable.getMenuLocator('row');
            await menu.waitFor({state: 'visible'});

            await expectScreenshot({component: menu});
        });

        test('column menu', async ({editor, expectScreenshot}) => {
            await (await editor.yfmTable.getCells()).first().hover();
            const columnButton = (await editor.yfmTable.getColumnButtons()).first();
            await columnButton.waitFor({state: 'visible'});
            await columnButton.click();

            const menu = editor.yfmTable.getMenuLocator('column');
            await menu.waitFor({state: 'visible'});
            await expectScreenshot({component: menu});
        });

        test('should remove table', async ({editor}) => {
            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const firstCell = (await editor.yfmTable.getCells(tableLocator)).first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'remove-table');

            await tableLocator.waitFor({state: 'detached'});
        });

        test('should remove first row', async ({editor}) => {
            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'remove-row');

            await expect(rowsLocator).toHaveCount(1);
            await expect(cellsLocator).toHaveCount(2);
            expect(prepareTexts(await cellsLocator.allInnerTexts())).toStrictEqual([
                'three',
                'four',
            ]);
        });

        test('should add row before first', async ({editor}) => {
            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'add-row-before');

            await expect(rowsLocator).toHaveCount(3);
            await expect(cellsLocator).toHaveCount(6);
            expect(prepareTexts(await cellsLocator.allInnerTexts())).toStrictEqual([
                'Cell content',
                'Cell content',
                'one',
                'two',
                'three',
                'four',
            ]);
        });

        test('should add row after first', async ({editor}) => {
            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'add-row-after');

            await expect(rowsLocator).toHaveCount(3);
            await expect(cellsLocator).toHaveCount(6);
            expect(prepareTexts(await cellsLocator.allInnerTexts())).toStrictEqual([
                'one',
                'two',
                'Cell content',
                'Cell content',
                'three',
                'four',
            ]);
        });

        test('should remove first column', async ({editor}) => {
            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const collumnButton = (await editor.yfmTable.getColumnButtons(tableLocator)).first();

            await firstCell.hover();
            await collumnButton.click();
            await editor.yfmTable.doCellAction('column', 'remove-column');

            await expect(rowsLocator).toHaveCount(2);
            await expect(cellsLocator).toHaveCount(2);
            expect(prepareTexts(await cellsLocator.allInnerTexts())).toStrictEqual(['two', 'four']);
        });

        test('should add column before first', async ({editor}) => {
            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const collumnButton = (await editor.yfmTable.getColumnButtons(tableLocator)).first();

            await firstCell.hover();
            await collumnButton.click();
            await editor.yfmTable.doCellAction('column', 'add-column-before');

            await expect(rowsLocator).toHaveCount(2);
            await expect(cellsLocator).toHaveCount(6);
            expect(prepareTexts(await cellsLocator.allInnerTexts())).toStrictEqual([
                'Cell content',
                'one',
                'two',
                'Cell content',
                'three',
                'four',
            ]);
        });

        test('should add column after first', async ({editor}) => {
            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const collumnButton = (await editor.yfmTable.getColumnButtons(tableLocator)).first();

            await firstCell.hover();
            await collumnButton.click();
            await editor.yfmTable.doCellAction('column', 'add-column-after');

            await expect(rowsLocator).toHaveCount(2);
            await expect(cellsLocator).toHaveCount(6);
            expect(prepareTexts(await cellsLocator.allInnerTexts())).toStrictEqual([
                'one',
                'Cell content',
                'two',
                'three',
                'Cell content',
                'four',
            ]);
        });

        /**
         * chromium and webkit have different number of \n at the end of text
         */
        function prepareTexts(texts: readonly string[]): string[] {
            return texts.map((str) => str.trimEnd());
        }
    });

    test.describe('header rows @wysiwyg', () => {
        const yfmMods: YfmMods = {'no-stripe-table': true};

        test('should set header on the first row', async ({
            page,
            wait,
            mount,
            editor,
            expectScreenshot,
        }) => {
            const initial = dd`
            #|
            || one   | two  ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'header-toggle');

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).not.toHaveAttribute('data-header', 'true');

            await editor.focus();
            await page.keyboard.press('Escape');
            await editor.blur();

            await page.mouse.move(-50, -50);
            await wait.timeout(500);
            await expectScreenshot();
        });

        test('should unset header on the first row', async ({
            page,
            wait,
            mount,
            editor,
            expectScreenshot,
        }) => {
            const initial = dd`
            #|
            |:{header-rows="1"}
            || one   | two  ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'header-toggle');

            await expect(rowsLocator.nth(0)).not.toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).not.toHaveAttribute('data-header', 'true');

            await editor.focus();
            await page.keyboard.press('Escape');
            await editor.blur();

            await page.mouse.move(-50, -50);
            await wait.timeout(500);
            await expectScreenshot();
        });

        test('should make 2nd row a header when rowspan from row 0 covers row 1', async ({
            wait,
            mount,
            editor,
        }) => {
            const initial = dd`
            #|
            |:{header-rows="1"}
            || one   | two ||
            || three | ^   ||
            || five  | six ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).not.toHaveAttribute('data-header', 'true');

            await editor.yfmTable.focusFirstCell(tableLocator);

            // hover the first cell of row 1 (column 0)
            await cellsLocator.nth(2).hover();
            await wait.timeout(200);
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'header-toggle');

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(2)).not.toHaveAttribute('data-header', 'true');
        });

        test('should make all rows header when first cell rowspan covers entire table', async ({
            page,
            wait,
            mount,
            editor,
            expectScreenshot,
        }) => {
            const initial = dd`
            #|
            || one | two  ||
            || ^   | four ||
            || ^   | six  ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'header-toggle');

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(2)).toHaveAttribute('data-header', 'true');

            await editor.focus();
            await page.keyboard.press('Escape');
            await editor.blur();

            await page.mouse.move(-50, -50);
            await wait.timeout(500);
            await expectScreenshot();
        });

        test('should unset header for current and all subsequent header rows', async ({
            wait,
            mount,
            editor,
        }) => {
            const initial = dd`
            #|
            |:{header-rows="3"}
            || one   | two   ||
            || three | four  ||
            || five  | six   ||
            || seven | eight ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();
            const rowMenu = editor.yfmTable.getMenuLocator('row');
            const headerToggle = editor.yfmTable.getCellActionLocator('row', 'header-toggle');

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(2)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(3)).not.toHaveAttribute('data-header', 'true');

            await editor.yfmTable.focusFirstCell(tableLocator);

            // open row menu of row 1 (first cell of row 1 is the 3rd cell overall)
            await cellsLocator.nth(2).hover();
            await wait.timeout(200);
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'header-toggle');

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).not.toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(2)).not.toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(3)).not.toHaveAttribute('data-header', 'true');

            // re-open row menu of row 1 — header toggle should be hidden now
            await cellsLocator.nth(2).hover();
            await wait.timeout(200);
            await rowButton.click();
            await rowMenu.waitFor({state: 'visible'});
            await expect(headerToggle).toBeHidden();
        });

        test('should shrink header-rows block when inserting a row inside it', async ({
            wait,
            mount,
            editor,
        }) => {
            const initial = dd`
            #|
            |:{header-rows="3"}
            || one   | two   ||
            || three | four  ||
            || five  | six   ||
            || seven | eight ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(2)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(3)).not.toHaveAttribute('data-header', 'true');

            await editor.yfmTable.focusFirstCell(tableLocator);

            // open row menu of row 1 (first cell of row 1 is the 3rd cell overall)
            await cellsLocator.nth(2).hover();
            await wait.timeout(200);
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'add-row-before');

            await expect(rowsLocator).toHaveCount(5);
            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).not.toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(2)).not.toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(3)).not.toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(4)).not.toHaveAttribute('data-header', 'true');
        });

        test('should decrease header-rows count by the number of removed header rows', async ({
            wait,
            mount,
            editor,
        }) => {
            const initial = dd`
            #|
            |:{header-rows="3"}
            || one   | two   ||
            || three | four  ||
            || ^     | six   ||
            || seven | eight ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const rowsLocator = await editor.yfmTable.getRows(tableLocator);
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(2)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(3)).not.toHaveAttribute('data-header', 'true');

            await editor.yfmTable.focusFirstCell(tableLocator);

            // Open row menu of row 2 (first cell of row 2 is the 3rd cell overall)
            await cellsLocator.nth(2).hover();
            await wait.timeout(200);
            await rowButton.click();
            await editor.yfmTable.doCellAction('row', 'remove-row');

            await expect(rowsLocator).toHaveCount(2);
            await expect(rowsLocator.nth(0)).toHaveAttribute('data-header', 'true');
            await expect(rowsLocator.nth(1)).not.toHaveAttribute('data-header', 'true');
        });
    });

    test.describe('cell background @wysiwyg', () => {
        const yfmMods: YfmMods = {'no-stripe-table': true};

        test('should set background color on a row', async ({
            page,
            wait,
            mount,
            editor,
            expectScreenshot,
        }) => {
            const initial = dd`
            #|
            || one   | two  ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.selectCellBg('row', 'Yellow');

            await expect(cellsLocator.nth(0)).toHaveAttribute('data-bg', 'yellow');
            await expect(cellsLocator.nth(1)).toHaveAttribute('data-bg', 'yellow');
            await expect(cellsLocator.nth(2)).not.toHaveAttribute('data-bg');
            await expect(cellsLocator.nth(3)).not.toHaveAttribute('data-bg');

            await editor.yfmTable.closeMenu('row');

            await page.mouse.move(-50, -50);
            await wait.timeout(500);
            await expectScreenshot();
        });

        test('should set background color on a column', async ({
            page,
            wait,
            mount,
            editor,
            expectScreenshot,
        }) => {
            const initial = dd`
            #|
            || one   | two  ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const columnButton = (await editor.yfmTable.getColumnButtons(tableLocator)).first();

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await columnButton.click();
            await editor.yfmTable.selectCellBg('column', 'Blue');

            await expect(cellsLocator.nth(0)).toHaveAttribute('data-bg', 'blue');
            await expect(cellsLocator.nth(2)).toHaveAttribute('data-bg', 'blue');
            await expect(cellsLocator.nth(1)).not.toHaveAttribute('data-bg');
            await expect(cellsLocator.nth(3)).not.toHaveAttribute('data-bg');

            await editor.yfmTable.closeMenu('column');

            await page.mouse.move(-50, -50);
            await wait.timeout(500);
            await expectScreenshot();
        });

        test('should clear background color via No color', async ({mount, editor}) => {
            const initial = dd`
            #|
            ||::{bg="red"}

            one

            | two ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await expect(firstCell).toHaveAttribute('data-bg', 'red');

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.selectCellBg('row', 'No color');

            await expect(cellsLocator.nth(0)).not.toHaveAttribute('data-bg');
            await expect(cellsLocator.nth(1)).not.toHaveAttribute('data-bg');
        });

        test('should overwrite background color on second selection', async ({mount, editor}) => {
            const initial = dd`
            #|
            || one   | two  ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.selectCellBg('row', 'Yellow');
            await editor.yfmTable.closeMenu('row');

            await expect(cellsLocator.nth(0)).toHaveAttribute('data-bg', 'yellow');

            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.selectCellBg('row', 'Green');

            await expect(cellsLocator.nth(0)).not.toHaveClass(/cell-bg-yellow/);
            await expect(cellsLocator.nth(0)).toHaveAttribute('data-bg', 'green');
            await expect(cellsLocator.nth(1)).toHaveAttribute('data-bg', 'green');
        });

        test('should apply column color independently from row color', async ({
            page,
            wait,
            mount,
            editor,
            expectScreenshot,
        }) => {
            const initial = dd`
            #|
            || a | b | c ||
            || d | e | f ||
            || g | h | i ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();
            const columnButton = (await editor.yfmTable.getColumnButtons(tableLocator)).first();

            await editor.yfmTable.focusFirstCell(tableLocator);

            // Paint first row yellow-light
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.selectCellBg('row', 'Light yellow');
            await editor.yfmTable.closeMenu('row');

            // Paint first column blue-light (overwrites cell[0][0])
            await firstCell.hover();
            await columnButton.click();
            await editor.yfmTable.selectCellBg('column', 'Light blue');

            // cell[0][0] — overwritten to blue-light
            await expect(cellsLocator.nth(0)).toHaveAttribute('data-bg', 'blue-light');
            // cell[0][1] and [0][2] — still yellow-light from row paint
            await expect(cellsLocator.nth(1)).toHaveAttribute('data-bg', 'yellow-light');
            await expect(cellsLocator.nth(2)).toHaveAttribute('data-bg', 'yellow-light');
            // cell[1][0] and [2][0] — blue-light from column paint
            await expect(cellsLocator.nth(3)).toHaveAttribute('data-bg', 'blue-light');
            await expect(cellsLocator.nth(6)).toHaveAttribute('data-bg', 'blue-light');

            await editor.yfmTable.closeMenu('column');

            await page.mouse.move(-50, -50);
            await wait.timeout(500);
            await expectScreenshot();
        });

        test('should persist background color in markdown markup', async ({
            wait,
            mount,
            editor,
            page,
        }) => {
            const initial = dd`
            #|
            || one   | two  ||
            || three | four ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);
            const firstCell = cellsLocator.first();
            const rowButton = (await editor.yfmTable.getRowButtons(tableLocator)).first();

            await editor.yfmTable.focusFirstCell(tableLocator);
            await firstCell.hover();
            await rowButton.click();
            await editor.yfmTable.selectCellBg('row', 'Red');
            await editor.yfmTable.closeMenu('row');

            await wait.timeout(500);

            const markupText = await page.locator('.playground__markup').textContent();
            expect(markupText).toContain('::{bg="red"}');
        });

        test('should render preloaded background colors from markdown', async ({
            page,
            wait,
            mount,
            editor,
            expectScreenshot,
        }) => {
            const initial = dd`
            #|
            ||

            No color

            |::{bg="yellow-light"}

            Light yellow

            |::{bg="red-light"}

            Light red

            |::{bg="purple-light"}

            Light purple

            |::{bg="blue-light"}

            Light blue

            |::{bg="green-light"}

            Light green

            ||
            ||::{bg="grey"}

            Grey

            |::{bg="yellow"}

            Yellow

            |::{bg="red"}

            Red

            |::{bg="purple"}

            Purple

            |::{bg="blue"}

            Blue

            |::{bg="green"}

            Green

            ||
            |#
            `;

            await mount(<Playground initial={initial} yfmMods={yfmMods} />);

            const tableLocator = (
                await editor.yfmTable.getTable(editor.locators.contenteditable)
            ).first();
            const cellsLocator = await editor.yfmTable.getCells(tableLocator);

            await expect(cellsLocator.nth(0)).not.toHaveAttribute('data-bg');
            await expect(cellsLocator.nth(1)).toHaveAttribute('data-bg', 'yellow-light');
            await expect(cellsLocator.nth(2)).toHaveAttribute('data-bg', 'red-light');
            await expect(cellsLocator.nth(3)).toHaveAttribute('data-bg', 'purple-light');
            await expect(cellsLocator.nth(4)).toHaveAttribute('data-bg', 'blue-light');
            await expect(cellsLocator.nth(5)).toHaveAttribute('data-bg', 'green-light');
            await expect(cellsLocator.nth(6)).toHaveAttribute('data-bg', 'grey');
            await expect(cellsLocator.nth(7)).toHaveAttribute('data-bg', 'yellow');
            await expect(cellsLocator.nth(8)).toHaveAttribute('data-bg', 'red');
            await expect(cellsLocator.nth(9)).toHaveAttribute('data-bg', 'purple');
            await expect(cellsLocator.nth(10)).toHaveAttribute('data-bg', 'blue');
            await expect(cellsLocator.nth(11)).toHaveAttribute('data-bg', 'green');

            await page.mouse.move(-50, -50);
            await wait.timeout(500);
            await expectScreenshot();
        });
    });
});
