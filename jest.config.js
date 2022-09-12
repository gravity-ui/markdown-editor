/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['spec.js', 'spec.ts'],
    setupFilesAfterEnv: ['<rootDir>tests/setup.ts'],
    moduleNameMapper: {
        '\\.(css|less|scss|sss|styl)$': '<rootDir>/node_modules/jest-css-modules',
        '.+\\.(svg|png|jpg)$': 'identity-obj-proxy',
    },
    moduleFileExtensions: ['tsx', 'ts', 'js'],
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
};
