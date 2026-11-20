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

import {CodeBlockSpecs, codeBlockNodeName} from './CodeBlockSpecs';
import {codeBlockPastePlugin} from './plugins/codeBlockPastePlugin';

const logger = new Logger2();
const {schema, plugins} = new ExtensionsManager({
    extensions: (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(CodeBlockSpecs, {}).use(MathSpecs);
        builder.addPlugin(codeBlockPastePlugin, builder.Priority.High);
    },
    logger,
}).build();
plugins.unshift(LoggerFacet.of(logger));

const {doc, p, cb, mathI} = builders<'doc' | 'p' | 'cb' | 'mathI'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    cb: {nodeType: codeBlockNodeName},
    mathI: {nodeType: MathNode.Inline},
});

const editors: {name: string; data: Record<string, string>}[] = [
    {
        name: 'VS Code',
        data: {
            'vscode-editor-data':
                '{"version":1,"isFromEmptySelection":false,"multicursorText":null,"mode":"python"}',
        },
    },
    {
        name: 'JetBrains',
        data: {'text/rtf': '{\\rtf1\\ansi{\\fonttbl\\f0\\fmodern JetBrains Mono;}}'},
    },
];

function paste(startDoc: ReturnType<typeof doc>, data: Record<string, string>) {
    const state = EditorState.create({
        schema,
        doc: startDoc,
        selection: TextSelection.create(startDoc, startDoc.tag.a),
        plugins,
    });
    const view = new EditorView(null, {state});
    dispatchPasteEvent(view, data);
    return view.state.doc;
}

describe.each(editors)('codeBlockPastePlugin: paste from $name', ({data}) => {
    it('should remove indentation when pasting into inline math', () => {
        expect(
            paste(doc(p(mathI('a<a>b'))), {'text/plain': 'foo\n    bar\n', ...data}),
        ).toMatchNode(doc(p(mathI('afoo\nbarb'))));
    });

    it('should keep indentation when pasting into a code block', () => {
        const text = 'def f():\n    return 1';
        expect(paste(doc(cb('a<a>b')), {'text/plain': text, ...data})).toMatchNode(
            doc(cb(`a${text}b`)),
        );
    });

    it('should create a dedented code block when pasting into a paragraph', () => {
        expect(
            paste(doc(p('<a>')), {'text/plain': 'foo() {\n        bar();\n    }', ...data}),
        ).toMatchNode(doc(cb('foo() {\n    bar();\n}')));
    });
});
