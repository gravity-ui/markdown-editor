import type {Locator, Page} from '@playwright/test';

import {test as base} from './header-title';

export class HeaderContentBlock {
    readonly blocks: Locator;
    readonly previews: Locator;
    /** The links of the descriptions of the preview. */
    readonly links: Locator;
    /** The fenced code blocks of the preview, in the descriptions and outside them. */
    readonly codeBlocks: Locator;
    protected readonly page: Page;

    constructor(page: Page, preview: Locator) {
        this.page = page;
        this.blocks = page.locator('.ProseMirror .g-md-header-content-plugin');
        this.previews = preview.locator('.g-md-header-content-plugin');
        this.links = this.previews.locator('a');
        this.codeBlocks = preview.locator('pre > code');
    }

    /** The descriptions that stand right in the given blocks: `inHeaders(header.previews)`. */
    inHeaders(headers: Locator) {
        return headers.locator(':scope > .g-md-header-content-plugin');
    }

    /**
     * Descriptions of the preview with the attribute, or with its value:
     * `previewsWith('data-size', '1')`. Regular text, the default, renders no attribute.
     */
    previewsWith(name: string, value?: string) {
        return this.previews.and(
            this.page.locator(value === undefined ? `[${name}]` : `[${name}="${value}"]`),
        );
    }

    /** The size and the texts of the paragraphs of every description. */
    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                size: element.getAttribute('data-size'),
                paragraphs: Array.from(
                    element.querySelectorAll(':scope > p'),
                    (paragraph) => paragraph.textContent,
                ),
            })),
        );
    }

    /** The font size, the line height and the font weight of the first paragraph of every description. */
    getTypography(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {fontSize, lineHeight, fontWeight} = getComputedStyle(
                    element.firstElementChild ?? element,
                );
                return [fontSize, lineHeight, fontWeight];
            }),
        );
    }

    /** The different distances between the paragraphs of the descriptions. */
    getParagraphGaps(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            Array.from(
                new Set(
                    elements.flatMap((element) =>
                        Array.from(element.children)
                            .slice(1)
                            .map((child) =>
                                Math.round(
                                    child.getBoundingClientRect().top -
                                        (child.previousElementSibling?.getBoundingClientRect()
                                            .bottom ?? 0),
                                ),
                            ),
                    ),
                ),
            ),
        );
    }

    /** The number of text lines of the first paragraph of every description. */
    getLineCounts(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const paragraph = element.firstElementChild ?? element;
                return Math.round(
                    paragraph.getBoundingClientRect().height /
                        parseFloat(getComputedStyle(paragraph).lineHeight),
                );
            }),
        );
    }

    /**
     * The color and the underline of every link, and the color of the description around it.
     * A link that takes the text color has `color` equal to `textColor`.
     */
    getLinkStyles(links = this.links) {
        return links.evaluateAll((elements) =>
            elements.map((element) => {
                const {color, textDecorationLine, textDecorationThickness, textUnderlineOffset} =
                    getComputedStyle(element);
                const content = element.closest('.g-md-header-content-plugin');
                return {
                    color,
                    underline: textDecorationLine.includes('underline'),
                    textDecorationThickness,
                    textUnderlineOffset,
                    textColor: content ? getComputedStyle(content).color : '',
                };
            }),
        );
    }

    /** The underline thickness and offset of the `++underlined++` text of every description. */
    getUnderlinedTextStyles(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.flatMap((element) =>
                Array.from(element.querySelectorAll('ins'), (ins) => {
                    const {textDecorationThickness, textUnderlineOffset} = getComputedStyle(ins);
                    return {textDecorationThickness, textUnderlineOffset};
                }),
            ),
        );
    }

    /** The style, the width and the color of the focus ring of every link. */
    getFocusOutlines(links = this.links) {
        return links.evaluateAll((elements) =>
            elements.map((element) => {
                const {outlineStyle, outlineWidth, outlineColor} = getComputedStyle(element);
                return {outlineStyle, outlineWidth, outlineColor};
            }),
        );
    }

    /** The computed value of a color variable, as a description reads it: `--g-color-line-focus`. */
    getColorVariable(name: string) {
        return this.previews.first().evaluate((element, variable) => {
            const probe = element.appendChild(document.createElement('span'));
            probe.style.color = `var(${variable})`;
            const {color} = getComputedStyle(probe);
            probe.remove();
            return color;
        }, name);
    }

    /**
     * The text color, the text decoration and the background color of the elements,
     * and whether they stand in a description: `getTextStyles(headerContent.codeBlocks)`.
     */
    getTextStyles(elements: Locator) {
        return elements.evaluateAll((items) =>
            items.map((item) => {
                const {color, textDecorationLine, backgroundColor} = getComputedStyle(item);
                return {
                    color,
                    textDecorationLine,
                    backgroundColor,
                    inDescription: Boolean(item.closest('.g-md-header-content-plugin')),
                };
            }),
        );
    }

    /** The text color and the background color of the inline code of every description. */
    getCodeColors(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.flatMap((element) =>
                Array.from(element.querySelectorAll('code'), (code) => {
                    const {color, backgroundColor} = getComputedStyle(code);
                    return [color, backgroundColor].join(' on ');
                }),
            ),
        );
    }
}

type HeaderContentFixtures = {headerContent: HeaderContentBlock};
type Test = ReturnType<typeof base.extend<HeaderContentFixtures>>;

export const test: Test = base.extend<HeaderContentFixtures>({
    headerContent: async ({page, editor}, use) => {
        await use(new HeaderContentBlock(page, editor.locators.previewContent));
    },
});
