import {StrictMode} from 'react';

import {autocompletion, startCompletion} from '@codemirror/autocomplete';
import {EditorState, type Extension, Prec} from '@codemirror/state';
import {EditorView as CodeMirrorView} from '@codemirror/view';
import {ThemeProvider, Toaster, ToasterProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ReactRenderStorage} from '../../extensions';
import {Logger2, globalLogger} from '../../logger';
import {ZeroPreset} from '../../presets/zero';
import {DirectiveSyntaxContext} from '../../utils/directive';
import {SafeEventEmitter} from '../../utils/event-emitter';
import {TabFocusModeState} from '../../utils/tab-focus-mode';
import {EditorImpl, type EditorOptions} from '../Editor';
import {MarkdownEditorView, type MarkdownEditorViewProps} from '../MarkdownEditorView';
import {MarkupCore} from '../markup/MarkupCore';
import type {EditorEventMap} from '../shared/events';
import type {MarkdownEditorMode} from '../types';
import {WysiwygCore} from '../wysiwyg/WysiwygCore';

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

    function createEditor(
        mode: MarkdownEditorMode,
        attributes: Record<string, string> = {},
        markupExtensions: Extension[] = [],
    ) {
        const options: EditorOptions = {
            logger: new Logger2(),
            renderStorage: new ReactRenderStorage(),
            preset: 'zero',
            directiveSyntax: new DirectiveSyntaxContext(undefined),
            tabFocusMode: new TabFocusModeState(),
            initial: {mode, markup: 'Initial content', toolbarVisible: false},
            wysiwygConfig: {
                extensions: (builder) => builder.use(ZeroPreset, {baseStyles: {attributes}}),
            },
            markupConfig: {
                extensions: [
                    Prec.highest(CodeMirrorView.contentAttributes.of(attributes)),
                    ...markupExtensions,
                ],
                renderPreview: () => <div>Preview content</div>,
            },
        };
        const events = new SafeEventEmitter<EditorEventMap>({
            onError: (error) => {
                options.logger.error(error);
                globalLogger.error(error);
            },
        });
        const markupState = {markup: options.initial?.markup ?? ''};
        const getInitialMarkup = () => markupState.markup;
        const editor = new EditorImpl(options, {
            events,
            markupState,
            wysiwyg: new WysiwygCore(options, events, getInitialMarkup),
            markup: new MarkupCore(options, events, getInitialMarkup),
        });
        editors.push(editor);
        // Initialize the active engine before React subscribes to its render storage.
        editor.currentEditor.getValue();
        return editor;
    }

    function render(editor: EditorImpl, attributes?: ContenteditableAttributes) {
        act(() => {
            root.render(
                <ThemeProvider theme="light">
                    <ToasterProvider toaster={toaster}>
                        <StrictMode>
                            <MarkdownEditorView
                                editor={editor}
                                stickyToolbar={false}
                                settingsVisible={false}
                                contenteditableAttributes={attributes}
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

        it('should preserve editability when a shared attribute map contains a forbidden key', () => {
            const editor = createEditor(mode);
            const attributes: Record<string, string> = Object.freeze({
                contenteditable: 'false',
                'aria-invalid': 'true',
            });

            render(editor, attributes);

            expect(getEditable(editor).getAttribute('contenteditable')).toBe('true');
            expect(getEditable(editor).getAttribute('aria-invalid')).toBe('true');
            expect(attributes).toEqual({contenteditable: 'false', 'aria-invalid': 'true'});
        });

        it('should apply own attributes without exposing inherited attributes on the input', () => {
            const editor = createEditor(mode);
            const attributes = Object.create(
                {title: 'Inherited title', 'data-inherited': 'inherited'},
                {'aria-label': {value: 'Own label', enumerable: true}},
            ) as Record<string, string>;

            render(editor, attributes);

            const element = getEditable(editor);
            expect(element.getAttribute('aria-label')).toBe('Own label');
            expect(element.hasAttribute('title')).toBe(false);
            expect(element.hasAttribute('data-inherited')).toBe(false);
        });

        it('should add consumer classes and styles while retaining configured classes', () => {
            const editor = createEditor(mode, {class: 'configured-editor'});

            render(editor, {class: 'consumer-editor', style: 'background-color: blue'});

            const element = getEditable(editor);
            expect(element.classList.contains('configured-editor')).toBe(true);
            expect(element.classList.contains('consumer-editor')).toBe(true);
            expect(element.style.backgroundColor).toBe('blue');
        });

        it('should apply flat attributes named after editor modes as ordinary strings', () => {
            const editor = createEditor(mode);

            render(editor, {wysiwyg: 'visual', markup: 'source', 'aria-label': 'Shared editor'});

            const element = getEditable(editor);
            expect(element.getAttribute('wysiwyg')).toBe('visual');
            expect(element.getAttribute('markup')).toBe('source');
            expect(element.getAttribute('aria-label')).toBe('Shared editor');
        });

        it('should apply the selected engine restrictions to a flat WYSIWYG attribute map', () => {
            const editor = createEditor(mode);

            render(editor, {
                role: 'application',
                'aria-multiline': 'false',
                'aria-label': 'Shared editor',
            });

            const element = getEditable(editor);
            expect(element.getAttribute('role')).toBe(
                mode === 'wysiwyg' ? 'application' : 'textbox',
            );
            expect(element.getAttribute('aria-multiline')).toBe(
                mode === 'wysiwyg' ? 'false' : 'true',
            );
            expect(element.getAttribute('aria-label')).toBe('Shared editor');
        });

        it('should remove stale overrides when switching between flat and paired attributes', () => {
            const editor = createEditor(mode, {title: 'Configured title'});
            const pair = {
                wysiwyg: {title: 'Visual title', 'data-pair': 'visual'},
                markup: {title: 'Markdown title', 'data-pair': 'markdown'},
            };
            render(editor, {title: 'Shared title', 'data-flat': 'shared'});
            const element = getEditable(editor);

            render(editor, pair);

            expect(getEditable(editor)).toBe(element);
            expect(element.getAttribute('title')).toBe(pair[mode].title);
            expect(element.getAttribute('data-pair')).toBe(pair[mode]['data-pair']);
            expect(element.hasAttribute('data-flat')).toBe(false);

            render(editor, {'aria-label': 'Shared label'});

            expect(element.getAttribute('title')).toBe('Configured title');
            expect(element.hasAttribute('data-pair')).toBe(false);
            expect(element.getAttribute('aria-label')).toBe('Shared label');

            render(editor, pair);
            render(editor);

            expect(element.getAttribute('title')).toBe('Configured title');
            expect(element.hasAttribute('data-pair')).toBe(false);
            expect(element.hasAttribute('aria-label')).toBe(false);
        });
    });

    it('should allow WYSIWYG attributes reserved for the Markdown engine', () => {
        const editor = createEditor('wysiwyg');
        const attributes = {
            role: 'application',
            'aria-multiline': 'false',
            'aria-readonly': 'true',
            'aria-autocomplete': 'none',
            'aria-haspopup': 'dialog',
            'aria-controls': 'consumer-popup',
            'aria-activedescendant': 'consumer-option',
        };

        render(editor, attributes);

        for (const [name, value] of Object.entries(attributes)) {
            expect(getEditable(editor).getAttribute(name)).toBe(value);
        }
        expect(editor.wysiwygEditor.view.editable).toBe(true);
    });

    it('should preserve Markdown semantics and readonly state when attributes contain forbidden keys', () => {
        const editor = createEditor('markup', {}, [EditorState.readOnly.of(true)]);
        const attributes: Record<string, string> = Object.freeze({
            contenteditable: 'false',
            role: 'application',
            'aria-multiline': 'false',
            'aria-readonly': 'false',
            'aria-invalid': 'true',
        });

        render(editor, {wysiwyg: {}, markup: attributes});

        const element = getEditable(editor);
        expect(element.getAttribute('contenteditable')).toBe('true');
        expect(element.getAttribute('role')).toBe('textbox');
        expect(element.getAttribute('aria-multiline')).toBe('true');
        expect(element.getAttribute('aria-readonly')).toBe('true');
        expect(element.getAttribute('aria-invalid')).toBe('true');
        expect(editor.markupEditor.cm.state.readOnly).toBe(true);
        expect(attributes.role).toBe('application');
        expect(attributes['aria-readonly']).toBe('false');
    });

    it('should retain live Markdown completion attributes when consumer values conflict', async () => {
        const editor = createEditor('markup', {}, [
            autocompletion({
                override: [(context) => ({from: context.pos, options: [{label: 'completion'}]})],
            }),
        ]);
        const attributes: Record<string, string> = Object.freeze({
            'aria-autocomplete': 'none',
            'aria-haspopup': 'dialog',
            'aria-controls': 'consumer-popup',
            'aria-activedescendant': 'consumer-option',
            'data-validation': 'valid',
        });
        render(editor, {wysiwyg: {}, markup: attributes});

        await act(async () => {
            startCompletion(editor.markupEditor.cm);
            await vi.advanceTimersByTimeAsync(100);
        });

        const element = getEditable(editor);
        const popupId = element.getAttribute('aria-controls');
        const optionId = element.getAttribute('aria-activedescendant');
        expect(element.getAttribute('aria-autocomplete')).toBe('list');
        expect(element.getAttribute('aria-haspopup')).toBe('listbox');
        expect(popupId).toMatch(/^cm-ac-/);
        expect(optionId).toBe(`${popupId}-0`);
        expect(document.getElementById(popupId ?? '')?.getAttribute('role')).toBe('listbox');
        expect(document.getElementById(optionId ?? '')?.getAttribute('role')).toBe('option');
        expect(element.getAttribute('data-validation')).toBe('valid');
        expect(attributes['aria-controls']).toBe('consumer-popup');

        render(editor);

        expect(element.getAttribute('aria-controls')).toBe(popupId);
        expect(element.getAttribute('aria-activedescendant')).toBe(optionId);
        expect(element.hasAttribute('data-validation')).toBe(false);
    });

    it('should apply independent attributes when switching between editor modes', () => {
        const editor = createEditor('wysiwyg');
        const attributes: ContenteditableAttributes = {
            wysiwyg: {
                'aria-label': 'Visual editor',
                'data-wysiwyg': 'active',
            },
            markup: {
                'aria-label': 'Markdown editor',
                'data-markup': 'active',
            },
        };
        render(editor, attributes);
        const wysiwygElement = getEditable(editor);
        editor.markupEditor.getValue();

        act(() => editor.setEditorMode('markup'));

        const markupElement = getEditable(editor);
        expect(markupElement.getAttribute('aria-label')).toBe('Markdown editor');
        expect(markupElement.hasAttribute('data-wysiwyg')).toBe(false);
        expect(wysiwygElement.getAttribute('aria-label')).toBe('Visual editor');

        render(editor, {
            ...attributes,
            wysiwyg: {'aria-label': 'Updated visual editor'},
        });
        act(() => editor.setEditorMode('wysiwyg'));

        expect(getEditable(editor)).toBe(wysiwygElement);
        expect(wysiwygElement.getAttribute('aria-label')).toBe('Updated visual editor');
        expect(wysiwygElement.hasAttribute('data-markup')).toBe(false);
        expect(wysiwygElement.hasAttribute('data-wysiwyg')).toBe(false);
        expect(markupElement.getAttribute('aria-label')).toBe('Markdown editor');
        expect(markupElement.getAttribute('data-markup')).toBe('active');
    });

    it('should apply the current value when switching between editor modes', () => {
        const editor = createEditor('wysiwyg', {'aria-labelledby': 'editor-label'});
        render(editor, {'data-validation': 'pending'});
        const initialValue = editor.getValue();
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
        expect(editor.getValue()).toBe(initialValue);
    });

    it('should apply props changed during preview when returning to the input', () => {
        const editor = createEditor('markup');
        render(editor, {title: 'Original title'});
        const initialValue = editor.getValue();
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
        expect(editor.getValue()).toBe(initialValue);
    });
});
