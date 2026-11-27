import type {ComponentProps, DependencyList, Ref} from 'react';

import type * as Public from 'src/index';

export function shouldRequireOptions(useEditor: typeof Public.useMarkdownWysiwygEditor) {
    const hook: (
        options: Public.MarkdownWysiwygEditorOptions,
        deps?: DependencyList,
    ) => Public.MarkdownWysiwygEditorInstance = useEditor;
    const editor: Public.MarkdownWysiwygEditorInstance = hook({}, [1, 'dependency']);
    // @ts-expect-error Options are required.
    useEditor();
    // @ts-expect-error Dependencies must be a list.
    useEditor({}, 1);
    return editor;
}

export function shouldKeepApplicableOptions(logger: Public.Logger2.ILogger) {
    const options: Public.MarkdownWysiwygEditorOptions = {
        preset: 'full',
        md: {html: true, breaks: false, linkifyTlds: ['com']},
        initial: {markup: '', toolbarVisible: false},
        handlers: {uploadFile: async () => ({url: '/file'})},
        config: {emoji: {defs: {custom: '⭐'}}},
        experimental: {
            directiveSyntax: 'preserve',
            preserveEmptyRows: true,
            preserveMarkupFormatting: true,
            needToSetDimensionsForUploadedImages: true,
            enableNewImageSizeCalculation: true,
        },
        wysiwygConfig: {
            placeholderOptions: {value: 'Text', behavior: 'empty-row'},
            searchPanel: false,
            extensionOptions: {emoji: {defs: {custom: '⭐'}}},
        },
        logger,
        mobile: true,
    };
    const presets: Public.MarkdownWysiwygEditorOptions['preset'][] = [
        'zero',
        'commonmark',
        'default',
        'yfm',
        'full',
    ];
    return {options, presets};
}

export function shouldRejectForeignOptions(useEditor: typeof Public.useMarkdownWysiwygEditor) {
    // @ts-expect-error WYSIWYG does not accept markup configuration.
    useEditor({markupConfig: {searchPanel: false}});
    // @ts-expect-error A standalone editor has no initial mode.
    useEditor({initial: {mode: 'wysiwyg'}});
    // @ts-expect-error WYSIWYG does not support split mode.
    useEditor({initial: {splitModeEnabled: true}});
    // @ts-expect-error Standalone editors do not switch modes.
    useEditor({experimental: {beforeEditorModeChange: () => true}});
    // @ts-expect-error Standalone editors do not prepare mode transitions.
    useEditor({experimental: {prepareRawMarkup: (value: string) => value}});
}

export function shouldAcceptWiderStructuralOptions(options: Public.MarkdownEditorOptions) {
    const standalone: Public.MarkdownWysiwygEditorOptions = options;
    return standalone;
}

export function shouldKeepDocumentOperations(editor: Public.MarkdownWysiwygEditorInstance) {
    const getValue: () => string = editor.getValue;
    const focused: boolean = editor.hasFocus();
    const empty: boolean = editor.isEmpty();
    const toolbarVisible: boolean = editor.toolbarVisible;
    const logger: Public.Logger2.LogReceiver = editor.logger;
    const results: void[] = [
        editor.focus(),
        editor.clear(),
        editor.replace('replacement'),
        editor.prepend('before'),
        editor.append('after'),
        editor.insert('here'),
        editor.moveCursor('start'),
        editor.moveCursor('end'),
        editor.moveCursor({line: 0}),
    ];
    const api = editor;
    // @ts-expect-error Toolbar visibility is read-only.
    api.toolbarVisible = false;
    // @ts-expect-error The public logger only receives messages.
    editor.logger.log('message');
    // @ts-expect-error The input logger must also emit messages.
    const options: Public.MarkdownWysiwygEditorOptions = {logger};
    return {getValue, focused, empty, toolbarVisible, logger, results, options};
}

export function shouldHideOwnerAndForeignCapabilities(
    editor: Public.MarkdownWysiwygEditorInstance,
) {
    // @ts-expect-error Runtime mode identity is internal.
    const currentMode = editor.currentMode;
    // @ts-expect-error Mode activity is not public.
    const isActive = editor.isActive;
    // @ts-expect-error A standalone editor cannot switch modes.
    editor.setEditorMode('markup');
    // @ts-expect-error Preview belongs to markup.
    const previewVisible = editor.previewVisible;
    // @ts-expect-error Preview belongs to markup.
    editor.changePreviewVisible();
    // @ts-expect-error The hook owns destruction.
    editor.destroy();
    // @ts-expect-error Native engines are private.
    const _wysiwygView = editor._wysiwygView;
    // @ts-expect-error Consumers cannot emit events.
    editor.emit('change', null);
    // @ts-expect-error Toolbar setters are private.
    editor.changeToolbarVisibility({visible: false});
    // @ts-expect-error Exporters are not part of the standalone API.
    const exporters = editor.exporters;
    return {currentMode, isActive, previewVisible, _wysiwygView, exporters};
}

export function shouldExposeWysiwygEvents(editor: Public.MarkdownWysiwygEditorInstance) {
    const listener = (payload: null) => payload;
    const onResult: void = editor.on('change', listener);
    const offResult: void = editor.off('change', listener);
    editor.on('submit', listener);
    editor.on('cancel', listener);
    editor.on('change-toolbar-visibility', ({visible}): boolean => visible);
    editor.on('toolbar-action', ({editorMode, id, attrs: _attrs}) => {
        const mode: 'wysiwyg' = editorMode;
        const action: string = id;
        const custom: typeof _attrs = {custom: {value: 1}};
        return {mode, action, custom};
    });
    // @ts-expect-error Change events carry null.
    editor.on('change', (_value: string) => {});
    // @ts-expect-error There are no mode switch events.
    editor.on('change-editor-mode', listener);
    // @ts-expect-error There are no split mode events.
    editor.on('change-split-mode-enabled', listener);
    // @ts-expect-error There are no preview events.
    editor.on('change-preview-visible', listener);
    return {onResult, offResult};
}

export function shouldExposeDirectContext(
    editor: Public.MarkdownWysiwygEditorInstance,
    api: typeof Public,
) {
    const hook: () => Public.MarkdownWysiwygEditorInstance | null =
        api.useMarkdownWysiwygEditorContext;
    const provider: Public.MarkdownWysiwygEditorProviderProps = {value: editor};
    const props: ComponentProps<typeof Public.MarkdownWysiwygEditorProvider> = provider;
    props.value = null;
    const context = hook();
    // @ts-expect-error The context is the API, not a wrapper.
    const wrappedEditor = context?.editor;
    // @ts-expect-error The context does not expose mode identity.
    const mode = context?.mode;
    return {hook, provider, props, wrappedEditor, mode};
}

export function shouldKeepApplicableViewProps(editor: Public.MarkdownWysiwygEditorInstance) {
    const ref: Ref<HTMLDivElement> = {current: null};
    const props: ComponentProps<typeof Public.MarkdownWysiwygEditorView> = {
        editor,
        stickyToolbar: true,
        ref,
        autofocus: false,
        qa: 'standalone',
        className: 'custom-editor',
        settingsVisible: ['toolbar'],
        contenteditableAttributes: {
            'aria-label': 'Description',
            'aria-multiline': 'true',
            role: 'textbox',
        },
    };
    const implicit: Public.MarkdownWysiwygEditorViewProps = {stickyToolbar: false};
    // @ts-expect-error stickyToolbar is required.
    const missingSticky: Public.MarkdownWysiwygEditorViewProps = {editor};
    const invalidRef: ComponentProps<typeof Public.MarkdownWysiwygEditorView> = {
        stickyToolbar: false,
        // @ts-expect-error The forwarded ref refers to a div.
        ref: {current: document.createElement('button')},
    };
    return {props, implicit, missingSticky, invalidRef};
}

export function shouldRejectForeignViewProps(viewProps: Public.MarkdownWysiwygEditorViewProps) {
    const props = viewProps;
    // @ts-expect-error Mode selection is absent.
    props.settingsVisible = ['mode'];
    // @ts-expect-error Split settings belong to markup.
    props.settingsVisible = ['split'];
    // @ts-expect-error Preview belongs to markup.
    props.enableSubmitInPreview = true;
    // @ts-expect-error Preview belongs to markup.
    props.hidePreviewAfterSubmit = true;
    // @ts-expect-error Use toolbarsPreset for customization.
    props.wysiwygToolbarConfig = [];
    // @ts-expect-error Use toolbarsPreset for customization.
    props.markupToolbarConfig = [];
    // @ts-expect-error Use toolbarsPreset for customization.
    props.wysiwygHiddenActionsConfig = [];
    // @ts-expect-error Use toolbarsPreset for customization.
    props.markupHiddenActionsConfig = [];
    // @ts-expect-error Standalone attributes do not accept a pair of modes.
    props.contenteditableAttributes = {wysiwyg: {}, markup: {}};
    // @ts-expect-error Content editability is controlled by the editor.
    props.contenteditableAttributes = {contenteditable: 'false'};
}

export function shouldKeepStructuralInstanceTypes(editor: Public.MarkdownEditorInstance) {
    const props: Public.MarkdownWysiwygEditorViewProps = {editor, stickyToolbar: false};
    return props;
}
