import type {Locator} from '@playwright/test';
import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

// A point right of the last character of a single-line text block
async function endOfText(locator: Locator) {
    const box = await locator.boundingBox();
    if (!box) throw new Error('The text block is not visible');
    return {x: box.width - 1, y: box.height / 2};
}

test.describe('Note', () => {
    test.beforeEach(async ({editor, mount}) => {
        await mount(<Playground initial={''} />);
        await editor.switchMode('wysiwyg');
    });

    test.describe('insert', () => {
        test('should insert via toolbar @wysiwyg', async ({wait, editor}) => {
            await editor.clickAdditionalToolbarButton('Note');
            await wait.hidden(editor.locators.toolbars.additional);

            await editor.assertAdditionalToolbarButtonEnabled('Note');
            // A menu still closing after an outside click is taken as open by the next assertion
            await editor.hideToolbarMoreMenu();

            // ArrowUp from the empty note content reaches the empty title only on some runs
            await editor.getBySelectorInContenteditable('.yfm-note-title').click();

            await editor.assertAdditionalToolbarButtonDisabled('Note');
        });

        test('should insert via command menu @wysiwyg', async ({editor, actions, wait}) => {
            await editor.openCommandMenuToolbar('no');

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
            const selection = page.locator('.playground__pm-selection');
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

            const nestedTitle = page.getByText('Nested note title').first();
            const nestedContent = page.getByText('Add content for nested note').first();
            await wait.visible(nestedTitle);

            // A click on the note edge selects the whole note, and the toolbar turns that into
            // a text selection only when the click is short, so the text of the note is selected instead
            await nestedTitle.click({position: {x: 1, y: 10}});
            await nestedContent.click({
                modifiers: ['Shift'],
                position: await endOfText(nestedContent),
            });
            await editor.waitForTextSelectionInside(nestedTitle, 'yfm_note');

            await expect(selection).toContainText('TextSelection');
            const nestedSelection = await selection.innerText();
            await editor.yfmNote.clickYfmNoteToolbarButton('Alert');
            await page.mouse.move(-1, -1);
            await wait.timeout(500);

            await expect(editor.locators.contenteditable).toBeFocused();
            await expect(selection).toHaveText(nestedSelection, {useInnerText: true});
            await expectScreenshot({nameSuffix: 'nested-note-is-alert'});

            const parentTitle = page.getByText('Parent note title').first();
            await wait.visible(parentTitle);

            await parentTitle.click({position: {x: 1, y: 10}});
            await nestedContent.click({
                modifiers: ['Shift'],
                position: await endOfText(nestedContent),
            });
            await editor.waitForTextSelectionInside(parentTitle, 'yfm_note');

            await expect(selection).toContainText('TextSelection');
            const parentSelection = await selection.innerText();
            await editor.yfmNote.clickYfmNoteToolbarButton('Note');
            await page.mouse.move(-1, -1);
            await wait.timeout(500);

            await expect(editor.locators.contenteditable).toBeFocused();
            await expect(selection).toHaveText(parentSelection, {useInnerText: true});
            await expectScreenshot({nameSuffix: 'parent-note-is-info'});
        });
    });
});
