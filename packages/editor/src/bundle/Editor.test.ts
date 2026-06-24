/// <reference types="jest" />
import {ReactRenderStorage} from '../extensions';
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

describe('EditorImpl: changePreviewVisible', () => {
    it('should be a no-op when renderPreview is not configured', () => {
        const editor = createEditor();
        const listener = jest.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(listener).not.toHaveBeenCalled();
    });

    it('should show preview and emit change-preview-visible event', () => {
        const editor = createEditorWithPreview();
        const listener = jest.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({visible: true});
    });

    it('should toggle preview when called without argument', () => {
        const editor = createEditorWithPreview();
        const listener = jest.fn();
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
        const listener = jest.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(listener).not.toHaveBeenCalled();
    });
});

describe('EditorImpl: changeSplitModeEnabled', () => {
    it('should enable split mode and emit change-split-mode-enabled event', () => {
        const editor = createEditor();
        const listener = jest.fn();
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
        const splitListener = jest.fn();
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
        const previewListener = jest.fn();
        const splitListener = jest.fn();
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
