import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {ExtensionsManager} from '../../../core';
import {LoggerFacet} from '../../../core/utils/logger';
import {Logger2} from '../../../logger';
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

const {doc, p, cb, code, mathB, mathI} = builders<'doc' | 'p' | 'cb' | 'code' | 'mathB' | 'mathI'>(
    schema,
    {
        doc: {nodeType: BaseNode.Doc},
        p: {nodeType: BaseNode.Paragraph},
        cb: {nodeType: codeBlockNodeName},
        code: {markType: codeMarkName},
        mathB: {nodeType: MathNode.Block},
        mathI: {nodeType: MathNode.Inline},
    },
);

function paste(startDoc: ReturnType<typeof doc>, data: Record<string, string>) {
    const state = EditorState.create({
        schema,
        doc: startDoc,
        selection: TextSelection.create(startDoc, startDoc.tag.a, startDoc.tag.b ?? startDoc.tag.a),
        plugins,
    });
    const view = new EditorView(null, {state});
    dispatchPasteEvent(view, data);
    const result = view.state.doc;
    view.destroy();
    return result;
}

describe('handlePasteIntoCodePlugin', () => {
    it('should keep indentation when replacing a selection from code into a paragraph', () => {
        expect(paste(doc(cb('a<a>b'), p('c<b>d')), {'text/plain': 'x\n    y'})).toMatchNode(
            doc(cb('ax\n    yd')),
        );
    });

    it('should handle IDE paste into inline code before the code block handler', () => {
        expect(
            paste(doc(p('x', code('a<a>b'))), {
                'text/plain': 'x\ny',
                'vscode-editor-data': '{"version":1}',
            }),
        ).toMatchNode(doc(p('x', code('ax↵yb'))));
    });

    it('should keep indentation of all lines when pasting into a code block', () => {
        const text = 'foo\n\tbar\n\t\tbombbar\n\t\t\ttest';
        expect(paste(doc(cb('a<a>b')), {'text/plain': text})).toMatchNode(doc(cb(`a${text}b`)));
    });

    it('should keep leading indentation and trailing line break when pasting into a code block', () => {
        const text = '\tfoo\n\tbar\n';
        expect(paste(doc(cb('a<a>b')), {'text/plain': text})).toMatchNode(doc(cb(`a${text}b`)));
    });

    it('should keep indentation when pasting from VS Code into a code block', () => {
        const text = '\tfoo\n\tbar';
        expect(
            paste(doc(cb('a<a>b')), {
                'text/plain': text,
                'vscode-editor-data':
                    '{"version":1,"isFromEmptySelection":false,"multicursorText":null,"mode":"python"}',
            }),
        ).toMatchNode(doc(cb(`a${text}b`)));
    });

    it('should keep indentation when pasting into a math block', () => {
        const text = '\tfoo\n\tbar';
        expect(paste(doc(mathB('a<a>b')), {'text/plain': text})).toMatchNode(
            doc(mathB(`a${text}b`)),
        );
    });

    it('should remove trailing line break when pasting into inline code', () => {
        expect(paste(doc(p('x', code('a<a>b'))), {'text/plain': 'foo\n'})).toMatchNode(
            doc(p('x', code('afoob'))),
        );
    });

    it('should remove indentation when pasting into inline math', () => {
        expect(paste(doc(p('x', mathI('a<a>b'))), {'text/plain': 'foo\n    bar\n'})).toMatchNode(
            doc(p('x', mathI('afoo\nbarb'))),
        );
    });
});
