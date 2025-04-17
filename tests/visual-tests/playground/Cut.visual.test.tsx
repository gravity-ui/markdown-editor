import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Cut', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = dd`
            ## YFM Cut

            {% cut "Cut header" %}

            Content displayed when clicked.

            {% endcut %}

            {% cut "Cut with nested сut header" %}

            {% cut "Cut inside cut header" %}

            Content displayed when clicked.

            {% endcut %}

            {% endcut %}
        `;

        await mount(<Playground initial={initialMarkup} />);
    });

    test.skip('should open second cut', async ({expectScreenshot, editor, page, wait}) => {
        await editor.switchMode('wysiwyg');
        const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
        await wait.visible(nestedCut);

        // Clicking by MouseEvent because YfmCutController relies on event bubbling to document
        // https://github.com/diplodoc-platform/cut-extension/blob/master/src/runtime/controller.ts#L9
        await nestedCut.dispatchEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
        });

        await wait.timeout();
        await expectScreenshot();
    });

    test.skip('should cut inside open second cut', async ({
        expectScreenshot,
        editor,
        page,
        wait,
    }) => {
        await editor.switchMode('wysiwyg');

        const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
        await wait.visible(nestedCut);

        await nestedCut.dispatchEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        await wait.timeout();

        // click to cut inside
        const cutInsideNestedCut = page.getByText('Cut inside cut header').first().locator('..');
        await wait.visible(cutInsideNestedCut);

        await cutInsideNestedCut.dispatchEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
        });

        await wait.timeout();
        await expectScreenshot();
    });

    test.skip('should open second cut in preview', async ({
        editor,
        page,
        expectScreenshot,
        wait,
    }) => {
        await editor.switchPreview('visible');

        const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
        await wait.visible(nestedCut);

        await nestedCut.click();

        await wait.timeout();
        await expectScreenshot();
    });

    test.skip('should insert cut block via command menu', async ({page, editor, actions, wait}) => {
        await editor.switchPreview('hidden');
        await editor.switchMode('wysiwyg');
        await editor.clearContent();

        await editor.pressSequentially('/c');
        await expect(page.getByTestId('g-md-command-menu')).toBeVisible();

        const cutMenu = editor.getByTextInCommandMenu('Cut').first();
        await wait.visible(cutMenu);

        await cutMenu.click();

        await expect(
            editor.getBySelectorInContenteditable('.g-md-yfm-cut-title-inner'),
        ).toBeVisible();

        await editor.pressSequentially('title');
        await actions.pressFocused('Enter');
        await editor.pressSequentially('content');
        await wait.timeout();

        await expect(editor.getByTextInContenteditable('title')).toBeVisible();
        await expect(editor.getByTextInContenteditable('content')).toBeVisible();
    });

    test.skip('should insert cut via short code', async ({page, editor, actions, wait}) => {
        await editor.switchMode('markup');
        await editor.clearContent();

        await editor.pressSequentially('{%');
        await expect(page.getByText('YFM Cut')).toBeVisible();
        await wait.timeout(300);

        await actions.pressFocused('Enter');
        await wait.timeout(300);

        await expect(editor.getByTextInContenteditable('{% cut "title" %}')).toBeVisible();
    });

    test.skip('should display cut block content in markup mode', async ({editor, wait}) => {
        const cutMarkup = '{% cut "Cut header" %}\nHidden content\n{% endcut %}';
        await editor.switchMode('markup');
        await editor.fill(cutMarkup);
        await wait.timeout();

        await expect(editor.getByTextInContenteditable('Cut header')).toBeVisible();
        await expect(editor.getByTextInContenteditable('Hidden content')).toBeVisible();
        await expect(editor.getByTextInContenteditable('{% endcut %}')).toBeVisible();
    });

    test.skip('should insert cut block via input rule when typing {% cut', async ({
        editor,
        wait,
    }) => {
        await editor.inputRule('{% cut');
        await wait.timeout();

        const cutBlock = editor.getByTextInContenteditable('Cut title').first();
        await expect(cutBlock).toBeVisible();
    });

    test('should insert cut via toolbar in WYSIWYG and highlight toolbar button when inside cut', async ({
        editor,
        page,
        wait,
    }) => {
        await editor.switchMode('wysiwyg');
        await editor.clearContent();

        await editor.clickToolbarButton('cut');
        await wait.timeout();

        const cutButton = page.locator('[data-qa="g-md-toolbar-cut"]');
        await expect(cutButton).toHaveClass(/g-button_disabled/);

        await editor.press('ArrowDown');
        await editor.press('ArrowDown');
        await editor.press('ArrowDown');
        await wait.timeout();

        await expect(cutButton).not.toHaveClass(/g-button_disabled/);
    });
});
