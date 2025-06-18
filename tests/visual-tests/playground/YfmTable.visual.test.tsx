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

    test('should show plus buttons only if table is focused @wysiwyg', async ({
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

        const table = editor.getBySelectorInContenteditable(await editor.yfmTable.getTable());
        const rowPlusBtn = table.locator(editor.yfmTable.buttonPlusRowLocator);
        const columnPlusBtn = table.locator(editor.yfmTable.buttonPlusColumnLocator);

        await expect(rowPlusBtn).toBeHidden();
        await expect(columnPlusBtn).toBeHidden();

        await page.keyboard.press('ArrowDown');

        await expect(rowPlusBtn).toBeVisible();
        await expect(columnPlusBtn).toBeVisible();
    });

    test('should add row via click on horizontal plus button @wysiwyg', async ({
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

    test('should add column via click on vertical plus button @wysiwyg', async ({
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

    test('should show menu buttons only for current cell @wysiwyg', async ({
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
        });

        // TODO: Error: locator.screenshot: Element is not attached to the DOM
        test.skip('row menu', async ({editor, expectScreenshot}) => {
            await (await editor.yfmTable.getCells()).first().hover();
            await (await editor.yfmTable.getRowButtons()).first().click();

            const menu = editor.yfmTable.getMenuLocator('row');
            await menu.waitFor({state: 'visible'});

            await expectScreenshot({component: menu});
        });

        // TODO: Error: locator.screenshot: Element is not attached to the DOM
        test.skip('column menu', async ({editor, expectScreenshot}) => {
            await (await editor.yfmTable.getCells()).first().hover();
            await (await editor.yfmTable.getColumnButtons()).first().click();

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
});
