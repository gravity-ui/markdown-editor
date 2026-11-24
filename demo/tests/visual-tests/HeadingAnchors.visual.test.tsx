import type {Page} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {HeadingAliasViewer, ViewerStories} from './MarkdownViewer.helpers';

test.describe('MarkdownViewer heading anchors', () => {
    for (const attribute of ['id', 'name'] as const) {
        test(`should scroll to a legacy ${attribute} alias while hiding its old control`, async ({
            mount,
            page,
        }) => {
            await page.addStyleTag({content: 'h2 { scroll-margin-block-start: 64px; }'});
            await mount(<HeadingAliasViewer attribute={attribute} />, {width: 700});
            const heading = page.locator('h2#heading');
            await expect(heading).toBeAttached();
            await expect(heading).not.toBeInViewport();

            await page.getByRole('link', {name: 'Go to heading'}).click();
            await expect.poll(async () => (await heading.boundingBox())?.y).toBeCloseTo(64, 0);
            await page.getByRole('link', {name: 'Go to alias'}).click();

            await expect.poll(async () => (await heading.boundingBox())?.y).toBeCloseTo(64, 0);
            const alias = heading.locator(`[${attribute}="legacy-alias"]`);
            await expect(alias).toBeHidden();

            await page.getByRole('link', {name: 'Go to alias'}).focus();
            await page.keyboard.press('Tab');
            await expect(
                heading.getByRole('button', {name: 'Copy link', exact: true}),
            ).toBeFocused();

            const layout = await measureAliasLayout(page);
            expect(
                await alias.evaluate((element) => element.getBoundingClientRect().toJSON()),
            ).toMatchObject({
                x: layout.heading?.x,
                y: layout.heading?.y,
                width: 0,
                height: 0,
            });

            await alias.evaluate((element) => {
                element.style.setProperty('display', 'none');
            });
            expect(await measureAliasLayout(page)).toEqual(layout);
        });
    }

    test('should preserve a custom scroll margin on the fragment target', async ({mount, page}) => {
        await page.addStyleTag({content: ':target { scroll-margin-block-start: 64px; }'});
        await mount(<HeadingAliasViewer attribute="id" />, {width: 700});
        const heading = page.locator('h2#heading');
        await expect(heading).toBeAttached();

        await page.getByRole('link', {name: 'Go to heading'}).click();
        await expect.poll(async () => (await heading.boundingBox())?.y).toBeCloseTo(64, 0);
        await page.getByRole('link', {name: 'Go to alias'}).click();
        await expect.poll(async () => (await heading.boundingBox())?.y).toBeCloseTo(64, 0);
    });

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

async function measureAliasLayout(page: Page) {
    return page.evaluate(() => ({
        heading: document.querySelector('h2#heading')?.getBoundingClientRect().toJSON(),
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
    }));
}

async function hoverHeadings(page: Page) {
    const devtools = await page.context().newCDPSession(page);
    await devtools.send('DOM.enable');
    await devtools.send('CSS.enable');
    const {root} = await devtools.send('DOM.getDocument');
    const {nodeIds} = await devtools.send('DOM.querySelectorAll', {
        nodeId: root.nodeId,
        selector: '[data-qa="demo-markdown-viewer"] .g-md-v-heading-anchor',
    });
    for (const nodeId of nodeIds) {
        await devtools.send('CSS.forcePseudoState', {nodeId, forcedPseudoClasses: ['hover']});
    }
    return devtools;
}
