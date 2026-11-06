import type {DependencyList} from 'react';

import {ViewPlugin} from '@codemirror/view';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {MarkdownEditorInstance, MarkdownEditorOptions} from './types';
import {useMarkdownEditor} from './useMarkdownEditor';

describe('useMarkdownEditor', () => {
    let root: Root;
    let editor: MarkdownEditorInstance;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        root = createRoot(document.createElement('div'));
    });

    afterEach(() => {
        act(() => root.unmount());
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should capture options with the default dependencies', () => {
        render({initial: {mode: 'markup', markup: 'first'}});
        const first = editor;

        render({initial: {mode: 'wysiwyg', markup: 'second'}});

        expect(editor).toBe(first);
        expect(editor.currentMode).toBe('markup');
        expect(editor.getValue()).toBe('first');
    });

    it('should keep an extracted getValue function through mode changes', () => {
        render({initial: {mode: 'markup', markup: 'first'}});
        const {getValue} = editor;
        const changes: null[] = [];
        editor.on('change', (value) => changes.push(value));

        editor.setEditorMode('wysiwyg');
        editor.replace('second');

        expect(editor.currentMode).toBe('wysiwyg');
        expect(editor.getValue).toBe(getValue);
        expect(getValue()).toBe('second');
        expect(changes).toEqual([null]);
    });

    it('should use the existing initial state defaults', () => {
        render({});

        expect({
            mode: editor.currentMode,
            toolbar: editor.toolbarVisible,
            preview: editor.previewVisible,
            value: editor.getValue(),
            empty: editor.isEmpty(),
        }).toEqual({mode: 'wysiwyg', toolbar: true, preview: false, value: '', empty: true});
    });

    it.each(['markup', 'wysiwyg'] as const)(
        'should route document operations to the active %s mode',
        (mode) => {
            render({initial: {mode}});

            editor.replace('middle');
            editor.prepend('first');
            editor.append('last');

            expect(editor.getValue().trim()).toBe('first\n\nmiddle\n\nlast');
            expect(editor.isEmpty()).toBe(false);

            editor.clear();

            expect(editor.getValue()).toBe('');
            expect(editor.isEmpty()).toBe(true);
        },
    );

    it.each(['markup', 'wysiwyg'] as const)(
        'should insert at named document edges in %s mode',
        (mode) => {
            render({initial: {mode, markup: 'middle'}});
            editor.moveCursor('end');
            editor.insert('last');
            editor.moveCursor('start');
            editor.insert('first');

            expect(editor.getValue()).toBe('firstmiddlelast');
        },
    );

    it.each(['markup', 'wysiwyg'] as const)(
        'should position the cursor in transferred text before and after %s initialization',
        (mode) => {
            render({
                initial: {mode: mode === 'markup' ? 'wysiwyg' : 'markup', markup: 'old'},
                wysiwygConfig: {
                    extensions: (builder) =>
                        builder.configureMd((md) => {
                            md.core.ruler.push('source-lines', (state) => {
                                for (const token of state.tokens) {
                                    // Leave the first line unmapped to check the fallback.
                                    if (token.map && token.map[0] > 0) {
                                        token.attrSet('data-line', String(token.map[0]));
                                    }
                                }
                            });
                            return md;
                        }),
                },
            });
            editor.replace('first\n\nlast');
            editor.setEditorMode(mode);

            editor.moveCursor({line: 0});
            editor.insert('new-');
            expect(editor.getValue()).toBe('new-first\n\nlast');

            editor.moveCursor({line: 2});
            editor.insert('new-');
            expect(editor.getValue()).toBe('new-first\n\nnew-last');
        },
    );

    it('should create each mode only when it is used', () => {
        const initialized: string[] = [];
        render({
            initial: {mode: 'markup', markup: 'source'},
            markupConfig: {
                extensions: [
                    ViewPlugin.define(() => {
                        initialized.push('markup');
                        return {};
                    }),
                ],
            },
            wysiwygConfig: {
                extensions: () => {
                    initialized.push('wysiwyg');
                },
            },
        });

        expect(initialized).toEqual([]);
        expect(editor.getValue()).toBe('source');
        expect(initialized).toEqual(['markup']);

        editor.setEditorMode('wysiwyg');
        expect(initialized).toEqual(['markup']);
        expect(editor.getValue()).toBe('source');
        expect(initialized).toEqual(['markup', 'wysiwyg']);
        editor.getValue();
        expect(initialized).toEqual(['markup', 'wysiwyg']);
    });

    it('should replace the instance, state and subscriptions when dependencies change', () => {
        render(
            {
                initial: {mode: 'markup', markup: 'first', toolbarVisible: false},
                markupConfig: {renderPreview: () => null},
            },
            [1],
        );
        const first = editor;
        editor.changePreviewVisible(true);
        const oldChanges: null[] = [];
        editor.on('change', (value) => oldChanges.push(value));

        render({initial: {mode: 'markup', markup: 'second'}}, [2]);
        expect(editor).not.toBe(first);
        expect(editor.getValue()).toBe('second');
        const newChanges: null[] = [];
        editor.on('change', (value) => newChanges.push(value));
        editor.replace('updated');

        expect(editor.toolbarVisible).toBe(true);
        expect(editor.previewVisible).toBe(false);
        expect(editor.getValue()).toBe('updated');
        expect(newChanges).toEqual([null]);
        expect(oldChanges).toEqual([]);
    });

    it('should skip same-mode requests and veto only an explicit false', () => {
        const requests: {mode: string; reason: string}[] = [];
        let allow: false | undefined = false;
        render({
            initial: {mode: 'markup'},
            experimental: {
                beforeEditorModeChange: (request) => {
                    requests.push(request);
                    return allow;
                },
            },
        });

        editor.setEditorMode('markup');
        expect(requests).toEqual([]);
        editor.setEditorMode('wysiwyg');
        expect(editor.currentMode).toBe('markup');
        expect(requests).toEqual([{mode: 'wysiwyg', reason: 'manually'}]);

        allow = undefined;
        editor.setEditorMode('wysiwyg');
        expect(editor.currentMode).toBe('wysiwyg');
    });

    function render(options: MarkdownEditorOptions, deps?: DependencyList) {
        act(() => root.render(<Harness options={options} deps={deps} />));
    }

    function Harness({options, deps}: {options: MarkdownEditorOptions; deps?: DependencyList}) {
        editor = useMarkdownEditor(options, deps);
        return null;
    }
});
