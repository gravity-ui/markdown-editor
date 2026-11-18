import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class FoldingHeadingBlock {
    readonly headings: Locator;
    readonly hiddenContent: Locator;
    readonly previewSections: Locator;

    constructor(page: Page) {
        this.headings = page.locator('.ProseMirror :is(h1, h2, h3, h4, h5, h6)[data-folded]');
        this.hiddenContent = page.locator('.ProseMirror .pm-h-folding-hidden');
        this.previewSections = page.getByTestId('demo-md-preview').locator('.heading-section');
    }

    heading(name: string) {
        return this.headings.filter({hasText: name});
    }
}

type FoldingHeadingFixtures = {foldingHeading: FoldingHeadingBlock};
type Test = ReturnType<typeof base.extend<FoldingHeadingFixtures>>;

export const test: Test = base.extend<FoldingHeadingFixtures>({
    foldingHeading: async ({page}, use) => {
        await use(new FoldingHeadingBlock(page));
    },
});
