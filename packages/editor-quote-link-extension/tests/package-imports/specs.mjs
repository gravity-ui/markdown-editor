import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';

const require = createRequire(import.meta.url);

const markup = '> [Quote link](https://ya.ru){data-quotelink=true}\n> \n> quote link text';

for (const [format, load] of [
    ['ESM', (name) => import(name)],
    ['CJS', async (name) => require(name)],
]) {
    test(`should parse and serialize with ${format} specs without a DOM`, async () => {
        const specs = await load('@gravity-ui/markdown-editor-quote-link-extension/wysiwyg/specs');
        const {ExtensionsManager} = await load('@gravity-ui/markdown-editor/core');
        const {BaseSchemaSpecs, BlockquoteSpecs, YfmConfigsSpecs} = await load(
            '@gravity-ui/markdown-editor/specs',
        );

        assert.equal(typeof globalThis.document, 'undefined');
        assert.equal(specs.quoteLinkNodeName, 'yfm_quote-link');

        const {markupParser, serializer} = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(YfmConfigsSpecs, {attrs: {allowedAttributes: ['data-quotelink']}})
                    .use(BlockquoteSpecs)
                    .use(specs.QuoteLinkSpecs),
        }).buildDeps();

        const doc = markupParser.parse(markup);
        assert.equal(doc.firstChild.type.name, specs.quoteLinkNodeName);
        assert.equal(doc.firstChild.attrs[specs.QuoteLinkAttr.Cite], 'https://ya.ru');
        assert.equal(serializer.serialize(doc), markup);
    });
}
