import {EditorState, Plugin, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../core';
import {BaseNode, BaseSchemaSpecs} from '../../extensions/base/specs';
import {ReactRendererExtension} from '../../extensions/behavior/ReactRenderer';
import {
    BlockquoteSpecs,
    blockquoteNodeName,
} from '../../extensions/markdown/Blockquote/BlockquoteSpecs';
import {ReactRenderStorage} from '../../modules/react-renderer';

import {BaseTooltipPluginView} from './index';

const {schema, plugins} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(ReactRendererExtension, new ReactRenderStorage())
            .addPlugin(
                ({schema: {nodes}}) =>
                    new Plugin({
                        view: (view) =>
                            new BaseTooltipPluginView(view, {
                                idPrefix: 'quote-tooltip',
                                nodeType: nodes[blockquoteNodeName],
                                content: () => null,
                            }),
                    }),
            ),
}).build();

const {doc, p, blockquote} = builders(schema, {
    p: {nodeType: BaseNode.Paragraph},
    blockquote: {nodeType: blockquoteNodeName},
});

describe('BaseTooltipPluginView', () => {
    let view: EditorView | undefined;

    afterEach(() => {
        view?.destroy();
        view = undefined;
        vi.restoreAllMocks();
    });

    it('should skip rendering when the selection stays outside the tooltip node', () => {
        const content = doc(p('First'), p('Second'), blockquote(p('Quote')));
        const render = vi.spyOn(
            BaseTooltipPluginView.prototype as unknown as {render(): void},
            'render',
        );
        const editor = new EditorView(null, {
            state: EditorState.create({
                schema,
                doc: content,
                selection: TextSelection.create(content, 2),
                plugins,
            }),
        });
        view = editor;

        const moveTo = (pos: number) =>
            editor.dispatch(editor.state.tr.setSelection(TextSelection.create(content, pos)));

        moveTo(8);
        expect(render).not.toHaveBeenCalled();

        moveTo(17);
        expect(render).toHaveBeenCalledTimes(1);

        moveTo(2);
        expect(render).toHaveBeenCalledTimes(2);

        moveTo(8);
        expect(render).toHaveBeenCalledTimes(2);
    });
});
