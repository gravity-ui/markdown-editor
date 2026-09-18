import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test('Sticky toolbar keeps its layer and background at a fractional offset', async ({
    mount,
    page,
}) => {
    await mount(
        <Playground initial={'Paragraph\n\n'.repeat(100)} initialEditor="wysiwyg" stickyToolbar />,
        {
            hidePlaygroundBlocks: true,
            width: 812,
            rootStyle: {paddingTop: 200},
            styles: '.playwright-wrapper-test {--g-md-toolbar-sticky-offset: 0.5px;}',
        },
    );

    const parts = page.locator('.g-md-editor-sticky_sticky');
    await expect(parts).toHaveCount(2);

    await page.evaluate(() => window.scrollTo(0, 500));

    for (const part of await parts.all()) {
        await expect(part).toHaveClass(/g-md-editor-sticky_sticky-active/);
        await expect(part).not.toHaveCSS('z-index', 'auto');
        expect(
            await part.evaluate((element) => getComputedStyle(element, '::before').backgroundColor),
        ).not.toBe('rgba(0, 0, 0, 0)');
    }
});
