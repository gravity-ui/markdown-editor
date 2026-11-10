import type {Expect, Locator, Page} from '@playwright/test';

import {test as base, expect} from '../index';

export class HeaderBlock {
    readonly blocks: Locator;
    readonly toolbar: Locator;
    readonly copyButton: Locator;
    readonly removeButton: Locator;
    protected readonly page: Page;
    protected readonly expect: Expect;

    constructor(page: Page, expect: Expect) {
        this.page = page;
        this.expect = expect;
        this.blocks = page.locator('.ProseMirror .g-md-header-plugin');
        this.toolbar = page.getByTestId('g-md-toolbar-header');
        this.copyButton = this.toolbar.getByRole('button', {name: 'Copy', exact: true});
        this.removeButton = this.toolbar.getByRole('button', {name: 'Delete', exact: true});
    }

    /** The editor opens with the cursor in the first block, which shows its toolbar. */
    async hideToolbar() {
        await this.expect(this.toolbar).toBeVisible();
        await this.page.keyboard.press('Escape');
        await this.expect(this.toolbar).toBeHidden();
    }
}

type HeaderFixtures = {header: HeaderBlock};
type Test = ReturnType<typeof base.extend<HeaderFixtures>>;

export const test: Test = base.extend<HeaderFixtures>({
    header: async ({page}, use) => {
        await use(new HeaderBlock(page, expect));
    },
});
