import type {Locator, Page} from '@playwright/test';

const withAttribute = (locator: Locator, name: string, value?: string) =>
    locator.and(locator.page().locator(value === undefined ? `[${name}]` : `[${name}="${value}"]`));

export class PreviewBlock {
    readonly blocks: Locator;
    readonly previews: Locator;
    readonly selectedBlocks: Locator;
    readonly placeholders: Locator;
    private readonly selector: string;
    private readonly textInFirstChild: boolean;

    constructor(page: Page, preview: Locator, selector: string, textInFirstChild = false) {
        this.selector = selector;
        this.textInFirstChild = textInFirstChild;
        this.blocks = page.locator(`.ProseMirror ${selector}`);
        this.previews = preview.locator(selector);
        this.selectedBlocks = this.blocks.and(page.locator('.ProseMirror-selectednode'));
        this.placeholders = this.blocks.locator('.g-md-placeholder');
    }

    inHeaders(headers: Locator) {
        return headers.locator(`:scope > ${this.selector}`);
    }

    blocksWith(name: string, value?: string) {
        return withAttribute(this.blocks, name, value);
    }

    previewsWith(name: string, value?: string) {
        return withAttribute(this.previews, name, value);
    }

    getSizes(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {width, height} = element.getBoundingClientRect();
                return [Math.round(width), Math.round(height)];
            }),
        );
    }

    getStyle(property: string, blocks = this.previews) {
        return blocks.evaluateAll(
            (elements, name) =>
                elements.map((element) => getComputedStyle(element).getPropertyValue(name)),
            property,
        );
    }

    getTypography(blocks = this.previews) {
        return blocks.evaluateAll(
            (elements, inFirstChild) =>
                elements.map((element) => {
                    const text = (inFirstChild && element.firstElementChild) || element;
                    const {fontSize, lineHeight, fontWeight} = getComputedStyle(text);
                    return [fontSize, lineHeight, fontWeight];
                }),
            this.textInFirstChild,
        );
    }

    getLineCounts(blocks = this.previews) {
        return blocks.evaluateAll(
            (elements, inFirstChild) =>
                elements.map((element) => {
                    const text = (inFirstChild && element.firstElementChild) || element;
                    return Math.round(
                        text.getBoundingClientRect().height /
                            parseFloat(getComputedStyle(text).lineHeight),
                    );
                }),
            this.textInFirstChild,
        );
    }
}

export class ToolbarBlock extends PreviewBlock {
    readonly toolbar: Locator;
    readonly menu: Locator;
    readonly menuItems: Locator;

    constructor(
        page: Page,
        preview: Locator,
        selector: string,
        toolbarTestId: string,
        textInFirstChild = false,
    ) {
        super(page, preview, selector, textInFirstChild);
        this.toolbar = page.getByTestId(toolbarTestId);
        this.menu = page.getByTestId('g-md-toolbar-menu');
        this.menuItems = this.menu.getByRole('menuitem');
    }

    menuItem(name: string) {
        return this.menu.getByRole('menuitem', {name, exact: true});
    }

    async choose(button: Locator, name: string) {
        await button.click();
        await this.menuItem(name).click();
    }

    async isToolbarBelow(block = this.blocks.first()) {
        const [box, toolbar] = await Promise.all([block.boundingBox(), this.toolbar.boundingBox()]);
        if (!box || !toolbar) return null;
        return toolbar.y >= box.y + box.height;
    }

    async isToolbarCentered(block = this.blocks.first()) {
        const [box, toolbar] = await Promise.all([block.boundingBox(), this.toolbar.boundingBox()]);
        if (!box || !toolbar) return null;
        return Math.abs(box.x + box.width / 2 - (toolbar.x + toolbar.width / 2)) <= 1;
    }
}
