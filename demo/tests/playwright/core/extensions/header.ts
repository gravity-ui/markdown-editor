import type {Expect, FileChooser, Locator, Page} from '@playwright/test';

import {test as base, expect} from '../index';

export class HeaderBlock {
    readonly blocks: Locator;
    readonly previews: Locator;
    readonly toolbar: Locator;
    readonly settingsButton: Locator;
    readonly removeButton: Locator;
    readonly settings: Locator;
    readonly height: Locator;
    readonly width: Locator;
    readonly closeButton: Locator;
    readonly options: Locator;
    readonly backgroundPopup: Locator;
    readonly clearBackgroundButton: Locator;
    readonly blur: Locator;
    readonly resetBackgroundButton: Locator;
    readonly uploadButton: Locator;
    readonly linkInput: Locator;
    readonly submitLinkButton: Locator;
    readonly replaceFileButton: Locator;
    readonly bannerPreview: Locator;
    readonly textColor: Locator;
    protected readonly page: Page;
    protected readonly expect: Expect;

    constructor(page: Page, expect: Expect) {
        this.page = page;
        this.expect = expect;
        this.blocks = page.locator('.ProseMirror .g-md-header-plugin');
        this.previews = page.getByTestId('demo-md-preview').locator('.g-md-header-plugin');
        this.toolbar = page.getByTestId('g-md-toolbar-header');
        this.settingsButton = this.toolbar.getByRole('button', {name: 'Settings', exact: true});
        this.removeButton = this.toolbar.getByRole('button', {name: 'Delete', exact: true});
        this.settings = page.getByRole('dialog', {name: 'Banner settings'});
        this.height = this.settings.getByRole('combobox', {name: 'Height', exact: true});
        this.width = this.settings.getByRole('combobox', {name: 'Width', exact: true});
        this.closeButton = this.settings.getByRole('button', {name: 'Close', exact: true});
        this.options = page.getByRole('option');
        this.backgroundPopup = page.getByRole('dialog', {name: 'Background', exact: true});
        this.clearBackgroundButton = this.settings.getByRole('button', {
            name: 'Remove background',
            exact: true,
        });
        this.blur = this.settings.getByRole('checkbox', {name: 'Blur background', exact: true});
        this.resetBackgroundButton = this.backgroundPopup.getByRole('button', {
            name: 'Reset',
            exact: true,
        });
        this.uploadButton = this.backgroundPopup.getByRole('button', {
            name: 'Upload',
            exact: true,
        });
        this.linkInput = this.backgroundPopup.getByPlaceholder('https://');
        this.submitLinkButton = this.backgroundPopup.getByRole('button', {
            name: 'Submit',
            exact: true,
        });
        this.replaceFileButton = this.backgroundPopup.getByRole('button', {
            name: 'Replace file',
            exact: true,
        });
        this.bannerPreview = this.backgroundPopup.locator('.g-md-header-settings__thumbnail');
        this.textColor = this.backgroundPopup.getByRole('combobox', {
            name: 'Text color',
            exact: true,
        });
    }

    option(name: string) {
        return this.page.getByRole('option', {name, exact: true});
    }

    /**
     * Headers of the preview with the data attribute, or with its value:
     * `previewsWith('data-align', 'center')`. Default values render no attribute.
     */
    previewsWith(name: string, value?: string) {
        return this.previews.and(
            this.page.locator(value === undefined ? `[${name}]` : `[${name}="${value}"]`),
        );
    }

    /** The width and the height of every header of the preview. */
    getPreviewSizes() {
        return this.previews.evaluateAll((elements) =>
            elements.map((element) => {
                const {width, height} = element.getBoundingClientRect();
                return [Math.round(width), Math.round(height)];
            }),
        );
    }

    /** The computed background color of every header of the preview. */
    getPreviewBackgrounds() {
        return this.previews.evaluateAll((elements) =>
            elements.map((element) => getComputedStyle(element).backgroundColor),
        );
    }

    /** The computed text color of every header of the preview. */
    getPreviewColors() {
        return this.previews.evaluateAll((elements) =>
            elements.map((element) => getComputedStyle(element).color),
        );
    }

    /** The different distances from the text above the button row to the row in the headers. */
    getPreviewButtonGaps() {
        return this.previews.evaluateAll((elements) =>
            Array.from(
                new Set(
                    elements.flatMap((element) => {
                        const row = element.querySelector(':scope > .g-md-button-plugin-row');
                        const text = row?.previousElementSibling;
                        if (!row || !text) return [];
                        const {top} = row.getBoundingClientRect();
                        return [Math.round(top - text.getBoundingClientRect().bottom)];
                    }),
                ),
            ),
        );
    }

    /** The different widths the headers of the preview leave unused in their column. */
    getPreviewWidthGaps() {
        return this.previews.evaluateAll((elements) =>
            Array.from(
                new Set(
                    elements.map((element) => {
                        const column = element.parentElement;
                        if (!column) return NaN;
                        const {paddingLeft, paddingRight} = getComputedStyle(column);
                        return Math.round(
                            column.clientWidth -
                                parseFloat(paddingLeft) -
                                parseFloat(paddingRight) -
                                element.getBoundingClientRect().width,
                        );
                    }),
                ),
            ),
        );
    }

    /**
     * Where the first block of the content stands in every header of the preview:
     * the distances from the left, right, top and bottom edges of the header to the content.
     */
    getPreviewContentInsets() {
        return this.previews.evaluateAll((elements) =>
            elements.map((element) => {
                const box = element.getBoundingClientRect();
                const first = element.firstElementChild?.getBoundingClientRect();
                const last = element.lastElementChild?.getBoundingClientRect();
                if (!first || !last) return null;
                return [
                    Math.round(first.left - box.left),
                    Math.round(box.right - first.right),
                    Math.round(first.top - box.top),
                    Math.round(box.bottom - last.bottom),
                ];
            }),
        );
    }

    /** The different text styles of the headers of the preview. */
    getPreviewTypography() {
        return this.previews.evaluateAll((elements) =>
            Array.from(
                new Set(
                    elements.map((element) => {
                        const {fontFamily, fontSize, fontWeight, lineHeight} =
                            getComputedStyle(element);
                        return [fontFamily, fontSize, fontWeight, lineHeight].join(' / ');
                    }),
                ),
            ),
        );
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

    /** The background field, named by its value. */
    get background() {
        return this.settings.getByRole('button', {name: /^Background /});
    }

    backgroundTab(name: string) {
        return this.backgroundPopup.getByRole('tab', {name, exact: true});
    }

    previewTheme(name: 'Light theme' | 'Dark theme') {
        return this.backgroundPopup.getByRole('radio', {name, exact: true});
    }

    swatch(name: string) {
        return this.backgroundPopup.getByRole('button', {name, exact: true});
    }

    async openBackground() {
        await this.setExpandedSections('Image and background');
        await this.background.click();
        await this.expect(this.backgroundPopup).toBeVisible();
    }

    async chooseFile(trigger: Locator, files: Parameters<FileChooser['setFiles']>[0]) {
        const fileChooser = this.page.waitForEvent('filechooser');
        await trigger.click();
        await (await fileChooser).setFiles(files);
    }

    /** `expectScreenshot` waits for `img[src]` only, not for CSS backgrounds. */
    async waitForImage(src: string) {
        await this.page.evaluate(async (url) => {
            const image = new Image();
            image.src = url;
            await image.decode();
        }, src);
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
