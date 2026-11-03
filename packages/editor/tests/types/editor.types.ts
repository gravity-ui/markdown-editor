import type {ComponentProps, DependencyList, Ref} from 'react';

import type {EditorView} from 'prosemirror-view';

import type * as Public from '../../src';

export function shouldKeepHookArguments(useEditor: typeof Public.useMarkdownEditor) {
    const hook: (
        options: Public.MarkdownEditorOptions,
        deps?: DependencyList,
    ) => Public.MarkdownEditorInstance = useEditor;
    const editor: Public.MarkdownEditorInstance = hook({}, [1, 'dependency']);
    const props: Public.UseMarkdownEditorProps = {};
    hook(props);
    // @ts-expect-error Options are required.
    useEditor();
    // @ts-expect-error Dependencies must be a list.
    useEditor({}, 1);
    return editor;
}

export function shouldKeepNestedOptions(logger: Public.Logger2.ILogger) {
    const md: Public.MarkdownEditorMdOptions = {html: true, breaks: false, linkifyTlds: ['com']};
    const initial: Public.MarkdownEditorInitialOptions = {
        mode: 'markup',
        markup: '',
        toolbarVisible: false,
        splitModeEnabled: true,
    };
    const handlers: Public.MarkdownEditorHandlers = {uploadFile: async () => ({url: '/file'})};
    const experimental: Public.MarkdownEditorExperimentalOptions = {
        prepareRawMarkup: (value) => value,
        beforeEditorModeChange: ({mode, reason}) => mode === 'markup' || reason === 'manually',
        directiveSyntax: 'preserve',
        preserveEmptyRows: true,
        preserveMarkupFormatting: true,
        needToSetDimensionsForUploadedImages: true,
        enableNewImageSizeCalculation: true,
    };
    const config: Public.MarkdownEditorConfig = {emoji: {defs: {custom: '⭐'}}};
    const markupConfig: Public.MarkdownEditorMarkupConfig = {
        splitMode: 'vertical',
        renderPreview: ({getValue, mode}) => `${mode}: ${getValue()}`,
        placeholder: 'Markdown',
        searchPanel: false,
    };
    const wysiwygConfig: Public.MarkdownEditorWysiwygConfig = {
        placeholderOptions: {value: 'Text', behavior: 'empty-row'},
        searchPanel: false,
        extensionOptions: {emoji: {defs: {custom: '⭐'}}},
    };
    const presets: Public.MarkdownEditorPreset[] = ['zero', 'commonmark', 'default', 'yfm', 'full'];
    const options: Public.MarkdownEditorOptions = {
        md,
        initial,
        handlers,
        experimental,
        config,
        markupConfig,
        wysiwygConfig,
        logger,
        mobile: false,
        preset: presets[0],
    };
    return options;
}

export function shouldKeepInstanceMethods(editor: Public.MarkdownEditorInstance) {
    const mode: 'markup' | 'wysiwyg' = editor.currentMode;
    const view: EditorView | undefined = editor._wysiwygView;
    const logger: Public.Logger2.LogReceiver = editor.logger;
    const getValue: () => string = editor.getValue;
    const focused: boolean = editor.hasFocus();
    const empty: boolean = editor.isEmpty();
    const previewVisible: boolean = editor.previewVisible;
    const toolbarVisible: boolean = editor.toolbarVisible;
    const results: void[] = [
        editor.focus(),
        editor.setEditorMode('markup', {emit: false}),
        editor.clear(),
        editor.replace('replacement'),
        editor.prepend('before'),
        editor.append('after'),
        editor.insert('here'),
        editor.moveCursor('start'),
        editor.moveCursor('end'),
        editor.moveCursor({line: 0}),
        editor.changePreviewVisible(),
        editor.changePreviewVisible(true),
    ];
    // @ts-expect-error The public logger only receives messages.
    editor.logger.log('message');
    // @ts-expect-error The input logger must also emit messages and create nested loggers.
    const invalidOptions: Public.MarkdownEditorOptions = {logger};
    // @ts-expect-error A cursor position is a named edge or a line object.
    editor.moveCursor(0);
    return {
        mode,
        view,
        logger,
        getValue,
        focused,
        empty,
        previewVisible,
        toolbarVisible,
        results,
        invalidOptions,
    };
}

export function shouldKeepEventPayloads(editor: Public.MarkdownEditorInstance) {
    const listener = (payload: null) => payload;
    const onResult: void = editor.on('change', listener);
    const offResult: void = editor.off('change', listener);
    editor.on('cancel', listener);
    editor.on('submit', listener);
    editor.on('change-editor-mode', ({mode}): 'markup' | 'wysiwyg' => mode);
    editor.on('change-toolbar-visibility', ({visible}): boolean => visible);
    editor.on('change-split-mode-enabled', ({splitModeEnabled}): boolean => splitModeEnabled);
    editor.on('change-preview-visible', ({visible}): boolean => visible);
    editor.on('toolbar-action', ({editorMode, id, attrs: _attrs}) => {
        const mode: 'markup' | 'wysiwyg' = editorMode;
        const action: string = id;
        const custom: typeof _attrs = {custom: {value: 1}};
        return {mode, action, custom};
    });
    // @ts-expect-error Change events carry null.
    editor.on('change', (_value: string) => {});
    // @ts-expect-error Event names are checked.
    editor.on('changed', listener);
    return {onResult, offResult};
}

export function shouldKeepViewAndContextTypes(
    editor: Public.MarkdownEditorInstance,
    api: typeof Public,
) {
    const ref: Ref<HTMLDivElement> = {current: null};
    const props: ComponentProps<typeof Public.MarkdownEditorView> = {
        stickyToolbar: false,
        editor,
        ref,
        qa: 'editor',
        className: 'custom-editor',
        settingsVisible: ['mode', 'toolbar', 'split'],
        autofocus: false,
        enableSubmitInPreview: true,
        hidePreviewAfterSubmit: false,
        markupToolbarConfig: [],
        wysiwygToolbarConfig: [],
        markupHiddenActionsConfig: [],
        wysiwygHiddenActionsConfig: [],
    };
    const provider: ComponentProps<typeof Public.MarkdownEditorProvider> = {value: editor};
    provider.value = null;
    const hook: () => Public.MarkdownEditorInstance | null = api.useMarkdownEditorContext;
    // @ts-expect-error stickyToolbar is required.
    const missingSticky: Public.MarkdownEditorViewProps = {editor};
    const invalidRef: ComponentProps<typeof Public.MarkdownEditorView> = {
        stickyToolbar: false,
        // @ts-expect-error The forwarded ref refers to a div.
        ref: {current: document.createElement('button')},
    };
    return {props, provider, hook, missingSticky, invalidRef};
}

export function shouldKeepToolbarExportTypes(api: typeof Public) {
    const markup: typeof Public.mBoldItemData = api.markupToolbarConfigs.mBoldItemData;
    const wysiwyg: typeof Public.wBoldItemData = api.wysiwygToolbarConfigs.wBoldItemData;
    return {markup, wysiwyg};
}
