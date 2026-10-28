import common from '@markdown-editor/vitest-config';
import {defineConfig, mergeConfig} from 'vitest/config';

export default mergeConfig(common, defineConfig({test: {environment: 'jsdom'}}));
