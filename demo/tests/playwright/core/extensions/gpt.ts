import type {JSHandle, Locator, Page} from '@playwright/test';

import {test as base, expect} from '../index';

export class GptPopup {
    readonly popup: Locator;
    readonly dialog: Locator;
    readonly input: Locator;
    readonly answer: Locator;
    readonly button: Locator;
    readonly applied: Locator;
    readonly completed: Locator;
    readonly updates: Locator;

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.popup = page.locator('.g-md-gpt-popup');
        this.dialog = page.locator('.g-md-gpt-dialog');
        this.input = this.dialog.locator('input');
        this.answer = this.dialog.locator('.g-md-gpt-dialog__answer');
        this.button = page.getByRole('button', {name: 'Help with text', exact: true});
        this.applied = page.getByTestId('gpt-applied');
        this.completed = page.getByTestId('gpt-completed');
        this.updates = page.getByTestId('gpt-updates');
    }
    async startScrollTracking() {
        return this.page.evaluateHandle(() => {
            const positions = [window.scrollY];
            const record = () => {
                if (positions[positions.length - 1] !== window.scrollY)
                    positions.push(window.scrollY);
            };
            window.addEventListener('scroll', record);
            return {positions, stop: () => window.removeEventListener('scroll', record)};
        });
    }
    async expectScrollUnchanged(trace: JSHandle<{positions: number[]; stop: () => void}>) {
        const positions = await trace.evaluate(async (state) => {
            // Include scroll events queued by focus and layout after opening the popup.
            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });
            state.stop();
            return state.positions;
        });
        await trace.dispose();
        expect(positions).toEqual([positions[0]]);
    }
    async open() {
        await this.button.click();
        await expect(this.input).toBeFocused();
    }
    async submit(prompt: string) {
        await this.input.fill(prompt);
        await this.input.press('Enter');
    }
    async uppercase() {
        await this.dialog.getByRole('button', {name: 'Uppercase', exact: true}).click();
        await expect(this.answer).toHaveText('ORIGINAL TEXT');
    }
    async apply() {
        await this.dialog
            .getByRole('button', {name: 'Replace the selected text', exact: true})
            .click();
        await expect(this.dialog).toBeHidden();
    }
    async retry() {
        await this.dialog.getByRole('button', {name: /Try again|Retry/, exact: true}).click();
        await expect(this.answer).toHaveText('retried');
    }
    async close() {
        await this.dialog.press('Escape');
        await expect(this.dialog).toBeHidden();
    }
    async expectInsideViewport() {
        const box = await this.popup.boundingBox();
        const viewport = this.page.viewportSize();
        if (!box || !viewport) throw new Error('Popup or viewport is missing');
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
}

type GptFixtures = {gpt: GptPopup};
type Test = ReturnType<typeof base.extend<GptFixtures>>;
export const test: Test = base.extend<GptFixtures>({
    gpt: async ({page}, use) => {
        await use(new GptPopup(page));
    },
});
