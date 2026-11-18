import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';

const require = createRequire(import.meta.url);

const markup = '#+ Folded {#anchor}\n\nSection text\n\n## Common\n\n##+ Nested\n\nNested text';

for (const [format, load] of [
    ['ESM', (name) => import(name)],
    ['CJS', async (name) => require(name)],
]) {
    test(`should parse and serialize with ${format} specs without a DOM`, async () => {
        const specs = await load(
            '@gravity-ui/markdown-editor-folding-heading-extension/wysiwyg/specs',
        );
        const {ExtensionsManager} = await load('@gravity-ui/markdown-editor/core');
        const {BaseSchemaSpecs, YfmConfigsSpecs, YfmHeadingSpecs} = await load(
            '@gravity-ui/markdown-editor/specs',
        );

        assert.equal(typeof globalThis.document, 'undefined');
        assert.equal(specs.FoldingHeadingAttr.Folding, 'folded');

        const {markupParser, serializer} = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(YfmConfigsSpecs, {attrs: {allowedAttributes: ['id']}})
                    .use(YfmHeadingSpecs, {})
                    .use(specs.FoldingHeadingSpecs),
        }).buildDeps();

        const doc = markupParser.parse(markup);
        const headings = [];
        doc.forEach((node) => {
            if (node.type.name === 'heading') headings.push(node.attrs);
        });
        assert.deepEqual(
            headings.map((attrs) => [
                attrs.level,
                attrs.id,
                attrs[specs.FoldingHeadingAttr.Folding],
            ]),
            [
                [1, 'anchor', true],
                [2, '', null],
                [2, '', true],
            ],
        );
        assert.equal(serializer.serialize(doc), markup);
    });
}
