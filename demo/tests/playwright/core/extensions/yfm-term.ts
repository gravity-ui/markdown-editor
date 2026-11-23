import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class TermBlock {
    readonly references: Locator;
    readonly form: Locator;
    readonly label: Locator;
    readonly definition: Locator;

    constructor(page: Page, editable: Locator) {
        this.references = editable.locator('.g-md-yfm-term-node-view');
        this.form = page.getByRole('dialog', {name: 'Term', exact: true});
        this.label = this.form.getByRole('textbox', {name: 'Label', exact: true});
        this.definition = this.form.getByRole('textbox', {name: 'Definition', exact: true});
    }

    async openForm() {
        await this.references.first().click();
        await this.form.waitFor({state: 'visible'});
    }
}

type TermFixtures = {term: TermBlock};
type Test = ReturnType<typeof base.extend<TermFixtures>>;

export const test: Test = base.extend<TermFixtures>({
    term: async ({page, editor}, use) => {
        await use(new TermBlock(page, editor.locators.contenteditable));
    },
});
