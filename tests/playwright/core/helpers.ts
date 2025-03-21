import type {BrowserContext, Page} from '@playwright/test';

class Keymap {
    readonly selectAll = 'ControlOrMeta+A';
    readonly copy = 'ControlOrMeta+C';
    readonly cut = 'ControlOrMeta+X';
    readonly paste = 'ControlOrMeta+V';
}

export class PlaywrightHelpers {
    readonly keys = new Keymap();

    private readonly page;
    private readonly context;

    constructor({page, context}: {page: Page; context: BrowserContext}) {
        this.page = page;
        this.context = context;
    }

    async getClipboardData() {
        await this.context.grantPermissions(['clipboard-read']);
        return this.page.evaluate(async () => {
            const item = (await navigator.clipboard.read())[0];
            const data: Record<string, string> = {};
            const types = Array.from(item.types);
            for (const type of types) {
                data[type] = await (await item.getType(type)).text();
            }
            return data;
        });
    }
}
