import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class ButtonBlock {
    readonly blocks: Locator;

    constructor(page: Page) {
        this.blocks = page.locator('.ProseMirror .g-md-button-plugin');
    }
}

type ButtonFixtures = {button: ButtonBlock};
type Test = ReturnType<typeof base.extend<ButtonFixtures>>;

export const test: Test = base.extend<ButtonFixtures>({
    button: async ({page}, use) => {
        await use(new ButtonBlock(page));
    },
});
