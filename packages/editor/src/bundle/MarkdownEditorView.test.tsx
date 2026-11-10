import {type DependencyList, createRef} from 'react';

import {searchPanelOpen} from '@codemirror/search';
import {EditorView} from '@codemirror/view';
import {ThemeProvider, Toaster, ToasterProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest';

import {configure} from 'src/configure';
import {Logger2, globalLogger} from 'src/logger';
import {ToolbarDataType} from 'src/toolbar';

import {MarkdownEditorView, type MarkdownEditorViewProps} from './MarkdownEditorView';
import {MarkdownEditorProvider, useMarkdownEditorContext} from './context';
import type {MarkdownEditorInstance, MarkdownEditorOptions} from './types';
import {useMarkdownEditor} from './useMarkdownEditor';

type HarnessProps = {
    options: MarkdownEditorOptions;
    deps?: DependencyList;
    visible?: boolean;
    view?: Partial<MarkdownEditorViewProps>;
};

describe('MarkdownEditorView', () => {
    let root: Root;
    let container: HTMLDivElement;
    let testEditor: MarkdownEditorInstance;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        configure({lang: undefined});
    });

    it('should require an instance from props or context', () => {
        expect(() => renderToStaticMarkup(<MarkdownEditorView stickyToolbar={false} />)).toThrow(
            'an instance of the editor must be passed through the props or context',
        );
    });

    it('should prefer the explicit instance without replacing the context', () => {
        const ref = createRef<HTMLDivElement>();
        let outer!: MarkdownEditorInstance;
        let nested: MarkdownEditorInstance | null = null;

        function Preview() {
            nested = useMarkdownEditorContext();
            return <span>explicit preview</span>;
        }

        function Owner() {
            outer = useMarkdownEditor({});
            const editor = useMarkdownEditor({
                initial: {mode: 'markup'},
                markupConfig: {renderPreview: () => <Preview />},
            });
            editor.changePreviewVisible(true);
            return (
                <MarkdownEditorProvider value={outer}>
                    <MarkdownEditorView
                        editor={editor}
                        ref={ref}
                        stickyToolbar={false}
                        settingsVisible={false}
                        qa="editor"
                        className="custom-editor"
                    />
                </MarkdownEditorProvider>
            );
        }

        act(() =>
            root.render(
                <ToasterProvider toaster={new Toaster()}>
                    <Owner />
                </ToasterProvider>,
            ),
        );

        expect(container.textContent).toBe('explicit preview');
        expect(nested).toBe(outer);
        expect(ref.current).toBe(container.firstElementChild);
        expect(ref.current?.getAttribute('data-qa')).toBe('editor');
        expect(ref.current?.classList.contains('custom-editor')).toBe(true);
    });

    it.each([
        ['the localized default', undefined, 'Добавьте вашу разметку'],
        ['the explicit', 'Custom placeholder', 'Custom placeholder'],
    ])('should capture and show %s markup placeholder', (_name, placeholder, expected) => {
        configure({lang: 'ru'});
        const markupConfig = {placeholder};
        const options: MarkdownEditorOptions = {
            initial: {mode: 'markup', toolbarVisible: false},
            markupConfig,
        };
        renderEditor({options, visible: false});

        markupConfig.placeholder = 'Changed placeholder';
        renderEditor({options});

        expect(container.querySelector('.cm-placeholder')?.textContent).toBe(expected);
    });

    it.each(['markup', 'wysiwyg'] as const)(
        'should keep the document and undo history when the %s view remounts',
        (mode) => {
            const options: MarkdownEditorOptions = {
                initial: {mode, markup: 'source', toolbarVisible: false},
            };
            renderEditor({options});
            const first = testEditor;
            act(() => testEditor.replace('updated'));

            renderEditor({options, visible: false});
            renderEditor({options});

            expect(testEditor).toBe(first);
            expect(testEditor.getValue()).toBe('updated');
            act(() => pressShortcut('z', 'KeyZ'));
            expect(testEditor.getValue()).toBe('source');
        },
    );

    it.each(['markup', 'wysiwyg'] as const)(
        'should keep a late %s upload away from the replacement instance',
        async (mode) => {
            vi.useFakeTimers();
            let finishUpload!: (result: {url: string}) => void;
            const uploadFile = vi.fn(
                () =>
                    new Promise<{url: string}>((resolve) => {
                        finishUpload = resolve;
                    }),
            );
            renderEditor({
                options: {
                    initial: {mode, toolbarVisible: false},
                    handlers: {uploadFile},
                },
                deps: [1],
            });
            const file = new File(['text'], 'test.txt', {type: 'text/plain'});
            await act(async () => {
                const event = new Event('paste', {bubbles: true, cancelable: true});
                Object.defineProperty(event, 'clipboardData', {
                    value: {files: [file], types: ['Files'], getData: () => ''},
                });
                getContent().dispatchEvent(event);
            });
            expect(uploadFile).toHaveBeenCalledWith(file);

            renderEditor({
                options: {initial: {mode, markup: 'new document', toolbarVisible: false}},
                deps: [2],
            });
            const changes: null[] = [];
            testEditor.on('change', (value) => changes.push(value));
            await act(async () => {
                finishUpload({url: 'https://example.com/test.txt'});
                await vi.advanceTimersByTimeAsync(1000);
            });

            expect(testEditor.getValue()).toBe('new document');
            expect(changes).toEqual([]);
        },
    );

    it('should recover the initial markup after lazy WYSIWYG initialization fails', async () => {
        vi.useFakeTimers();
        const error = new Error('extension initialization failed');
        const handleError = (event: ErrorEvent) => {
            if (event.error === error) event.preventDefault();
        };
        window.addEventListener('error', handleError);
        onTestFinished(() => window.removeEventListener('error', handleError));
        const errors: unknown[] = [];
        const logger = new Logger2();
        logger.on('error', (data) => errors.push(data.error));
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        renderEditor({
            options: {
                initial: {markup: 'source', toolbarVisible: false},
                logger,
                wysiwygConfig: {
                    extensions: () => {
                        throw error;
                    },
                },
            },
        });
        const modes: unknown[] = [];
        testEditor.on('change-editor-mode', (value) => modes.push(value));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1);
        });

        expect(testEditor.currentMode).toBe('markup');
        expect(testEditor.getValue()).toBe('source');
        expect(container.querySelector('.cm-content')?.textContent).toBe('source');
        expect(errors).toContain(error);
        expect(modes).toEqual([]);
    });

    it.each([true, false])(
        'should preserve markup search notification behavior with emit %s',
        async (emit) => {
            vi.useFakeTimers();
            document.body.appendChild(container);
            let searchOpen = false;
            renderEditor({
                options: {
                    initial: {mode: 'markup', markup: 'source', toolbarVisible: false},
                    markupConfig: {
                        extensions: [
                            EditorView.updateListener.of((update) => {
                                searchOpen = searchPanelOpen(update.state);
                            }),
                        ],
                    },
                },
                view: {settingsVisible: true},
            });
            await act(async () => pressShortcut('f', 'KeyF'));
            expect(document.querySelector('[data-qa="g-md-search-panel"]')).not.toBeNull();

            act(() => testEditor.setEditorMode('wysiwyg', {emit}));

            expect(searchOpen).toBe(!emit);
        },
    );

    it('should log each toolbar action once after the view rerenders', () => {
        const logger = new Logger2();
        const actions: Logger2.ActionData[] = [];
        logger.on('action', (data) => actions.push(data));
        const originalAction = globalLogger.action;
        const globalActions: Logger2.ActionData[] = [];
        globalLogger.setLogger({action: (data) => globalActions.push(data)});
        onTestFinished(() => globalLogger.setLogger({action: originalAction}));
        const options: MarkdownEditorOptions = {initial: {mode: 'markup'}, mobile: true, logger};
        const view: Partial<MarkdownEditorViewProps> = {
            markupToolbarConfig: [
                [
                    {
                        id: 'test-action',
                        type: ToolbarDataType.SingleButton,
                        title: 'Test action',
                        icon: {data: () => <svg />},
                        exec: () => undefined,
                        isActive: () => false,
                        isEnable: () => true,
                        qa: 'test-action',
                    },
                ],
            ],
            markupHiddenActionsConfig: [],
        };
        renderEditor({options, view});
        renderEditor({options, view: {...view, className: 'updated'}});
        const button = container.querySelector<HTMLButtonElement>('[data-qa="test-action"]');
        expect(button).not.toBeNull();
        act(() => button?.click());

        expect(actions).toEqual([{mode: 'markup', source: 'toolbar', action: 'test-action'}]);
        expect(globalActions).toEqual(actions);
    });

    function pressShortcut(key: string, code: string) {
        getContent().dispatchEvent(
            new KeyboardEvent('keydown', {
                key,
                code,
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            }),
        );
    }

    function getContent() {
        const content = container.querySelector<HTMLElement>('[contenteditable="true"]');
        if (!content) throw new Error('Editor content is missing');
        return content;
    }

    function renderEditor(props: HarnessProps) {
        act(() =>
            root.render(
                <ToasterProvider toaster={new Toaster()}>
                    <ThemeProvider>
                        <Harness {...props} />
                    </ThemeProvider>
                </ToasterProvider>,
            ),
        );
    }

    function Harness({options, deps, visible = true, view}: HarnessProps) {
        testEditor = useMarkdownEditor(options, deps);
        return visible ? (
            <MarkdownEditorView
                editor={testEditor}
                stickyToolbar={false}
                settingsVisible={false}
                {...view}
            />
        ) : null;
    }
});
