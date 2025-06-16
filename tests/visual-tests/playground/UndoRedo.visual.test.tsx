import {test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Undo/Redo', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = '';

        await mount(<Playground initial={initialMarkup} />);
    });

    test.describe('specific', () => {
        test('should verify correct undo and redo behavior @wysiwyg', async ({
            page,
            wait,
            editor,
        }) => {
            await editor.switchMode('wysiwyg');

            await editor.assertToolbarButtonDisabled('Undo');
            await editor.assertToolbarButtonDisabled('Redo');

            await editor.pressSequentially('Text');
            await wait.timeout();

            await editor.assertToolbarButtonEnabled('Undo');
            await editor.assertToolbarButtonDisabled('Redo');

            await editor.clickToolbarButton('Undo');
            await wait.timeout();

            await editor.assertToolbarButtonDisabled('Undo');
            await editor.assertToolbarButtonEnabled('Redo');

            const placeholder = page.getByText('Enter your text or type').first().locator('..');
            await wait.visible(placeholder);
        });

        test('should verify correct undo and redo behavior @markup', async ({
            page,
            wait,
            editor,
        }) => {
            await editor.switchMode('markup');

            await editor.assertToolbarButtonDisabled('Undo');
            await editor.assertToolbarButtonDisabled('Redo');

            await editor.pressSequentially('Text');
            await wait.timeout();

            await editor.assertToolbarButtonEnabled('Undo');
            await editor.assertToolbarButtonDisabled('Redo');

            await editor.clickToolbarButton('Undo');
            await wait.timeout();

            await editor.assertToolbarButtonDisabled('Undo');
            await editor.assertToolbarButtonEnabled('Redo');

            const placeholder = page.getByText('Enter your text or type').first().locator('..');
            await wait.visible(placeholder);
        });
    });
});
