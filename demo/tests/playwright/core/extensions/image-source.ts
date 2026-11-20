import type {Locator} from '@playwright/test';

/** The image form of the banner windows: upload, link, and the file of the image. */
export class ImageSourceLocators {
    readonly uploadButton: Locator;
    readonly linkInput: Locator;
    readonly submitLinkButton: Locator;
    readonly replaceFileButton: Locator;
    readonly fileName: Locator;
    readonly error: Locator;
    private readonly dialog: Locator;

    constructor(dialog: Locator) {
        this.dialog = dialog;
        this.uploadButton = dialog.getByRole('button', {name: 'Upload', exact: true});
        this.linkInput = dialog.getByPlaceholder('https://');
        this.submitLinkButton = dialog.getByRole('button', {name: 'Submit', exact: true});
        this.replaceFileButton = dialog.getByRole('button', {name: 'Replace file', exact: true});
        this.fileName = dialog.locator('.g-md-header-settings__file-name');
        this.error = dialog.getByRole('alert');
    }

    tab(name: 'Upload from device' | 'Add by link') {
        return this.dialog.getByRole('tab', {name, exact: true});
    }
}
