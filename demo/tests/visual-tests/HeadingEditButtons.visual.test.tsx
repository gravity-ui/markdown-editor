import type {Page} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {Playground} from './playground/Playground.helpers';

test.describe('MarkdownViewer heading edit buttons', () => {
    const headingText =
        'Target heading that wraps over several lines in the narrow preview and ends here';
    const source = `# Start\n\n${Array.from({length: 60}, (_, i) => `Paragraph ${i + 1}.`).join('\n\n')}\n\n## ${headingText}`;

    test('should move the cursor and focus the source in split preview @markup', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(
            <Playground
                initial={source}
                initialEditor="markup"
                initialSplitModeEnabled
                width={900}
                height={480}
            />,
            {width: 1000},
        );
        const heading = page
            .getByTestId('demo-md-preview')
            .getByRole('heading', {name: headingText});
        const button = heading.getByRole('button', {name: 'Edit'});
        await button.focus();
        await expect(button.locator('..')).toHaveCSS('opacity', '1');
        const layout = await heading.evaluate((element) => {
            const text = Array.from(element.childNodes).find(
                (node) => node.nodeType === Node.TEXT_NODE,
            );
            const edit = element.querySelector('[aria-label="Edit"]');
            if (!text || !edit) throw new Error('Heading text or edit button is missing');
            const range = document.createRange();
            range.selectNodeContents(text);
            const lines = range.getClientRects();
            const last = lines[lines.length - 1];
            const rect = edit.getBoundingClientRect();
            return {
                lines: lines.length,
                textRight: last.right,
                textCenter: (last.top + last.bottom) / 2,
                buttonLeft: rect.left,
                buttonRight: rect.right,
                headingRight: element.getBoundingClientRect().right,
                buttonCenter: (rect.top + rect.bottom) / 2,
            };
        });
        expect(layout.lines).toBeGreaterThan(1);
        expect(layout.buttonLeft).toBeGreaterThanOrEqual(layout.textRight);
        expect(layout.buttonRight).toBeLessThanOrEqual(layout.headingRight);
        expect(Math.abs(layout.buttonCenter - layout.textCenter)).toBeLessThan(3);
        await expectScreenshot({component: heading, themes: ['light']});
        await button.press('Enter');

        await expectSourceSelection(page, `## ${headingText}`);
    });

    test('should close full preview before focusing the source @markup', async ({mount, page}) => {
        await mount(
            <Playground initial={source} initialEditor="markup" width={900} height={480} />,
            {width: 1000},
        );
        await page.evaluate(() => {
            window.mdEditor?.moveCursor({line: 2});
            window.mdEditor?.changePreviewVisible(true);
        });
        await expect(page.locator('.cm-content')).toHaveCount(0);
        await page
            .getByTestId('demo-md-preview')
            .getByRole('heading', {name: headingText})
            .getByRole('button', {name: 'Edit'})
            .click();

        await expect(page.getByTestId('demo-md-preview')).toHaveCount(0);
        await expectSourceSelection(page, `## ${headingText}`);
    });

    test('should discard the edit request if full preview cannot close @markup', async ({
        mount,
        editor,
    }) => {
        await mount(<Playground initial={'Start\n\n## Target'} initialEditor="markup" />);
        const {contenteditable, settingsButton, settingsContent} = editor.locators;
        const splitMode = settingsContent.getByRole('checkbox', {name: 'Split mode'});

        await editor.press('Control+Home');
        await editor.switchPreview('visible');
        await settingsButton.click();
        await splitMode.check();
        await settingsButton.click();
        await editor.locators.editor
            .getByTestId('demo-md-preview')
            .getByRole('heading', {name: 'Target'})
            .getByRole('button', {name: 'Edit'})
            .click();

        await settingsButton.click();
        await splitMode.uncheck();
        await settingsButton.click();
        await editor.switchPreview('hidden');
        await editor.pressSequentially('Here: ');

        await expect(contenteditable.getByText('Here: Start', {exact: true})).toBeVisible();
    });
});

async function expectSourceSelection(page: Page, expectedLine: string) {
    await expect(page.locator('.cm-content')).toBeFocused();
    await expect
        .poll(() =>
            page.evaluate(() => {
                const node = window.getSelection()?.focusNode;
                const element = node instanceof Element ? node : node?.parentElement;
                return element?.closest('.cm-line')?.textContent;
            }),
        )
        .toBe(expectedLine);
    await expect
        .poll(() => page.locator('.cm-scroller').evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
}
