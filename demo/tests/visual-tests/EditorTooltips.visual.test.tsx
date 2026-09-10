import {expect, test} from 'playwright/core';

import {EditorTooltips} from './EditorTooltips.helpers';

test.describe('Editor tooltips', () => {
    test.beforeEach(async ({mount, page}) => {
        await mount(<EditorTooltips />);
        // Language definitions load asynchronously; wait before opening the toolbar.
        await expect(page.locator('pre [class*="hljs-"]').first()).toBeVisible();
    });

    test('keep nested menus anchored during text selection', async ({page}) => {
        const note = page.locator('.ProseMirror .yfm-note');
        const code = note.locator('pre');
        await expect(code).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        const box = await code.locator('code > div').evaluate((element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const {x, y, height} = range.getBoundingClientRect();
            return {x, y, height};
        });

        for (let attempt = 0; attempt < 2; attempt += 1) {
            const capture = await note.evaluateHandle((element) => {
                const originalCode = element.querySelector('pre');
                const unexpectedFallbacks: string[] = [];
                const observer = new MutationObserver((records) => {
                    for (const record of records) {
                        for (const node of Array.from(record.addedNodes)) {
                            if (
                                node instanceof HTMLElement &&
                                node.matches('span[tabindex="-1"][aria-hidden="true"]')
                            ) {
                                unexpectedFallbacks.push(node.outerHTML);
                            }
                        }
                    }
                });
                // Observe before the first pointer interaction, including mutations between frames.
                const editor = element.closest('.ProseMirror');
                if (!editor) throw new Error('Editor root not found');
                observer.observe(editor, {
                    childList: true,
                    subtree: true,
                });
                const snapshots: {connected: boolean | undefined; positions: number[]}[] = [];
                let frameId: number;
                const sample = () => {
                    snapshots.push({
                        connected: element.isConnected && originalCode?.isConnected,
                        positions: Array.from(document.querySelectorAll('.g-md-base-tooltip'))
                            .filter((tooltip) =>
                                tooltip.checkVisibility({
                                    opacityProperty: true,
                                    visibilityProperty: true,
                                }),
                            )
                            .map((tooltip) => tooltip.getBoundingClientRect().x),
                    });
                    frameId = requestAnimationFrame(sample);
                };
                sample();
                return {
                    stop: () => {
                        cancelAnimationFrame(frameId);
                        observer.disconnect();
                        return {snapshots, unexpectedFallbacks};
                    },
                };
            });

            await page.mouse.move(box.x + 5, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + 180, box.y + box.height / 2, {steps: 30});
            await page.mouse.up();
            // The observation window includes the entire gesture and popup transitions.
            await expect(page.locator('.g-md-base-tooltip')).toHaveCount(2);
            await page
                .locator('.g-md-code-block-toolbar')
                .getByRole('combobox')
                .click({trial: true});
            await page
                .getByTestId('g-md-toolbar-yfm-note')
                .getByRole('button')
                .first()
                .click({trial: true});
            await page.evaluate(() => new Promise(requestAnimationFrame));

            const {snapshots, unexpectedFallbacks} = await capture.evaluate(({stop}) => stop());
            await capture.dispose();
            expect(unexpectedFallbacks).toEqual([]);
            expect(snapshots.every(({connected}) => connected)).toBe(true);
            expect(snapshots.some(({positions}) => positions.length === 2)).toBe(true);
            expect(snapshots.every(({positions}) => positions.every((x) => x > 0))).toBe(true);
            expect(await page.evaluate(() => document.getSelection()?.toString())).not.toBe('');
        }

        await expect
            .poll(() =>
                page.evaluate(() =>
                    [
                        ['.g-md-code-block-toolbar', '.ProseMirror pre'],
                        ['.g-md-yfm-note-toolbar', '.ProseMirror .yfm-note'],
                    ].map(([menuSelector, anchorSelector]) => {
                        const menu = document
                            .querySelector(menuSelector)
                            ?.closest('[data-floating-ui-placement]');
                        const anchor = document.querySelector(anchorSelector);
                        if (!menu || !anchor) return false;
                        const rect = menu.getBoundingClientRect();
                        const anchorRect = anchor.getBoundingClientRect();
                        const gap = menu
                            .getAttribute('data-floating-ui-placement')
                            ?.startsWith('top')
                            ? anchorRect.top - rect.bottom
                            : rect.top - anchorRect.bottom;
                        const centerX = rect.x + rect.width / 2;
                        const hit = document.elementFromPoint(centerX, rect.y + rect.height / 2);
                        return (
                            Math.abs(centerX - (anchorRect.x + anchorRect.width / 2)) < 1 &&
                            Math.abs(gap - 4) < 1 &&
                            menu.contains(hit)
                        );
                    }),
                ),
            )
            .toEqual([true, true]);

        const outside = page.getByRole('button', {name: 'After editor'});
        await outside.click();
        await expect(outside).toBeFocused();
        await expect(page.locator('.g-md-base-tooltip')).toHaveCount(0);
        await expect(code).toHaveText('Select this text inside the code block');
    });

    test('returns focus after Escape in the language selector', async ({page}) => {
        await page.locator('.ProseMirror pre').click();
        const select = page.getByRole('combobox');
        await select.click();
        await expect(page.getByRole('listbox')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('listbox')).toBeHidden();
        await expect(select).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', {name: 'Line numbers'})).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(select).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.locator('.g-md-code-block-toolbar')).toBeHidden();
        await expect(page.locator('.ProseMirror')).toBeFocused();
    });

    for (const block of [
        {name: 'code', selector: 'pre', action: 'code-block-remove'},
        {name: 'note', selector: '.yfm-note', action: 'note-remove'},
    ]) {
        test(`keeps editing after removing the ${block.name} block`, async ({page}) => {
            const editor = page.locator('.ProseMirror');
            const node = editor.locator(block.selector);
            await editor.locator('pre').click();
            await page.locator(`[data-toolbar-item="${block.action}"]`).click();
            await expect(node).toHaveCount(0);
            await expect(editor).toBeFocused();
            await page.keyboard.type('Continue editing');
            await expect(editor).toContainText('Continue editing');
        });
    }
});

test('Editor tooltips follow a different block and scrolling', async ({mount, page}) => {
    await mount(<EditorTooltips markup={'```js\nthis.first\n```\n\n```js\nthis.second\n```'} />, {
        rootStyle: {minHeight: 1200},
    });
    await expect(page.locator('pre [class*="hljs-"]').first()).toBeVisible();
    const blocks = page.locator('.ProseMirror pre');
    const menu = page.locator('.g-md-code-block-toolbar');

    for (const index of [0, 1, 0]) {
        await blocks.nth(index).click();
        await expect(menu).toBeVisible();
        const scrollY = await page.evaluate(() => window.scrollY);
        await page.mouse.wheel(0, 20);
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY + 20);
        await expect
            .poll(async () => {
                const anchor = await blocks.nth(index).boundingBox();
                const popup = await menu
                    .locator('xpath=ancestor::*[@data-floating-ui-placement]')
                    .boundingBox();
                if (!anchor || !popup) return Infinity;
                return Math.abs(popup.y - (anchor.y + anchor.height) - 4);
            })
            .toBeLessThan(2);
    }
});

test('Editor tooltips keep markdown table menus outside the document', async ({mount, page}) => {
    await mount(<EditorTooltips markup={'| Header | Other |\n| --- | --- |\n| Body | Cell |'} />, {
        rootStyle: {minHeight: 1200},
    });
    const editor = page.locator('.ProseMirror');
    const capture = await editor.evaluateHandle((root) => {
        const table = root.querySelector('table');
        const cells = Array.from(root.querySelectorAll('td, th'));
        const unexpectedFallbacks: string[] = [];
        const observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const node of Array.from(record.addedNodes)) {
                    if (
                        node instanceof HTMLElement &&
                        node.matches('span[tabindex="-1"][aria-hidden="true"]')
                    ) {
                        unexpectedFallbacks.push(node.outerHTML);
                    }
                }
            }
        });
        observer.observe(root, {subtree: true, childList: true});
        return {
            connected: () => Boolean(table?.isConnected) && cells.every((cell) => cell.isConnected),
            stop: () => {
                observer.disconnect();
                return unexpectedFallbacks;
            },
        };
    });
    const switcher = page.locator('.table-cell-floating-button');
    for (const text of ['Body', 'Cell', 'Body']) {
        await editor.getByText(text, {exact: true}).click();
        await expect(switcher).toBeVisible();
        const scrollY = await page.evaluate(() => window.scrollY);
        await page.mouse.wheel(0, 20);
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY + 20);
        await expect
            .poll(async () => {
                const cell = await editor.locator('td').filter({hasText: text}).boundingBox();
                const popup = await switcher
                    .locator('xpath=ancestor::*[@data-floating-ui-placement]')
                    .boundingBox();
                if (!cell || !popup) return false;
                return (
                    Math.abs(popup.x + popup.width - cell.x - 12) < 1 &&
                    Math.abs(popup.y - cell.y - 2) < 1
                );
            })
            .toBe(true);
        await switcher.click();
        await expect(page.getByRole('menu')).toBeVisible();
        await page.getByText('Align cell content to the right', {exact: true}).click({trial: true});
        await page.getByRole('menuitem').first().focus();
        await expect(page.getByRole('menuitem').first()).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('menuitem').nth(1)).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('menuitem').first()).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('menu')).toBeHidden();
    }

    expect(await capture.evaluate(({connected}) => connected())).toBe(true);
    await page.getByRole('button', {name: 'After editor'}).click();
    await expect(page.getByRole('button', {name: 'After editor'})).toBeFocused();
    const result = await capture.evaluate(({stop}) => stop());
    await capture.dispose();
    expect(result).toEqual([]);
});

test('Editor tooltips keep markdown table commands working', async ({mount, page}) => {
    await mount(<EditorTooltips markup={'| Header | Other |\n| --- | --- |\n| Body | Cell |'} />);
    const editor = page.locator('.ProseMirror');
    const switcher = page.locator('.table-cell-floating-button');
    await editor.getByText('Body', {exact: true}).click();
    await switcher.click();
    await page.getByText('Align cell content to the right', {exact: true}).click();
    await expect(editor.locator('td').filter({hasText: 'Body'})).toHaveAttribute(
        'cell-align',
        'right',
    );
    await editor.getByText('Body', {exact: true}).click();
    await switcher.click();
    await page.getByText('Remove table', {exact: true}).click();
    await expect(editor.locator('table')).toHaveCount(0);
    await editor.click();
    await page.keyboard.type('Continue editing');
    await expect(editor).toContainText('Continue editing');
});
