import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Sticky toolbar', () => {
    for (const mode of ['wysiwyg', 'markup'] as const) {
        for (const offset of [0, 0.5]) {
            test(`keeps both toolbar parts opaque and clickable with offset ${offset} in ${mode}`, async ({
                mount,
                page,
                editor,
            }) => {
                await mount(
                    <Playground
                        initial={'Paragraph\n\n'.repeat(100)}
                        initialEditor={mode}
                        stickyToolbar
                    />,
                    {
                        hidePlaygroundBlocks: true,
                        width: 812,
                        rootStyle: {paddingTop: 200},
                        styles: `.playwright-wrapper-test {--g-md-toolbar-sticky-offset: ${offset}px;}`,
                    },
                );

                const parts = page.locator('.g-md-editor-sticky_sticky');
                await expect(parts).toHaveCount(2);
                for (const part of await parts.all()) {
                    await expect(part).not.toHaveClass(/g-md-editor-sticky_sticky-active/);
                }

                await page.evaluate(() => window.scrollTo(0, 500));

                for (const part of await parts.all()) {
                    await expect(part).toHaveClass(/g-md-editor-sticky_sticky-active/);
                    await expect(part).toHaveCSS('position', 'sticky');
                    await expect(part).not.toHaveCSS('z-index', 'auto');
                    expect(
                        await part.evaluate(
                            (element) => getComputedStyle(element, '::before').backgroundColor,
                        ),
                    ).not.toBe('rgba(0, 0, 0, 0)');
                }

                await editor.openMainToolbarMoreMenu();
                await editor.hideToolbarMoreMenu();
                await editor.openSettingsPopup();
                await expect(editor.locators.settingsContent).toBeVisible();
                await page.keyboard.press('Escape');

                await page.evaluate(() => window.scrollTo(0, 0));
                for (const part of await parts.all()) {
                    await expect(part).not.toHaveClass(/g-md-editor-sticky_sticky-active/);
                }
            });
        }
    }
});
