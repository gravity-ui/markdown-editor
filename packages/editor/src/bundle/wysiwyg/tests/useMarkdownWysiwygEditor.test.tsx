import type {DependencyList} from 'react';

import {Plugin} from 'prosemirror-state';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {MarkdownEditorOptions} from 'src/bundle/types';
import type {
    MarkdownWysiwygEditorInstance,
    MarkdownWysiwygEditorOptions,
} from 'src/bundle/wysiwyg/public/types';
import {useMarkdownWysiwygEditor} from 'src/bundle/wysiwyg/public/useMarkdownWysiwygEditor';
import {Logger2} from 'src/logger';

describe('useMarkdownWysiwygEditor', () => {
    let root: Root;
    let editor: MarkdownWysiwygEditorInstance;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        root = createRoot(document.createElement('div'));
    });

    afterEach(() => {
        act(() => root.unmount());
        vi.unstubAllGlobals();
    });

    it('should capture options and initialize only when a document operation needs the engine', () => {
        const initialized: string[] = [];
        render({
            initial: {markup: 'first'},
            wysiwygConfig: {
                extensions: () => {
                    initialized.push('wysiwyg');
                },
            },
        });
        const first = editor;
        const {getValue} = editor;
        render({initial: {markup: 'second'}});

        expect(initialized).toEqual([]);
        expect(editor).toBe(first);
        expect(editor.getValue).toBe(getValue);
        expect(getValue()).toBe('first');
        expect(initialized).toEqual(['wysiwyg']);
    });

    it('should preserve defaults and expose only the standalone document API', () => {
        render({});
        expect(editor.toolbarVisible).toBe(true);
        expect(editor.getValue()).toBe('');
        expect(editor.isEmpty()).toBe(true);
        for (const name of [
            'currentMode',
            'setEditorMode',
            'previewVisible',
            'destroy',
            'wysiwygEditor',
            'isActive',
        ]) {
            expect(editor).not.toHaveProperty(name);
        }
    });

    it('should preserve document operations and emit each change once', () => {
        render({initial: {markup: 'middle'}});
        const changes: null[] = [];
        const onChange = (value: null) => changes.push(value);
        expect(editor.on('change', onChange)).toBeUndefined();
        editor.prepend('first');
        editor.append('last');
        expect(editor.getValue()).toBe('first\n\nmiddle\n\nlast');
        expect(changes).toEqual([null, null]);
        expect(editor.off('change', onChange)).toBeUndefined();
        editor.replace('next');
        editor.moveCursor('end');
        editor.insert('-end');
        editor.moveCursor('start');
        editor.insert('start-');
        expect(editor.getValue()).toBe('start-next-end');
        expect(changes).toEqual([null, null]);
        editor.clear();
        expect(editor.getValue()).toBe('');
        expect(editor.isEmpty()).toBe(true);
    });

    it('should move to a zero-based source line', () => {
        render({
            initial: {markup: 'first\n\nlast'},
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.configureMd((md) => {
                        md.core.ruler.push('source-lines', (state) => {
                            for (const token of state.tokens) {
                                if (token.map) token.attrSet('data-line', String(token.map[0]));
                            }
                        });
                        return md;
                    }),
            },
        });
        editor.moveCursor({line: 2});
        editor.insert('new-');
        expect(editor.getValue()).toBe('first\n\nnew-last');
    });

    it('should replace the instance and release the original engine once when dependencies change', () => {
        let destroyed = 0;
        const options: MarkdownWysiwygEditorOptions = {
            initial: {markup: 'first', toolbarVisible: false},
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.addPlugin(
                        () =>
                            new Plugin({
                                view: () => ({
                                    destroy: () => {
                                        destroyed++;
                                    },
                                }),
                            }),
                    ),
            },
        };
        render(options, [1]);
        const first = editor;
        expect(editor.getValue()).toBe('first');
        const oldChanges: null[] = [];
        first.on('change', (value) => oldChanges.push(value));
        render({initial: {markup: 'second'}}, [2]);
        expect(editor).not.toBe(first);
        expect(editor.toolbarVisible).toBe(true);
        expect(editor.getValue()).toBe('second');
        expect(destroyed).toBe(1);
        editor.replace('updated');
        expect(oldChanges).toEqual([]);
    });

    it('should ignore switching callbacks and markup configuration on wider options', () => {
        const callbacks = vi.fn();
        const options: MarkdownEditorOptions = {
            initial: {mode: 'markup', markup: 'source', splitModeEnabled: true},
            experimental: {
                prepareRawMarkup: () => {
                    callbacks();
                    return 'wrong';
                },
                beforeEditorModeChange: callbacks,
            },
            markupConfig: {renderPreview: callbacks},
        };
        render(options);
        expect(editor.getValue()).toBe('source');
        editor.insert('text');
        expect(callbacks).not.toHaveBeenCalled();
    });

    it('should report listener errors and keep other subscribers working', () => {
        const logger = new Logger2();
        const errors: unknown[] = [];
        const error = new Error('subscriber failed');
        logger.on('error', (data) => errors.push(data.error));
        render({logger});
        editor.on('change', () => {
            throw error;
        });
        const changes: null[] = [];
        editor.on('change', (value) => changes.push(value));
        editor.replace('text');
        expect(errors).toEqual([error]);
        expect(changes).toEqual([null]);
    });

    function render(options: MarkdownWysiwygEditorOptions, deps?: DependencyList) {
        act(() => root.render(<Harness options={options} deps={deps} />));
    }

    function Harness({
        options,
        deps,
    }: {
        options: MarkdownWysiwygEditorOptions;
        deps?: DependencyList;
    }) {
        editor = useMarkdownWysiwygEditor(options, deps);
        return null;
    }
});
