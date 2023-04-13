import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {CodeBlockSpecs} from './CodeBlockSpecs';
import {codeBlockNodeName, codeBlockLangAttr} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(CodeBlockSpecs, {}),
}).buildDeps();

const {doc, p, cb} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    cb: {nodeType: codeBlockNodeName},
}) as PMTestBuilderResult<'doc' | 'p' | 'cb'>;

const {same, parse} = createMarkupChecker({parser, serializer});

describe('CodeBlock extension', () => {
    it('should parse a code block', () =>
        same(
            'Some code:\n\n```\nHere it is\n```\n\nPara',
            doc(p('Some code:'), cb({[codeBlockLangAttr]: ''}, 'Here it is'), p('Para')),
        ));

    it('parses an intended code block', () =>
        parse(
            'Some code:\n\n    Here it is\n\nPara',
            doc(p('Some code:'), cb('Here it is'), p('Para')),
        ));

    it('should parse a fenced code block with info string', () =>
        same(
            'foo\n\n```javascript\n1\n```',
            doc(p('foo'), cb({[codeBlockLangAttr]: 'javascript'}, '1')),
        ));

    it('should parse a fenced code block with multiple new lines at the end', () =>
        same('```\nsome code\n\n\n\n```', doc(cb({[codeBlockLangAttr]: ''}, 'some code\n\n\n'))));

    // TODO: parsed: doc(paragraph("code\nblock"))
    it.skip('should parse html - pre tag', () => {
        parseDOM(schema, '<pre><code>code\nblock</code></pre>', doc(cb('code\nblock')));
    });
});
