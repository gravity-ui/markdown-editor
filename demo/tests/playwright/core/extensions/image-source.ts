import type {Locator} from '@playwright/test';

export class ImageSourceLocators {
    readonly uploadButton: Locator;
    readonly linkInput: Locator;
    readonly linkTextInputs: Locator;
    readonly submitLinkButton: Locator;
    readonly replaceFileButton: Locator;
    readonly fileName: Locator;
    private readonly dialog: Locator;

    constructor(dialog: Locator) {
        this.dialog = dialog;
        this.uploadButton = dialog.getByRole('button', {name: 'Upload', exact: true});
        this.linkInput = dialog.getByPlaceholder('https://');
        this.linkTextInputs = dialog.locator(
            '.g-md-image-form__input_type_name, .g-md-image-form__input_type_alt',
        );
        this.submitLinkButton = dialog.getByRole('button', {name: 'Submit', exact: true});
        this.replaceFileButton = dialog.getByRole('button', {name: 'Replace file', exact: true});
        this.fileName = dialog.locator('.g-md-header-settings__file-name');
    }

    tab(name: string) {
        return this.dialog.getByRole('tab', {name, exact: true});
    }
}
