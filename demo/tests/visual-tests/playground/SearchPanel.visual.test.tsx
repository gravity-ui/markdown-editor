import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('SearchPanel', () => {
    test.beforeEach(async ({mount}) => {
        const markup = dd`
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean massa purus, commodo et leo vel, pretium facilisis elit.
            
            Vivamus a risus sed orci interdum volutpat. Vivamus aliquet euismod laoreet. Donec nec erat non sapien luctus scelerisque.
            
            Duis fringilla eros sem, id luctus urna maximus sit amet. Aenean vitae massa ipsum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
            
            Phasellus in turpis vitae orci suscipit ultrices. Ut interdum urna a quam aliquet, sed ultricies diam egestas.
            `;

        await mount(<Playground initial={markup} />);
    });

    test('should focus editor after changing mode', async ({editor}) => {
        await editor.switchMode('markup');
        await expect(editor.locators.contenteditable).toBeFocused();
        await editor.switchMode('wysiwyg');
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    for (const mode of ['wysiwyg', 'markup'] as const) {
        test(`should keep page scroll when opening and expanding search in ${mode}`, async ({
            editor,
            page,
        }) => {
            await editor.switchMode(mode);
            await page.locator('.playwright-wrapper-test').evaluate((element) => {
                element.style.setProperty('padding-top', '1000px');
                element.style.setProperty('padding-bottom', '1000px');
            });
            await editor.focus();
            await page.evaluate(() => window.scrollTo(0, 1000));
            await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1000);

            await editor.press('ControlOrMeta+f');
            const searchInput = editor.searchPanel.searchInputLocator.locator('input');
            await expect(searchInput).toBeFocused();
            expect(await page.evaluate(() => window.scrollY)).toBe(1000);

            await editor.searchPanel.expand();
            await expect(searchInput).toBeFocused();
            await page.waitForLoadState('networkidle');
            expect(await page.evaluate(() => window.scrollY)).toBe(1000);
        });

        test(`should focus search on open and expand in ${mode}`, async ({editor, page}) => {
            await editor.switchMode(mode);
            await editor.focus();
            await editor.press('ControlOrMeta+f');

            const searchInput = editor.searchPanel.searchInputLocator.locator('input');
            await expect(searchInput).toBeFocused();
            await searchInput.press('Tab');
            await expect(editor.searchPanel.expandButtonLocator).toBeFocused();
            await editor.searchPanel.expandButtonLocator.press('Enter');
            await expect(searchInput).toBeFocused();

            await searchInput.press('Tab');
            await page.waitForLoadState('networkidle');
            await expect(
                editor.searchPanel.caseSensitiveCheckboxLocator.getByRole('checkbox'),
            ).toBeFocused();
        });

        test(`should keep replacement focus after expanding search in ${mode}`, async ({
            editor,
            page,
        }) => {
            await editor.switchMode(mode);
            await editor.focus();
            await editor.press('ControlOrMeta+f');
            await editor.searchPanel.expand();

            const replaceInput = editor.searchPanel.replaceInputLocator.locator('input');
            await replaceInput.click();
            await page.waitForLoadState('networkidle');
            await expect(replaceInput).toBeFocused();
        });
    }

    test.describe('mode:wysiwyg', () => {
        test.beforeEach(async ({editor}) => {
            await editor.switchMode('wysiwyg');
        });

        test('should open compact search panel', async ({editor, platform, expectScreenshot}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();

            await expectScreenshot({
                component: editor.searchPanel.panelLocator,
            });
        });

        test('should open full search panel', async ({
            editor,
            platform,
            expectScreenshot,
            wait,
        }) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await wait.hidden(editor.searchPanel.expandButtonLocator);

            await expectScreenshot({
                component: editor.searchPanel.panelLocator,
            });
        });

        test('should close compact search panel', async ({editor, platform}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.close();
            await editor.searchPanel.waitForHidden();
        });

        test('should close full search panel', async ({editor, platform, wait}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await wait.hidden(editor.searchPanel.expandButtonLocator);
            await editor.searchPanel.close();
            await editor.searchPanel.waitForHidden();
        });

        test('should activate replace buttons', async ({
            editor,
            platform,
            wait,
            expectScreenshot,
        }) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await editor.searchPanel.fillFindText('us');
            await wait.timeout(200);

            await expectScreenshot({
                component: editor.searchPanel.panelLocator,
            });
        });

        test('should update counter after one replacement', async ({editor, platform, wait}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await editor.searchPanel.fillFindText('us');
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('1 of 11');

            await editor.searchPanel.fillReplaceText('11');
            await editor.searchPanel.replace();
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('1 of 10');
        });

        test('should update counter after all replacement', async ({editor, platform, wait}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await editor.searchPanel.fillFindText('us');
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('1 of 11');

            await editor.searchPanel.fillReplaceText('22');
            await editor.searchPanel.replaceAll();
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('0 of 0');
        });

        test('should update counter after switching case sensitive flag', async ({
            editor,
            platform,
            wait,
        }) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await editor.searchPanel.fillFindText('Ut');
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('1 of 2');

            await editor.searchPanel.caseSensitiveCheckboxLocator.click();
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('1 of 1');
        });

        test('should update counter after switching whole word flag', async ({
            editor,
            platform,
            wait,
        }) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await editor.searchPanel.fillFindText('Ut');
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('1 of 2');

            await editor.searchPanel.wholeWordCheckboxLocator.click();
            await wait.timeout(100);

            expect(await editor.searchPanel.getCounterText()).toBe('1 of 1');
        });
    });

    test.describe('mode:markup', () => {
        test.beforeEach(async ({editor}) => {
            await editor.switchMode('markup');
        });

        test('should open compact search panel', async ({editor, platform, wait}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await wait.visible(editor.searchPanel.expandButtonLocator);
        });

        test('should open full search panel', async ({editor, platform, wait}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await wait.hidden(editor.searchPanel.expandButtonLocator);
            await wait.visible(editor.searchPanel.replaceAllButtonLocator);
        });

        test('should close compact search panel', async ({editor, platform}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.close();
            await editor.searchPanel.waitForHidden();
        });

        test('should close full search panel', async ({editor, platform, wait}) => {
            test.skip(platform === 'linux', 'key combo fails in docker container');

            await editor.openSearchPanel();
            await editor.searchPanel.expand();
            await wait.hidden(editor.searchPanel.expandButtonLocator);
            await editor.searchPanel.close();
            await editor.searchPanel.waitForHidden();
        });
    });
});
