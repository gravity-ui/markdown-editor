import {test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Settings panel', () => {
    test.beforeEach(async ({mount}) => {
        await mount(<Playground />);
    });

    test('should open settings panel @wysiwyg', async ({editor, expectScreenshot}) => {
        await editor.switchMode('wysiwyg');
        await editor.openSettingsPopup();

        await expectScreenshot({
            component: editor.locators.settingsContent,
        });
    });

    test('should open settings panel @markup', async ({editor, expectScreenshot}) => {
        await editor.switchMode('markup');
        await editor.openSettingsPopup();

        await expectScreenshot({
            component: editor.locators.settingsContent,
        });
    });
});
