import {expect, test} from 'playwright/core';
import dd from 'ts-dedent';

import {Playground} from './Playground.helpers';

test.describe('Cut', () => {
    test.beforeEach(async ({editor, mount}) => {
        await mount(<Playground initial={''} />);
        await editor.switchMode('wysiwyg');
    });

    test.describe('insert', () => {
        test('should insert via toolbar @wysiwyg', async ({wait, editor}) => {
            await editor.clickAdditionalToolbarButton('Cut');
            await wait.timeout();

            await editor.assertAdditionalToolbarButtonDisabled('Cut');

            await editor.press('ArrowDown');
            await wait.timeout();
            await editor.press('ArrowDown');

            await editor.assertAdditionalToolbarButtonDisabled('Cut');

            await editor.press('Enter');
            await wait.timeout();

            await editor.assertAdditionalToolbarButtonEnabled('Cut');
        });

        test('should insert via command menu @wysiwyg', async ({editor, actions, wait}) => {
            await editor.openCommandMenuToolbar('cu');

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

        test('should insert via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.inputRule('{% cut');
            await wait.timeout();

            const cutBlock = editor.getByTextInContenteditable('Cut title').first();
            await expect(cutBlock).toBeVisible();
        });

        // TODO: Investigate why keyboard shortcuts don't work reliably in the test environment
        test('should insert via keyboard shortcut @wysiwyg', async ({editor, wait}) => {
            test.skip(true, 'key combo fails in headless mode');

            await editor.press('Control+Alt+7');
            await wait.timeout();

            const cutBlock = editor.getByTextInContenteditable('Cut title').first();
            await expect(cutBlock).toBeVisible();
        });

        test('should insert via toolbar @markup', async ({editor}) => {
            await editor.switchMode('markup');

            await editor.clickAdditionalToolbarButton('Cut');

            await expect(editor.getByTextInContenteditable('{% cut "title" %}')).toBeVisible();
        });

        test('should insert via command menu @markup', async ({page, editor, actions, wait}) => {
            await editor.switchMode('markup');

            await editor.pressSequentially('{%');
            await expect(page.getByText('YFM Cut')).toBeVisible();
            await wait.timeout(300);

            await actions.pressFocused('Enter');
            await wait.timeout(300);

            await expect(editor.getByTextInContenteditable('{% cut "title" %}')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            const markup = dd`
                ## YFM Cut

                {% cut "Cut header" %}

                Hidden content

                {% endcut %}

                text
            `;

            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('Cut header')).toBeVisible();
            await expect(editor.getByTextInContenteditable('Hidden content')).toBeVisible();
            await expect(editor.getByTextInContenteditable('{% endcut %}')).toBeVisible();

            await editor.switchMode('wysiwyg');
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('Cut header')).toBeVisible();
            await expect(editor.getByTextInContenteditable('Hidden content')).toBeHidden();
        });
    });

    test.describe('specific', () => {
        test.beforeEach(async ({editor}) => {
            const markup = dd`
                ## YFM Cut

                {% cut "Cut header" %}

                Content displayed when clicked.

                {% endcut %}

                {% cut "Cut with nested сut header" %}

                {% cut "Cut inside cut header" %}

                Content displayed when clicked.

                {% endcut %}

                {% endcut %}

                text
            `;
            await editor.fill(markup);
        });

        test('should open second cut @wysiwyg', async ({expectScreenshot, page, wait}) => {
            const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
            await wait.visible(nestedCut);

            // Clicking by MouseEvent because YfmCutController relies on event bubbling to document
            // https://github.com/diplodoc-platform/cut-extension/blob/master/src/runtime/controller.ts#L9
            await nestedCut.dispatchEvent('click', {
                bubbles: true,
                cancelable: true,
                composed: true,
            });
            await wait.timeout(300);

            await expectScreenshot();
        });

        test('should cut inside open second cut @wysiwyg', async ({
            expectScreenshot,
            page,
            wait,
        }) => {
            const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
            await wait.visible(nestedCut);

            await nestedCut.dispatchEvent('click', {
                bubbles: true,
                cancelable: true,
                composed: true,
            });
            await wait.timeout();

            // click to cut inside
            const cutInsideNestedCut = page
                .getByText('Cut inside cut header')
                .first()
                .locator('..');
            await wait.visible(cutInsideNestedCut);

            await cutInsideNestedCut.dispatchEvent('click', {
                bubbles: true,
                cancelable: true,
                composed: true,
            });
            await wait.timeout(300);

            await expectScreenshot();
        });

        test('should open second cut in preview @markup', async ({
            editor,
            page,
            expectScreenshot,
            wait,
        }) => {
            await editor.switchPreview('visible');

            const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
            await wait.visible(nestedCut);

            await nestedCut.click();
            await wait.timeout(300);

            await expectScreenshot();
        });
    });
});
