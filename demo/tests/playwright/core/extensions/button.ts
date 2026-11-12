import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class ButtonBlock {
    readonly blocks: Locator;
    readonly content: Locator;
    readonly preview: Locator;
    readonly variants: Locator;
    readonly hostControl: Locator;
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.content = page.locator('.ProseMirror');
        this.blocks = this.content.locator('.g-md-button-plugin');
        this.preview = page.getByTestId('demo-md-preview');
        this.variants = this.preview.locator('.g-md-button-plugin');
        this.hostControl = page.getByTestId('button-host-control');
    }

    async setHostContent(html: string) {
        await this.page.setContent(`
            <style>
                :root {
                    --g-color-base-brand: rgb(12, 34, 56);
                    --g-color-text-brand: rgb(78, 90, 123);
                    --g-color-text-light-primary: rgb(240, 241, 242);
                    --g-border-radius-l: 7px;
                }
                .host-control {
                    color: var(--g-color-text-brand);
                    background: var(--g-color-base-brand);
                    border-radius: var(--g-border-radius-l);
                }
            </style>
            <button class="host-control" data-qa="button-host-control">Host control</button>
            <div data-qa="demo-md-preview">${html}</div>
        `);
    }

    getHostStyle() {
        return this.hostControl.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
                color: style.color,
                background: style.backgroundColor,
                radius: style.borderRadius,
            };
        });
    }

    async setHostBrand(color: string) {
        await this.page.evaluate((value) => {
            document.documentElement.style.setProperty('--g-color-base-brand', value);
        }, color);
    }

    getFilledBackgrounds(blocks = this.blocks) {
        return blocks.evaluateAll((elements) =>
            elements
                .filter((element) => {
                    const view = element.getAttribute('data-view');
                    return view === 'action' || view === 'normal';
                })
                .map((element) => getComputedStyle(element).backgroundColor),
        );
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
