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

    describe('Tab focus mode announcements', () => {
        const focusMessage = 'Enabled Tab navigation';
        const indentMessage = 'Disabled Tab navigation';

        beforeEach(() => {
            configure({lang: 'en'});
        });

        it.each(['indent', 'focus'] as const)(
            'should apply the initial %s Tab mode synchronously when markup is created',
            (tabFocusMode) => {
                renderEditor({
                    options: {initial: {mode: 'markup', tabFocusMode, toolbarVisible: false}},
                });
                const event = new KeyboardEvent('keydown', {
                    key: 'Tab',
                    code: 'Tab',
                    keyCode: 9,
                    bubbles: true,
                    cancelable: true,
                });

                act(() => getContent().dispatchEvent(event));

                expect(event.defaultPrevented).toBe(tabFocusMode === 'indent');
                expect(testEditor.getValue()).toBe(tabFocusMode === 'indent' ? '\t' : '');
            },
        );

        it.each(['wysiwyg', 'markup'] as const)(
            'should ignore the Tab mode shortcut in the settings popup for %s mode',
            async (mode) => {
                document.body.appendChild(container);
                renderEditor({
                    options: {initial: {mode, toolbarVisible: false}},
                    view: {settingsVisible: ['tab-focus']},
                });
                const button = container.querySelector<HTMLButtonElement>(
                    '[data-qa="g-md-settings-button"]',
                );
                if (!button) throw new Error('Settings button is missing');
                await act(async () => button.click());
                const checkbox = document.querySelector<HTMLInputElement>(
                    '[data-qa="g-md-settings-content"] input[type="checkbox"]',
                );
                if (!checkbox) throw new Error('Tab focus checkbox is missing');
                const changes = vi.fn();
                testEditor.on('change-tab-focus-mode', changes);
                const press = () => {
                    const event = new KeyboardEvent('keydown', {
                        key: 'm',
                        code: 'KeyM',
                        keyCode: 77,
                        ctrlKey: true,
                        bubbles: true,
                        cancelable: true,
                    });
                    act(() => checkbox.dispatchEvent(event));
                    return event;
                };

                act(() => checkbox.focus());
                expect(document.activeElement).toBe(checkbox);
                expect(press().defaultPrevented).toBe(false);
                expect(testEditor.tabFocusMode).toBe('indent');
                expect(checkbox.checked).toBe(false);
                expect(changes).not.toHaveBeenCalled();

                act(() => checkbox.click());
                expect(testEditor.tabFocusMode).toBe('focus');
                expect(checkbox.checked).toBe(true);

                expect(press().defaultPrevented).toBe(false);
                expect(testEditor.tabFocusMode).toBe('focus');
                expect(checkbox.checked).toBe(true);
                expect(changes.mock.calls).toEqual([[{mode: 'focus'}]]);
            },
        );

        it('should share the Tab mode between both engines after keyboard changes', async () => {
            renderEditor({
                options: {initial: {tabFocusMode: 'focus', toolbarVisible: false}},
            });
            const changes = vi.fn();
            testEditor.on('change-tab-focus-mode', changes);
            const pressTab = () => {
                const event = new KeyboardEvent('keydown', {
                    key: 'Tab',
                    code: 'Tab',
                    keyCode: 9,
                    bubbles: true,
                    cancelable: true,
                });
                act(() => getContent().dispatchEvent(event));
                return event.defaultPrevented;
            };

            expect(pressTab()).toBe(false);
            await act(async () => testEditor.setEditorMode('markup'));
            expect(testEditor.tabFocusMode).toBe('focus');
            expect(pressTab()).toBe(false);

            await act(async () => pressShortcut('m', 'KeyM'));
            expect(testEditor.tabFocusMode).toBe('indent');
            expect(pressTab()).toBe(true);
            await act(async () => testEditor.setEditorMode('wysiwyg'));
            expect(testEditor.tabFocusMode).toBe('indent');
            expect(pressTab()).toBe(true);

            await act(async () => pressShortcut('m', 'KeyM'));
            expect(pressTab()).toBe(false);
            await act(async () => testEditor.setEditorMode('markup'));
            expect(testEditor.tabFocusMode).toBe('focus');
            expect(pressTab()).toBe(false);
            expect(changes.mock.calls).toEqual([[{mode: 'indent'}], [{mode: 'focus'}]]);
        });

        it.each(['indent', 'focus'] as const)(
            'should mount one empty live region outside the editor with initial mode %s',
            (tabFocusMode) => {
                renderEditor({options: {initial: {tabFocusMode, toolbarVisible: false}}});
                const announcer = getAnnouncer();
                const editorElement = container.querySelector('.g-md-editor-component');

                expect(
                    container.querySelectorAll('.g-md-editor-component__announcer'),
                ).toHaveLength(1);
                expect(announcer.tagName).toBe('SPAN');
                expect(announcer.getAttribute('role')).toBe('status');
                expect(announcer.getAttribute('aria-live')).toBe('polite');
                expect(announcer.textContent).toBe('');
                expect(announcer.previousElementSibling).toBe(editorElement);
                expect(announcer.closest('[role="button"], [contenteditable]')).toBeNull();
            },
        );

        describe.each([
            {lang: 'en', focus: focusMessage, indent: indentMessage},
            {
                lang: 'ru',
                focus: 'Включена навигация по Tab',
                indent: 'Выключена навигация по Tab',
            },
        ] as const)('in $lang', ({lang, focus, indent}) => {
            it.each(['wysiwyg', 'markup'] as const)(
                'should announce API and keyboard changes in %s mode',
                async (mode) => {
                    configure({lang});
                    renderEditor({options: {initial: {mode, toolbarVisible: false}}});
                    const announcer = getAnnouncer();

                    act(() => testEditor.setTabFocusMode('focus'));
                    expect(announcer.textContent).toBe(focus);

                    await act(async () => pressShortcut('m', 'KeyM'));

                    expect(testEditor.tabFocusMode).toBe('indent');
                    expect(getAnnouncer()).toBe(announcer);
                    expect(announcer.textContent).toBe(indent);
                },
            );
        });

        it('should keep the live region across editor and preview mode changes with hidden settings', () => {
            renderEditor({
                options: {
                    initial: {mode: 'wysiwyg', toolbarVisible: false},
                    markupConfig: {renderPreview: () => <span data-qa="preview">Preview</span>},
                },
            });
            const announcer = getAnnouncer();
            act(() => testEditor.setTabFocusMode('focus'));

            act(() => testEditor.setEditorMode('markup'));
            expect(getAnnouncer()).toBe(announcer);
            expect(announcer.textContent).toBe(focusMessage);

            act(() => testEditor.changePreviewVisible(true));
            expect(container.querySelector('[data-qa="preview"]')).not.toBeNull();
            expect(getAnnouncer()).toBe(announcer);
            expect(announcer.textContent).toBe(focusMessage);

            act(() => testEditor.changePreviewVisible(false));
            expect(container.querySelector('[data-qa="preview"]')).toBeNull();
            expect(getAnnouncer()).toBe(announcer);
            expect(announcer.textContent).toBe(focusMessage);
        });

        it('should leave the live region unchanged while editing or selecting the same Tab mode', async () => {
            renderEditor({options: {initial: {mode: 'markup', toolbarVisible: false}}});
            act(() => testEditor.setTabFocusMode('focus'));
            const announcer = getAnnouncer();
            const onMutation = vi.fn();
            const observer = new MutationObserver(onMutation);
            observer.observe(announcer, {childList: true, characterData: true, subtree: true});
            onTestFinished(() => observer.disconnect());

            await act(async () => {
                testEditor.replace('Updated document');
                testEditor.setTabFocusMode('focus');
            });

            expect(testEditor.getValue()).toBe('Updated document');
            expect(getAnnouncer()).toBe(announcer);
            expect(announcer.textContent).toBe(focusMessage);
            expect(onMutation).not.toHaveBeenCalled();
        });

        it('should reset the announcement and unsubscribe when the editor instance changes', () => {
            renderEditor({options: {initial: {toolbarVisible: false}}, deps: [1]});
            const previousEditor = testEditor;
            act(() => previousEditor.setTabFocusMode('focus'));
            expect(getAnnouncer().textContent).toBe(focusMessage);
            const off = vi.spyOn(previousEditor, 'off');

            renderEditor({
                options: {initial: {tabFocusMode: 'focus', toolbarVisible: false}},
                deps: [2],
            });

            expect(testEditor).not.toBe(previousEditor);
            expect(getAnnouncer().textContent).toBe('');
            expect(off).toHaveBeenCalledWith('change-tab-focus-mode', expect.any(Function));

            act(() => previousEditor.setTabFocusMode('indent'));
            expect(testEditor.tabFocusMode).toBe('focus');
            expect(getAnnouncer().textContent).toBe('');

            act(() => testEditor.setTabFocusMode('indent'));
            expect(getAnnouncer().textContent).toBe(indentMessage);
        });
    });

    function getAnnouncer() {
        const announcer = container.querySelector<HTMLSpanElement>(
            'span.g-md-editor-component__announcer',
        );
        if (!announcer) throw new Error('Tab focus mode announcer is missing');
        return announcer;
    }

    function pressShortcut(key: string, code: string) {
        getContent().dispatchEvent(
            new KeyboardEvent('keydown', {
                key,
                code,
                keyCode: code.startsWith('Key') ? code.charCodeAt(3) : 0,
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
