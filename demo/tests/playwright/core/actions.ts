import type {Page} from '@playwright/test';

export class PlaywrightActions {
    private readonly page;

    constructor(page: Page) {
        this.page = page;
    }

    async pressFocused(pressFocused: string, times = 1) {
        while (times > 0) {
            await this.page.locator(':focus').press(pressFocused);
            times--;
        }
    }

    async fillFocused(text: string) {
        await this.page.locator(':focus').fill(text);
    }
}
