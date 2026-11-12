import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class ButtonBlock {
    readonly blocks: Locator;
    readonly content: Locator;
    readonly preview: Locator;
    readonly variants: Locator;

    constructor(page: Page) {
        this.content = page.locator('.ProseMirror');
        this.blocks = this.content.locator('.g-md-button-plugin');
        this.preview = page.getByTestId('demo-md-preview');
        this.variants = this.preview.locator('.g-md-button-plugin');
    }

    getValues(blocks = this.blocks) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                view: element.getAttribute('data-view'),
                color: element.getAttribute('data-color'),
                text: element.textContent?.trim(),
            })),
        );
    }
}

type ButtonFixtures = {button: ButtonBlock};
type Test = ReturnType<typeof base.extend<ButtonFixtures>>;

export const test: Test = base.extend<ButtonFixtures>({
    button: async ({page}, use) => {
        await use(new ButtonBlock(page));
    },
});
