import type {FileChooser, Locator, Page} from '@playwright/test';

import {expect} from '../index';

import {test as base} from './header';
import {ImageSourceLocators} from './image-source';

export class HeaderImageBlock {
    readonly images: Locator;
    readonly emptyBlocks: Locator;
    readonly placeholders: Locator;
    readonly previews: Locator;
    readonly selectedBlocks: Locator;
    readonly resetButton: Locator;
    readonly popup: Locator;
    readonly source: ImageSourceLocators;
    private readonly page: Page;

    constructor(page: Page, preview: Locator) {
        this.page = page;
        this.images = page.locator('.ProseMirror img.g-md-header-image-plugin');
        this.emptyBlocks = page.locator('.ProseMirror .g-md-header-image-nodeview_empty');
        this.placeholders = page
            .locator('.ProseMirror')
            .getByRole('button', {name: 'Add image', exact: true});
        this.previews = preview.locator('.g-md-header-image-plugin');
        this.selectedBlocks = page.locator(
            '.ProseMirror .g-md-header-image-plugin.ProseMirror-selectednode',
        );
        this.popup = page.getByRole('dialog', {name: 'Image', exact: true});
        this.resetButton = this.popup.getByRole('button', {name: 'Reset', exact: true});
        this.source = new ImageSourceLocators(this.popup);
    }

    async chooseFile(trigger: Locator, files: Parameters<FileChooser['setFiles']>[0]) {
        const fileChooser = this.page.waitForEvent('filechooser');
        await trigger.click();
        await (await fileChooser).setFiles(files);
    }

    /** Waits until the popup stops moving inside the viewport. */
    async waitForPopupPlaced() {
        let previous = '';
        await expect
            .poll(async () => {
                const box = await this.popup.boundingBox();
                const viewport = this.page.viewportSize();
                const current = JSON.stringify(box);
                const stable = current === previous;
                previous = current;
                return Boolean(
                    stable &&
                    box &&
                    viewport &&
                    box.x >= 0 &&
                    box.y >= 0 &&
                    box.x + box.width <= viewport.width &&
                    box.y + box.height <= viewport.height,
                );
            })
            .toBe(true);
    }

    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                src: element.getAttribute('src'),
                alt: element.getAttribute('alt'),
                title: element.getAttribute('title'),
            })),
        );
    }

    /** Distances from the left, right, top and bottom edges of the header to the image. */
    getInsets(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const parent = element.parentElement;
                if (!parent) return null;
                const box = parent.getBoundingClientRect();
                const image = element.getBoundingClientRect();
                return [
                    Math.round(image.left - box.left),
                    Math.round(box.right - image.right),
                    Math.round(image.top - box.top),
                    Math.round(box.bottom - image.bottom),
                ];
            }),
        );
    }

    /** The right edge of the first text block and its distance below the image. */
    getTextPlacement(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const parent = element.parentElement;
                const text = parent?.querySelector(':scope > :not(.g-md-header-image-plugin)');
                if (!parent || !text) return null;
                const box = parent.getBoundingClientRect();
                const textBox = text.getBoundingClientRect();
                return {
                    right: Math.round(textBox.right - box.left),
                    below: Math.round(textBox.top - element.getBoundingClientRect().bottom),
                };
            }),
        );
    }

    getRadius(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => getComputedStyle(element).borderTopLeftRadius),
        );
    }
}

type HeaderImageFixtures = {headerImage: HeaderImageBlock};
type Test = ReturnType<typeof base.extend<HeaderImageFixtures>>;

export const test: Test = base.extend<HeaderImageFixtures>({
    headerImage: async ({page, editor}, use) => {
        await use(new HeaderImageBlock(page, editor.locators.previewContent));
    },
});
