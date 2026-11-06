import {CompletionContext, type CompletionSource} from '@codemirror/autocomplete';
import {describe, expect, it, onTestFinished, vi} from 'vitest';

import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';
import {Logger2} from '../logger';
import {ReactRenderStorage} from '../modules/react-renderer';
import {DirectiveSyntaxContext} from '../utils/directive';

import {EditorImpl} from './Editor';

describe('EditorImpl: mode changes', () => {
    it('should not create an editor from pending mode focus after destroy', () => {
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const initializeWysiwyg = vi.fn();
        const editor = createModeEditor({
            initial: {mode: 'markup'},
            wysiwygConfig: {
                extensions: (builder) => {
                    initializeWysiwyg();
                    return builder.use(BaseSchemaSpecs, {});
                },
            },
        });

        editor.setEditorMode('wysiwyg');
        editor.destroy();
        vi.advanceTimersByTime(30);

        expect(initializeWysiwyg).not.toHaveBeenCalled();
    });

    it('should keep the source mode after serialization fails and allow retry', () => {
        const editor = createModeEditor({initial: {markup: 'source'}});
        const error = new Error('serialization failed');
        const modeChange = vi.fn();
        editor.on('change-editor-mode', modeChange);
        vi.spyOn(editor.wysiwygEditor.serializer, 'serialize').mockImplementationOnce(() => {
            throw error;
        });

        expect(() => editor.setEditorMode('markup')).toThrow(error);
        expect(editor.currentMode).toBe('wysiwyg');
        expect(editor.getValue()).toBe('source');
        expect(modeChange).not.toHaveBeenCalled();

        editor.setEditorMode('markup');

        expect(editor.currentMode).toBe('markup');
        expect(editor.getValue()).toBe('source');
    });

    it('should keep the source mode after markup preparation fails and allow retry', () => {
        const error = new Error('preparation failed');
        const prepareRawMarkup = vi
            .fn((value: string) => value)
            .mockImplementationOnce(() => {
                throw error;
            });
        const editor = createModeEditor({
            initial: {mode: 'markup', markup: 'source'},
            experimental: {prepareRawMarkup},
        });

        expect(() => editor.setEditorMode('wysiwyg')).toThrow(error);
        expect(editor.currentMode).toBe('markup');
        expect(editor.getValue()).toBe('source');

        editor.replace('fresh source');
        editor.setEditorMode('wysiwyg');

        expect(editor.currentMode).toBe('wysiwyg');
        expect(editor.getValue()).toBe('fresh source');
    });

    it.each([
        ['markup', 'wysiwyg'],
        ['wysiwyg', 'markup'],
    ] as const)(
        'should keep the source after %s replacement fails and retry with its latest value',
        (targetMode, sourceMode) => {
            const editor = createModeEditor({initial: {mode: sourceMode, markup: 'source'}});
            const source = editor.currentEditor;
            const target = targetMode === 'markup' ? editor.markupEditor : editor.wysiwygEditor;
            const replace = target.replace.bind(target);
            const error = new Error('replacement failed');
            const modeChange = vi.fn();
            const rerender = vi.fn();
            const changedModes: string[] = [];
            editor.on('change-editor-mode', modeChange);
            editor.on('rerender', rerender);
            editor.on('change', () => changedModes.push(editor.currentMode));
            vi.spyOn(target, 'replace').mockImplementationOnce(() => {
                replace('fresh source \n\n');
                throw error;
            });

            expect(() => editor.setEditorMode(targetMode)).toThrow(error);
            expect(editor.currentMode).toBe(sourceMode);
            expect(editor.getValue()).toBe('source');
            expect(modeChange).not.toHaveBeenCalled();
            expect(rerender).not.toHaveBeenCalled();
            expect(changedModes).toEqual([targetMode]);

            editor.replace('fresh source');
            editor.setEditorMode(targetMode);

            expect(editor.currentMode).toBe(targetMode);
            expect(editor.getValue()).toBe('fresh source');
            expect(editor.currentEditor).toBe(target);
            expect(source.getValue()).toBe('fresh source');
        },
    );

    it.each([
        ['markup', 'wysiwyg', true],
        ['wysiwyg', 'markup', true],
        ['markup', 'wysiwyg', false],
    ] as const)(
        'should preserve synchronous events for %s mode from %s with emit %s',
        (targetMode, sourceMode, emit) => {
            const editor = createModeEditor({initial: {mode: sourceMode, markup: 'source'}});
            editor.markupEditor.getValue();
            editor.wysiwygEditor.getValue();
            editor.replace('updated');
            const events: [string, string, string][] = [];
            for (const event of [
                'rerender-toolbar',
                'change',
                'rerender',
                'change-editor-mode',
            ] as const) {
                editor.on(event, () => {
                    events.push([event, editor.currentMode, editor.getValue()]);
                });
            }

            editor.setEditorMode(targetMode, {emit});

            expect(events).toEqual([
                ['rerender-toolbar', targetMode, 'updated'],
                ['change', targetMode, 'updated'],
                ['rerender', targetMode, 'updated'],
                ...(emit ? [['change-editor-mode', targetMode, 'updated']] : []),
            ]);
        },
    );
});

function createEditor(overrides: Partial<ConstructorParameters<typeof EditorImpl>[0]> = {}) {
    return new EditorImpl({
        logger: new Logger2(),
        renderStorage: new ReactRenderStorage(),
        preset: 'full',
        directiveSyntax: new DirectiveSyntaxContext(undefined),
        pmTransformers: [],
        ...overrides,
    });
}

function createEditorWithPreview(
    overrides: Partial<ConstructorParameters<typeof EditorImpl>[0]> = {},
) {
    return createEditor({
        markupConfig: {renderPreview: () => null},
        ...overrides,
    });
}

describe('EditorImpl: markup emoji configuration', () => {
    async function suggestions(editor: EditorImpl) {
        const {state} = editor.markupEditor.cm;
        const pos = state.doc.length;
        const sources = state.languageDataAt<CompletionSource>('autocomplete', pos);
        const results = await Promise.all(
            sources.map((source) => source(new CompletionContext(state, pos, false))),
        );
        return results.flatMap((result) => result?.options ?? []);
    }

    it.each([
        ['full', [{label: ':custom:', detail: '⭐', type: 'text'}]],
        ['yfm', []],
    ] as const)(
        'should suggest only the shared emoji definitions in markup mode for the %s preset',
        async (preset, expected) => {
            const editor = createEditor({
                preset,
                initial: {mode: 'markup', markup: ':'},
                config: {emoji: {defs: {custom: '⭐'}}},
                wysiwygConfig: {extensionOptions: {emoji: {defs: {wysiwyg: '🔥'}}}},
            });

            expect(await suggestions(editor)).toEqual(expected);
            editor.destroy();
        },
    );
});

describe('EditorImpl: changePreviewVisible', () => {
    it('should be a no-op when renderPreview is not configured', () => {
        const editor = createEditor();
        const listener = vi.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(listener).not.toHaveBeenCalled();
    });

    it('should show preview and emit change-preview-visible event', () => {
        const editor = createEditorWithPreview();
        const listener = vi.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({visible: true});
    });

    it('should toggle preview when called without argument', () => {
        const editor = createEditorWithPreview();
        const listener = vi.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(); // false → true
        expect(editor.previewVisible).toBe(true);

        editor.changePreviewVisible(); // true → false
        expect(editor.previewVisible).toBe(false);

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, {visible: true});
        expect(listener).toHaveBeenNthCalledWith(2, {visible: false});
    });

    it('should be a no-op when split mode is enabled', () => {
        const editor = createEditorWithPreview({
            initial: {splitModeEnabled: true},
            markupConfig: {renderPreview: () => null, splitMode: 'vertical'},
        });
        const listener = vi.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(listener).not.toHaveBeenCalled();
    });
});

describe('EditorImpl: changeSplitModeEnabled', () => {
    it('should enable split mode and emit change-split-mode-enabled event', () => {
        const editor = createEditor();
        const listener = vi.fn();
        editor.on('change-split-mode-enabled', listener);

        editor.changeSplitModeEnabled({splitModeEnabled: true});

        expect(editor.splitModeEnabled).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({splitModeEnabled: true});
    });
});

describe('EditorImpl: mutual exclusion between preview and split mode', () => {
    it('should not show preview when split mode is active (changePreviewVisible is a no-op)', () => {
        const editor = createEditorWithPreview({
            initial: {splitModeEnabled: true},
            markupConfig: {renderPreview: () => null, splitMode: 'vertical'},
        });
        const splitListener = vi.fn();
        editor.on('change-split-mode-enabled', splitListener);

        expect(editor.splitModeEnabled).toBe(true);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(editor.splitModeEnabled).toBe(true);
        // split-mode state did not change
        expect(splitListener).not.toHaveBeenCalled();
    });

    it('should not emit events when state does not change', () => {
        const editor = createEditorWithPreview();
        const previewListener = vi.fn();
        const splitListener = vi.fn();
        editor.on('change-preview-visible', previewListener);
        editor.on('change-split-mode-enabled', splitListener);

        // previewVisible already false
        editor.changePreviewVisible(false);
        // splitModeEnabled already false
        editor.changeSplitModeEnabled({splitModeEnabled: false});

        expect(previewListener).not.toHaveBeenCalled();
        expect(splitListener).not.toHaveBeenCalled();
    });
});

function createModeEditor(overrides: Partial<ConstructorParameters<typeof EditorImpl>[0]> = {}) {
    const editor = createEditor({
        preset: 'zero',
        wysiwygConfig: {extensions: (builder) => builder.use(BaseSchemaSpecs, {})},
        ...overrides,
    });
    onTestFinished(() => {
        editor.destroy();
        vi.restoreAllMocks();
    });
    return editor;
}
