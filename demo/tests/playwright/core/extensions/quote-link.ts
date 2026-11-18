import type {Expect, Locator, Page} from '@playwright/test';

import {test as base, expect} from '../index';

export class QuoteLinkBlock {
    readonly blocks: Locator;
    readonly form: Locator;
    readonly url: Locator;
    readonly text: Locator;
    readonly submitButton: Locator;
    protected readonly page: Page;
    protected readonly expect: Expect;

    constructor(page: Page, expect: Expect) {
        this.page = page;
        this.expect = expect;
        this.blocks = page.locator('.ProseMirror blockquote.yfm-quote-link');
        this.form = page.getByTestId('g-md-link-form');
        this.url = this.form.getByPlaceholder('Link address', {exact: true});
        this.text = this.form.getByPlaceholder('The text that will be displayed as a link', {
            exact: true,
        });
        this.submitButton = this.form.getByRole('button', {name: 'Add link', exact: true});
    }

    async addLink(url: string, text: string) {
        await this.expect(this.form).toBeVisible();
        await this.url.fill(url);
        await this.text.fill(text);
        await this.submitButton.click();
        await this.expect(this.form).toBeHidden();
    }
}

type QuoteLinkFixtures = {quoteLink: QuoteLinkBlock};
type Test = ReturnType<typeof base.extend<QuoteLinkFixtures>>;

export const test: Test = base.extend<QuoteLinkFixtures>({
    quoteLink: async ({page}, use) => {
        await use(new QuoteLinkBlock(page, expect));
    },
});
