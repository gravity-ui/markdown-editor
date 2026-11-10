import {expect, test} from 'playwright/core';
import type {CaptureScreenshotParams} from 'playwright/core/types';

import {Playground} from './Playground.helpers';

test.describe('Toolbar', () => {
    test.beforeEach(async ({mount}) => {
        await mount(<Playground initial="" />, {
            hidePlaygroundBlocks: true,
            width: '100%',
            rootStyle: {
                width: '100%',
                height: '100%',
                padding: 0,
            },
        });
    });

    test('should hide actions at small width', async ({page, wait, editor, expectScreenshot}) => {
        const height = 256;
        const themes = ['light'] as const;
        const screenshotParams: CaptureScreenshotParams = {
            themes,
            caret: 'hide',
            fullPage: true,
        };

        await editor.switchMode('wysiwyg');
        await editor.openMainToolbarMoreMenu();
        await page.mouse.move(-1, -1);

        await test.step('Set large width', async () => {
            await page.setViewportSize({height, width: 812});
            await wait.timeout(200); // waiting for popup to be positioned
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'width-large',
            });
        });

        await test.step('Set medium width', async () => {
            await page.setViewportSize({height, width: 512});
            await wait.timeout(200); // waiting for popup to be positioned
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'width-medium',
            });
        });

        await test.step('Set small width', async () => {
            await page.setViewportSize({height, width: 256});
            await wait.timeout(200); // waiting for popup to be positioned
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'width-small',
            });
        });

        await test.step('Switch to markup mode', async () => {
            await editor.switchMode('markup');
            await editor.openMainToolbarMoreMenu();
            await page.mouse.move(-1, -1);
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'markup-width-small',
            });
        });
    });

    test.describe('should hide all actions to more menu', () => {
        test('in @wysiwyg mode', async ({page, editor, expectScreenshot}) => {
            await page.setViewportSize({height: 256, width: 72});
            await editor.switchMode('wysiwyg');
            await editor.openMainToolbarMoreMenu();
            await page.mouse.move(-1, -1);
            await expectScreenshot({component: editor.locators.toolbars.additional});
        });

        test('in @markup mode', async ({page, editor, expectScreenshot}) => {
            await page.setViewportSize({height: 256, width: 96});
            await editor.switchMode('markup');
            await editor.openMainToolbarMoreMenu();
            await page.mouse.move(-1, -1);
            await expectScreenshot({component: editor.locators.toolbars.additional});
        });
    });

    test.describe('should have same set of actions in both modes', () => {
        test.beforeEach(async ({page}) => {
            await page.setViewportSize({height: 256, width: 812});
        });

        test('in @wysiwyg mode', async ({page, editor, expectScreenshot}) => {
            await editor.switchMode('wysiwyg');
            await editor.openMainToolbarMoreMenu();
            await page.mouse.move(-1, -1);

            await expectScreenshot({fullPage: true, caret: 'hide'});
        });

        test('in @markup mode', async ({page, editor, expectScreenshot}) => {
            await editor.switchMode('markup');
            await editor.openMainToolbarMoreMenu();
            await page.mouse.move(-1, -1);

            await expectScreenshot({fullPage: true, caret: 'hide'});
        });
    });
});

test.describe('Toolbar keyboard navigation', () => {
    test.beforeEach(async ({mount}) => {
        await mount(
            <div role="dialog" aria-label="Toolbar keyboard navigation">
                <button type="button" data-qa="toolbar-before">
                    Before editor
                </button>
                <Playground initial="" />
            </div>,
            {
                hidePlaygroundBlocks: true,
                width: '100%',
                rootStyle: {
                    width: '100%',
                    height: '100%',
                    padding: 0,
                },
            },
        );
    });

    test('should navigate preview and settings with arrows and Alt F10 in markup mode', async ({
        page,
        editor,
    }) => {
        await page.setViewportSize({height: 512, width: 812});
        await editor.switchMode('markup');
        await expect(editor.locators.contenteditable).toBeFocused();
        await editor.fill('[Preview text](#preview)');
        await page.evaluate(() => {
            if (!window.mdEditor) throw new Error('window.mdEditor is undefined');
            window.mdEditor.changeSplitModeEnabled({splitModeEnabled: false});
        });

        const preview = editor.locators.previewButton;
        const settings = editor.locators.settingsButton;
        await expect(preview).toBeVisible();
        await preview.focus();
        await page.keyboard.press('ArrowRight');
        await expect(settings).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(preview).toBeFocused();

        await editor.focus();
        await page.evaluate(() => {
            if (!window.mdEditor) throw new Error('window.mdEditor is undefined');
            window.mdEditor.changeToolbarVisibility({visible: false});
        });
        await expect(editor.locators.toolbars.main).toBeHidden();
        const toolbar = page.getByRole('toolbar', {name: 'Settings', exact: true});
        await expect(toolbar.locator('button[tabindex="0"]')).toHaveCount(1);
        await page.keyboard.press('Alt+F10');
        await expect(preview).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(settings).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(preview).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(settings).toBeFocused();
        await page.keyboard.press('Home');
        await expect(preview).toBeFocused();
        await page.keyboard.press('End');
        await expect(settings).toBeFocused();
        await editor.focus();
        await page.keyboard.press('Alt+F10');
        await expect(settings).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(preview).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByTestId('toolbar-before')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(preview).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(editor.locators.contenteditable).toBeFocused();

        await page.keyboard.press('Alt+F10');
        await expect(preview).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(editor.locators.previewContent).toBeVisible();
        await expect(editor.locators.previewContent).toHaveText('Preview text');
        await expect(editor.locators.component).toBeFocused();
        await page.keyboard.press('Alt+F10');
        await expect(preview).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(settings).toBeFocused();
        await editor.locators.component.focus();
        await page.keyboard.press('Alt+F10');
        await expect(settings).toBeFocused();
        await editor.locators.previewContent.getByRole('link', {name: 'Preview text'}).focus();
        await page.keyboard.press('Alt+F10');
        await expect(settings).toBeFocused();
    });

    test('should focus toolbar from a split preview link with Alt F10', async ({page, editor}) => {
        await page.setViewportSize({height: 512, width: 1200});
        await editor.switchMode('markup');
        await expect(editor.locators.contenteditable).toBeFocused();
        await editor.fill('[Preview link](#preview)');
        await page.evaluate(() => {
            if (!window.mdEditor) throw new Error('window.mdEditor is undefined');
            window.mdEditor.changeSplitModeEnabled({splitModeEnabled: true});
        });
        const link = editor.locators.previewContent.getByRole('link', {name: 'Preview link'});
        await expect(link).toBeVisible();
        await link.focus();
        await page.keyboard.press('Alt+F10');
        await expect(
            editor.locators.toolbars.main.locator('button:enabled[tabindex="0"]'),
        ).toBeFocused();
        await editor.locators.settingsButton.focus();
        await link.focus();
        await page.keyboard.press('Alt+F10');
        await expect(editor.locators.settingsButton).toBeFocused();
    });

    for (const mode of ['wysiwyg', 'markup'] as const) {
        test(`should tab through settings before editor when toolbar is hidden @${mode}`, async ({
            page,
            editor,
        }) => {
            await page.setViewportSize({height: 512, width: 812});
            await editor.switchMode(mode);
            await expect(editor.locators.contenteditable).toBeFocused();
            await page.evaluate(() => {
                if (!window.mdEditor) throw new Error('window.mdEditor is undefined');
                window.mdEditor.changeToolbarVisibility({visible: false});
            });

            const controls = page.getByRole('toolbar', {name: 'Settings', exact: true});
            const tabStop = controls.locator('button:enabled[tabindex="0"]');
            const before = page.getByTestId('toolbar-before');
            await before.focus();
            await page.keyboard.press('Tab');
            await expect(tabStop).toBeFocused();
            await page.keyboard.press('Shift+Tab');
            await expect(before).toBeFocused();
            await page.keyboard.press('Tab');
            await expect(tabStop).toBeFocused();
            await page.keyboard.press('Tab');
            await expect(editor.locators.contenteditable).toBeFocused();

            const [controlsBox, contentBox] = await Promise.all([
                controls.boundingBox(),
                editor.locators.contenteditable.boundingBox(),
            ]);
            if (!controlsBox || !contentBox) throw new Error('Editor controls must be visible');
            expect(controlsBox.x).toBeGreaterThanOrEqual(contentBox.x + contentBox.width);
        });

        test(`should focus toolbar with Alt F10 from editor @${mode}`, async ({page, editor}) => {
            await page.setViewportSize({height: 512, width: 812});
            await editor.switchMode(mode);
            await expect(editor.locators.contenteditable).toBeFocused();

            const toolbar = editor.locators.toolbars.main;
            await expect(toolbar.getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
            await page.keyboard.press('Alt+F10');
            await expect(toolbar.locator('button:enabled[tabindex="0"]')).toBeFocused();
            await expect(toolbar).toHaveAttribute('aria-keyshortcuts', 'Alt+F10');

            const italic = toolbar.getByRole('button', {name: 'Italic', exact: true});
            await italic.focus();
            await editor.focus();
            await page.keyboard.press('Alt+F10');
            await expect(italic).toBeFocused();

            const before = page.getByTestId('toolbar-before');
            await before.focus();
            await page.keyboard.press('Alt+F10');
            await expect(before).toBeFocused();

            await editor.focus();
            await page.keyboard.press('Control+Alt+F10');
            await expect(editor.locators.contenteditable).toBeFocused();

            await page.evaluate(() => {
                if (!window.mdEditor) throw new Error('window.mdEditor is undefined');
                window.mdEditor.changeToolbarVisibility({visible: false});
            });
            await expect(toolbar).toBeHidden();
            await page.keyboard.press('Alt+F10');
            await expect(
                page
                    .getByRole('toolbar', {name: 'Settings', exact: true})
                    .locator('button:enabled[tabindex="0"]'),
            ).toBeFocused();
        });

        test(`should restore settings focus when toggling toolbar visibility @${mode}`, async ({
            page,
            editor,
        }) => {
            await page.setViewportSize({height: 512, width: 812});
            await editor.switchMode(mode);
            await expect(editor.locators.contenteditable).toBeFocused();

            const button = editor.locators.settingsButton;
            const toolbar = editor.locators.toolbars.main;
            const dialog = page.getByRole('dialog', {name: 'Settings', exact: true});
            const checkbox = dialog.getByRole('checkbox', {name: 'Toolbar', exact: true});

            await button.click();
            await expect(checkbox).toBeChecked();
            await checkbox.click();
            await expect(toolbar).toBeHidden();
            await expect(dialog).toBeHidden();
            await expect(button).toBeFocused();

            await page.keyboard.press('Enter');
            await expect(page.getByTestId('g-md-settings-mode-wysiwyg')).toBeFocused();
            await expect(checkbox).not.toBeChecked();
            await checkbox.focus();
            await expect(checkbox).toBeFocused();
            await page.keyboard.press('Space');
            await expect(toolbar).toBeVisible();
            await expect(dialog).toBeHidden();
            await expect(button).toBeFocused();

            const before = page.getByTestId('toolbar-before');
            await before.focus();
            await page.evaluate(() => {
                if (!window.mdEditor) throw new Error('window.mdEditor is undefined');
                window.mdEditor.changeToolbarVisibility({visible: false});
            });
            await expect(toolbar).toBeHidden();
            await expect(before).toBeFocused();
        });

        test(`should trap focus in settings and restore focus on Escape @${mode}`, async ({
            page,
            editor,
        }) => {
            await page.setViewportSize({height: 512, width: 812});
            await editor.switchMode(mode);
            await expect(editor.locators.contenteditable).toBeFocused();

            const button = editor.locators.settingsButton;
            const dialog = page.getByRole('dialog', {name: 'Settings', exact: true});
            const first = page.getByTestId('g-md-settings-mode-wysiwyg');
            const last = dialog.locator('input[type="checkbox"]:enabled').last();

            await button.click();
            await expect(dialog).toHaveAttribute('aria-modal', 'true');
            await expect(first).toBeFocused();
            await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
            await expect(button).toHaveAttribute('aria-expanded', 'true');
            await page.keyboard.press('Shift+Tab');
            await expect(last).toBeFocused();
            await page.keyboard.press('Tab');
            await expect(first).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
            await expect(button).toBeFocused();
            await expect(button).toHaveAttribute('aria-expanded', 'false');

            await page.keyboard.press('Enter');
            await expect(first).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(button).toBeFocused();
            await page.keyboard.press('Space');
            await expect(first).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
            await expect(button).toBeFocused();
        });

        test(`should navigate toolbar with arrow keys @${mode}`, async ({page, editor}) => {
            await page.setViewportSize({height: 256, width: 812});
            await editor.switchMode(mode);
            await expect(editor.locators.contenteditable).toBeFocused();

            const before = page.getByTestId('toolbar-before');
            const toolbar = editor.locators.toolbars.main;
            const buttons = toolbar.locator('button:enabled:visible');
            const first = buttons.first();
            const second = buttons.nth(1);
            const last = editor.locators.settingsButton;

            await expect(toolbar.getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
            await expect(toolbar.locator('button:enabled[tabindex="0"]')).toHaveCount(1);
            await before.focus();
            await page.keyboard.press('Tab');
            await expect(first).toBeFocused();
            await page.keyboard.press('ArrowRight');
            await expect(second).toBeFocused();
            await page.keyboard.press('ArrowLeft');
            await expect(first).toBeFocused();
            await page.keyboard.press('End');
            await expect(last).toBeFocused();
            await page.keyboard.press('ArrowRight');
            await expect(first).toBeFocused();
            await page.keyboard.press('ArrowLeft');
            await expect(last).toBeFocused();
            await page.keyboard.press('Home');
            await expect(first).toBeFocused();
            await page.keyboard.press('ArrowRight');
            await expect(second).toBeFocused();

            await page.keyboard.press('Shift+Tab');
            await expect(before).toBeFocused();
            await page.keyboard.press('Tab');
            await expect(second).toBeFocused();
            await page.keyboard.press('Tab');
            await expect
                .poll(() => toolbar.evaluate((node) => node.contains(document.activeElement)))
                .toBe(false);

            await page.setViewportSize({height: 256, width: 72});
            await expect(buttons.first()).toHaveAttribute('data-qa', 'g-md-toolbar-more-action');
            await expect(toolbar.locator('button:enabled[tabindex="0"]')).toHaveCount(1);
            await buttons.first().focus();
            await page.keyboard.press('End');
            await expect(last).toBeFocused();
            await page.keyboard.press('Home');
            await expect(buttons.first()).toBeFocused();
        });

        for (const title of ['Heading', 'List', 'Text color', 'More actions']) {
            test(`should navigate ${title} menu with arrow keys @${mode}`, async ({
                page,
                editor,
            }) => {
                await page.setViewportSize({height: 512, width: 1800});
                await editor.switchMode(mode);
                await expect(editor.locators.contenteditable).toBeFocused();

                const toolbar = editor.locators.toolbars.main;
                const button = toolbar.getByRole('button', {name: title, exact: true});
                const menu = editor.getToolbarMenuByLabel(title);
                const items = menu.locator('[role="menuitem"]:not([aria-disabled="true"])');

                await expect(
                    toolbar.getByRole('button', {name: 'Heading', exact: true}),
                ).toBeVisible();
                await button.focus();
                await page.keyboard.press('ArrowDown');
                await expect(items.first()).toBeFocused();
                await expect(button).toHaveAttribute('aria-haspopup', 'menu');
                await expect(button).toHaveAttribute('aria-expanded', 'true');
                await page.keyboard.press('ArrowDown');
                await expect(items.nth(1)).toBeFocused();
                await page.keyboard.press('ArrowUp');
                await expect(items.first()).toBeFocused();
                await page.keyboard.press('ArrowUp');
                await expect(items.last()).toBeFocused();
                await page.keyboard.press('ArrowDown');
                await expect(items.first()).toBeFocused();
                await page.keyboard.press('End');
                await expect(items.last()).toBeFocused();
                await page.keyboard.press('Home');
                await expect(items.first()).toBeFocused();
                await page.keyboard.press('Escape');
                await expect(menu).toBeHidden();
                await expect(button).toBeFocused();
                await expect(button).toHaveAttribute('aria-expanded', 'false');

                await page.keyboard.press('ArrowUp');
                await expect(items.last()).toBeFocused();
                await page.keyboard.press('Escape');
                await expect(button).toBeFocused();

                await page.keyboard.press('Space');
                await expect(items.first()).toBeFocused();
                await page.keyboard.press('Tab');
                await expect(menu).toBeHidden();
                await expect
                    .poll(() => toolbar.evaluate((node) => node.contains(document.activeElement)))
                    .toBe(false);

                await button.focus();
                await page.keyboard.press('Enter');
                await expect(items.first()).toBeFocused();
                await page.keyboard.press('Shift+Tab');
                await expect(menu).toBeHidden();
                await expect(page.getByTestId('toolbar-before')).toBeFocused();

                await button.click();
                await expect(items.first()).toBeFocused();
                await page.keyboard.press('Escape');
                await expect(button).toBeFocused();
            });
        }

        for (const key of ['Enter', 'Space']) {
            test(`should execute a menu command with ${key} and return focus to editor @${mode}`, async ({
                page,
                editor,
            }) => {
                await page.setViewportSize({height: 512, width: 1800});
                await editor.switchMode(mode);
                await expect(editor.locators.contenteditable).toBeFocused();

                const button = editor.locators.toolbars.main.getByRole('button', {
                    name: 'Heading',
                    exact: true,
                });
                await button.focus();
                await page.keyboard.press('ArrowDown');
                await expect(
                    editor.getToolbarMenuByLabel('Heading').getByRole('menuitem').first(),
                ).toBeFocused();
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowDown');
                await expect(
                    editor
                        .getToolbarMenuByLabel('Heading')
                        .getByRole('menuitem', {name: 'Heading 2'}),
                ).toBeFocused();
                await page.keyboard.press(key);
                await expect(editor.locators.contenteditable).toBeFocused();
                await page.keyboard.type('Heading text');

                if (mode === 'wysiwyg') {
                    await expect(editor.locators.contenteditable.locator('h2')).toHaveText(
                        'Heading text',
                    );
                } else {
                    await expect(editor.locators.contenteditable).toHaveText('## Heading text');
                }
            });
        }
    }
});
