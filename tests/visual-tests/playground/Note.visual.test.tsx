import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Note', () => {
    test.beforeEach(async ({editor, mount}) => {
        await mount(<Playground initial={''} />);
        await editor.switchMode('wysiwyg');
    });

    test.describe('insert', () => {
        test('should insert via toolbar @wysiwyg', async ({wait, editor}) => {
            await editor.clickAdditionalToolbarButton('Note');
            await wait.timeout();

            await editor.assertAdditionalToolbarButtonEnabled('Note');

            await editor.focus();
            await wait.timeout();

            // TODO: figure out why we need to press ArrowUp twice in this test
            await editor.press('ArrowUp', 2);

            await editor.assertAdditionalToolbarButtonDisabled('Note');
        });

        test('should insert via command menu @wysiwyg', async ({page, editor, actions, wait}) => {
            await editor.pressSequentially('/no');
            await expect(page.getByTestId('g-md-toolbar-command-menu')).toBeVisible();

            const noteMenu = editor.getByTextInCommandMenu('Note').first();
            await wait.visible(noteMenu);

            await noteMenu.click();
            await wait.timeout(300);

            await expect(editor.getBySelectorInContenteditable('.yfm-note-title')).toBeVisible();
            await editor.press('ArrowUp');

            await editor.pressSequentially('title');
            await actions.pressFocused('Enter');
            await editor.press('ArrowDown');

            await editor.pressSequentially('content');
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('title')).toBeVisible();
            await expect(editor.getByTextInContenteditable('content')).toBeVisible();
        });

        // TODO: Investigate why keyboard shortcuts don't work reliably in the test environment
        test.skip('should insert via keyboard shortcut @wysiwyg', async ({editor, wait}) => {
            test.skip(true, 'key combo fails in headless mode');

            await editor.press('Control+Alt+8');
            await wait.timeout();

            const noteBlock = editor.getByTextInContenteditable('Note title').first();
            await expect(noteBlock).toBeVisible();
        });

        test('should insert via toolbar @markup', async ({editor}) => {
            await editor.switchMode('markup');

            await editor.clickAdditionalToolbarButton('Note');

            await expect(editor.getByTextInContenteditable('{% note info %}')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            const markup = dd`
                ## YFM Note

                {% note warning "Note title" %}

                Add content for note

                {% endnote %}

                next text
            `;

            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('Note title')).toBeVisible();
            await expect(editor.getByTextInContenteditable('Add content for note')).toBeVisible();
            await expect(editor.getByTextInContenteditable('{% endnote %}')).toBeVisible();

            await editor.switchMode('wysiwyg');
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('Note title')).toBeVisible();
            await expect(editor.getByTextInContenteditable('Add content for note')).toBeVisible();
            await expect(editor.getByTextInContenteditable('{% endnote %}')).toBeHidden();
        });
    });

    test.describe('specific', () => {
        test('should update styles independently for nested and parent notes', async ({
            expectScreenshot,
            editor,
            page,
            wait,
        }) => {
            const markup = dd`
                ## YFM Note

                {% note warning "Parent note title" %}

                Add content for note

                {% note info "Nested note title" %}

                Add content for nested note

                {% endnote %}

                {% endnote %}

                next text
            `;

            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout(300);

            await editor.switchMode('wysiwyg');
            await wait.timeout();

            const nestedNote = page.getByText('Nested note title').first().locator('..');
            await wait.visible(nestedNote);

            await nestedNote.click({
                position: {
                    x: 10,
                    y: 10,
                },
            });

            await editor.yfmNote.clickYfmNoteToolbarButton('Alert');
            await page.mouse.move(-1, -1);
            await wait.timeout(500);

            await expectScreenshot({nameSuffix: 'nested-note-is-alert'});

            const parentNote = page.getByText('Parent note title').first().locator('..');
            await wait.visible(parentNote);

            await parentNote.click({
                position: {
                    x: 10,
                    y: 10,
                },
            });
            await wait.timeout();

            await editor.yfmNote.clickYfmNoteToolbarButton('Note');
            await page.mouse.move(-1, -1);
            await wait.timeout(500);

            await expectScreenshot({nameSuffix: 'parent-note-is-info'});
        });
    });
});
