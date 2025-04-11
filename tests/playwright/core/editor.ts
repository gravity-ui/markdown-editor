import type {Expect, Page} from '@playwright/test';

import type {DataTransferType, MarkdownEditorMode} from 'src';

class MarkdownEditorLocators {
    readonly component;
    readonly editor;

    readonly settingsButton;
    readonly settingsContent;

    readonly contenteditable;
    readonly previewContent;

    readonly previewButton;

    constructor(page: Page) {
        this.component = page.getByTestId('demo-md-editor');
        this.previewContent = page.getByTestId('demo-md-preview');
        this.previewButton = page.getByTestId('g-md-settings-mode-markup-preview');

        this.editor = page.getByTestId('g-md-editor-mode');

        this.settingsButton = page.getByTestId('g-md-settings-button');
        this.settingsContent = page.getByTestId('g-md-settings-content');

        this.contenteditable = this.editor.locator('[contenteditable=true]');
    }
}

type PasteData = Partial<Record<DataTransferType, string>>;

type VisibleState = 'attached' | 'detached' | 'visible' | 'hidden' | undefined;

export class MarkdownEditorPage {
    protected readonly page: Page;
    protected readonly expect: Expect;
    protected readonly locators;

    constructor(page: Page, expect: Expect) {
        this.page = page;
        this.expect = expect;

        this.locators = new MarkdownEditorLocators(page);
    }

    async getMode(): Promise<MarkdownEditorMode> {
        const value = await this.locators.editor.getAttribute('data-mode');
        const mode = value as MarkdownEditorMode | null;
        if (mode === 'wysiwyg' || mode === 'markup') return mode;
        throw new Error(`MarkdownEditorPage.getMode(): unknown editor mode "${mode}"`);
    }

    async openSettingsPopup() {
        if (await this.locators.settingsContent.isVisible()) return;

        await this.locators.settingsButton.click();
        await this.locators.settingsContent.waitFor({state: 'visible'});
    }

    async switchMode(mode: MarkdownEditorMode) {
        if ((await this.getMode()) === mode) return;

        await this.openSettingsPopup();
        await this.locators.settingsContent.getByTestId(`g-md-settings-mode-${mode}`).click();
        await this.assertMode(mode);
    }

    async getPreview(): Promise<VisibleState> {
        const previewContent = await this.locators.previewContent;
        if (await previewContent.isVisible()) {
            return 'visible';
        }

        const previewButton = await this.locators.previewButton;
        if (await previewButton.isVisible()) {
            return 'hidden';
        }
        return undefined;
    }

    async switchPreview(state?: VisibleState) {
        const currentState = await this.getPreview();
        const revertState = currentState === 'visible' ? 'hidden' : 'visible';
        const targetState = state === undefined ? revertState : state;

        if (currentState === targetState) {
            return;
        }

        await this.switchMode('markup');
        await this.locators.previewButton.click();

        await this.locators.previewContent.waitFor({
            state: targetState,
        });
    }

    async assertMode(mode: MarkdownEditorMode) {
        await this.expect.poll(() => this.getMode()).toBe(mode);
    }

    async blur() {
        await this.locators.contenteditable.blur();
    }

    async press(key: string) {
        await this.locators.contenteditable.press(key);
    }

    async clearContent() {
        await this.press('ControlOrMeta+A');
        await this.press('Backspace');
    }

    async paste(value: PasteData | string) {
        const data: PasteData = typeof value === 'string' ? {'text/plain': value} : value;

        await this.locators.contenteditable.evaluate((element, data) => {
            const clipboardData = new DataTransfer();

            for (const [key, value] of Object.entries(data)) {
                clipboardData.setData(key, value);
            }

            element.focus();
            element.dispatchEvent(new ClipboardEvent('paste', {clipboardData}));
        }, data);
    }

    async fill(text: string) {
        this.locators.contenteditable.fill(text);
    }

    async selectTextIn(selector?: string) {
        let loc = this.locators.contenteditable;
        if (selector) loc = loc.locator(selector);

        loc.selectText();
        await this.page.waitForTimeout(100);
    }
}
