import type {Page} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {ViewerStories} from './MarkdownViewer.helpers';
import {Playground} from './playground/Playground.helpers';

test.describe('MarkdownViewer heading anchors', () => {
    test('should cover list markers beside every heading level', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<ViewerStories.HeadingLinks />, {width: 520});
        await page.evaluate(() => document.fonts.ready);
        const viewer = page.getByTestId('demo-markdown-viewer');
        const buttons = viewer.getByRole('button', {name: 'Copy link'});
        await expect(buttons).toHaveCount(6);
        for (const button of await buttons.all()) {
            await expect(button.locator('..')).toHaveCSS('height', '24px');
        }

        const devtools = await hoverHeadings(page);
        try {
            await expectScreenshot({
                component: viewer,
                themes: ['light'],
                style: '[aria-label^="Show ID "] {display: none;}',
            });
        } finally {
            await devtools.detach();
        }
    });

    test('should navigate without hiding the copy confirmation', async ({mount, page, context}) => {
        await context.grantPermissions(['clipboard-write']);
        await mount(<ViewerStories.HeadingLinks />, {width: 700});
        const heading = page.getByTestId('demo-markdown-viewer').locator('h2');
        const copy = heading.getByRole('button', {name: 'Copy link'});
        const expected = new URL(page.url());
        expected.hash = await heading.evaluate((element) => element.id);
        await copy.hover();
        await expect(page.getByText('Copy link', {exact: true})).toBeVisible();

        await copy.click();

        await expect(page.getByText('Copied', {exact: true})).toBeVisible();
        await expect(page).toHaveURL(expected.href);
        await expect(copy).toBeFocused();
    });

    test('should use the background override in colored containers', async ({mount, page}) => {
        await mount(<ViewerStories.HeadingLinks />, {width: 700});
        await page.getByRole('radio', {name: 'Backgrounds'}).check();
        const viewer = page.getByTestId('demo-markdown-viewer');
        const pageBackground = await viewer.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
        );
        const containers = viewer.locator('.yfm-note, td[data-bg="green-light"]');
        await expect(containers).toHaveCount(2);
        for (const container of await containers.all()) {
            const background = await container.evaluate(
                (element) => getComputedStyle(element).backgroundColor,
            );
            expect(background).not.toBe(pageBackground);
            await expect(container.getByRole('button', {name: 'Copy link'})).toHaveCSS(
                'background-color',
                background,
            );
        }
    });

    test('should keep copy buttons beside folding togglers at every heading level', async ({
        mount,
        page,
        context,
        expectScreenshot,
    }) => {
        await context.grantPermissions(['clipboard-write']);
        await mount(<ViewerStories.HeadingLinks />, {width: 520});
        await page.getByRole('radio', {name: 'Folding headings'}).check();
        const viewer = page.getByTestId('demo-markdown-viewer');
        await expect(viewer.getByRole('button', {name: 'Copy link'})).toHaveCount(6);
        const devtools = await hoverHeadings(page);
        try {
            await expectScreenshot({
                component: viewer,
                themes: ['light'],
                style: '[aria-label^="Show ID "] {display: none;}',
            });
        } finally {
            await devtools.detach();
        }
        const heading = viewer.locator('h2');
        const content = heading.locator('..').getByText('Section 2.', {exact: true});
        await heading.click({position: {x: 14, y: 14}});
        await expect(content).toBeVisible();
        await heading.getByRole('button', {name: 'Copy link'}).click();
        await expect(content).toBeVisible();
    });

    test('should show the anchor on hover and keyboard focus', async ({mount, page}) => {
        await mount(<ViewerStories.HeadingLinks />, {width: 700});
        const viewer = page.getByTestId('demo-markdown-viewer');
        const heading = viewer.locator('h2');
        const copy = heading.getByRole('button', {name: 'Copy link'});
        await page.mouse.move(0, 0);
        await expect(copy.locator('..')).toHaveCSS('opacity', '0');
        await expect(heading.locator('.yfm-anchor')).toBeHidden();

        await heading.getByLabel(/^Show ID /).focus();
        await page.keyboard.press('Tab');
        await expect(copy).toBeFocused();
        await expect(copy.locator('..')).toHaveCSS('opacity', '1');

        await page.keyboard.press('Tab');
        await expect(copy.locator('..')).toHaveCSS('opacity', '0');
        await heading.hover();
        await expect(copy.locator('..')).toHaveCSS('opacity', '1');
    });
});

test.describe('MarkdownViewer heading edit buttons', () => {
    const headingText =
        'Target heading that wraps over several lines in the narrow preview and ends here';
    const source = `# Start\n\n${Array.from({length: 60}, (_, i) => `Paragraph ${i + 1}.`).join('\n\n')}\n\n## ${headingText}`;

    test('should move the cursor and focus the source in split preview', async ({mount, page}) => {
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
        const button = heading.getByRole('button', {name: 'Edit section'});
        await button.focus();
        await expect(button.locator('..')).toHaveCSS('opacity', '1');
        const layout = await heading.evaluate((element) => {
            const text = Array.from(element.childNodes).find(
                (node) => node.nodeType === Node.TEXT_NODE,
            );
            const edit = element.querySelector('[aria-label="Edit section"]');
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
                buttonCenter: (rect.top + rect.bottom) / 2,
            };
        });
        expect(layout.lines).toBeGreaterThan(1);
        expect(layout.buttonLeft).toBeGreaterThanOrEqual(layout.textRight);
        expect(Math.abs(layout.buttonCenter - layout.textCenter)).toBeLessThan(3);
        await button.press('Enter');

        await expectSourceSelection(page, `## ${headingText}`);
    });

    test('should close full preview before focusing the source', async ({mount, page}) => {
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
            .getByRole('button', {name: 'Edit section'})
            .click();

        await expect(page.getByTestId('demo-md-preview')).toHaveCount(0);
        await expectSourceSelection(page, `## ${headingText}`);
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

async function hoverHeadings(page: Page) {
    const devtools = await page.context().newCDPSession(page);
    await devtools.send('DOM.enable');
    await devtools.send('CSS.enable');
    const {root} = await devtools.send('DOM.getDocument');
    const {nodeIds} = await devtools.send('DOM.querySelectorAll', {
        nodeId: root.nodeId,
        selector: '[data-qa="demo-markdown-viewer"] .g-md-heading-anchor',
    });
    for (const nodeId of nodeIds) {
        await devtools.send('CSS.forcePseudoState', {nodeId, forcedPseudoClasses: ['hover']});
    }
    return devtools;
}
