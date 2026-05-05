/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        '\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.cjs',
    },
    transformIgnorePatterns: ['node_modules/(?!(@gravity-ui|@diplodoc)/)'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    verbatimModuleSyntax: false,
                },
            },
        ],
    },
};
