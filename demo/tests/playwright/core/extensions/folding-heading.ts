import type {Expect, Locator, Page} from '@playwright/test';

import {test as base, expect} from '../index';

export class FoldingHeadingBlock {
    readonly headings: Locator;
    readonly hiddenContent: Locator;
    readonly visibleContent: Locator;
    protected readonly page: Page;
    protected readonly expect: Expect;

    constructor(page: Page, expect: Expect) {
        this.page = page;
        this.expect = expect;
        this.headings = page.locator('.ProseMirror :is(h1, h2, h3, h4, h5, h6)[data-folded]');
        this.hiddenContent = page.locator('.ProseMirror .pm-h-folding-hidden');
        this.visibleContent = page.locator('.ProseMirror .pm-h-folding-content');
    }

    heading(name: string) {
        return this.headings.filter({hasText: name});
    }

    /** Clicks the chevron in the left padding of the heading */
    async clickChevron(name: string) {
        const heading = this.heading(name);
        await this.expect(heading).toBeVisible();
        await heading.click({position: {x: 10, y: 10}});
    }

    /** Moves the mouse off the toolbar button and waits for its tooltip to hide */
    async hideTooltip() {
        await this.page.mouse.move(0, 0);
        await this.expect(this.page.getByRole('tooltip')).toBeHidden();
    }
}

type FoldingHeadingFixtures = {foldingHeading: FoldingHeadingBlock};
type Test = ReturnType<typeof base.extend<FoldingHeadingFixtures>>;

export const test: Test = base.extend<FoldingHeadingFixtures>({
    foldingHeading: async ({page}, use) => {
        await use(new FoldingHeadingBlock(page, expect));
    },
});
