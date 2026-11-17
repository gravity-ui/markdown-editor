import {join} from 'node:path';

import {beforeAll, expect, it} from 'vitest';

import {EDITOR_PACKAGE, packagesAt} from '../src/extension-pages/packages.mjs';
import {createGenerator, renderExtensionPages} from '../src/generate-extension-pages.mjs';

const FIXTURE_PACKAGES = packagesAt(join(import.meta.dirname, 'fixtures'), [
    {...EDITOR_PACKAGE, dir: 'editor'},
]);

let generator;
let pages;

beforeAll(() => {
    generator = createGenerator(FIXTURE_PACKAGES);
    pages = renderExtensionPages(generator);
});

it('should find every extension of the fixture', () => {
    expect([...pages.keys()]).toEqual(['Empty', 'Helper', 'Sample']);
});

it.each(['Empty', 'Sample'])('should render the %s page', async (name) => {
    await expect(pages.get(name)).toMatchFileSnapshot(`__snapshots__/${name}.md`);
});

it('should keep Not recognized out of the complete fixture', () => {
    expect(pages.get('Sample')).not.toContain('Not recognized');
});

it('should import the only extension function of a directory under its own name', () => {
    expect(pages.get('Helper')).toContain(
        "import {helperExtension} from '@gravity-ui/markdown-editor/extensions/additional/Helper/index.js';",
    );
});

it('should reject duplicate page names and identify both packages', () => {
    const original = generator.extensions[0];
    const duplicate = {
        ...original,
        package: {...original.package, name: 'another-extension-package'},
    };

    expect(() =>
        renderExtensionPages({
            ...generator,
            extensions: [...generator.extensions, duplicate],
        }),
    ).toThrow(
        `Duplicate extension page "${original.name}": ${original.package.name} and another-extension-package`,
    );
});
