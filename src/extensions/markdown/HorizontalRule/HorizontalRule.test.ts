import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {
    horizontalRuleMarkupAttr,
    horizontalRuleNodeName,
    HorizontalRuleSpecs,
} from './HorizontalRuleSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(HorizontalRuleSpecs),
}).buildDeps();

const {doc, p, hr, hr2, hr3} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    hr: {nodeType: horizontalRuleNodeName},
    hr2: {nodeType: horizontalRuleNodeName, [horizontalRuleMarkupAttr]: '___'},
    hr3: {nodeType: horizontalRuleNodeName, [horizontalRuleMarkupAttr]: '***'},
}) as PMTestBuilderResult<'doc' | 'p' | 'hr' | 'hr2' | 'hr3'>;

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
