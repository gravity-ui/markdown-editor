import {expect, test} from 'playwright/core';

import {LegacyContextualToolbars} from './LegacyContextualToolbars.helpers';

test('should show contextual toolbars from legacy configuration', async ({
    mount,
    editor,
    expectScreenshot,
}) => {
    await mount(<LegacyContextualToolbars />);

    await editor.press('ControlOrMeta+a');
    await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveCount(2);
    await expectScreenshot({
        component: editor.locators.toolbars.selection,
        nameSuffix: 'selection',
        themes: ['light'],
    });

    await editor.fill('');
    await editor.pressSequentially('/');
    await expect(editor.locators.toolbars.commandMenu).toContainText('Heading 1');
    await expectScreenshot({
        component: editor.locators.toolbars.commandMenu,
        nameSuffix: 'slash',
        themes: ['light'],
    });
});

for (const [config, title] of [
    ['preset', 'new preset'],
    ['both', 'new preset over legacy configuration'],
] as const) {
    test(`should show contextual toolbars from ${title}`, async ({
        mount,
        editor,
        expectScreenshot,
    }) => {
        await mount(<LegacyContextualToolbars config={config} />);

        await editor.press('ControlOrMeta+a');
        const selectionButtons = editor.locators.toolbars.selection.getByRole('button');
        await expect(selectionButtons).toHaveCount(2);
        await expect(selectionButtons.nth(0)).toHaveAttribute('aria-label', 'Italic');
        await expect(selectionButtons.nth(1)).toHaveAttribute('aria-label', 'Bold');
        await expectScreenshot({
            component: editor.locators.toolbars.selection,
            nameSuffix: 'selection',
            themes: ['light'],
        });

        await editor.fill('');
        await editor.pressSequentially('/');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Heading 1');
        await expect(editor.locators.toolbars.commandMenu).not.toContainText('Heading 2');
        await expectScreenshot({
            component: editor.locators.toolbars.commandMenu,
            nameSuffix: 'slash',
            themes: ['light'],
        });
    });
}
