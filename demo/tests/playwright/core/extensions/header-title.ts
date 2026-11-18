import type {Locator, Page} from '@playwright/test';

import {test as base} from './header';

const SELECTOR = '.g-md-header-title-plugin';

export class HeaderTitleBlock {
    readonly blocks: Locator;
    readonly previews: Locator;
    readonly placeholders: Locator;
    readonly toolbar: Locator;
    readonly sizeButton: Locator;
    readonly colorButton: Locator;
    readonly menu: Locator;
    readonly menuItems: Locator;

    constructor(page: Page, preview: Locator) {
        this.blocks = page.locator(`.ProseMirror ${SELECTOR}`);
        this.previews = preview.locator(SELECTOR);
        this.placeholders = this.blocks.locator('.g-md-placeholder');
        this.toolbar = page.getByTestId('g-md-toolbar-header-title');
        this.sizeButton = this.toolbar.getByRole('button', {name: /^Title size: /});
        this.colorButton = this.toolbar.getByRole('button', {name: /^Title color: /});
        this.menu = page.getByTestId('g-md-toolbar-menu');
        this.menuItems = this.menu.getByRole('menuitem');
    }

    menuItem(name: string) {
        return this.menu.getByRole('menuitem', {name, exact: true});
    }

    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                size: element.className.match(/_size_(\d)/)?.[1],
                color: element.getAttribute('data-color') ?? 'auto',
                text: element.textContent?.trim(),
            })),
        );
    }

    getStyles(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {fontSize, lineHeight, fontWeight, color} = getComputedStyle(element);
                return {fontSize, lineHeight, fontWeight, color};
            }),
        );
    }

    getLineCounts(blocks = this.blocks) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) =>
                Math.round(
                    element.getBoundingClientRect().height /
                        parseFloat(getComputedStyle(element).lineHeight),
                ),
            ),
        );
    }

    hasHorizontalScroll(blocks = this.blocks) {
        return blocks.evaluateAll((elements) =>
            elements.some((element) => element.scrollWidth > element.clientWidth),
        );
    }

    getMarkup() {
        return this.blocks.page().evaluate(() => window.mdEditor?.getValue());
    }
}

type HeaderTitleFixtures = {headerTitle: HeaderTitleBlock};
type Test = ReturnType<typeof base.extend<HeaderTitleFixtures>>;

export const test: Test = base.extend<HeaderTitleFixtures>({
    headerTitle: async ({page, editor}, use) => {
        await use(new HeaderTitleBlock(page, editor.locators.previewContent));
    },
});
