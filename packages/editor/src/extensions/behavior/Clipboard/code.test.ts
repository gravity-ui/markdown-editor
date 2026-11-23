import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {ClipboardEventMock, DataTransferMock} from '../../../../tests/event-mock';
import {ExtensionsManager} from '../../../core';
import {LoggerFacet} from '../../../core/utils/logger';
import {Logger2} from '../../../logger';
import {DataTransferType} from '../../../utils/clipboard';
import {MathNode, MathSpecs} from '../../additional/Math/MathSpecs';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {CodeSpecs, codeMarkName} from '../../markdown/Code/CodeSpecs';
import {CodeBlock, codeBlockNodeName} from '../../markdown/CodeBlock';
import {ReactRenderStorage, ReactRendererExtension} from '../ReactRenderer';

import {Clipboard} from './index';

const logger = new Logger2();
const {schema, plugins} = new ExtensionsManager({
    extensions: (builder) => {
        builder
            .use(BaseSchemaSpecs, {})
            .use(ReactRendererExtension, new ReactRenderStorage())
            .use(CodeBlock, {})
            .use(CodeSpecs)
            .use(MathSpecs)
            .use(Clipboard, {});
    },
    logger,
}).build();
plugins.unshift(LoggerFacet.of(logger));

const {doc, p, cb, code, mathB} = builders<'doc' | 'p' | 'cb' | 'code' | 'mathB'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    cb: {nodeType: codeBlockNodeName},
    code: {markType: codeMarkName},
    mathB: {nodeType: MathNode.Block},
});

function createView(startDoc: ReturnType<typeof doc>) {
    const {a, b = a} = startDoc.tag;
    const selection = TextSelection.create(startDoc, a, b);
    return new EditorView(null, {
        state: EditorState.create({schema, doc: startDoc, selection, plugins}),
    });
}

function paste(startDoc: ReturnType<typeof doc>, data: Record<string, string>) {
    const view = createView(startDoc);
    dispatchPasteEvent(view, data);
    const result = view.state.doc;
    view.destroy();
    return result;
}

const fromLineStart = {[DataTransferType.CodeLineStart]: 'true'};

describe('handlePasteIntoCodePlugin', () => {
    it('should keep code copied from the line start in the editor', () => {
        const text = 'foo\n\tbar\n\t\tbaz';
        expect(paste(doc(cb('a<a>b')), {'text/plain': text, ...fromLineStart})).toMatchNode(
            doc(cb(`a${text}b`)),
        );
    });

    it('should keep code copied from the line start of the same block', () => {
        const startDoc = doc(cb('<a>foo\n\tbar\n\t\tbaz<b>'));
        const view = createView(startDoc);
        const clipboardData = new DataTransferMock();
        view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData}));
        view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData}));
        expect(view.state.doc).toMatchNode(startDoc);
        view.destroy();
    });

    it('should keep code whose first line is indented', () => {
        const text = '\tfoo\n\tbar\n';
        expect(paste(doc(cb('a<a>b')), {'text/plain': text})).toMatchNode(doc(cb(`a${text}b`)));
    });

    it('should keep VS Code paste whose first line is indented', () => {
        const text = '    foo() {\n        bar();\n    }';
        expect(
            paste(doc(cb('a<a>b')), {'text/plain': text, 'vscode-editor-data': '{"version":1}'}),
        ).toMatchNode(doc(cb(`a${text}b`)));
    });

    it('should align code copied from the middle of a line', () => {
        expect(paste(doc(cb('a<a>b')), {'text/plain': 'foo();\n    bar();'})).toMatchNode(
            doc(cb('afoo();\nbar();b')),
        );
    });

    it('should keep code copied from the line start in a math block', () => {
        const text = 'foo\n\tbar';
        expect(paste(doc(mathB('a<a>b')), {'text/plain': text, ...fromLineStart})).toMatchNode(
            doc(mathB(`a${text}b`)),
        );
    });

    it('should remove indentation when pasting into inline code', () => {
        expect(
            paste(doc(p('x', code('a<a>b'))), {'text/plain': 'foo\n\tbar\n', ...fromLineStart}),
        ).toMatchNode(doc(p('x', code('afoo↵barb'))));
    });
});
