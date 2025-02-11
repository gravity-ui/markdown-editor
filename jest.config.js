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
    transformIgnorePatterns: ['node_modules/(?!cheerio)'],
    transform: {
        '.ts(x)?': [
            'ts-jest',
            {
                isolatedModules: true,
            },
        ],
    },
};
