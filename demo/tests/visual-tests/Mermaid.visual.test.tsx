import {ThemeProvider} from '@gravity-ui/uikit';

import {expect, test} from 'playwright/core';

import {mermaidDocuments} from '../../src/stories/viewer/content';

import {ViewerStories} from './MarkdownViewer.helpers';

test.describe('MarkdownViewer Mermaid', () => {
    test('should render diagrams and update their theme', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<ViewerStories.Mermaid />, {width: 700});
        const viewer = page.getByTestId('demo-markdown-viewer');

        await expect(viewer.locator('.mermaid svg')).toHaveCount(1);
        await expect(viewer.locator('.mermaid svg')).toContainText('Hi Alice');
        await expectScreenshot({component: viewer, themes: ['light']});

        const actor = viewer.locator('rect.actor').first();
        const lightFill = await actor.evaluate((node) => getComputedStyle(node).fill);
        await page.emulateMedia({colorScheme: 'dark'});
        await expect(actor).not.toHaveCSS('fill', lightFill);
        await expectScreenshot({component: viewer, themes: ['dark']});
    });

    test('should zoom and reset a diagram with native controls', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<ViewerStories.Mermaid />, {width: 700});
        const viewer = page.getByTestId('demo-markdown-viewer');
        const diagram = viewer.locator('.mermaid');
        const svg = diagram.locator('[data-mermaid-zoom-allowed="1"] > svg');
        const actor = svg.locator('rect.actor').first();
        const menu = diagram.locator('.mermaid-zoom-menu');

        await svg.click();
        await expect(menu).toBeVisible();
        await expectScreenshot({component: diagram, themes: ['light']});

        const width = await actor.evaluate((node) => node.getBoundingClientRect().width);
        await svg.hover();
        await page.mouse.wheel(0, -1000);
        await expect
            .poll(() => actor.evaluate((node) => node.getBoundingClientRect().width))
            .toBeCloseTo(width * 2, 1);
        await menu.locator('[data-action="reset"]').click();
        await expect
            .poll(() => actor.evaluate((node) => node.getBoundingClientRect().width))
            .toBeCloseTo(width, 1);

        const lightFill = await actor.evaluate((node) => getComputedStyle(node).fill);
        await page.emulateMedia({colorScheme: 'dark'});
        await expect(actor).not.toHaveCSS('fill', lightFill);
        await svg.click();
        await expect(menu).toBeVisible();
        await expectScreenshot({component: diagram, themes: ['dark']});

        await viewer.getByRole('heading').click();
        await expect(menu).toHaveCount(0);
    });

    test('should isolate concurrent viewers with different themes', async ({mount, page}) => {
        const source = mermaidDocuments[0].source;
        await mount(
            <>
                <ThemeProvider theme="light" scoped>
                    <ViewerStories.Mermaid
                        documents={[{label: 'Diagrams', source: `${source}\n\n${source}`}]}
                    />
                </ThemeProvider>
                <ThemeProvider theme="dark" scoped>
                    <ViewerStories.Mermaid />
                </ThemeProvider>
            </>,
            {width: 700},
        );
        const viewers = page.getByTestId('demo-markdown-viewer');
        await expect(viewers.nth(0).locator('.mermaid svg')).toHaveCount(2);
        await expect(viewers.nth(1).locator('.mermaid svg')).toHaveCount(1);

        const lightFill = await viewers
            .nth(0)
            .locator('rect.actor')
            .first()
            .evaluate((node) => getComputedStyle(node).fill);
        await expect(
            viewers.nth(0).locator('.mermaid').nth(1).locator('rect.actor').first(),
        ).toHaveCSS('fill', lightFill);
        await expect(viewers.nth(1).locator('rect.actor').first()).not.toHaveCSS('fill', lightFill);
    });

    test('should keep the Mermaid syntax error visible', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<ViewerStories.Mermaid />, {width: 700});
        await page.getByRole('radio', {name: 'Invalid diagram'}).check();
        const viewer = page.getByTestId('demo-markdown-viewer');

        await expect(viewer.locator('.mermaid svg')).toContainText('Syntax error');
        await expectScreenshot({component: viewer});
    });
});
