const {pathsToModuleNameMapper} = require('ts-jest');
const {compilerOptions} = require('./tsconfig.json');

const esmModules = ['cheerio', '@diplodoc'];

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['spec.js', 'spec.ts', 'visual.test.tsx'],
    setupFilesAfterEnv: ['<rootDir>tests/setup.ts'],
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>/'}),
        '\\.(css|less|scss|sss|styl)$': '<rootDir>/node_modules/jest-css-modules',
        '.+\\.(svg|png|jpg)$': 'identity-obj-proxy',
    },
    moduleFileExtensions: ['tsx', 'ts', 'js'],
    transformIgnorePatterns: [`node_modules/(?!(?:.pnpm/)?(${esmModules.join('|')}))`],
    transform: {
        '.ts(x)?': [
            'ts-jest',
            {
                isolatedModules: true,
            },
        ],
    },
};
