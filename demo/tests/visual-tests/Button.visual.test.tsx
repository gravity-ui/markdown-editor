import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {ButtonStories} from './Button.helpers';

const singleButton = ':button[Кнопка]{href="https://example.com" view="action" color="standard"}';

const withSpace = `${singleButton}${'\n\nТекст'.repeat(12)}`;

const scriptUrl = ['javascript', 'alert(1)'].join(':');

const EXAMPLES_COUNT = 34;

const stateStyles = [
    ['action', 'standard'],
    ['action', 'blue'],
    ['normal', 'gray'],
    ['normal', 'blue'],
    ['outline', 'gray'],
    ['outline', 'blue'],
    ['flat', 'standard'],
    ['flat', 'gray'],
    ['flat', 'blue'],
] as const;
const statesMarkup = stateStyles
    .map(
        ([view, color]) =>
            `:button[Button]{href="https://example.com" view="${view}" color="${color}"}`,
    )
    .join(' ');

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
        await mount(<ButtonStories.Button width={500} />);
        await editor.assertMode('wysiwyg');
        await expect(button.blocks).toHaveCount(EXAMPLES_COUNT);
        expect(await button.getFilledBackgrounds()).not.toContain('rgba(0, 0, 0, 0)');
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
        await mount(<ButtonStories.Button width={560} />);
        await expect(button.blocks).toHaveCount(EXAMPLES_COUNT);
        const before = await button.getValues();
        await editor.switchMode('markup');
        await editor.switchPreview('visible');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expect(button.variants).toHaveCount(EXAMPLES_COUNT);
        expect(await button.getFilledBackgrounds(button.variants)).not.toContain(
            'rgba(0, 0, 0, 0)',
        );
        expect(await button.getValues(button.variants)).toEqual(before);
        await expectScreenshot({component: editor.locators.component});
        await editor.switchMode('wysiwyg');
        await expect(button.blocks).toHaveCount(EXAMPLES_COUNT);
        expect(await button.getValues()).toEqual(before);
    });

    test('should open settings on repeated clicks and preserve selection @wysiwyg', async ({
        mount,
        button,
        editor,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await expect(button.blocks).toHaveClass(/ProseMirror-selectednode/);
        await expect(button.blocks).toHaveClass(/pm-node-selected/);
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
        await expect(editor.locators.contenteditable).toBeFocused();
        await button.blocks.click();
        await expect(button.label).toBeFocused();
        await expect(button.blocks).toHaveClass(/ProseMirror-selectednode/);
        await editor.press('Escape');
    });

    test('should keep the window open and the focus in the label after clearing it @wysiwyg', async ({
        mount,
        button,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await button.label.press('Tab');
        await expect(button.clearLabel).toBeFocused();
        await button.clearLabel.press('Enter');
        await expect(button.label).toBeFocused();
        await expect(button.label).toHaveValue('');
        await expect(button.settings).toBeVisible();
    });

    test('should remove the style preview after closing its list @wysiwyg', async ({
        mount,
        button,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await button.styleSelect.click();
        await button.option('Accent, Green').hover();
        await expect(button.preview).toBeVisible();
        await button.option('Accent, Green').click();
        await expect(button.option(/, Green$/)).toHaveCount(0);
        await expect(button.preview).toHaveCount(0);
        await button.styleSelect.click();
        await button.option('Accent, Violet').hover();
        await expect(button.preview).toBeVisible();
        await button.newTab.click();
        await expect(button.option(/, Violet$/)).toHaveCount(0);
        await expect(button.preview).toHaveCount(0);
        await button.styleSelect.click();
        await button.option('Accent, Red').hover();
        await expect(button.preview).toBeVisible();
        await button.styleSelect.press('Escape');
        await expect(button.option(/, Red$/)).toHaveCount(0);
        await expect(button.preview).toHaveCount(0);
    });

    test('should change the style of a button in its window @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} width={600} />);
        await button.openSettings();
        await button.styleSelect.click();
        await expect(button.option(/, Green$/)).toHaveCount(4);
        await expect(button.styleSelect).toHaveAccessibleName('Style: Accent, Standard');
        await button.option('Accent, Green').hover();
        await expect(button.preview).toBeVisible();
        await expectScreenshot({component: editor.locators.component});
        await button.option('Accent, Green').click();
        await expect(button.blocks).toHaveAttribute('data-view', 'action');
        await expect(button.blocks).toHaveAttribute('data-color', 'green');
        await button.newTab.click();
        await expect(button.blocks).toHaveAttribute('target', '_blank');
        await expect(button.settings).toBeVisible();
    });

    test('should save a field on a click outside and reject an unsafe link @wysiwyg', async ({
        mount,
        editor,
        button,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await button.label.fill('Открыть');
        await editor.locators.contenteditable.getByText('Текст').last().click();
        await expect(button.settings).toBeHidden();
        await expect(button.blocks).toHaveText('Открыть');
        await button.openSettings();
        await button.link.fill('/docs');
        await editor.locators.contenteditable.getByText('Текст').last().click();
        await expect(button.settings).toBeHidden();
        await expect(button.blocks).toHaveAttribute('href', '/docs');
        await button.openSettings();
        await button.link.fill(scriptUrl);
        await button.link.press('Enter');
        await expect(button.linkError).toHaveText('Unsupported link address');
        await expect(button.settings).toBeVisible();
        await expect(button.blocks).toHaveAttribute('href', '/docs');
        await button.link.fill('/page');
        await expect(button.linkError).toBeHidden();
        await button.link.press('Enter');
        await expect(button.settings).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(button.blocks).toHaveAttribute('href', '/page');
        await expect(button.blocks).toHaveText('Открыть');
    });

    test('should edit and delete a button with the keyboard @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(
            <ButtonStories.Button
                initial={`:button[Кнопка]{view="action" color="standard"} и текст${'\n\nТекст'.repeat(12)}`}
                width={440}
            />,
        );
        await expect(button.blocks).toHaveCount(1);
        await editor.focus();
        await editor.press('Control+Home');
        await editor.press('ArrowRight');
        await expect(button.selectedBlocks).toHaveCount(1);
        await editor.press('Enter');
        await expect(button.label).toBeFocused();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(button.styleSelect).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(button.option('Accent, Blue')).toBeVisible();
        await expectScreenshot({component: editor.locators.component});
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(button.blocks).toHaveAttribute('data-color', 'blue');
        await expect(button.option(/, Blue$/)).toHaveCount(0);
        await expect(button.styleSelect).toHaveAccessibleName('Style: Accent, Blue');
        await expect(button.styleSelect).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(button.link).toBeFocused();
        await page.keyboard.type('/page');
        await page.keyboard.press('Tab');
        await expect(button.blocks).toHaveAttribute('href', '/page');
        await page.keyboard.press('Space');
        await expect(button.blocks).toHaveAttribute('target', '_blank');
        await page.keyboard.press('Tab');
        await expect(button.settings).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(button.selectedBlocks).toHaveCount(1);
        await editor.press('ArrowRight');
        await expect(button.selectedBlocks).toHaveCount(0);
        await editor.press('Backspace');
        await expect(button.selectedBlocks).toHaveCount(1);
        await editor.press('Backspace');
        await expect(button.blocks).toHaveCount(0);
    });

    test('should show the hover state of every view @markup', async ({mount, editor, button}) => {
        await mount(<ButtonStories.Button mode="markup" initial={statesMarkup} />);
        await editor.switchPreview('visible');
        await expect(button.variants).toHaveCount(stateStyles.length);

        const action = button.variant('action', 'blue');
        const idle = await button.getBackground(action);
        await action.hover();
        await expect(action).not.toHaveCSS('background-color', idle);

        const normal = button.variant('normal', 'gray');
        const normalIdle = await button.getBackground(normal);
        await normal.hover();
        await expect(normal).not.toHaveCSS('background-color', normalIdle);

        const outline = button.variant('outline', 'blue');
        await outline.hover();
        await expect(outline).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

        const flat = button.variant('flat', 'gray');
        await flat.hover();
        await expect(flat).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    });
});
