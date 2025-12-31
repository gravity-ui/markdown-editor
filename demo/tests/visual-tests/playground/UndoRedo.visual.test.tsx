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

            await editor.assertMainToolbarButtonDisabled('Undo');
            await editor.assertMainToolbarButtonDisabled('Redo');

            await editor.pressSequentially('Text');
            await wait.timeout();

            await editor.assertMainToolbarButtonEnabled('Undo');
            await editor.assertMainToolbarButtonDisabled('Redo');

            await editor.clickMainToolbarButton('Undo');
            await wait.timeout();

            await editor.assertMainToolbarButtonDisabled('Undo');
            await editor.assertMainToolbarButtonEnabled('Redo');

            const placeholder = page.getByText('Enter your text or type').first().locator('..');
            await wait.visible(placeholder);
        });

        test('should verify correct undo and redo behavior @markup', async ({
            page,
            wait,
            editor,
        }) => {
            await editor.switchMode('markup');

            await editor.assertMainToolbarButtonDisabled('Undo');
            await editor.assertMainToolbarButtonDisabled('Redo');

            await editor.pressSequentially('Text');
            await wait.timeout();

            await editor.assertMainToolbarButtonEnabled('Undo');
            await editor.assertMainToolbarButtonDisabled('Redo');

            await editor.clickMainToolbarButton('Undo');
            await wait.timeout();

            await editor.assertMainToolbarButtonDisabled('Undo');
            await editor.assertMainToolbarButtonEnabled('Redo');

            const placeholder = page.getByText('Add your markup here').first().locator('..');
            await wait.visible(placeholder);
        });
    });
});
