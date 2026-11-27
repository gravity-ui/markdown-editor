import {
    type DependencyList,
    type FunctionComponent,
    type ReactNode,
    createRef,
    useState,
} from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {Plugin} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';
import {type Root, createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest';

import {MarkdownEditorProvider, useMarkdownEditorContext} from 'src/bundle/context';
import type {WToolbarBaseProps} from 'src/bundle/toolbar/types';
import {useMarkdownEditor} from 'src/bundle/useMarkdownEditor';
import {
    MarkdownWysiwygEditorView,
    type MarkdownWysiwygEditorViewProps,
} from 'src/bundle/wysiwyg/public/MarkdownWysiwygEditorView';
import {
    MarkdownWysiwygEditorProvider,
    useMarkdownWysiwygEditorContext,
} from 'src/bundle/wysiwyg/public/context';
import type {
    MarkdownWysiwygEditorInstance,
    MarkdownWysiwygEditorOptions,
} from 'src/bundle/wysiwyg/public/types';
import {useMarkdownWysiwygEditor} from 'src/bundle/wysiwyg/public/useMarkdownWysiwygEditor';
import {contextualToolbarsKey} from 'src/extensions/behavior/ContextualToolbars';
import {Logger2, globalLogger} from 'src/logger';
import {ToolbarName} from 'src/modules/toolbars/constants';
import type {ToolbarsPreset} from 'src/modules/toolbars/types';
import {wysiwygToolbarsPresets} from 'src/modules/toolbars/wysiwyg/presets';
import {ToolbarDataType, useToolbarContext} from 'src/toolbar';

describe('MarkdownWysiwygEditorView', () => {
    let root: Root;
    let container: HTMLDivElement;
    let editor: MarkdownWysiwygEditorInstance;

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
    });

    it('should require an instance from props or context', () => {
        expect(() =>
            renderToStaticMarkup(<MarkdownWysiwygEditorView stickyToolbar={false} />),
        ).toThrow('an instance of the editor must be passed through the props or context');
    });

    it('should mount the context instance with the forwarded ref and QA props', () => {
        const ref = createRef<HTMLDivElement>();
        function Owner() {
            editor = useMarkdownWysiwygEditor({initial: {markup: 'hello', toolbarVisible: false}});
            return (
                <MarkdownWysiwygEditorProvider value={editor}>
                    <MarkdownWysiwygEditorView
                        ref={ref}
                        qa="standalone"
                        className="custom"
                        stickyToolbar={false}
                        settingsVisible={false}
                    />
                </MarkdownWysiwygEditorProvider>
            );
        }
        render(<Owner />);
        expect(container.querySelector('[contenteditable="true"]')?.textContent).toBe('hello');
        expect(ref.current?.getAttribute('data-qa')).toBe('standalone');
        expect(ref.current?.classList.contains('custom')).toBe(true);
        expect(ref.current?.hasAttribute('role')).toBe(false);
        expect(ref.current?.tabIndex).toBe(-1);
        expect(editor.getValue()).toBe('hello');
    });

    it('should update and remove input attributes without replacing the editor', () => {
        const options = {initial: {markup: 'document', toolbarVisible: false}};
        renderEditor({
            options,
            view: {contenteditableAttributes: {'aria-label': 'Original label', lang: 'en'}},
        });
        const first = editor;
        const input = getContent();
        const changes: null[] = [];
        editor.on('change', (value) => changes.push(value));
        expect(input.getAttribute('aria-label')).toBe('Original label');
        expect(input.getAttribute('lang')).toBe('en');

        renderEditor({options, view: {contenteditableAttributes: {'aria-label': 'Updated label'}}});
        expect(input.getAttribute('aria-label')).toBe('Updated label');
        expect(input.hasAttribute('lang')).toBe(false);

        renderEditor({options});
        expect(input.hasAttribute('aria-label')).toBe(false);
        expect(getContent()).toBe(input);
        expect(editor).toBe(first);
        expect(editor.getValue()).toBe('document');
        expect(changes).toEqual([]);
    });

    it('should return null from the context without a provider', () => {
        let value: MarkdownWysiwygEditorInstance | null | undefined;
        function Reader() {
            value = useMarkdownWysiwygEditorContext();
            return null;
        }
        act(() => root.render(<Reader />));
        expect(value).toBeNull();
    });

    it('should provide the explicit instance to toolbar and extension consumers', () => {
        let explicit!: MarkdownWysiwygEditorInstance;
        let toolbarContext: MarkdownWysiwygEditorInstance | null = null;
        let extensionContext: MarkdownWysiwygEditorInstance | null = null;
        let toolbarHost: WToolbarBaseProps['editor'] | undefined;
        let contextHost: WToolbarBaseProps['editor'] | undefined;
        function ToolbarReader({editor: host}: WToolbarBaseProps) {
            toolbarContext = useMarkdownWysiwygEditorContext();
            toolbarHost = host;
            contextHost = useToolbarContext<WToolbarBaseProps['editor']>().editor;
            return (
                <button data-qa="custom-undo" onClick={() => host.actions.undo.run()}>
                    Custom undo
                </button>
            );
        }
        function ExtensionReader() {
            extensionContext = useMarkdownWysiwygEditorContext();
            return <span>Rendered extension</span>;
        }
        function Owner() {
            const outer = useMarkdownWysiwygEditor({});
            explicit = useMarkdownWysiwygEditor({
                initial: {markup: 'original'},
                mobile: true,
                wysiwygConfig: {
                    extensions: (builder) => {
                        const renderer = builder.context.get('reactrenderer');
                        if (!renderer) throw new Error('React renderer is missing');
                        renderer.createItem('context-reader', () => <ExtensionReader />);
                    },
                },
            });
            return (
                <MarkdownWysiwygEditorProvider value={outer}>
                    <MarkdownWysiwygEditorView
                        editor={explicit}
                        stickyToolbar={false}
                        settingsVisible={false}
                        toolbarsPreset={componentPreset(ToolbarReader)}
                    />
                </MarkdownWysiwygEditorProvider>
            );
        }
        render(<Owner />);
        expect(toolbarContext).toBe(explicit);
        expect(extensionContext).toBe(explicit);
        expect(contextHost).toBe(toolbarHost);
        expect(container.textContent).toContain('Rendered extension');
        const undo = container.querySelector<HTMLButtonElement>('[data-qa="custom-undo"]');
        expect(undo).not.toBeNull();
        act(() => explicit.append('added'));
        expect(explicit.getValue()).toBe('original\n\nadded');
        act(() => undo?.click());
        expect(explicit.getValue()).toBe('original');
    });

    it.each([false, true])(
        'should keep legacy context separate with an outer legacy provider: %s',
        (withLegacyProvider) => {
            let legacy!: ReturnType<typeof useMarkdownEditor>;
            let received: ReturnType<typeof useMarkdownEditorContext> | undefined;
            function LegacyButton() {
                const context = useMarkdownEditorContext();
                received = context;
                return (
                    <button data-qa="legacy-action" onClick={() => context?.append('added')}>
                        Legacy action
                    </button>
                );
            }
            function Owner() {
                legacy = useMarkdownEditor({initial: {markup: 'legacy'}});
                editor = useMarkdownWysiwygEditor({initial: {markup: 'standalone'}, mobile: true});
                const view = (
                    <MarkdownWysiwygEditorView
                        editor={editor}
                        stickyToolbar={false}
                        toolbarsPreset={componentPreset(LegacyButton)}
                    />
                );
                return withLegacyProvider ? (
                    <MarkdownEditorProvider value={legacy}>{view}</MarkdownEditorProvider>
                ) : (
                    view
                );
            }
            render(<Owner />);
            expect(received).toBe(withLegacyProvider ? legacy : null);
            const button = container.querySelector<HTMLButtonElement>('[data-qa="legacy-action"]');
            if (!button) throw new Error('Legacy button is missing');
            act(() => button.click());
            expect(editor.getValue()).toBe('standalone');
            expect(legacy.getValue()).toBe(withLegacyProvider ? 'legacy\n\nadded' : 'legacy');
        },
    );

    it('should keep the document and history when only the view remounts', () => {
        const options = {initial: {markup: 'source', toolbarVisible: false}};
        renderEditor({options});
        const first = editor;
        act(() => editor.replace('updated'));
        renderEditor({options, visible: false});
        renderEditor({options});
        expect(editor).toBe(first);
        expect(editor.getValue()).toBe('updated');
        act(() => pressShortcut('z', 'KeyZ'));
        expect(editor.getValue()).toBe('source');
    });

    it('should reject a legacy instance before initializing it', () => {
        const initialize = vi.fn();
        silenceErrors();
        function Owner() {
            const legacy = useMarkdownEditor({wysiwygConfig: {extensions: initialize}});
            return <MarkdownWysiwygEditorView editor={legacy} stickyToolbar={false} />;
        }
        expect(() => act(() => root.render(<Owner />))).toThrow(
            'Expected a standalone WYSIWYG editor instance',
        );
        expect(initialize).not.toHaveBeenCalled();
    });

    it('should reject two simultaneous views of the same instance', () => {
        silenceErrors();
        function Owner() {
            const instance = useMarkdownWysiwygEditor({initial: {toolbarVisible: false}});
            return (
                <>
                    <MarkdownWysiwygEditorView editor={instance} stickyToolbar={false} />
                    <MarkdownWysiwygEditorView editor={instance} stickyToolbar={false} />
                </>
            );
        }
        expect(() => act(() => root.render(<Owner />))).toThrow(
            'Only one View can be mounted per editor',
        );
    });

    it('should propagate lazy initialization errors outside its runtime boundary', () => {
        silenceErrors();
        expect(() =>
            renderEditor({
                options: {
                    wysiwygConfig: {
                        extensions: () => {
                            throw new Error('init failed');
                        },
                    },
                },
            }),
        ).toThrow('init failed');
        expect(container.querySelector('[data-qa="g-md-wysiwyg-error"]')).toBeNull();
    });

    it('should recover live Markdown and clear it if a later recovery fails', () => {
        silenceErrors();
        renderEditor({
            options: {mobile: true},
            deps: [0],
            view: {toolbarsPreset: componentPreset(BrokenButton)},
        });
        act(() => editor.replace('updated **document**'));
        act(() => container.querySelector<HTMLButtonElement>('[data-qa="break-render"]')?.click());
        expect(container.querySelector('[data-qa="g-md-wysiwyg-error"]')).not.toBeNull();
        expect(editor.getValue()).toBe('updated **document**');
        const recover = container.querySelector<HTMLButtonElement>(
            '[data-qa="g-md-recover-markdown"]',
        );
        act(() => recover?.click());
        expect(container.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe(
            'updated **document**',
        );
        expect(container.querySelector('textarea')?.getAttribute('aria-label')).toBe('Markdown');
        expect(container.querySelector('.cm-editor')).toBeNull();
        vi.spyOn(editor, 'getValue').mockImplementation(() => {
            throw new Error('serializer failed');
        });
        act(() => recover?.click());
        expect(container.querySelector('[data-qa="g-md-recovery-error"]')).not.toBeNull();
        expect(container.querySelector('textarea')).toBeNull();

        renderEditor({
            options: {initial: {markup: 'new document', toolbarVisible: false}},
            deps: [1],
        });
        expect(container.querySelector('[data-qa="g-md-wysiwyg-error"]')).toBeNull();
        expect(getContent().textContent).toBe('new document');
    });

    it('should handle submit and cancel shortcuts with one null notification', () => {
        renderEditor({
            options: {initial: {toolbarVisible: false}, wysiwygConfig: {searchPanel: false}},
        });
        const submitted: null[] = [];
        const cancelled: null[] = [];
        editor.on('submit', (payload) => submitted.push(payload));
        editor.on('cancel', (payload) => cancelled.push(payload));
        act(() => {
            expect(pressShortcut('Enter', 'Enter')).toBe(false);
            expect(pressShortcut('Escape', 'Escape')).toBe(false);
        });
        expect(submitted).toEqual([null]);
        expect(cancelled).toEqual([null]);
    });

    it('should log and publish each toolbar action once after a reactive preset change', () => {
        const logger = new Logger2();
        const actions: Logger2.ActionData[] = [];
        logger.on('action', (data) => actions.push(data));
        const originalAction = globalLogger.action;
        const globalActions: Logger2.ActionData[] = [];
        globalLogger.setLogger({action: (data) => globalActions.push(data)});
        onTestFinished(() => globalLogger.setLogger({action: originalAction}));
        const options = {mobile: true, logger};
        renderEditor({options, view: {toolbarsPreset: {items: {}, orders: {}}}});
        const first = editor;
        const notifications: unknown[] = [];
        editor.on('toolbar-action', (data) => notifications.push(data));
        const preset: ToolbarsPreset = {
            items: {
                test: {
                    view: {title: 'Test action', icon: {data: () => <svg />}},
                    wysiwyg: {exec: () => undefined, isActive: () => false, isEnable: () => true},
                },
            },
            orders: {[ToolbarName.wysiwygMain]: [['test']]},
        };
        renderEditor({options, view: {toolbarsPreset: preset}});
        expect(editor).toBe(first);
        const button = container.querySelector<HTMLButtonElement>('[aria-label="Test action"]');
        expect(button).not.toBeNull();
        act(() => button?.click());
        expect(notifications).toEqual([{editorMode: 'wysiwyg', id: 'test', attrs: undefined}]);
        expect(actions).toEqual([{mode: 'wysiwyg', source: 'toolbar', action: 'test'}]);
        expect(globalActions).toEqual(actions);
    });

    it('should update contextual overrides and restore them after the view remounts', () => {
        let nativeView!: EditorView;
        const options: MarkdownWysiwygEditorOptions = {
            initial: {toolbarVisible: false},
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.addPlugin(
                        () =>
                            new Plugin({
                                view: (view) => {
                                    nativeView = view;
                                    return {};
                                },
                            }),
                    ),
            },
        };
        renderEditor({options});
        const first = nativeView;
        const view = {toolbarsPreset: wysiwygToolbarsPresets.commonmark};
        renderEditor({options, view});
        const overrides = contextualToolbarsKey.getState(nativeView.state);
        expect(overrides?.selection?.length).toBeGreaterThan(0);
        expect(overrides?.slash?.length).toBeGreaterThan(0);

        renderEditor({options});
        expect(contextualToolbarsKey.getState(nativeView.state)).toEqual({
            selection: undefined,
            slash: undefined,
        });

        renderEditor({options, view});
        renderEditor({options, visible: false});
        expect(contextualToolbarsKey.getState(nativeView.state)).toEqual({});
        renderEditor({options, view});
        expect(nativeView).toBe(first);
        expect(contextualToolbarsKey.getState(nativeView.state)).toEqual(overrides);
    });

    it('should publish each toolbar visibility change with the current state until unsubscribed', () => {
        document.body.appendChild(container);
        renderEditor({options: {mobile: true}, view: {settingsVisible: true}});
        const changes: {visible: boolean; current: boolean}[] = [];
        const onVisibility = ({visible}: {visible: boolean}) => {
            changes.push({visible, current: editor.toolbarVisible});
        };
        editor.on('change-toolbar-visibility', onVisibility);

        toggleToolbar();
        toggleToolbar();
        expect(changes).toEqual([
            {visible: false, current: false},
            {visible: true, current: true},
        ]);
        editor.off('change-toolbar-visibility', onVisibility);
        toggleToolbar();
        expect(editor.toolbarVisible).toBe(false);
        expect(changes).toHaveLength(2);
    });

    it('should keep a late upload away from the replacement instance', async () => {
        vi.useFakeTimers();
        let finishUpload!: (result: {url: string}) => void;
        const uploadFile = vi.fn(
            () =>
                new Promise<{url: string}>((resolve) => {
                    finishUpload = resolve;
                }),
        );
        renderEditor({
            options: {initial: {toolbarVisible: false}, handlers: {uploadFile}},
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
            options: {initial: {markup: 'new document', toolbarVisible: false}},
            deps: [2],
        });
        const changes: null[] = [];
        editor.on('change', (value) => changes.push(value));
        await act(async () => {
            finishUpload({url: 'https://example.com/test.txt'});
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(editor.getValue()).toBe('new document');
        expect(changes).toEqual([]);
    });

    function renderEditor(props: HarnessProps) {
        render(<Harness {...props} />);
    }

    function render(node: ReactNode) {
        act(() => root.render(<ThemeProvider>{node}</ThemeProvider>));
    }

    function toggleToolbar() {
        const button = container.querySelector<HTMLButtonElement>(
            '[data-qa="g-md-settings-button"]',
        );
        if (!button) throw new Error('Settings button is missing');
        act(() => button.click());
        const checkbox = document.querySelector<HTMLInputElement>(
            '[data-qa="g-md-settings-content"] input[type="checkbox"]',
        );
        if (!checkbox) throw new Error('Toolbar setting is missing');
        act(() => checkbox.click());
    }

    function Harness({options, deps, visible = true, view}: HarnessProps) {
        editor = useMarkdownWysiwygEditor(options, deps);
        return visible ? (
            <MarkdownWysiwygEditorView
                editor={editor}
                stickyToolbar={false}
                settingsVisible={false}
                {...view}
            />
        ) : null;
    }

    function getContent() {
        const content = container.querySelector<HTMLElement>('[contenteditable="true"]');
        if (!content) throw new Error('Editor content is missing');
        return content;
    }

    function pressShortcut(key: string, code: string) {
        return getContent().dispatchEvent(
            new KeyboardEvent('keydown', {
                key,
                code,
                ctrlKey: key !== 'Escape',
                bubbles: true,
                cancelable: true,
            }),
        );
    }

    function silenceErrors() {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const onError = (event: ErrorEvent) => event.preventDefault();
        window.addEventListener('error', onError);
        onTestFinished(() => window.removeEventListener('error', onError));
    }
});

type HarnessProps = {
    options: MarkdownWysiwygEditorOptions;
    deps?: DependencyList;
    visible?: boolean;
    view?: Partial<MarkdownWysiwygEditorViewProps>;
};

function componentPreset(component: FunctionComponent<WToolbarBaseProps>): ToolbarsPreset {
    return {
        items: {
            custom: {
                view: {type: ToolbarDataType.ReactComponent},
                wysiwyg: {component, width: 100},
            },
        },
        orders: {[ToolbarName.wysiwygMain]: [['custom']]},
    };
}

function BrokenButton() {
    const [failed, setFailed] = useState(false);
    if (failed) throw new Error('render failed');
    return (
        <button type="button" data-qa="break-render" onClick={() => setFailed(true)}>
            Break render
        </button>
    );
}
