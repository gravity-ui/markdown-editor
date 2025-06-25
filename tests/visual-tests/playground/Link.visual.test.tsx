import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Link', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = ``;

        await mount(<Playground initial={initialMarkup} />);
    });

    test('should insert link via toolbar popup dialog', async ({
        browserName,
        editor,
        page,
        actions,
        wait,
    }) => {
        test.skip(browserName === 'webkit', 'fillFocused does not work correctly in webkit');

        await editor.switchMode('wysiwyg');
        await editor.clickAdditionalToolbarButton('Link');

        await expect(page.getByTestId('g-md-link-form')).toBeVisible();

        await wait.timeout(300);
        await actions.fillFocused('gravity-ui.com');

        await actions.pressFocused('Tab', 3);

        await actions.fillFocused('gravity');

        await actions.pressFocused('Enter');

        await expect(editor.getByTextInContenteditable('gravity-ui.com')).toBeHidden();
        await expect(editor.getByTextInContenteditable('gravity')).toBeVisible();
    });
});
