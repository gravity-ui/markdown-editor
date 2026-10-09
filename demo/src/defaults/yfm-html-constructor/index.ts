import {
    YFM_HTML_CONSTRUCTOR_STORAGE_KEY,
    parseTemplates,
    saveTemplates,
} from '@gravity-ui/markdown-editor/extensions/additional/YfmHtmlConstructor/templates/index.js';

import gravityUiLanding from './gravity-ui-landing.html?raw';

const SEEDED_FLAG_KEY = 'gravity-md-editor:yfm-html-constructor:demo-seeded';
let seeded = false;

/** Seed once so clearing templates remains effective, including without storage. */
export const seedYfmHtmlConstructorTemplates = (): void => {
    if (typeof window === 'undefined' || seeded) return;

    try {
        if (window.localStorage.getItem(SEEDED_FLAG_KEY)) {
            seeded = true;
            return;
        }
    } catch {
        // The template store also works when persistence is unavailable.
    }

    const templates = saveTemplates(parseTemplates(gravityUiLanding));
    seeded = true;

    try {
        if (
            window.localStorage.getItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY) ===
            JSON.stringify(templates)
        ) {
            window.localStorage.setItem(SEEDED_FLAG_KEY, '1');
        }
    } catch {
        // Leave the flag unset so another session can retry persistence.
    }
};
