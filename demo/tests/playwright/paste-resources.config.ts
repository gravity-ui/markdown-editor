import {defineConfig, devices} from '@playwright/experimental-ct-react';

import config from './playwright.config';

export default defineConfig(config, {
    testMatch: 'PasteResources.visual.test.tsx',
    projects: [
        {name: 'chromium', use: {...devices['Desktop Chrome']}},
        {name: 'firefox', use: {...devices['Desktop Firefox']}},
        {name: 'webkit', use: {...devices['Desktop Safari']}},
        {name: 'mobile-webkit', use: {...devices['iPhone 13']}},
    ],
});
