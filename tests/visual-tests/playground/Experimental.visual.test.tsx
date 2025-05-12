import {test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Empty rows', () => {
    test.beforeEach(async ({mount, editor}) => {
        await mount(<Playground experimental={{preserveEmptyRows: true}} />);
        await editor.clearContent();
    });

    test.describe('WYSIWYG mode @wysiwyg', () => {
        test.beforeEach(async ({editor}) => {
            await editor.switchMode('wysiwyg');
        });

        test('should preserve empty rows', async ({editor, wait, expectScreenshot}) => {
            await editor.press('Enter');
            await editor.press('Enter');
            await editor.blur();
            await wait.timeout(500);
            await expectScreenshot({nameSuffix: 'empty'});

            await editor.paste('a');
            await editor.press('Enter');
            await editor.press('Enter');
            await editor.blur();
            await wait.timeout(500);
            await expectScreenshot({nameSuffix: 'preserve'});
        });
    });

    test.describe('MARKUP mode @markup', () => {
        test.beforeEach(async ({editor}) => {
            await editor.switchMode('markup');
        });

        test('should show autocomplete', async ({editor, expectScreenshot}) => {
            await editor.press('&');
            await editor.waitForCMAutocomplete();
            await expectScreenshot({nameSuffix: 'tooltip'});

            await editor.press('Enter');
            await editor.blur();
            await expectScreenshot({nameSuffix: 'result'});
        });
    });
});
