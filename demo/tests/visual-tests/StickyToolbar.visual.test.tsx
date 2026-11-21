import {expect, test} from 'playwright/core';

import {StickyToolbar} from './StickyToolbar.helpers';

test.describe('Sticky toolbar', () => {
    for (const offset of ['0px', 'calc(5px + 7.5px)']) {
        test(`should track nested scrolling with inherited offset ${offset}`, async ({
            mount,
            page,
        }) => {
            await mount(<StickyToolbar offset={offset} />);
            const container = page.getByTestId('sticky-scroll-container');
            const toolbar = page.locator('.g-md-editor-sticky').first();
            await expect(toolbar).not.toHaveClass(/g-md-editor-sticky_sticky-active/);
            await container.evaluate((element) => {
                element.scrollTop = 100;
            });
            await expect(toolbar).toHaveClass(/g-md-editor-sticky_sticky-active/);
            const position = await toolbar.evaluate((element) => {
                const parent = element.closest(
                    '[data-qa="sticky-scroll-container"]',
                ) as HTMLElement;
                return {
                    actual: element.getBoundingClientRect().top,
                    expected:
                        parent.getBoundingClientRect().top +
                        parent.clientTop +
                        parseFloat(getComputedStyle(element).top),
                };
            });
            expect(position.actual).toBeCloseTo(position.expected, 1);
            await container.evaluate((element) => {
                element.scrollTop = 0;
            });
            await expect(toolbar).not.toHaveClass(/g-md-editor-sticky_sticky-active/);
        });
    }
});
