import {test as base, expect} from '@playwright/experimental-ct-react';

import {MarkdownEditorPage} from './editor';
import {expectScreenshot} from './expectScreenshot';
import {DebugHelpers, PlaywrightHelpers} from './helpers';
import {mount} from './mount';
import type {Fixtures} from './types';
import {wait} from './wait';

export const test = base.extend<Fixtures>({
    mount,
    expectScreenshot,
    wait,
    editor: async ({page}, use) => {
        const editor = new MarkdownEditorPage(page, expect);
        await use(editor);
    },
    helpers: async ({page, context}, use) => {
        const helpers = new PlaywrightHelpers({page, context});
        await use(helpers);
    },
    debug: async ({page}, use) => {
        const debug = new DebugHelpers({page});
        await use(debug);
    },
    platform: [process.platform, {scope: 'test'}],
});

export {expect} from '@playwright/experimental-ct-react';
