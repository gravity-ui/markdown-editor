import type {Locator, Page} from '@playwright/test';

import {test as base} from '../index';

const gridSelector = '.g-md-section-plugin';
const columnSelector = '.g-md-section-column-plugin';

export class SectionBlock {
    readonly editable: Locator;
    readonly preview: Locator;
    readonly settingsButton: Locator;
    readonly padding: Locator;
    readonly rounded: Locator;
    readonly firstBoundary: Locator;
    readonly gap: Locator;
    readonly secondBackground: Locator;

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.editable = page.locator(`.ProseMirror ${gridSelector}`);
        this.preview = page.getByTestId('demo-md-preview').locator(gridSelector);
        this.settingsButton = page.getByRole('button', {name: 'Section settings', exact: true});
        this.padding = page.getByText('Inner padding', {exact: true});
        this.rounded = page.getByText('Rounded corners', {exact: true});
        this.firstBoundary = this.editable.locator('.g-md-section-column-nodeview__handle').nth(1);
        this.gap = page.getByRole('combobox', {name: 'Column gap'});
        this.secondBackground = page.getByRole('combobox', {name: 'Column 2 background'});
    }

    async openSettings() {
        await this.editable.getByText('First column').click();
        if ((await this.settingsButton.getAttribute('aria-expanded')) === 'false') {
            await this.settingsButton.click();
        }
    }

    async select(control: Locator, option: string) {
        await control.click();
        await this.page.getByRole('option', {name: option, exact: true}).click();
    }

    async layout(grid: Locator) {
        return grid.evaluate((element, selector) => {
            const {left, right} = element.getBoundingClientRect();
            const columns = Array.from(element.querySelectorAll(`:scope > ${selector}`));
            const bounds = columns.map((column) => column.getBoundingClientRect());
            return {
                startInset: bounds[0].left - left,
                endInset: right - bounds[bounds.length - 1].right,
                gap: bounds[1].left - bounds[0].right,
                widths: bounds.map((column) => column.width),
                padding: columns.map((column) => {
                    if (!column.firstElementChild) throw new Error('Expected column content');
                    return getComputedStyle(column.firstElementChild).paddingInlineStart;
                }),
                radii: columns.map((column) => getComputedStyle(column).borderRadius),
                colors: columns.map((column) => getComputedStyle(column).backgroundColor),
            };
        }, columnSelector);
    }

    async editorInsets() {
        return this.editable.evaluate((element) => {
            const editor = element.closest('.ProseMirror');
            if (!editor) throw new Error('Expected an editor around the section');
            const grid = element.getBoundingClientRect();
            const canvas = editor.getBoundingClientRect();
            const style = getComputedStyle(editor);
            return [
                grid.left - canvas.left - parseFloat(style.paddingLeft),
                canvas.right - grid.right - parseFloat(style.paddingRight),
            ];
        });
    }

    async hoverColumnText() {
        await this.editable.getByText('First column').hover();
    }

    async boundaryAppearance() {
        return this.firstBoundary.evaluate((element) => {
            const {opacity, backgroundImage, filter} = getComputedStyle(element, '::before');
            return {opacity, backgroundImage, filter};
        });
    }

    async resizeFirstBoundary() {
        const grid = await this.editable.boundingBox();
        const handle = await this.firstBoundary.boundingBox();
        if (!grid || !handle) throw new Error('Expected a visible section and resize handle');

        const {gap} = await this.layout(this.editable);
        const x = handle.x + handle.width / 2;
        const y = handle.y + handle.height / 2;
        await this.page.mouse.move(x, y);
        await this.page.mouse.down();
        await this.page.mouse.move(x + (grid.width + gap) / 12, y);
        await this.page.mouse.up();
    }
}

type SectionFixtures = {section: SectionBlock};
type Test = ReturnType<typeof base.extend<SectionFixtures>>;

export const test: Test = base.extend<SectionFixtures>({
    section: async ({page}, use) => {
        await use(new SectionBlock(page));
    },
});
