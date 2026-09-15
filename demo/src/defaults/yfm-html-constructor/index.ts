import {
    parseTemplates,
    saveTemplates,
} from '@gravity-ui/markdown-editor/extensions/additional/YfmHtmlConstructor/templates/index.js';

import gravityUiLanding from './gravity-ui-landing.html';

const SEEDED_FLAG_KEY = 'gravity-md-editor:yfm-html-constructor:demo-seeded';

/**
 * The demo ships a "Gravity UI" template family. To make the whole flow go
 * through localStorage — so the picker's "Clear all templates" can actually
 * remove them — we seed those defaults into storage once instead of passing
 * them as static `items`. The flag keeps a cleared list cleared across reloads.
 */
export const seedYfmHtmlConstructorTemplates = (): void => {
    if (typeof window === 'undefined') return;

    try {
        if (window.localStorage.getItem(SEEDED_FLAG_KEY)) return;
        saveTemplates(parseTemplates(gravityUiLanding));
        window.localStorage.setItem(SEEDED_FLAG_KEY, '1');
    } catch {
        // Storage may be unavailable in the demo environment; ignore.
    }
};
