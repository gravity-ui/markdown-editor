import {afterEach, expect, it} from 'vitest';

import {renderExtensionPage} from '../src/extension-pages/render-page.mjs';

import {indexFixture} from './test-fixture.mjs';

const SECTIONS = [
    '### Description',
    '### Options',
    '### Actions',
    '### Keys',
    '### Input rules',
    '### Directive syntax',
    '## Toolbar',
    '### Import',
];

let fixture;

afterEach(() => fixture?.cleanup());

/** Renders the page of an extension declared in the fixture file. */
function renderFixturePage(source, name) {
    fixture = indexFixture(source);
    const {packages, index, file} = fixture;

    return renderExtensionPage(
        {index, packages},
        {name, exportName: name, file, package: packages[0]},
    );
}

/** Reads the first line after the last heading with the given text and the empty line under it. */
function bodyOf(page, heading, position = 'last') {
    const lines = page.split('\n');
    const at = position === 'last' ? lines.lastIndexOf(heading) : lines.indexOf(heading);

    return lines[at + 2];
}

it('should write Not found under every heading of an extension without data', () => {
    const page = renderFixturePage(
        'export const Sample = (builder: ExtensionBuilder) => {};',
        'Sample',
    );

    for (const heading of SECTIONS.filter((section) => section !== '### Import')) {
        expect(bodyOf(page, heading), heading).toBe('Not found');
    }
    expect(page.match(/^### Import$/gm)).toHaveLength(2);
    expect(page).toContain(
        "import {Sample} from '@gravity-ui/markdown-editor/extensions/markdown/Sample/index.js';",
    );
    expect(page.split('\n').at(-2)).toBe('Not found');
});

it('should write Not found under every heading of a name that the file does not export', () => {
    const page = renderFixturePage(
        'export const sample = (builder: ExtensionBuilder) => {};',
        'Sample',
    );

    expect(page.match(/^Not found$/gm)).toHaveLength(SECTIONS.length + 2);
});

it('should write Not recognized when an extension registers only computed keys', () => {
    const page = renderFixturePage(
        [
            'export const Sample = (builder: ExtensionBuilder, key: string) => {',
            '    builder.addKeymap(() => ({[key]: () => true}));',
            '};',
        ].join('\n'),
        'Sample',
    );

    expect(bodyOf(page, '### Keys')).toBe('Not recognized');
    expect(page.match(/^Not recognized$/gm)).toHaveLength(1);
});

it('should print an options type without named properties as written', () => {
    const page = renderFixturePage(
        [
            'type SampleOptions = Record<string, string | null>;',
            'export const Sample = (builder: ExtensionBuilder, options: SampleOptions) => {};',
        ].join('\n'),
        'Sample',
    );

    expect(bodyOf(page, '### Options', 'first')).toBe('`Record<string, string | null>`');
});

it('should exclude registrations in uncalled functions and include directly called helpers', () => {
    const page = renderFixturePage(
        `export const Sample = (builder: ExtensionBuilder) => {
            const unused = () => builder.addAction('unusedAction', () => ({}));
            const register = () => {
                builder.addAction('registeredAction', () => ({}));
            };
            register();
        };`,
        'Sample',
    );

    expect(page).toContain('`registeredAction`');
    expect(page).not.toContain('unusedAction');
});
