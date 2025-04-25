import type {Expect, Locator, Page} from '@playwright/test';

import type {DataTransferType, MarkdownEditorMode} from 'src';

class MarkdownEditorLocators {
    readonly commandMenu;
    readonly component;
    readonly contenteditable;
    readonly editor;
    readonly previewButton;
    readonly previewContent;
    readonly settingsButton;
    readonly settingsContent;
    readonly toolbar;
    readonly toolbarMoreActionButton;

    constructor(page: Page) {
        // page
        this.commandMenu = page.getByTestId('g-md-command-menu');
        this.component = page.getByTestId('demo-md-editor');
        this.editor = page.getByTestId('g-md-editor-mode');
        this.previewButton = page.getByTestId('g-md-markup-preview-button');
        this.previewContent = page.getByTestId('demo-md-preview');
        this.settingsButton = page.getByTestId('g-md-settings-button');
        this.settingsContent = page.getByTestId('g-md-settings-content');
        this.toolbar = page.getByTestId('g-md-toolbar');

        // editor
        this.contenteditable = this.editor.locator('[contenteditable=true]');
        this.toolbarMoreActionButton = this.editor.getByTestId('g-md-toolbar-more-action');
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

    /**
     * Checks that the current editor mode matches the expected one
     */
    async assertMode(mode: MarkdownEditorMode) {
        await this.expect.poll(() => this.getMode()).toBe(mode);
    }

    /**
     * Asserts that the toolbar button is disabled
     */
    async assertToolbarButtonDisabled(label: string) {
        const button = this.getToolbarButton(label);
        await this.expect(button).toHaveClass(/disabled/);
    }

    /**
     * Asserts that the toolbar button is enabled
     */
    async assertToolbarButtonEnabled(label: string) {
        const button = this.getToolbarButton(label);
        await this.expect(button).not.toHaveClass(/disabled/);
    }

    /**
     * Returns the current editor mode
     */
    async getMode(): Promise<MarkdownEditorMode> {
        const value = await this.locators.editor.getAttribute('data-mode');
        const mode = value as MarkdownEditorMode | null;
        if (mode === 'wysiwyg' || mode === 'markup') return mode;
        throw new Error(`MarkdownEditorPage.getMode(): unknown editor mode "${mode}"`);
    }

    /**
     * Finds an element in the command menu by its text
     */
    getByTextInCommandMenu(text: string): Locator {
        return this.locators.commandMenu.getByText(text);
    }

    /**
     * Finds an element by selector within the contenteditable area
     */
    getBySelectorInContenteditable(selector: string): Locator {
        return this.locators.contenteditable.locator(selector);
    }

    /**
     * Finds an element by text within the contenteditable area
     */
    getByTextInContenteditable(text: string): Locator {
        return this.locators.contenteditable.getByText(text);
    }

    /**
     * Returns a locator for the toolbar button by its aria-label
     */
    getToolbarButton(label: string): Locator {
        return this.page.getByLabel(label);
    }

    /**
     * Returns the current visibility state of the preview
     */
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

    /**
     * Switches the editor to the specified mode
     */
    async switchMode(mode: MarkdownEditorMode) {
        if ((await this.getMode()) === mode) return;

        await this.openSettingsPopup();
        await this.locators.settingsContent.getByTestId(`g-md-settings-mode-${mode}`).click();
        await this.assertMode(mode);
    }

    /**
     * Toggles or sets the preview visibility state
     */
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

    /**
     * Opens the settings popup if it is not already open
     */
    async openSettingsPopup() {
        if (await this.locators.settingsContent.isVisible()) return;

        await this.locators.settingsButton.click();
        await this.locators.settingsContent.waitFor({state: 'visible'});
    }

    /**
     * Clicks the "more actions" button on the toolbar
     */
    async clickToolbarMoreActionButton() {
        await this.locators.toolbarMoreActionButton.click();
    }

    /**
     * Clicks a toolbar button using its aria-label
     */
    async clickToolbarButton(label: string) {
        const button = this.getToolbarButton(label);

        await this.expect(button).toBeEnabled();
        await button.click();
    }

    /**
     * Clears all content from the contenteditable area
     */
    async clearContent() {
        await this.press('ControlOrMeta+A');
        await this.press('Backspace');
    }

    /**
     * Removes focus from the contenteditable area
     */
    async blur() {
        await this.locators.contenteditable.blur();
    }

    /**
     * Presses a key within the contenteditable area
     */
    async press(key: string) {
        await this.locators.contenteditable.press(key);
    }

    /**
     * Presses each character sequentially in the contenteditable area
     */
    async pressSequentially(key: string) {
        await this.locators.contenteditable.pressSequentially(key);
    }

    /**
     * Simulates input rule behavior by typing a sequence in WYSIWYG mode.
     * Clears the editor and types each character
     */
    async inputRule(sequence: string) {
        await this.switchMode('wysiwyg');
        await this.clearContent();
        await this.pressSequentially(sequence);
        await this.press('Space');
    }

    /**
     * Pastes data into the contenteditable area
     */
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

    /**
     * Fills the contenteditable area with the provided text
     */
    async fill(text: string) {
        this.locators.contenteditable.fill(text);
    }

    /**
     * Selects text within the contenteditable area
     */
    async selectTextIn(selector?: string) {
        let loc = this.locators.contenteditable;
        if (selector) loc = loc.locator(selector);

        loc.selectText();
        await this.page.waitForTimeout(100);
    }
}
