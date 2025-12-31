import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {DataTransferType} from '../../../utils/clipboard';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {CodeBlockNodeAttr, CodeBlockSpecs, codeBlockNodeName} from './CodeBlockSpecs';
import {getCodeData, isInlineCode} from './handle-paste';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(CodeBlockSpecs, {}),
}).buildDeps();

const {doc, p, cb} = builders<'doc' | 'p' | 'cb'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    cb: {nodeType: codeBlockNodeName},
});

const {same, parse} = createMarkupChecker({parser, serializer});

function createMockDataTransfer(data: Record<string, string>): DataTransfer {
    const types = Object.keys(data);
    return {
        types,
        getData: (type: string) => data[type] || '',
        setData: jest.fn(),
        clearData: jest.fn(),
        setDragImage: jest.fn(),
        dropEffect: 'none',
        effectAllowed: 'all',
        files: [] as unknown as FileList,
        items: [] as unknown as DataTransferItemList,
    } as DataTransfer;
}

describe('CodeBlock extension', () => {
    it('should parse a code block', () =>
        same(
            'Some code:\n\n```\nHere it is\n```\n\nPara',
            doc(p('Some code:'), cb('Here it is'), p('Para')),
        ));

    it('parses an intended code block', () =>
        parse(
            'Some code:\n\n    Here it is\n\nPara',
            doc(p('Some code:'), cb('Here it is'), p('Para')),
        ));

    it('should parse a fenced code block with info string', () =>
        same(
            'foo\n\n```javascript\n1\n```',
            doc(p('foo'), cb({[CodeBlockNodeAttr.Lang]: 'javascript'}, '1')),
        ));

    it('should parse a fenced code block with multiple new lines at the end', () =>
        same('```\nsome code\n\n\n\n```', doc(cb('some code\n\n\n'))));

    // TODO: parsed: doc(paragraph("code\nblock"))
    it.skip('should parse html - pre tag', () => {
        parseDOM(schema, '<pre><code>code\nblock</code></pre>', doc(cb('code\nblock')));
    });

    it('should support different markup', () =>
        same('~~~\n123\n~~~', doc(cb({[CodeBlockNodeAttr.Markup]: '~~~'}, '123'))));
});

describe('CodeBlock paste handling', () => {
    it('should detect inline code for single line text', () => {
        expect(isInlineCode('const x = 1')).toBe(true);
        expect(isInlineCode('const x = 1\nconst y = 2')).toBe(false);
    });

    it('should detect VSCode paste as inline for single line', () => {
        const data = createMockDataTransfer({
            [DataTransferType.Text]: 'const x = 1',
            [DataTransferType.VSCodeData]: '{"version":1}',
        });
        const result = getCodeData(data);

        expect(result).toEqual({
            editor: 'vscode',
            value: 'const x = 1',
            inline: true,
        });
    });

    it('should detect VSCode paste as block for multiline', () => {
        const data = createMockDataTransfer({
            [DataTransferType.Text]: 'const x = 1\nconst y = 2',
            [DataTransferType.VSCodeData]: '{"version":1}',
        });
        const result = getCodeData(data);

        expect(result).toEqual({
            editor: 'vscode',
            value: 'const x = 1\nconst y = 2',
            inline: false,
        });
    });

    it('should detect inline code from HTML <code> tag', () => {
        const data = createMockDataTransfer({
            [DataTransferType.Text]: 'x',
            [DataTransferType.Html]: '<code>x</code>',
        });
        const result = getCodeData(data);

        expect(result).toEqual({
            editor: 'code-editor',
            value: 'x',
            inline: true,
        });
    });

    it('should return null when no code-related data', () => {
        const data = createMockDataTransfer({
            [DataTransferType.Text]: 'some text',
            [DataTransferType.Html]: '<div>some text</div>',
        });
        expect(getCodeData(data)).toBeNull();
    });
});
