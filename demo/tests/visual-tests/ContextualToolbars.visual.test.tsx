import {expect, test} from 'playwright/core';

import {ContextualToolbars} from './ContextualToolbars.helpers';

test.describe('Contextual toolbar configuration', () => {
    test.afterEach(async ({page}) => {
        await expect(page.getByRole('heading', {name: 'Error in YFM editor'})).toBeHidden();
    });

    test('uses shared items in the requested selection order and executes an action', async ({
        mount,
        editor,
    }) => {
        await mount(<ContextualToolbars />);
        await editor.press('ControlOrMeta+a');
        const toolbar = editor.locators.toolbars.selection;
        await expect(toolbar.getByRole('button')).toHaveCount(2);
        await expect(toolbar.getByRole('button').nth(0)).toHaveAttribute('aria-label', 'Italic');
        await expect(toolbar.getByRole('button').nth(1)).toHaveAttribute('aria-label', 'Bold');
        await toolbar.getByRole('button', {name: 'Bold', exact: true}).click();
        await expect(editor.locators.contenteditable.locator('strong')).toHaveText(
            'Select this text',
        );
    });

    test('searches a custom slash alias and executes its command', async ({mount, editor}) => {
        await mount(<ContextualToolbars />);
        await editor.fill('');
        await editor.pressSequentially('/topic');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Custom heading');
        await editor.press('Enter');
        await editor.pressSequentially('Heading text');
        await expect(editor.locators.contenteditable.locator('h2')).toHaveText('Heading text');
        await expect(editor.locators.contenteditable).not.toContainText('/topic');
    });

    test('updates an open selection toolbar and restores the legacy fallback', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars legacy />);
        await editor.press('ControlOrMeta+a');
        const toolbar = editor.locators.toolbars.selection;
        await expect(toolbar.getByRole('button')).toHaveCount(2);
        await page.getByRole('button', {name: 'Use alternate toolbar'}).click();
        await expect(toolbar.getByRole('button')).toHaveCount(1);
        await expect(toolbar.getByRole('button')).toHaveAttribute('aria-label', 'Strikethrough');
        await page.getByRole('button', {name: 'Use default toolbar'}).click();
        await expect(toolbar.getByRole('button')).toHaveAttribute('aria-label', 'Italic');
    });

    test('updates an open slash menu without executing the previous configuration', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars />);
        await editor.fill('');
        await editor.pressSequentially('/');
        const toolbar = editor.locators.toolbars.commandMenu;
        await expect(toolbar).toContainText('Custom heading');
        await page.getByRole('button', {name: 'Use alternate toolbar'}).click();
        await expect(toolbar).toContainText('Heading 1');
        await expect(toolbar).not.toContainText('Custom heading');
        await editor.press('Enter');
        await editor.pressSequentially('Updated heading');
        await expect(editor.locators.contenteditable.locator('h1')).toHaveText('Updated heading');
    });

    test('disables both contextual toolbars with empty orders', async ({mount, editor}) => {
        await mount(<ContextualToolbars initialConfig="empty" />);
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection).toBeHidden();
        await editor.fill('');
        await editor.pressSequentially('/h1');
        await expect(editor.locators.toolbars.commandMenu).toBeHidden();
        await expect(editor.locators.contenteditable).toHaveText('/h1');
    });

    test('preserves the highlighted slash command when the preset object is replaced', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars />);
        await editor.fill('');
        await editor.pressSequentially('/');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Custom heading');
        await editor.press('ArrowDown');
        await page.getByRole('button', {name: 'Use refreshed toolbar'}).click();
        await editor.press('Enter');
        await editor.pressSequentially('Still a paragraph');
        await expect(editor.locators.contenteditable.locator('p')).toHaveText('Still a paragraph');
        await expect(editor.locators.contenteditable.locator('h2')).toHaveCount(0);
    });

    test('enables initially empty legacy menus and restores their disabled state', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars initialConfig="default" legacy="empty" />);
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection).toBeHidden();
        await page.getByRole('button', {name: 'Use custom toolbar'}).click();
        await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveCount(2);
        await editor.fill('');
        await editor.pressSequentially('/');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Custom heading');
        await page.getByRole('button', {name: 'Use default toolbar'}).click();
        await expect(editor.locators.toolbars.commandMenu).toBeHidden();
        await editor.pressSequentially('topic');
        await expect(editor.locators.contenteditable).toHaveText('/topic');
    });

    test('closes a filtered slash menu when the replacement preset no longer matches', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars />);
        await editor.fill('');
        await editor.pressSequentially('/topic');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Custom heading');
        await page.getByRole('button', {name: 'Use alternate toolbar'}).click();
        await expect(editor.locators.toolbars.commandMenu).toBeHidden();
        await expect(editor.locators.contenteditable).toHaveText('/topic');
    });

    test('hides an empty selection popup after evaluating visibility conditions', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars />);
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection).toBeVisible();
        await page.getByRole('button', {name: 'Use conditional toolbar'}).click();
        await expect(editor.locators.toolbars.selection).toBeHidden();
        await page.getByRole('button', {name: 'Use custom toolbar'}).click();
        await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveCount(2);
    });

    test('preserves formatting undo and redo across toolbar configuration updates', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars />);
        await editor.press('ControlOrMeta+a');
        await editor.locators.toolbars.selection
            .getByRole('button', {name: 'Bold', exact: true})
            .click();
        await page.getByRole('button', {name: 'Use alternate toolbar'}).click();
        await editor.press('ControlOrMeta+z');
        await expect(editor.locators.contenteditable.locator('strong')).toHaveCount(0);
        await expect(editor.locators.contenteditable).toHaveText('Select this text');
        await editor.press('ControlOrMeta+Shift+z');
        await expect(editor.locators.contenteditable.locator('strong')).toHaveText(
            'Select this text',
        );
        await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveAttribute(
            'aria-label',
            'Strikethrough',
        );
    });

    test('uses the latest contextual preset when first entering WYSIWYG mode', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars initialMode="markup" />);
        await page.getByRole('button', {name: 'Use alternate toolbar'}).click();
        await editor.switchMode('wysiwyg');
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveAttribute(
            'aria-label',
            'Strikethrough',
        );
        await editor.fill('');
        await editor.pressSequentially('/');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Heading 1');
        await expect(editor.locators.toolbars.commandMenu).not.toContainText('Custom heading');
    });

    test('keeps selection conditions at block boundaries and hides menus in code blocks', async ({
        mount,
        editor,
    }) => {
        await mount(
            <ContextualToolbars
                initialConfig="default"
                initialMarkup={'First paragraph\n\nSecond paragraph'}
            />,
        );
        await editor.press('ControlOrMeta+a');
        await expect(
            editor.locators.toolbars.selection.getByTestId('g-md-toolbar-text-select'),
        ).toBeVisible();
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection).toBeVisible();
        await expect(
            editor.locators.toolbars.selection.getByTestId('g-md-toolbar-text-select'),
        ).toBeHidden();
        await editor.fill('');
        await editor.pressSequentially('/code');
        await editor.press('Enter');
        await editor.pressSequentially('code');
        await editor.press('Home');
        await editor.press('Shift+End');
        await expect(editor.locators.toolbars.selection).toBeHidden();
        await editor.press('End');
        await editor.pressSequentially(' /h1');
        await expect(editor.locators.toolbars.commandMenu).toBeHidden();
    });

    test('keeps legacy extension options when contextual orders are omitted', async ({
        mount,
        editor,
    }) => {
        await mount(<ContextualToolbars initialConfig="mainOnly" legacy />);
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveCount(1);
        await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveAttribute(
            'aria-label',
            'Italic',
        );
        await editor.fill('');
        await editor.pressSequentially('/');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Heading 1');
        await expect(editor.locators.toolbars.commandMenu).not.toContainText('Custom heading');
    });

    test('enables custom contextual actions with the zero editor preset', async ({
        mount,
        editor,
    }) => {
        await mount(<ContextualToolbars preset="zero" initialConfig="zeroCustom" />);
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection).toBeVisible();
        await editor.fill('');
        await editor.pressSequentially('/');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Text');
        await expect(editor.locators.toolbars.commandMenu).not.toContainText('Custom heading');
    });

    test('keeps contextual toolbars disabled on mobile', async ({mount, editor}) => {
        await mount(<ContextualToolbars mobile />);
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection).toBeHidden();
        await editor.fill('');
        await editor.pressSequentially('/topic');
        await expect(editor.locators.toolbars.commandMenu).toBeHidden();
    });

    test('closes open contextual toolbars when their orders become empty', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<ContextualToolbars />);
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection).toBeVisible();
        await page.getByRole('button', {name: 'Use empty toolbar'}).click();
        await expect(editor.locators.toolbars.selection).toBeHidden();
        await page.getByRole('button', {name: 'Use custom toolbar'}).click();
        await editor.fill('');
        await editor.pressSequentially('/');
        await expect(editor.locators.toolbars.commandMenu).toBeVisible();
        await page.getByRole('button', {name: 'Use empty toolbar'}).click();
        await expect(editor.locators.toolbars.commandMenu).toBeHidden();
        await editor.pressSequentially('topic');
        await expect(editor.locators.contenteditable).toHaveText('/topic');
    });

    test('applies contextual overrides after switching editor modes', async ({mount, editor}) => {
        await mount(<ContextualToolbars />);
        await editor.switchMode('markup');
        await editor.switchMode('wysiwyg');
        await editor.press('ControlOrMeta+a');
        await expect(editor.locators.toolbars.selection.getByRole('button')).toHaveCount(2);
        await editor.fill('');
        await editor.pressSequentially('/topic');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Custom heading');
    });

    test('preserves selection popup controls and slash heading aliases in the full preset', async ({
        mount,
        editor,
    }) => {
        await mount(<ContextualToolbars initialConfig="default" />);
        await editor.press('ControlOrMeta+a');
        await expect(
            editor.locators.toolbars.selection.getByTestId('g-md-toolbar-text-select'),
        ).toBeVisible();
        await expect(editor.locators.toolbars.selection.getByLabel('Text color')).toBeVisible();
        await editor.fill('');
        await editor.pressSequentially('/h2');
        await expect(editor.locators.toolbars.commandMenu).toContainText('Heading 2');
        await editor.press('Enter');
        await editor.pressSequentially('Default heading');
        await expect(editor.locators.contenteditable.locator('h2')).toHaveText('Default heading');
    });
});
