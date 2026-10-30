import {CompletionContext, type CompletionSource} from '@codemirror/autocomplete';
import {describe, expect, it, vi} from 'vitest';

import {dispatchPasteEvent} from '../../tests/dispatch-event';
import {ReactRenderStorage} from '../extensions';
import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';
import {Clipboard} from '../extensions/behavior/Clipboard';
import {LinkSpecs} from '../extensions/markdown/Link/LinkSpecs';
import {linkPasteEnhance} from '../extensions/markdown/Link/paste-plugin';
import {Logger2} from '../logger';
import {DirectiveSyntaxContext} from '../utils/directive';

import {EditorImpl} from './Editor';

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

describe('EditorImpl: linkifyDefaultProtocol', () => {
    it('should pass the default protocol to WYSIWYG and expose it to preview', () => {
        const editor = createEditor({
            md: {linkify: true, linkifyDefaultProtocol: 'https'},
            wysiwygConfig: {
                extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(LinkSpecs),
            },
            initial: {markup: 'example.com'},
        });
        try {
            expect(editor.wysiwygEditor.doc.firstChild?.firstChild?.marks[0].attrs.href).toBe(
                'https://example.com',
            );
            expect(editor.mdOptions.linkifyDefaultProtocol).toBe('https');
        } finally {
            editor.destroy();
        }
    });

    it.each(['example.com', 'See example.com'])('should paste %s with an HTTPS link', (text) => {
        const editor = createEditor({
            wysiwygConfig: {
                extensions: (builder) =>
                    builder
                        .use(BaseSchemaSpecs, {})
                        .use(LinkSpecs)
                        .use(Clipboard, {})
                        .addPlugin(linkPasteEnhance, builder.Priority.High),
            },
            md: {linkify: true, linkifyDefaultProtocol: 'https'},
        });
        try {
            dispatchPasteEvent(editor.wysiwygEditor.view, {'text/plain': text});
            expect(editor.wysiwygEditor.doc.firstChild?.lastChild?.marks[0].attrs.href).toBe(
                'https://example.com',
            );
            expect(editor.wysiwygEditor.doc.textContent).toBe(text);
        } finally {
            editor.destroy();
        }
    });
});
