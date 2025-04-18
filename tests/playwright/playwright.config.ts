import {resolve} from 'node:path';

import type {PlaywrightTestConfig} from '@playwright/experimental-ct-react';
import {defineConfig, devices} from '@playwright/experimental-ct-react';
import type {InlineConfig} from 'vite'; // eslint-disable-line import/no-extraneous-dependencies

import tsConfig from '../../tsconfig.json';

const pathFromRoot = (p: string) => {
    return resolve(__dirname, '../', p);
};

const aliasesFromTsConf = (() => {
    const baseUrl = resolve(__dirname, '..', '..', tsConfig.compilerOptions.baseUrl);
    const paths = tsConfig.compilerOptions.paths;

    return Object.entries(paths).reduce<Record<string, string>>((acc, [key, value]) => {
        const cleanKey = key.replace('/*', '');
        const cleanValue = value[0].replace('/*', '');
        acc[cleanKey] = resolve(baseUrl, cleanValue);
        return acc;
    }, {});
})();

const ctViteConfig: InlineConfig = {
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
    resolve: {
        alias: {
            ...aliasesFromTsConf,
            '~@gravity-ui/uikit/styles/mixins': '@gravity-ui/uikit/styles/mixins',
        },
    },
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
    testDir: pathFromRoot('visual-tests'),
    testMatch: '*.visual.test.tsx',
    updateSnapshots: process.env.UPDATE_REQUEST ? 'all' : 'missing',
    snapshotPathTemplate:
        '{testDir}/__snapshots__/{testFileName}-snapshots/{arg}{-projectName}-linux{ext}',
    /* Maximum time one test can run for. */
    timeout: 10 * 1000,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: Boolean(process.env.CI),
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 2 : 2,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['list'],
        [
            'html',
            {
                open: process.env.CI ? 'never' : 'on-failure',
                outputFolder: resolve(
                    process.cwd(),
                    process.env.IS_DOCKER ? 'playwright-report-docker' : 'playwright-report',
                ),
            },
        ],
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        testIdAttribute: 'data-qa',
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        headless: true,
        screenshot: 'only-on-failure',
        timezoneId: 'UTC',
        ctCacheDir: process.env.IS_DOCKER ? '.cache-docker' : '.cache',
        /* Configure Vite settings for component testing.
        See https://playwright.dev/docs/test-components#i-have-a-project-that-already-uses-vite-can-i-reuse-the-config */
        ctViteConfig,
    },
    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                deviceScaleFactor: 2,
            },
        },
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                deviceScaleFactor: 2,
            },
        },
    ],
};

export default defineConfig(config);
