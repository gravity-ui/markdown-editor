import type {Expect, Locator, Page} from '@playwright/test';

import type {MarkdownEditorPage} from '../editor';
import {test as base, expect} from '../index';

const SETTINGS_INSET = 16;

export class BannerBlock {
    readonly blocks: Locator;
    readonly toolbar: Locator;
    readonly settingsButton: Locator;
    readonly editable: Locator;
    readonly buttonRows: Locator;
    readonly images: Locator;
    readonly imagePopup: Locator;
    readonly removeButton: Locator;
    readonly settings: Locator;
    readonly height: Locator;
    readonly width: Locator;
    readonly closeButton: Locator;
    readonly options: Locator;
    readonly backgroundPopup: Locator;
    protected readonly page: Page;
    protected readonly expect: Expect;
    protected readonly editor: MarkdownEditorPage;

    constructor(page: Page, expect: Expect, editor: MarkdownEditorPage) {
        this.page = page;
        this.expect = expect;
        this.editor = editor;
        this.editable = page.locator('.ProseMirror');
        this.blocks = this.editable.locator('.g-md-banner-plugin');
        this.buttonRows = this.blocks.locator('.g-md-button-plugin-row');
        this.images = this.blocks.locator('.g-md-banner-image-plugin');
        this.imagePopup = page.getByRole('dialog', {name: 'Image', exact: true});
        this.toolbar = page.getByTestId('g-md-toolbar-banner');
        this.settingsButton = this.toolbar.getByRole('button', {name: 'Settings', exact: true});
        this.removeButton = this.toolbar.getByRole('button', {name: 'Delete', exact: true});
        this.settings = page.getByRole('dialog', {name: 'Banner settings'});
        this.height = this.settings.getByRole('combobox', {name: 'Height', exact: true});
        this.width = this.settings.getByRole('combobox', {name: 'Width', exact: true});
        this.closeButton = this.settings.getByRole('button', {name: 'Close', exact: true});
        this.options = page.getByRole('option');
        this.backgroundPopup = page.getByRole('dialog', {name: 'Background', exact: true});
    }

    option(name: string) {
        return this.page.getByRole('option', {name, exact: true});
    }

    toggle(name: string) {
        return this.settings.getByRole('switch', {name, exact: true});
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
        return this.settings.getByRole('button', {name: /^Background /});
    }

    backgroundTab(name: string) {
        return this.backgroundPopup.getByRole('tab', {name, exact: true});
    }

    backgroundSwatch(name: string) {
        return this.backgroundPopup.getByRole('radio', {name, exact: true});
    }

    /** Collapses every section except the given ones. */
    async setExpandedSections(...expanded: string[]) {
        for (const name of ['Text', 'Buttons', 'Image and background']) {
            const section = this.section(name);
            const isExpanded = (await section.getAttribute('aria-expanded')) === 'true';
            if (isExpanded !== expanded.includes(name)) await section.click();
        }
        // The pointer leaves the panel, so a screenshot shows no hovered button.
        await this.page.mouse.move(0, 0);
    }

    async buttonsInRows() {
        return this.buttonRows.evaluateAll((rows) =>
            rows.map((row) =>
                Array.from(row.querySelectorAll('.g-md-button-plugin'), (button) => {
                    const {y, width} = button.getBoundingClientRect();
                    return {y, width};
                }),
            ),
        );
    }

    async settingsOffsets() {
        const [editable, settings] = await Promise.all([
            this.editable.boundingBox(),
            this.settings.boundingBox(),
        ]);
        const viewport = this.page.viewportSize();
        if (!editable || !settings || !viewport) return null;
        const right = Math.min(editable.x + editable.width, viewport.width - SETTINGS_INSET);
        return [
            Math.round(settings.y - editable.y),
            Math.round(settings.x + settings.width - right),
        ];
    }

    async scrollSettingsToEnd() {
        await this.settings.evaluate((element) => element.scrollTo({top: element.scrollHeight}));
    }

    async settingsBottom() {
        const settings = await this.settings.boundingBox();
        return settings && Math.round(settings.y + settings.height);
    }

    async focusEditor() {
        await this.editor.focus();
        await this.editor.press('ControlOrMeta+Home');
    }

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

type BannerFixtures = {banner: BannerBlock};
type Test = ReturnType<typeof base.extend<BannerFixtures>>;

export const test: Test = base.extend<BannerFixtures>({
    banner: async ({page, editor}, use) => {
        await use(new BannerBlock(page, expect, editor));
    },
});
