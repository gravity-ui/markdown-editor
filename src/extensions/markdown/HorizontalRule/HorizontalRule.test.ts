import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';

import {
    HorizontalRuleSpecs,
    horizontalRuleMarkupAttr,
    horizontalRuleNodeName,
} from './HorizontalRuleSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(HorizontalRuleSpecs),
}).buildDeps();

const {doc, p, hr, hr2, hr3} = builders<'doc' | 'p' | 'hr' | 'hr2' | 'hr3'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    hr: {nodeType: horizontalRuleNodeName},
    hr2: {nodeType: horizontalRuleNodeName, [horizontalRuleMarkupAttr]: '___'},
    hr3: {nodeType: horizontalRuleNodeName, [horizontalRuleMarkupAttr]: '***'},
});

const {same} = createMarkupChecker({parser, serializer});

describe('HorizontalRule extension', () => {
    it('should parse a horizontal rule ---', () => same('---', doc(hr())));

    it('should parse a horizontal rule ___', () => same('___', doc(hr2())));

    it('should parse a horizontal rule ***', () => same('***', doc(hr3())));

    it('should parse a horizontal rule between paragraphs', () => {
        const markup = `
hello

---

world!
        `.trim();

        same(markup, doc(p('hello'), hr(), p('world!')));
    });

    it('should parse html - hr tag', () => {
        parseDOM(schema, 'hello<hr>world!', doc(p('hello'), hr(), p('world!')));
    });
});
