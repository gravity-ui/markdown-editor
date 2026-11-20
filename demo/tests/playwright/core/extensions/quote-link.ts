import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class QuoteLinkBlock {
    readonly blocks: Locator;
    readonly previewBlocks: Locator;
    readonly form: Locator;

    constructor(page: Page) {
        this.blocks = page.locator('.ProseMirror blockquote.yfm-quote-link');
        this.previewBlocks = page.getByTestId('demo-md-preview').locator('.yfm-quote-link');
        this.form = page.getByTestId('g-md-link-form');
    }
}

type QuoteLinkFixtures = {quoteLink: QuoteLinkBlock};
type Test = ReturnType<typeof base.extend<QuoteLinkFixtures>>;

export const test: Test = base.extend<QuoteLinkFixtures>({
    quoteLink: async ({page}, use) => {
        await use(new QuoteLinkBlock(page));
    },
});
