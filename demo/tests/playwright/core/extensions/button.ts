import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

export class ButtonBlock {
    readonly content: Locator;
    readonly blocks: Locator;
    readonly variants: Locator;
    readonly rows: Locator;
    readonly headers: Locator;
    readonly settings: Locator;
    readonly label: Locator;
    readonly link: Locator;
    readonly styleSelect: Locator;
    readonly newTab: Locator;
    readonly preview: Locator;
    protected readonly page: Page;

    constructor(page: Page, preview: Locator) {
        this.page = page;
        this.content = page.locator('.ProseMirror');
        this.blocks = this.content.locator('.g-md-button-plugin');
        this.variants = preview.locator('.g-md-button-plugin');
        this.rows = preview.locator('.g-md-button-plugin-row');
        this.headers = preview.locator('.g-md-header-plugin');
        this.settings = page.getByRole('dialog', {name: 'Button settings'});
        this.label = this.settings.getByRole('textbox', {name: 'Label', exact: true});
        this.link = this.settings.getByRole('textbox', {name: 'Link', exact: true});
        this.styleSelect = this.settings.getByRole('combobox', {name: 'Style', exact: true});
        this.newTab = this.settings.getByText('Open in a new tab', {exact: true});
        this.preview = page.getByTestId('button-style-preview');
    }

    async getSettingsGeometry() {
        return this.settings.evaluate((element) => {
            const find = (selector: string) => {
                const found = element.querySelector(selector);
                if (!found) throw new Error(`Missing settings element: ${selector}`);
                return found;
            };
            const rect = (selector: string) => find(selector).getBoundingClientRect();
            const icon = rect('.g-md-button-settings__icon');
            const link = rect('.g-text-input_has-start-content');
            const input = rect('.g-text-input_has-start-content input');
            const style = rect('.g-md-button-style__control');
            const swatch = rect('.g-md-button-style__swatch');
            return {
                width: element.getBoundingClientRect().width,
                iconSize: [icon.width, icon.height],
                iconLeft: icon.left - link.left,
                iconCenter: icon.top + icon.height / 2 - (link.top + link.height / 2),
                textLeft:
                    input.left +
                    parseFloat(
                        getComputedStyle(find('.g-text-input_has-start-content input')).paddingLeft,
                    ) -
                    link.left,
                swatchLeft: swatch.left - style.left,
                fieldGap: link.top - style.bottom,
            };
        });
    }

    /** A color of the style list; each view group has its own option of this name. */
    option(name: string) {
        return this.page.getByRole('option', {name, exact: true});
    }

    /** A click on the button opens its settings window with the label field focused. */
    async openSettings(block = this.blocks.first()) {
        await block.click();
        await this.label.waitFor({state: 'visible'});
    }

    /** A button of the preview by its view and color. */
    variant(view: string, color: string) {
        return this.variants.and(this.page.locator(`[data-view="${view}"][data-color="${color}"]`));
    }

    /** Elements with the attribute, or with this exact value of it. */
    withAttribute(name: string, value?: string) {
        return this.page.locator(value === undefined ? `[${name}]` : `[${name}="${value}"]`);
    }

    /** The number of different top edges of the buttons in every row: 1 is a single line. */
    getRowTops() {
        return this.rows.evaluateAll((rows) =>
            rows.map(
                (row) =>
                    new Set(
                        Array.from(row.children, (child) =>
                            Math.round(child.getBoundingClientRect().top),
                        ),
                    ).size,
            ),
        );
    }

    /** `:focus-visible` follows the Tab key; a scripted focus alone may not match it. */
    async focusWithKeyboard(block: Locator) {
        await block.focus();
        await this.page.keyboard.press('Shift+Tab');
        await this.page.keyboard.press('Tab');
    }

    getBackground(block: Locator) {
        return block.evaluate((element) => getComputedStyle(element).backgroundColor);
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
