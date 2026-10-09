export class FocusManager {
    #doc: Document;
    #previousFocused: HTMLElement | null = null;

    constructor(doc: Document = document) {
        this.#doc = doc;
    }

    storeFocus() {
        this.#previousFocused = this.#doc.activeElement as HTMLElement | null;
    }

    restoreFocus(options?: FocusOptions) {
        this.#previousFocused?.focus?.(options);
    }
}
