import type {Expect, Locator, Page} from '@playwright/test';

import type {DataTransferType, MarkdownEditorMode} from 'src';

type YfmTableCellMenuType = 'row' | 'column';
type YfmTableActionKind =
    | 'remove-table'
    | 'remove-column'
    | 'remove-row'
    | 'add-column-before'
    | 'add-column-after'
    | 'add-row-before'
    | 'add-row-after';

type MarkdownEditorToolbarsLocators = Record<
    'main' | 'additional' | 'selection' | 'commandMenu',
    Locator
>;

class Colorify {
    protected readonly page: Page;
    protected readonly expect: Expect;
    protected readonly editor: Locator;
    protected readonly mainToolbar: Locator;
    protected readonly selectionToolbar: Locator;

    constructor(
        page: Page,
        expect: Expect,
        locators: {toolbars: MarkdownEditorToolbarsLocators} & {editor: Locator},
    ) {
        this.page = page;
        this.expect = expect;
        this.editor = locators.editor;
        this.mainToolbar = locators.toolbars.main;
        this.selectionToolbar = locators.toolbars.selection;
    }
    /**
     * Asserts that the main toolbar color button has the "default" qa attribute.
     */
    async assertMainToolbarColorButtonDefault() {
        const button = this.mainToolbar.getByLabel('Text color');
        await this.expect(button).toHaveAttribute('data-selected-color', 'default');
    }

    /**
     * Asserts that the main toolbar color button does not have the "default" qa attribute.
     */
    async assertMainToolbarColorButtonNotDefault() {
        const button = this.mainToolbar.getByLabel('Text color');
        await this.expect(button).not.toHaveAttribute('data-selected-color', 'default');
    }

    /**
     * Asserts that the selection toolbar color button has the "default" qa attribute.
     */
    async assertSelectionToolbarColorButtonDefault() {
        const button = this.selectionToolbar.getByLabel('Text color');
        await this.expect(button).toHaveAttribute('data-selected-color', 'default');
    }

    /**
     * Asserts that the selection toolbar color button does not have the "default" qa attribute.
     */
    async assertSelectionToolbarColorButtonNotDefault() {
        const button = this.selectionToolbar.getByLabel('Text color');
        await this.expect(button).not.toHaveAttribute('data-selected-color', 'default');
    }
}

class Image {
    protected readonly imageSettingsButton: Locator;
    protected readonly imageSettingsMenu: Locator;
    protected readonly image: Locator;

    constructor(page: Page) {
        this.imageSettingsButton = page.getByTestId('g-md-image-settings-button');
        this.imageSettingsMenu = page.getByTestId('g-md-image-settings-menu');
        this.image = page.getByTestId('g-md-image');
    }

    async clickImageSettingsButton() {
        const button = this.imageSettingsButton;
        await button.click();
    }

    async clickImageSettingsMenu(label: string) {
        const button = this.imageSettingsMenu.getByLabel(label);
        await button.click();
    }
}

class Link {
    protected readonly expect: Expect;
    protected readonly form: Locator;

    constructor(page: Page, expect: Expect) {
        this.expect = expect;
        this.form = page.getByTestId('g-md-link-form');
    }

    async assertFormToBeVisible() {
        await this.expect(this.form).toBeVisible();
    }
}

class YfmNote {
    protected readonly yfmNoteToolbar: Locator;

    constructor(page: Page) {
        this.yfmNoteToolbar = page.getByTestId('g-md-toolbar-yfm-note');
    }

    async clickYfmNoteToolbarButton(label: string) {
        const button = this.yfmNoteToolbar.getByLabel(label);
        await button.click();
    }
}

class YfmTable {
    readonly buttonPlusRowLocator;
    readonly buttonPlusColumnLocator;
    private readonly tableWrapperLocator;

    private readonly rowButtonLocator;
    private readonly columnButtonLocator;
    private readonly cellMenus: Readonly<Record<YfmTableCellMenuType, Locator>>;
    private readonly cellMenuActions: Readonly<Record<YfmTableActionKind, Locator>>;

    constructor(page: Page) {
        this.tableWrapperLocator = page.getByTestId('g-md-yfm-table-wrapper');
        this.buttonPlusRowLocator = page.getByTestId('g-md-yfm-table-plus-row');
        this.buttonPlusColumnLocator = page.getByTestId('g-md-yfm-table-plus-column');

        this.rowButtonLocator = page.getByTestId('g-md-yfm-table-row-btn');
        this.columnButtonLocator = page.getByTestId('g-md-yfm-table-column-btn');
        this.cellMenus = {
            row: page.getByTestId('g-md-yfm-table-row-menu'),
            column: page.getByTestId('g-md-yfm-table-column-menu'),
        };
        this.cellMenuActions = {
            'add-column-after': page.getByTestId('g-md-yfm-table-action-add-column-after'),
            'add-column-before': page.getByTestId('g-md-yfm-table-action-add-column-before'),
            'add-row-after': page.getByTestId('g-md-yfm-table-action-add-row-after'),
            'add-row-before': page.getByTestId('g-md-yfm-table-action-add-row-before'),
            'remove-column': page.getByTestId('g-md-yfm-table-action-remove-column'),
            'remove-row': page.getByTestId('g-md-yfm-table-action-remove-row'),
            'remove-table': page.getByTestId('g-md-yfm-table-action-remove-table'),
        };
    }

    getMenuLocator(type: YfmTableCellMenuType) {
        return this.cellMenus[type];
    }

    async getTable(locator?: Locator) {
        return locator?.locator(this.tableWrapperLocator) ?? this.tableWrapperLocator;
    }

    async getRows(table?: Locator) {
        return (table || (await this.getTable())).first().locator('table > tbody > tr');
    }

    async getCells(table?: Locator) {
        return (table || (await this.getTable())).first().locator('table > tbody > tr > td');
    }

    async getRowButtons(table?: Locator) {
        return (table || (await this.getTable())).first().locator(this.rowButtonLocator);
    }

    async getColumnButtons(table?: Locator) {
        return (table || (await this.getTable())).first().locator(this.columnButtonLocator);
    }

    async doCellAction(menuType: YfmTableCellMenuType, kind: YfmTableActionKind) {
        const menu = this.cellMenus[menuType];
        await menu.waitFor({state: 'visible'});
        await menu.locator(this.cellMenuActions[kind]).click();
        await menu.waitFor({state: 'hidden'});
    }

    async clickPlusRow(locator?: Locator) {
        const btnLoc = this.buttonPlusRowLocator;
        const loc = locator?.locator(btnLoc) ?? btnLoc;
        await loc.click();
    }

    async clickPlusColumn(locator?: Locator) {
        const btnLoc = this.buttonPlusColumnLocator;
        const loc = locator?.locator(btnLoc) ?? btnLoc;
        await loc.click();
    }
}

class MarkdownEditorLocators {
    readonly component;
    readonly contenteditable;
    readonly editor;
    readonly previewButton;
    readonly previewContent;
    readonly settingsButton;
    readonly settingsContent;
    readonly toolbars: MarkdownEditorToolbarsLocators;
    readonly toolbarMoreActionButton;
    readonly toolbarActionDisabledHint;
    readonly cmAutocomplete;

    constructor(page: Page) {
        // page
        this.component = page.getByTestId('demo-md-editor');
        this.editor = page.getByTestId('g-md-editor-mode');
        this.previewButton = page.getByTestId('g-md-markup-preview-button');
        this.previewContent = page.getByTestId('demo-md-preview');
        this.settingsButton = page.getByTestId('g-md-settings-button');
        this.settingsContent = page.getByTestId('g-md-settings-content');
        this.toolbars = {
            main: page.getByTestId('g-md-toolbar-main'),
            additional: page.getByTestId('g-md-toolbar-additional'),
            selection: page.getByTestId('g-md-toolbar-selection'),
            commandMenu: page.getByTestId('g-md-toolbar-command-menu'),
        };

        // editor
        this.contenteditable = this.editor.locator('[contenteditable=true]');
        this.toolbarMoreActionButton = this.editor.getByTestId('g-md-toolbar-more-action');
        this.toolbarActionDisabledHint = page.getByTestId('g-md-toolbar-action-disabled-hint');

        this.cmAutocomplete = this.editor.locator('.cm-tooltip-autocomplete');
    }
}

type PasteData = Partial<Record<DataTransferType, string>>;

type VisibleState = 'attached' | 'detached' | 'visible' | 'hidden' | undefined;

const DEFAULT_DELAY = 100;

export class MarkdownEditorPage {
    readonly locators;
    readonly yfmTable;
    readonly colorify;
    readonly yfmNote;
    readonly image;
    readonly link;
    protected readonly page: Page;
    protected readonly expect: Expect;

    constructor(page: Page, expect: Expect) {
        this.page = page;
        this.expect = expect;

        this.locators = new MarkdownEditorLocators(page);
        this.yfmTable = new YfmTable(page);
        this.colorify = new Colorify(page, expect, this.locators);
        this.yfmNote = new YfmNote(page);
        this.image = new Image(page);
        this.link = new Link(page, expect);
    }

    /**
     * Checks that the current editor mode matches the expected one
     */
    async assertMode(mode: MarkdownEditorMode) {
        await this.expect.poll(() => this.getMode()).toBe(mode);
    }

    /**
     * Asserts that the main toolbar button with the given aria-label is disabled.
     */
    async assertMainToolbarButtonDisabled(label: string, subLabel?: string) {
        const button = this.locators.toolbars.main.getByLabel(label);

        if (subLabel) {
            await button.click();
            await this.page.waitForTimeout(DEFAULT_DELAY);

            const item = this.getToolbarMenuByLabel(label).getByLabel(subLabel);
            await this.expect(item).toHaveClass(/disabled/);
            await button.click();
        } else {
            await this.expect(button).toHaveClass(/disabled/);
        }
    }

    /**
     * Asserts that the additional toolbar button with the given aria-label is disabled.
     */
    async assertAdditionalToolbarButtonDisabled(label: string) {
        await this.openMainToolbarMoreMenu();

        const button = this.locators.toolbars.additional.getByLabel(label);
        await this.expect(button).toHaveClass(/disabled/);
    }

    /**
     * Asserts that the selection toolbar button with the given aria-label is disabled.
     */
    async assertSelectionToolbarButtonDisabled(label: string) {
        const button = this.locators.toolbars.selection.getByLabel(label);
        await this.expect(button).toHaveClass(/disabled/);
    }

    /**
     * Asserts that the main toolbar button with the given aria-label is enabled.
     */
    async assertMainToolbarButtonEnabled(label: string, subLabel?: string) {
        const button = this.locators.toolbars.main.getByLabel(label);

        if (subLabel) {
            await button.click();
            await this.page.waitForTimeout(DEFAULT_DELAY);

            const item = this.getToolbarMenuByLabel(label).getByLabel(subLabel);
            await this.expect(item).not.toHaveClass(/disabled/);
            await button.click();
        } else {
            await this.expect(button).not.toHaveClass(/disabled/);
        }
    }

    /**
     * Asserts that the additional toolbar button with the given aria-label is enabled.
     */
    async assertAdditionalToolbarButtonEnabled(label: string) {
        await this.openMainToolbarMoreMenu();

        const button = this.locators.toolbars.additional.getByLabel(label);
        await this.expect(button).not.toHaveClass(/disabled/);
    }

    /**
     * Asserts that the selection toolbar button with the given aria-label is enabled.
     */
    async assertSelectionToolbarButtonEnabled(label: string) {
        const button = this.locators.toolbars.selection.getByLabel(label);
        await this.expect(button).not.toHaveClass(/disabled/);
    }

    /**
     * Asserts that the main toolbar button with the given aria-label is selected.
     */
    async assertMainToolbarButtonSelected(label: string) {
        const button = this.locators.toolbars.main.getByLabel(label);
        await this.expect(button).toHaveClass(/selected/);
    }

    /**
     * Asserts that the selection toolbar button with the given aria-label is selected.
     * If the button is "Heading", checks that the heading is selected as specified.
     */
    async assertSelectionToolbarButtonSelected(label: string, selectedLabel?: string) {
        if (label === 'Heading') {
            const select = this.locators.toolbars.selection.getByTestId('g-md-toolbar-text-select');
            const text = await select.locator('span').innerText();

            await this.expect(text).toBe(selectedLabel);
        } else {
            const button = this.locators.toolbars.selection.getByLabel(label);
            await this.expect(button).toHaveClass(/selected/);
        }
    }

    /**
     * Asserts that the main toolbar button with the given aria-label is not selected.
     */
    async assertMainToolbarButtonNotSelected(label: string) {
        const button = this.locators.toolbars.main.getByLabel(label);
        await this.expect(button).not.toHaveClass(/selected/);
    }

    /**
     * Asserts that the selection toolbar button with the given aria-label is not selected.
     */
    async assertSelectionToolbarButtonNotSelected(label: string) {
        const button = this.locators.toolbars.selection.getByLabel(label);
        await this.expect(button).not.toHaveClass(/selected/);
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
     * Opens the command menu toolbar and optionally searches for a command.
     */
    async openCommandMenuToolbar(search = '') {
        await this.pressSequentially('/' + search);
        await this.locators.toolbars.commandMenu.waitFor({state: 'visible'});
    }

    /**
     * Finds an element in the command menu by its text
     */
    getByTextInCommandMenu(text: string): Locator {
        return this.locators.toolbars.commandMenu.getByText(text);
    }

    /**
     * Selects a command from the command menu by first searching and then clicking the command.
     */
    async selectFromCommandMenu(searchText: string, commandText: string) {
        await this.openCommandMenuToolbar(searchText);
        await this.getByTextInCommandMenu(commandText).click();
        await this.locators.toolbars.commandMenu.waitFor({state: 'detached'});
    }

    /**
     * Finds an element by selector within the contenteditable area
     */
    getBySelectorInContenteditable(selector: string | Locator): Locator {
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
    async clickMainToolbarMoreActionButton() {
        await this.locators.toolbarMoreActionButton.click();
    }

    /**
     * Opens the "more actions" menu in the main toolbar if it is not already open.
     */
    async openMainToolbarMoreMenu() {
        const visible = await this.locators.toolbars.additional.isVisible();
        if (!visible) {
            await this.clickMainToolbarMoreActionButton();
            await this.locators.toolbars.additional.waitFor({state: 'visible'});
        }
    }

    /**
     * Hides the "more actions" menu in the main toolbar if it is visible.
     */
    async hideToolbarMoreMenu() {
        const visible = await this.locators.toolbars.additional.isVisible();
        if (visible) {
            await this.clickMainToolbarMoreActionButton();
            await this.locators.toolbars.additional.waitFor({state: 'hidden'});
        }
    }

    /**
     * Hovers over an action in the additional toolbar by its aria-label.
     */
    async hoverToolbarMoreAction(label: string) {
        await this.locators.toolbars.additional.waitFor({state: 'visible'});
        await this.getToolbarButton(label).hover({force: true});
    }

    /**
     * Waits for the toolbar action disabled hint to become visible.
     */
    async waitForToolbarActionDisabledHint() {
        await this.locators.toolbarActionDisabledHint.waitFor({state: 'visible'});
    }

    /**
     * Returns the locator for the toolbar dropdown menu related to the given label.
     */
    getToolbarMenuByLabel(label: string): Locator {
        return this.page.locator(`[data-toolbar-menu-for="${label}"]`);
    }

    /**
     * Clicks a main toolbar button using its aria-label.
     */
    async clickMainToolbarButton(label: string, subLabel?: string) {
        const button = this.locators.toolbars.main.getByLabel(label);

        await this.expect(button).toBeEnabled();
        await button.click();

        if (subLabel) {
            await this.page.waitForTimeout(DEFAULT_DELAY);

            const item = this.getToolbarMenuByLabel(label).getByLabel(subLabel);

            await this.expect(item).toBeEnabled();
            await item.click();
        }
    }

    /**
     * Clicks a additional toolbar button using its aria-label.
     */
    async clickAdditionalToolbarButton(label: string) {
        await this.openMainToolbarMoreMenu();

        const button = this.locators.toolbars.additional.getByLabel(label);

        await this.expect(button).toBeEnabled();
        await button.click();
    }

    /**
     * Clicks a selection toolbar button using its aria-label.
     */
    async clickSelectionToolbarButton(label: string, subLabel?: string) {
        const button =
            label === 'Heading'
                ? this.locators.toolbars.selection.getByTestId('g-md-toolbar-text-select')
                : this.locators.toolbars.selection.getByLabel(label);

        await this.expect(button).toBeEnabled();
        await button.click();

        if (subLabel) {
            await this.page.waitForTimeout(DEFAULT_DELAY);

            const item =
                label === 'Heading'
                    ? this.locators.toolbars.selection.getByLabel(subLabel)
                    : this.getToolbarMenuByLabel(label).getByLabel(subLabel);

            await this.expect(item).toBeEnabled();
            await item.click();
        }
    }

    /**
     * Clears all content from the contenteditable area
     */
    async clearContent() {
        await this.fill('');
    }

    /**
     * Removes focus from the contenteditable area
     */
    async blur() {
        await this.locators.contenteditable.blur();
    }

    /**
     * Add focus from the contenteditable area
     */
    async focus() {
        await this.locators.contenteditable.focus();
    }

    /**
     * Presses a key within the contenteditable area
     */
    async press(key: string, times = 1) {
        while (times > 0) {
            await this.locators.contenteditable.press(key);
            times--;
        }
    }

    /**
     * Presses each character sequentially in the contenteditable area
     */
    async pressSequentially(key: string) {
        await this.locators.contenteditable.pressSequentially(key);
    }

    /**
     * Types the given sequence of characters and then presses Space to apply an input rule.
     */
    async inputRule(sequence: string) {
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
        const mode = await this.getMode();

        if (mode === 'wysiwyg') {
            await this.switchMode('markup');
        }
        await this.locators.contenteditable.fill(text);
        await this.page.waitForTimeout(DEFAULT_DELAY);

        await this.switchMode(mode);
        await this.page.waitForTimeout(DEFAULT_DELAY);
    }

    /**
     * Selects text within the contenteditable area
     */
    async selectTextIn(selector?: string) {
        let loc = this.locators.contenteditable;
        if (selector) loc = loc.locator(selector);

        await loc.selectText();
        await this.page.waitForTimeout(DEFAULT_DELAY);
    }

    /**
     * Waits for the CodeMirror autocomplete popup to become visible.
     */
    async waitForCMAutocomplete() {
        await this.locators.cmAutocomplete.waitFor({state: 'visible'});
    }
}
