import {afterEach, describe, expect, it} from 'vitest';

import {
    collectExtensionCalls,
    exportedDeclaration,
} from '../src/extension-pages/extension-graph.mjs';
import {markdownPluginSection} from '../src/extension-pages/sections/markdown-plugin.mjs';

import {indexFixture} from './test-fixture.mjs';

let fixture;

afterEach(() => fixture?.cleanup());

/** Renders the markdown plugin section of the `Sample` extension. */
function renderPluginSection(source) {
    fixture = indexFixture(source);
    const {index, packages, file} = fixture;
    const {calls} = collectExtensionCalls(index, exportedDeclaration(index, file, 'Sample'));

    return markdownPluginSection({index, packages, calls}).join('\n');
}

/** Builds a `Sample` extension that configures markdown-it with one statement. */
function sampleExtension(imports, body) {
    return [
        ...imports,
        'export const Sample = (builder: ExtensionBuilder) => {',
        `    builder.configureMd((md) => ${body});`,
        '};',
    ].join('\n');
}

describe('md.use output', () => {
    it('should print a call with literal arguments and an imported factory', () => {
        const page = renderPluginSection(
            sampleExtension(
                ["import {transform} from 'some-plugin';"],
                "md.use(transform({bundle: false, list: [1, 'a']}), {output: ''})",
            ),
        );

        expect(page).toContain(
            [
                '```ts',
                "import {transform} from 'some-plugin';",
                '',
                "md.use(transform({bundle: false, list: [1, 'a']}), {output: ''});",
                '```',
            ].join('\n'),
        );
    });

    it('should print a call with an imported plugin and no options', () => {
        const page = renderPluginSection(
            sampleExtension(["import plugin from 'some-plugin';"], 'md.use(plugin)'),
        );

        expect(page).toContain('md.use(plugin);');
    });

    it('should print only the import when an argument is a variable', () => {
        const page = renderPluginSection(
            sampleExtension(
                ["import plugin from 'some-plugin';", "const log = 'log';"],
                'md.use(plugin, {log})',
            ),
        );

        expect(page).toContain(['```ts', "import plugin from 'some-plugin';", '```'].join('\n'));
        expect(page).not.toContain('md.use');
    });

    it('should print only the import when an argument is a method call', () => {
        const page = renderPluginSection(
            sampleExtension(
                ["import {transform} from 'some-plugin';", 'declare const context: any;'],
                "md.use(transform({directiveSyntax: context?.valueFor('key')}))",
            ),
        );

        expect(page).not.toContain('md.use');
    });

    it('should name a plugin imported from a relative path without an import', () => {
        const page = renderPluginSection(
            sampleExtension(["import plugin from './plugin';"], 'md.use(plugin)'),
        );

        expect(page).toContain(
            ['### Import', '', 'Defined in the editor: `plugin`', '', '### Options'].join('\n'),
        );
        expect(page).not.toContain('import plugin');
    });

    it('should print calls in execution order and imports sorted', () => {
        const page = renderPluginSection(
            sampleExtension(
                ["import zeta from 'zeta-plugin';", "import alpha from 'alpha-plugin';"],
                'md.use(zeta, {step: 1}).use(zeta, {step: 2}).use(alpha)',
            ),
        );

        expect(page).toContain(
            [
                "import alpha from 'alpha-plugin';",
                "import zeta from 'zeta-plugin';",
                '',
                'md.use(zeta, {step: 1});',
                'md.use(zeta, {step: 2});',
                'md.use(alpha);',
            ].join('\n'),
        );
    });

    it('should print the imports of nested calls and only the bindings in use', () => {
        const page = renderPluginSection(
            sampleExtension(
                [
                    "import {plugin, unused} from 'some-plugin';",
                    "import {makeOptions} from 'helper-package';",
                    'void unused;',
                ],
                'md.use(plugin, {nested: makeOptions()})',
            ),
        );

        expect(page).toContain(
            [
                "import {makeOptions} from 'helper-package';",
                "import {plugin} from 'some-plugin';",
                '',
                'md.use(plugin, {nested: makeOptions()});',
            ].join('\n'),
        );
    });

    it('should not print a call of a nested function without a package import', () => {
        const page = renderPluginSection(
            sampleExtension(
                ["import plugin from 'some-plugin';", 'const makeOptions = () => ({});'],
                'md.use(plugin, {nested: makeOptions()})',
            ),
        );

        expect(page).toContain(['```ts', "import plugin from 'some-plugin';", '```'].join('\n'));
        expect(page).not.toContain('md.use');
    });
});

describe('helper registrations', () => {
    it('should exclude plugin registrations in uncalled helper functions', () => {
        const page = renderPluginSection(
            sampleExtension(
                ["import plugin from 'some-plugin';"],
                '{ const unused = () => md.use(plugin); return md; }',
            ),
        );

        expect(page).not.toContain('some-plugin');
        expect(page).not.toContain('md.use');
        expect(page).toContain('### Import\n\nNot found');
    });

    it('should preserve repeated direct helper calls and stop recursive traversal', () => {
        const page = renderPluginSection(
            sampleExtension(
                ["import plugin from 'some-plugin';"],
                `{
                const register = () => {
                    md.use(plugin);
                    if (false) register();
                };
                register();
                register();
                return md;
            }`,
            ),
        );

        expect(page.match(/md\.use\(plugin\);/g)).toHaveLength(2);
    });
});
