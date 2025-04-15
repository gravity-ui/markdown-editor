import type {Page} from '@playwright/test';

export class PlaywrightActions {
    private readonly page;

    constructor(page: Page) {
        this.page = page;
    }

    async pressFocused(pressFocused: string) {
        await this.page.locator(':focus').press(pressFocused);
    }

    async fillFocused(text: string) {
        await this.page.locator(':focus').fill(text);
    }
}
