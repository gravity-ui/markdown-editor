import {StrictMode, createElement, useLayoutEffect} from 'react';

import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {describe, expect, it, vi} from 'vitest';

import type {Extension} from '../core';
import {ReactRenderStorage} from '../extensions';
import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';
import {ImageSpecs} from '../extensions/markdown/Image/ImageSpecs';
import {Logger2} from '../logger';
import type {
    ResourceReplacementConfig,
    ResourceReplacementResult,
} from '../modules/resource-replacement';
import {DirectiveSyntaxContext} from '../utils/directive';

import {EditorImpl, type EditorInt} from './Editor';
import {useMarkdownEditor} from './useMarkdownEditor';

const registerResources: Extension = (builder) => {
    builder.use(BaseSchemaSpecs, {}).use(ImageSpecs);
    builder.overrideNodeSpec('image', (spec) => ({
        ...spec,
        _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
    }));
};

function createEditor(
    resourceReplacement: ResourceReplacementConfig,
    extensions = registerResources,
) {
    return new EditorImpl({
        logger: new Logger2(),
        renderStorage: new ReactRenderStorage(),
        preset: 'commonmark',
        directiveSyntax: new DirectiveSyntaxContext(undefined),
        pmTransformers: [],
        initial: {mode: 'markup', markup: 'before'},
        wysiwygConfig: {extensions},
        resourceReplacement,
    });
}

describe('resource replacement attachment lifecycle', () => {
    it.each(['markup', 'wysiwyg'] as const)(
        'should reuse the facade and recreate its %s view when StrictMode reconnects effects',
        (mode) => {
            vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
            const root = createRoot(document.createElement('div'));
            const attachments: Array<{editor: EditorInt; view: object}> = [];
            const onChange = vi.fn();
            let signal: AbortSignal | undefined;
            const resolve = vi.fn<NonNullable<ResourceReplacementConfig['resolve']>>(
                (_resources, context) => {
                    signal = context.signal;
                    return new Promise(() => {});
                },
            );
            function Probe() {
                const facade = useMarkdownEditor({
                    preset: 'commonmark',
                    initial: {mode},
                    resourceReplacement: {triggers: ['paste'], resolve, onChange},
                    wysiwygConfig: {
                        extensions: (builder) => {
                            builder.overrideNodeSpec('image', (spec) => ({
                                ...spec,
                                _resource: {kind: 'image', valueAttribute: 'src'},
                            }));
                        },
                    },
                });
                useLayoutEffect(() => {
                    const editor = facade as EditorInt;
                    attachments.push({
                        editor,
                        view:
                            mode === 'markup' ? editor.markupEditor.cm : editor.wysiwygEditor.view,
                    });
                }, [facade]);
                return null;
            }
            try {
                act(() => root.render(createElement(StrictMode, null, createElement(Probe))));
                expect(attachments).toHaveLength(2);
                expect(attachments[1].editor).toBe(attachments[0].editor);
                expect(attachments[1].view).not.toBe(attachments[0].view);
                const {editor} = attachments[1];
                act(() => {
                    if (mode === 'markup') {
                        editor.markupEditor.cm.dispatch({
                            changes: {from: 0, insert: '![image](/old.png)'},
                            userEvent: 'input.paste',
                        });
                    } else {
                        const view = editor.wysiwygEditor.view;
                        view.dispatch(
                            view.state.tr
                                .insert(1, view.state.schema.nodes.image.create({src: '/old.png'}))
                                .setMeta('paste', true),
                        );
                    }
                });
                expect(resolve).toHaveBeenCalledTimes(1);
                expect(editor.getPendingResourceReplacements()).toHaveLength(1);
            } finally {
                act(() => root.unmount());
                vi.unstubAllGlobals();
            }
            expect(signal?.aborted).toBe(true);
            expect(onChange.mock.calls.map(([event]) => event.status)).toEqual([
                'pending',
                'cancelled',
            ]);
        },
    );

    it('should leave Markdown dependencies lazy when triggers are omitted', () => {
        const extensions = vi.fn(registerResources);
        const resolve = vi.fn(async () => ({replacements: []}));
        const editor = createEditor({resolve}, extensions);
        try {
            editor.markupEditor.cm.dispatch({
                changes: {from: 0, insert: '![image](/old.png)'},
                userEvent: 'input.paste',
            });
            expect(extensions).not.toHaveBeenCalled();
            expect(resolve).not.toHaveBeenCalled();
            expect(editor._wysiwygView).toBeUndefined();
            expect(editor.getPendingResourceReplacements()).toEqual([]);
        } finally {
            editor.destroy();
        }
    });

    it('should cancel detached operations and create a fresh lifecycle without losing content or subscriptions', async () => {
        const requests: Array<{
            signal: AbortSignal;
            resolve: (result: ResourceReplacementResult) => void;
        }> = [];
        const extensions = vi.fn(registerResources);
        const onChange = vi.fn();
        const editor = createEditor(
            {
                triggers: ['paste'],
                resolve: (_resources, {signal}) =>
                    new Promise((resolve) => requests.push({signal, resolve})),
                onChange,
            },
            extensions,
        );
        const change = vi.fn();
        editor.on('change', change);
        try {
            const first = editor.markupEditor.cm;
            first.dispatch({
                changes: {from: 0, insert: '![first](/old.png) '},
                userEvent: 'input.paste',
            });
            expect(requests).toHaveLength(1);
            expect(editor._wysiwygView).toBeUndefined();
            editor.setEditorMode('wysiwyg');
            expect(editor.currentMode).toBe('markup');
            const saved = editor.getValue();
            const destroy = vi.spyOn(first, 'destroy');
            editor.destroy();
            expect(destroy).toHaveBeenCalledTimes(1);
            expect(requests[0].signal.aborted).toBe(true);
            expect(editor.getPendingResourceReplacements()).toEqual([]);

            const second = editor.markupEditor.cm;
            expect(second).not.toBe(first);
            expect(extensions).toHaveBeenCalledTimes(2);
            expect(editor._wysiwygView).toBeUndefined();
            expect(editor.getValue()).toBe(saved);
            requests[0].resolve({
                replacements: [{kind: 'image', oldValue: '/old.png', newValue: '/late.png'}],
            });
            for (let i = 0; i < 8; i++) await Promise.resolve();
            expect(editor.getValue()).toBe(saved);

            change.mockClear();
            second.dispatch({
                changes: {from: 0, insert: '![second](/old.png) '},
                userEvent: 'input.paste',
            });
            expect(requests).toHaveLength(2);
            requests[1].resolve({
                replacements: [{kind: 'image', oldValue: '/old.png', newValue: '/new.png'}],
            });
            for (let i = 0; i < 8; i++) await Promise.resolve();
            expect(editor.getValue()).toContain('/new.png');
            expect(editor.getValue()).not.toContain('/old.png');
            expect(editor.getPendingResourceReplacements()).toEqual([]);
            expect(change).toHaveBeenCalled();
            expect(onChange.mock.calls.map(([event]) => event.status)).toEqual([
                'pending',
                'cancelled',
                'pending',
                'succeeded',
            ]);
        } finally {
            editor.off('change', change);
            editor.destroy();
        }
    });
});
