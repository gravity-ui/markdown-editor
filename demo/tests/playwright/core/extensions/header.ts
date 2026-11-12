import type {Expect, Locator, Page} from '@playwright/test';

import {test as base, expect} from '../index';

export class HeaderBlock {
    readonly blocks: Locator;
    readonly toolbar: Locator;
    readonly settingsButton: Locator;
    readonly removeButton: Locator;
    readonly settings: Locator;
    readonly height: Locator;
    readonly width: Locator;
    readonly closeButton: Locator;
    readonly options: Locator;
    protected readonly page: Page;
    protected readonly expect: Expect;

    constructor(page: Page, expect: Expect) {
        this.page = page;
        this.expect = expect;
        this.blocks = page.locator('.ProseMirror .g-md-header-plugin');
        this.toolbar = page.getByTestId('g-md-toolbar-header');
        this.settingsButton = this.toolbar.getByRole('button', {name: 'Settings', exact: true});
        this.removeButton = this.toolbar.getByRole('button', {name: 'Delete', exact: true});
        this.settings = page.getByRole('dialog', {name: 'Banner settings'});
        this.height = this.settings.getByRole('combobox', {name: 'Height', exact: true});
        this.width = this.settings.getByRole('combobox', {name: 'Width', exact: true});
        this.closeButton = this.settings.getByRole('button', {name: 'Close', exact: true});
        this.options = page.getByRole('option');
    }

    option(name: string) {
        return this.page.getByRole('option', {name, exact: true});
    }

    toggle(name: string) {
        return this.settings.getByRole('switch', {name, exact: true});
    }

    async clickToggle(name: string) {
        await this.settings.getByText(name, {exact: true}).click();
    }

    section(name: string) {
        return this.settings.getByRole('button', {name, exact: true});
    }

    alignment(direction: string, value: string) {
        return this.settings
            .getByRole('radiogroup', {name: direction, exact: true})
            .getByRole('radio', {name: value, exact: true});
    }

    get background() {
        return this.settings.getByRole('button', {name: 'Background No background', exact: true});
    }

    /** Distances from the top and right edges of the block to the panel. */
    async settingsInsets() {
        const [block, settings] = await Promise.all([
            this.blocks.boundingBox(),
            this.settings.boundingBox(),
        ]);
        return (
            block &&
            settings && [
                Math.round(settings.y - block.y),
                Math.round(block.x + block.width - settings.x - settings.width),
            ]
        );
    }

    async settingsBottom() {
        const settings = await this.settings.boundingBox();
        return settings && Math.round(settings.y + settings.height);
    }

    async scrollSettingsToTop() {
        await this.settings.evaluate((element) => element.scrollTo(0, 0));
    }

    async scrollSettingsToBottom() {
        await this.settings.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    }

    /** The editor opens with the cursor in the first block, which shows its toolbar. */
    async hideToolbar() {
        await this.expect(this.toolbar).toBeVisible();
        await this.page.keyboard.press('Escape');
        await this.expect(this.toolbar).toBeHidden();
    }

    async openSettings() {
        await this.settingsButton.click();
        await this.expect(this.settings).toBeVisible();
    }

    async select(control: Locator, value: string) {
        await control.click();
        await this.option(value).click();
    }
}

type HeaderFixtures = {header: HeaderBlock};
type Test = ReturnType<typeof base.extend<HeaderFixtures>>;

export const test: Test = base.extend<HeaderFixtures>({
    header: async ({page}, use) => {
        await use(new HeaderBlock(page, expect));
    },
});
