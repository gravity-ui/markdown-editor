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
            doc(
                p('Some code:'),
                cb({[codeBlockLangAttr]: ''}, schema.text('Here it is\n')),
                p('Para'),
            ),
        ));

    it('parses an intended code block', () =>
        parse(
            'Some code:\n\n    Here it is\n\nPara',
            doc(p('Some code:'), cb('Here it is\n'), p('Para')),
        ));

    it('should parse a fenced code block with info string', () =>
        same(
            'foo\n\n```javascript\n1\n```',
            doc(
                p('foo'),
                schema.node(codeBlockNodeName, {[codeBlockLangAttr]: 'javascript'}, [
                    schema.text('1\n'),
                ]),
            ),
        ));

    // TODO: parsed: doc(paragraph("code\nblock"))
    it.skip('should parse html - pre tag', () => {
        parseDOM(schema, '<pre><code>code\nblock</code></pre>', doc(cb('code\nblock')));
    });
});
