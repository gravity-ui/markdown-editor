// @vitest-environment jsdom
import {type ReactElement, createElement} from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {describe, expect, it, vi} from 'vitest';

import {GptDialog} from '../../../components/GptDialog';
import type {GptDialogProps} from '../../../types';

import {runGpt} from './commands';
import {gptWidgetPlugin} from './plugin';
import {pluginKey} from './plugin-key';

const schema = new Schema({
    nodes: {
        doc: {content: 'paragraph+'},
        paragraph: {content: 'text*', toDOM: () => ['p', 0]},
        text: {},
    },
});
function setup(remove = () => {}, request?: () => Promise<{rawText: string}>) {
    const renders: (() => unknown)[] = [];
    const onUpdate = vi.fn();
    const plugin = gptWidgetPlugin({
        getRenderer: () => ({
            createItem: (_id, render) => {
                renders.push(render);
                return {rerender() {}, remove};
            },
        }),
        parser: {
            parse: (text) =>
                schema.node('doc', null, [
                    schema.node('paragraph', null, text ? schema.text(text) : []),
                ]),
        },
        serializer: {serialize: (doc) => doc.textContent},
        answerRender: () => createElement('div'),
        onCustomPromptApply: async () => undefined,
        onPromptPresetClick: request,
        promptPresets: [{key: 'a', display: 'A'}],
        onUpdate,
    });
    function view() {
        return new EditorView(document.createElement('div'), {
            state: EditorState.create({
                schema,
                doc: schema.node('doc', null, [
                    schema.node('paragraph', null, schema.text('source')),
                ]),
                plugins: [plugin],
            }),
        });
    }
    return {view, renders, onUpdate};
}

describe('GPT view lifecycle', () => {
    it('should keep preset state independent when reusing one plugin instance', () => {
        const {view, renders} = setup();
        const first = view(),
            second = view();
        try {
            runGpt(first.state, first.dispatch);
            expect((renders[0]() as ReactElement<GptDialogProps>).props.disablePromptPresets).toBe(
                true,
            );
            second.dispatch(
                second.state.tr.setSelection(TextSelection.create(second.state.doc, 1, 5)),
            );
            runGpt(second.state, second.dispatch);
            expect((renders[0]() as ReactElement<GptDialogProps>).props.disablePromptPresets).toBe(
                true,
            );
        } finally {
            first.destroy();
            second.destroy();
        }
    });
    it('should keep the popup for a transaction that sets the same selection', () => {
        const {view} = setup();
        const editor = view();
        try {
            runGpt(editor.state, editor.dispatch);
            expect(pluginKey.getState(editor.state)?.find()).toHaveLength(1);
            editor.dispatch(editor.state.tr.setSelection(editor.state.selection));
            expect(pluginKey.getState(editor.state)?.find()).toHaveLength(1);
        } finally {
            editor.destroy();
        }
    });
    it('should invalidate callbacks immediately on editor destruction', () => {
        const {view, renders, onUpdate} = setup();
        const editor = view();
        runGpt(editor.state, editor.dispatch);
        const popup = renders[0]() as ReactElement<GptDialogProps>;
        editor.destroy();
        popup.props.onUpdate?.({rawText: 'late'});
        expect(onUpdate).not.toHaveBeenCalled();
    });
    it('should not notify when a pending request resolves in the destroy tick', async () => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
        vi.stubGlobal('requestAnimationFrame', () => 0);
        vi.stubGlobal('cancelAnimationFrame', () => {});
        const container = document.body.appendChild(document.createElement('div'));
        const root = createRoot(container);
        let resolve!: (data: {rawText: string}) => void;
        const delayed = new Promise<{rawText: string}>((r) => {
            resolve = r;
        });
        const {view, renders, onUpdate} = setup(
            () => root.render(null),
            () => delayed,
        );
        const editor = view();
        try {
            runGpt(editor.state, editor.dispatch);
            editor.dispatch(
                editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1, 5)),
            );
            runGpt(editor.state, editor.dispatch);
            const props = (renders[0]() as ReactElement<GptDialogProps>).props;
            act(() =>
                root.render(
                    <ThemeProvider theme="light">
                        <GptDialog {...props} />
                    </ThemeProvider>,
                ),
            );
            const button = Array.from(container.querySelectorAll('button')).find(
                (b) => b.textContent === 'A',
            );
            expect(button).toBeDefined();
            act(() => button?.click());
            await act(async () => {
                editor.destroy();
                resolve({rawText: 'late'});
                await delayed;
            });
            expect(onUpdate).not.toHaveBeenCalled();
        } finally {
            act(() => root.unmount());
            container.remove();
            vi.unstubAllGlobals();
        }
    });
});
