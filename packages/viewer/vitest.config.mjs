import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import process from 'node:process';

import common from '@markdown-editor/vitest-config';
import {defineConfig, mergeConfig} from 'vitest/config';

const require = createRequire(import.meta.url);
const react19 = process.env.VIEWER_REACT_VERSION === '19';
const requireReact = react19
    ? createRequire(require.resolve('@markdown-viewer-tests/react19/package.json'))
    : require;

export default mergeConfig(
    common,
    defineConfig({
        define: {__VIEWER_REACT_MAJOR__: JSON.stringify(react19 ? '19' : '18')},
        resolve: {
            alias: {
                '@gravity-ui/uikit/i18n': requireReact.resolve('@gravity-ui/uikit/i18n'),
                '@gravity-ui/uikit/legacy': requireReact.resolve('@gravity-ui/uikit/legacy'),
                '@gravity-ui/uikit': requireReact.resolve('@gravity-ui/uikit'),
                '@gravity-ui/components': requireReact.resolve('@gravity-ui/components'),
                react: dirname(requireReact.resolve('react/package.json')),
                'react-dom': dirname(requireReact.resolve('react-dom/package.json')),
            },
        },
        test: {
            environment: 'jsdom',
            setupFiles: ['./tests/setup.ts'],
        },
    }),
);
