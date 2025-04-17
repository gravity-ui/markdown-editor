import type {BrowserContext, Locator, Page} from '@playwright/test';

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

export class DebugHelpers {
    private readonly page;

    constructor({page}: {page: Page}) {
        this.page = page;
    }

    /**
     * Draws a red dot on the screen at the given (x, y) coordinates.
     * Useful for debugging click locations.
     *
     * Example:
     * ```ts
     * const box = await element.boundingBox();
     * if (box) {
     *   const { x, y } = box;
     *   await element.dispatchEvent('click', {
     *     bubbles: true,
     *     cancelable: true,
     *     composed: true,
     *     clientX: Math.floor(x + 2),
     *     clientY: Math.floor(y + 2),
     *   });
     *   await markClick(page, x + 2, y + 2);
     * }
     * ```
     */
    async markClick(x: number, y: number) {
        await this.page.evaluate(
            ({x, y}) => {
                const dot = document.createElement('div');
                dot.style.position = 'absolute';
                dot.style.width = '6px';
                dot.style.height = '6px';
                dot.style.borderRadius = '50%';
                dot.style.background = 'red';
                dot.style.zIndex = '999999';
                dot.style.pointerEvents = 'none';
                dot.style.left = `${x}px`;
                dot.style.top = `${y}px`;
                document.body.appendChild(dot);
            },
            {x, y},
        );
    }

    /**
     *  Logs the outer HTML of a given locator.
     *  Useful for debugging or verifying the exact markup of an element.
     */
    async logHtml(locator: Locator) {
        const html = await locator.evaluate((el) => el.outerHTML);
        console.log('Outer HTML:', html);
    }

    /**
     * Highlights a given locator by applying CSS styles.
     * Useful for visually identifying elements during testing or debugging.
     */
    async highlight(
        locator: Locator,
        {
            outline = true,
            background = true,
            border = false,
        }: {
            outline?: boolean;
            background?: boolean;
            border?: boolean;
        } = {},
    ) {
        await locator.evaluate(
            (el, opts) => {
                if (opts.outline) {
                    el.style.outline = '2px solid red';
                    el.style.outlineOffset = '2px';
                }
                if (opts.border) {
                    el.style.border = '2px solid red';
                }
                if (opts.background) {
                    el.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
                }
            },
            {outline, background, border},
        );
    }
}
