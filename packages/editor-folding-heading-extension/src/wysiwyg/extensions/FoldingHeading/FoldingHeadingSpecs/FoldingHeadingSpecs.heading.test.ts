// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {
    BaseNode,
    BaseSchemaSpecs,
    YfmConfigsSpecs,
    YfmHeadingAttr,
    YfmHeadingSpecs,
    headingNodeName,
} from '@gravity-ui/markdown-editor/specs';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

import {FoldingHeadingAttr} from './const';

import {FoldingHeadingSpecs} from './index';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(YfmConfigsSpecs, {attrs: {allowedAttributes: ['id']}})
            .use(YfmHeadingSpecs, {})
            .use(FoldingHeadingSpecs),
}).buildDeps();

const {doc, p, h1, h2, h3, h4} = builders<'doc' | 'p' | 'h1' | 'h2' | 'h3' | 'h4'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    h1: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 1},
    h2: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 2},
    h3: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 3},
    h4: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 4},
});

const folded = {[FoldingHeadingAttr.Folding]: true};
const unfolded = {[FoldingHeadingAttr.Folding]: false};

function same(markup: string, expected: ReturnType<typeof doc>) {
    expect(markupParser.parse(markup).toJSON()).toEqual(expected.toJSON());
    expect(serializer.serialize(expected)).toBe(markup);
}

function parseHtml(html: string) {
    const container = document.createElement('div');
    container.innerHTML = html;
    return DOMParser.fromSchema(schema).parse(container);
}

function renderHtml(node: ReturnType<typeof doc>) {
    const container = document.createElement('div');
    container.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(node.content));
    return container.innerHTML;
}

describe('Folding Headings', () => {
    it('should keep the content of nested sections', () => {
        same(
            dd`
            #+ outer

            text 1

            ## common

            text 2

            ##+ inner

            text 3

            # next
            `,
            doc(
                h1(folded, 'outer'),
                p('text 1'),
                h2('common'),
                p('text 2'),
                h2(folded, 'inner'),
                p('text 3'),
                h1('next'),
            ),
        );
    });

    it('should keep the anchor of a folding heading', () => {
        same(
            '##+ heading {#anchor}',
            doc(h2({...folded, [YfmHeadingAttr.Id]: 'anchor'}, 'heading')),
        );
    });

    it('should serialize an unfolded heading as a folding heading', () => {
        expect(serializer.serialize(doc(h2(unfolded, 'heading')))).toBe('##+ heading');
    });

    it('should parse the folding state from html', () => {
        const parsed = parseHtml(dd`
            <h2 data-folded="true">folded</h2>
            <h3 data-folded="false" id="anchor">unfolded</h3>
            <h4>common</h4>
        `);
        expect(parsed.toJSON()).toEqual(
            doc(
                h2(folded, 'folded'),
                h3({...unfolded, [YfmHeadingAttr.Id]: 'anchor'}, 'unfolded'),
                h4('common'),
            ).toJSON(),
        );
    });

    it('should render the folding state to html', () => {
        expect(renderHtml(doc(h2(folded, 'a'), h3(unfolded, 'b'), h4('c')))).toBe(
            '<h2 data-folded="true">a</h2><h3 data-folded="false">b</h3><h4>c</h4>',
        );
    });
});
