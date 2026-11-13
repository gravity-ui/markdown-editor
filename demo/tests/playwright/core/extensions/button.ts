import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class ButtonBlock {
    readonly content: Locator;
    readonly blocks: Locator;
    readonly variants: Locator;
    readonly toolbar: Locator;
    readonly link: Locator;
    readonly styleButton: Locator;
    readonly style: Locator;
    readonly styleSelect: Locator;

    constructor(page: Page, preview: Locator) {
        this.content = page.locator('.ProseMirror');
        this.blocks = this.content.locator('.g-md-button-plugin');
        this.variants = preview.locator('.g-md-button-plugin');
        this.toolbar = page.getByTestId('button-toolbar');
        this.link = this.toolbar.getByRole('textbox');
        this.styleButton = this.toolbar.getByRole('button', {name: 'Style', exact: true});
        this.style = page.getByTestId('button-style');
        this.styleSelect = this.style.getByRole('combobox');
    }

    /** Puts the cursor into the label, which opens the button panel. */
    async focus(block = this.blocks.first()) {
        await block.click();
        await this.toolbar.waitFor({state: 'visible'});
    }

    /** The theme root defines the variables, so a value set above it has no effect. */
    async setThemeVariable(name: string, value: string) {
        await this.content.evaluate(
            (element, [variable, color]) => element.style.setProperty(variable, color),
            [name, value],
        );
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
    button: async ({page, editor}, use) => {
        await use(new ButtonBlock(page, editor.locators.previewContent));
    },
});
