import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {ButtonStories} from './Button.helpers';

// Lines under the button leave room for its settings window and style list in the screenshot.
const withSpace = `:button[Кнопка]{href="https://example.com" view="action" color="standard"}${'\n\nТекст'.repeat(12)}`;

test.describe('Button', () => {
    test('should take the colors from the theme @wysiwyg', async ({mount, button}) => {
        await mount(
            <ButtonStories.Button initial={':button[Кнопка]{view="action" color="blue"}'} />,
        );
        await expect(button.blocks).toHaveCount(1);
        await button.setThemeVariable('--g-color-base-info-heavy', 'rgb(100, 110, 120)');
        await expect(button.blocks).toHaveCSS('background-color', 'rgb(100, 110, 120)');
    });

    test('should render every view and color @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Colors />);
        await editor.assertMode('wysiwyg');
        await expect(button.blocks).toHaveCount(25);
        expect(await button.getFilledBackgrounds()).not.toContain('rgba(0, 0, 0, 0)');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render a button @wysiwyg', async ({mount, editor, button, expectScreenshot}) => {
        await mount(<ButtonStories.Button />);
        await editor.assertMode('wysiwyg');
        await expect(button.blocks).toHaveCount(1);
        await expect(button.blocks).toHaveAttribute('href', 'https://example.com');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should place buttons in a line of text @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(
            <ButtonStories.Button
                initial={
                    'Нажмите :button[Кнопка]{view="action" color="blue"} или :button[Кнопка]{view="outline" color="gray"} и читайте дальше'
                }
            />,
        );
        await expect(button.blocks).toHaveCount(2);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should preview every view and color and preserve them across modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Colors />);
        await expect(button.blocks).toHaveCount(25);
        const before = await button.getValues();
        await editor.switchMode('markup');
        await editor.switchPreview('visible');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expect(button.variants).toHaveCount(25);
        expect(await button.getFilledBackgrounds(button.variants)).not.toContain(
            'rgba(0, 0, 0, 0)',
        );
        expect(await button.getValues(button.variants)).toEqual(before);
        await expectScreenshot({component: editor.locators.component});
        await editor.switchMode('wysiwyg');
        await expect(button.blocks).toHaveCount(25);
        expect(await button.getValues()).toEqual(before);
    });

    test('should preview a button @markup', async ({
        mount,
        page,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button mode="markup" />);
        await editor.switchPreview('visible');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expect(button.variants).toHaveCount(1);
        await expect(button.variants).toHaveAttribute('href', 'https://example.com');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should show the placeholder in an empty button @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button width={400} />);
        await button.openSettings();
        await button.label.fill('');
        await button.label.press('Enter');
        await expect(button.settings).toBeHidden();
        await expect(button.blocks).toHaveText('Button');
        // The pointer leaves the button, so the screenshot shows no hover state.
        await page.mouse.move(0, 0);
        await expectScreenshot({component: editor.locators.component});
        await editor.switchMode('markup');
        await expect(editor.locators.contenteditable).toContainText(':button[Button]');
    });

    test('should insert a button from the toolbar @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial="Текст " />);
        await editor.focus();
        await editor.press('End');
        await editor.clickMainToolbarButton('Button');
        await expect(button.blocks).toHaveCount(1);
        await expect(button.blocks).toHaveText('Button');
        await expect(button.blocks).toHaveAttribute('data-view', 'action');
        await expect(button.blocks).toHaveAttribute('data-color', 'standard');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should insert a button from the toolbar @markup', async ({mount, editor}) => {
        await mount(<ButtonStories.Button initial="" mode="markup" />);
        await editor.clickMainToolbarButton('Button');
        await expect(editor.locators.contenteditable).toHaveText(
            ':button[Button]{view="action" color="standard"}',
        );
    });

    test('should edit the label and the link of a button in its window @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await expect(button.label).toBeFocused();
        await expect(button.label).toHaveValue('Кнопка');
        await expect(button.link).toHaveValue('https://example.com');
        await page.mouse.move(0, 0);
        await expectScreenshot({component: editor.locators.component});
        await button.label.fill('Открыть');
        await button.link.fill('/page');
        await button.link.press('Enter');
        await expect(button.settings).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(button.blocks).toHaveText('Открыть');
        await expect(button.blocks).toHaveAttribute('href', '/page');
        await editor.press('Enter');
        await expect(button.label).toBeFocused();
        await editor.press('Escape');
        await expect(button.settings).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    test('should open settings on repeated clicks and preserve selection @wysiwyg', async ({
        mount,
        button,
        editor,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await expect(button.blocks).toHaveClass(/ProseMirror-selectednode/);
        await expect(button.blocks).toHaveCSS('outline-width', '2px');
        await expect(button.label).toBeFocused();
        expect(await button.getSettingsGeometry()).toEqual({
            width: 257,
            iconSize: [16, 16],
            iconLeft: 12,
            iconCenter: 0,
            textLeft: 36,
            swatchLeft: 8,
            fieldGap: 12,
        });
        await button.blocks.dblclick();
        await expect(button.label).toBeFocused();
        await expect(button.settings).toBeVisible();
        await button.label.press('Escape');
        await expect(button.settings).toBeHidden();
        await button.blocks.click();
        await expect(button.label).toBeFocused();
        await expect(button.blocks).toHaveClass(/ProseMirror-selectednode/);
        await editor.press('Escape');
    });

    test('should change the style of a button in its window @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await button.styleSelect.click();
        await expect(button.option('Green')).toHaveCount(4);
        await button.option('Green').first().hover();
        await expect(button.preview).toBeVisible();
        await expectScreenshot({component: editor.locators.component});
        await button.option('Green').first().click();
        await expect(button.blocks).toHaveAttribute('data-view', 'action');
        await expect(button.blocks).toHaveAttribute('data-color', 'green');
        await button.newTab.click();
        await expect(button.blocks).toHaveAttribute('target', '_blank');
        await expect(button.settings).toBeVisible();
    });
});
