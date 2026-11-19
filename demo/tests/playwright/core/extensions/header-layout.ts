import type {Locator} from '@playwright/test';

import {test as base} from '../index';

export type BannerGeometry = {
    width: number;
    height: number;
    image: {left: number; right: number; top: number; bottom: number; width: number} | null;
    text: {left: number; right: number; top: number; bottom: number};
    textAlign: string;
};

/** The banners of a container, measured relative to each banner. */
export class HeaderLayout {
    readonly root: Locator;

    constructor(root: Locator) {
        this.root = root;
    }

    banners() {
        return this.root.locator('.g-md-header-plugin');
    }

    /**
     * Sets the width of the banners themselves: the narrow layout follows the width of the banner.
     * A style sheet sets it, because the editor redraws the attributes of its blocks.
     */
    async setBannerWidth(width: number) {
        await this.root.evaluate((root, value) => {
            const style = document.createElement('style');
            style.dataset.qa = 'banner-width';
            style.textContent = `.g-md-header-plugin.g-md-header-plugin { width: ${value}px; max-width: none; }`;
            document.querySelector('style[data-qa="banner-width"]')?.remove();
            root.ownerDocument.head.append(style);
        }, width);
    }

    geometry(): Promise<BannerGeometry[]> {
        return this.banners().evaluateAll((elements) =>
            elements.map((element) => {
                const banner = element.getBoundingClientRect();
                const relative = (rect: DOMRect) => ({
                    left: Math.round(rect.left - banner.left),
                    right: Math.round(rect.right - banner.left),
                    top: Math.round(rect.top - banner.top),
                    bottom: Math.round(rect.bottom - banner.top),
                    width: Math.round(rect.width),
                });
                const children = Array.from(element.children) as HTMLElement[];
                const image = children.find((child) =>
                    child.classList.contains('g-md-header-image-plugin'),
                );
                const texts = children.filter((child) => child !== image);
                const rects = texts.map((child) => child.getBoundingClientRect());
                const text = {
                    left: Math.min(...rects.map((rect) => rect.left)),
                    right: Math.max(...rects.map((rect) => rect.right)),
                    top: Math.min(...rects.map((rect) => rect.top)),
                    bottom: Math.max(...rects.map((rect) => rect.bottom)),
                };
                return {
                    width: Math.round(banner.width),
                    height: Math.round(banner.height),
                    image: image ? relative(image.getBoundingClientRect()) : null,
                    text: relative(
                        new DOMRect(
                            text.left,
                            text.top,
                            text.right - text.left,
                            text.bottom - text.top,
                        ),
                    ),
                    textAlign: texts[0] ? getComputedStyle(texts[0]).textAlign : '',
                };
            }),
        );
    }
}

type HeaderLayoutFixtures = {preview: HeaderLayout; wysiwyg: HeaderLayout};
type Test = ReturnType<typeof base.extend<HeaderLayoutFixtures>>;

export const test: Test = base.extend<HeaderLayoutFixtures>({
    preview: async ({editor}, use) => {
        await use(new HeaderLayout(editor.locators.previewContent));
    },
    wysiwyg: async ({page}, use) => {
        await use(new HeaderLayout(page.locator('.ProseMirror')));
    },
});
