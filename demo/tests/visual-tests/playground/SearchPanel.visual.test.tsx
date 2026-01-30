import {expect, test} from 'playwright/core';
import dd from 'ts-dedent';

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
