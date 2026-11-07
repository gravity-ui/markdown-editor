import {StrictMode} from 'react';

import {Prec} from '@codemirror/state';
import {EditorView as CodeMirrorView} from '@codemirror/view';
import {ThemeProvider, Toaster, ToasterProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ReactRenderStorage} from '../../extensions';
import {Logger2} from '../../logger';
import {ZeroPreset} from '../../presets/zero';
import {DirectiveSyntaxContext} from '../../utils/directive';
import {EditorImpl} from '../Editor';
import {MarkdownEditorView, type MarkdownEditorViewProps} from '../MarkdownEditorView';
import type {MarkdownEditorMode} from '../types';

type ContenteditableAttributes = MarkdownEditorViewProps['contenteditableAttributes'];

describe('contenteditableAttributes', () => {
    let container: HTMLDivElement;
    let root: Root;
    let toaster: Toaster;
    let editors: EditorImpl[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        toaster = new Toaster();
        editors = [];
    });

    afterEach(() => {
        act(() => root.unmount());
        editors.forEach((editor) => editor.destroy());
        container.remove();
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    function createEditor(mode: MarkdownEditorMode, attributes: Record<string, string> = {}) {
        const editor = new EditorImpl({
            logger: new Logger2(),
            renderStorage: new ReactRenderStorage(),
            preset: 'zero',
            directiveSyntax: new DirectiveSyntaxContext(undefined),
            pmTransformers: [],
            initial: {mode, markup: 'Initial content', toolbarVisible: false},
            wysiwygConfig: {
                extensions: (builder) => builder.use(ZeroPreset, {baseStyles: {attributes}}),
            },
            markupConfig: {
                extensions: [Prec.highest(CodeMirrorView.contentAttributes.of(attributes))],
                renderPreview: () => <div>Preview content</div>,
            },
        });
        editors.push(editor);
        // Initialize the active engine before React subscribes to its render storage.
        editor.currentEditor.getValue();
        return editor;
    }

    function render(editor: EditorImpl, contenteditableAttributes?: ContenteditableAttributes) {
        act(() => {
            root.render(
                <ThemeProvider theme="light">
                    <ToasterProvider toaster={toaster}>
                        <StrictMode>
                            <MarkdownEditorView
                                editor={editor}
                                stickyToolbar={false}
                                settingsVisible={false}
                                contenteditableAttributes={contenteditableAttributes}
                            />
                        </StrictMode>
                    </ToasterProvider>
                </ThemeProvider>,
            );
        });
    }

    function getEditable(editor: EditorImpl) {
        return editor.currentMode === 'wysiwyg'
            ? editor.wysiwygEditor.dom
            : editor.markupEditor.cm.contentDOM;
    }

    describe.each(['wysiwyg', 'markup'] as const)('%s mode', (mode) => {
        it('should update attributes on the same input without emitting a change', () => {
            const editor = createEditor(mode);
            render(editor, {
                'aria-invalid': 'true',
                'aria-label': 'Original label',
                'data-validation': 'pending',
                title: 'Original title',
            });
            expect(getEditable(editor).getAttribute('aria-invalid')).toBe('true');

            const element = getEditable(editor);
            const onChange = vi.fn();
            editor.on('change', onChange);

            render(editor, {
                'aria-invalid': 'false',
                'aria-label': 'Updated label',
                'data-validation': 'valid',
                title: 'Updated title',
            });

            expect(element.getAttribute('aria-invalid')).toBe('false');
            expect(element.getAttribute('aria-label')).toBe('Updated label');
            expect(element.getAttribute('data-validation')).toBe('valid');
            expect(element.getAttribute('title')).toBe('Updated title');
            expect(getEditable(editor)).toBe(element);
            expect(onChange).not.toHaveBeenCalled();
        });

        it('should restore static attributes when keys or the attribute map are removed', () => {
            const editor = createEditor(mode, {
                'aria-invalid': 'grammar',
                'aria-describedby': 'editor-hint',
                title: 'Static title',
            });
            const attributes = {
                'aria-invalid': 'false',
                'aria-describedby': 'validation-error',
                'data-validation': 'invalid',
                title: 'Validation title',
            };
            render(editor, attributes);
            const element = getEditable(editor);
            expect(element.getAttribute('aria-invalid')).toBe('false');
            expect(element.getAttribute('aria-describedby')).toBe('validation-error');
            expect(element.getAttribute('data-validation')).toBe('invalid');
            expect(element.getAttribute('title')).toBe('Validation title');

            render(editor, {'aria-invalid': 'true'});

            expect(element.getAttribute('aria-invalid')).toBe('true');
            expect(element.getAttribute('aria-describedby')).toBe('editor-hint');
            expect(element.getAttribute('title')).toBe('Static title');
            expect(element.hasAttribute('data-validation')).toBe(false);

            render(editor, {});
            expect(element.getAttribute('aria-invalid')).toBe('grammar');

            render(editor, attributes);
            render(editor);

            expect(element.getAttribute('aria-invalid')).toBe('grammar');
            expect(element.getAttribute('aria-describedby')).toBe('editor-hint');
            expect(element.getAttribute('title')).toBe('Static title');
            expect(element.hasAttribute('data-validation')).toBe(false);
        });

        it('should remove the attribute when no static value exists', () => {
            const editor = createEditor(mode);
            render(editor, {lang: 'en'});
            expect(getEditable(editor).getAttribute('lang')).toBe('en');

            render(editor);

            expect(getEditable(editor).hasAttribute('lang')).toBe(false);
        });

        it('should apply unchanged attributes when the editor instance changes', () => {
            const attributes = {'aria-label': 'Description'};
            render(createEditor(mode), attributes);

            const nextEditor = createEditor(mode);
            render(nextEditor, attributes);

            expect(getEditable(nextEditor).getAttribute('aria-label')).toBe('Description');
        });
    });

    it('should apply the current value when switching between editor modes', () => {
        const editor = createEditor('wysiwyg', {'aria-labelledby': 'editor-label'});
        render(editor, {'data-validation': 'pending'});
        const wysiwygElement = getEditable(editor);
        // Create the other engine before the current React renderer is replaced.
        editor.markupEditor.getValue();

        act(() => editor.setEditorMode('markup'));

        expect(wysiwygElement.getAttribute('data-validation')).toBe('pending');
        expect(getEditable(editor).getAttribute('data-validation')).toBe('pending');
        const markupElement = getEditable(editor);
        render(editor, {'data-validation': 'valid'});
        act(() => editor.setEditorMode('wysiwyg'));

        expect(getEditable(editor)).toBe(wysiwygElement);
        expect(wysiwygElement.getAttribute('data-validation')).toBe('valid');
        expect(wysiwygElement.getAttribute('aria-labelledby')).toBe('editor-label');
        expect(markupElement.getAttribute('data-validation')).toBe('valid');
        render(editor);
        act(() => editor.setEditorMode('markup'));

        expect(getEditable(editor)).toBe(markupElement);
        expect(markupElement.hasAttribute('data-validation')).toBe(false);
        expect(editor.getValue()).toContain('Initial content');
    });

    it('should apply props changed during preview when returning to the input', () => {
        const editor = createEditor('markup');
        render(editor, {title: 'Original title'});
        const element = getEditable(editor);

        act(() => editor.changePreviewVisible(true));
        expect(container.textContent).toContain('Preview content');
        expect(container.contains(element)).toBe(false);
        render(editor, {title: 'Updated title'});
        expect(element.getAttribute('title')).toBe('Original title');
        act(() => editor.changePreviewVisible(false));

        expect(container.contains(element)).toBe(true);
        expect(getEditable(editor)).toBe(element);
        expect(element.getAttribute('title')).toBe('Updated title');
        expect(editor.getValue()).toContain('Initial content');
    });
});
