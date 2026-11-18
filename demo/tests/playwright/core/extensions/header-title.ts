import type {Locator, Page} from '@playwright/test';

import {test as base} from './header';
import {ToolbarBlock} from './preview-block';

export class HeaderTitleBlock extends ToolbarBlock {
    readonly sizeButton: Locator;
    readonly colorButton: Locator;

    constructor(page: Page, preview: Locator) {
        super(page, preview, '.g-md-header-title-plugin', 'g-md-toolbar-header-title');
        this.sizeButton = this.toolbar.getByRole('button', {name: /^Title size: /});
        this.colorButton = this.toolbar.getByRole('button', {name: /^Title color: /});
    }

    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                size: element.getAttribute('aria-level'),
                color: element.getAttribute('data-color') ?? 'auto',
                text: element.textContent?.trim(),
            })),
        );
    }

    getMarkup() {
        return this.blocks.page().evaluate(() => window.mdEditor?.getValue());
    }

    getParentColors(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) =>
                element.parentElement ? getComputedStyle(element.parentElement).color : '',
            ),
        );
    }
}

type HeaderTitleFixtures = {headerTitle: HeaderTitleBlock};
type Test = ReturnType<typeof base.extend<HeaderTitleFixtures>>;

export const test: Test = base.extend<HeaderTitleFixtures>({
    headerTitle: async ({page, editor}, use) => {
        await use(new HeaderTitleBlock(page, editor.locators.previewContent));
    },
});
