import type {ReactNode} from 'react';

import {EditorView as CMEditorView} from '@codemirror/view';
import {TextSelection} from 'prosemirror-state';
import type {EditorView as PMEditorView} from 'prosemirror-view';

import {getDescedantByAttribute} from 'src/utils/node-descedants';

import type {CommonEditor, MarkupString} from '../common';
import {
    type ActionStorage,
    type EscapeConfig,
    type ExtensionsManager,
    WysiwygEditor,
    type WysiwygEditorOptions,
    createEditorExtensions,
} from '../core';
import type {TransformFn} from '../core/markdown/ProseMirrorTransformer';
import type {DynamicModifiers} from '../core/types/dynamicModifiers';
import type {ReactRenderStorage, RenderStorage} from '../extensions';
import {createProseMirrorResourceExtension} from '../extensions/behavior/ResourceReplacement';
import {resourceReplacementKey} from '../extensions/behavior/ResourceReplacement/plugin-key';
import {i18n} from '../i18n/bundle';
import {type Logger2, globalLogger} from '../logger';
import {createCodemirror} from '../markup';
import {getAutocompleteConfig} from '../markup/codemirror/autocomplete';
import {historyLocked} from '../markup/codemirror/history-lock';
import {createCodeMirrorResourceExtension} from '../markup/codemirror/resource-replacement-plugin';
import {type CodeEditor, Editor as MarkupEditor} from '../markup/editor';
import {
    type ResourceReplacementControl,
    ResourceReplacementController,
    type ResourceSpecOverrides,
    type ResourceTrigger,
} from '../modules/resource-replacement';
import {type Emitter, type FileUploadHandler, type Receiver, SafeEventEmitter} from '../utils';
import type {DirectiveSyntaxContext} from '../utils/directive';

import {MarkupManager} from './MarkupManager';
import {createDynamicModifiers} from './config/dynamicModifiers';
import type {ChangeEditorModeOptions, MarkdownEditorInstance} from './editor-public-types';
import type {EventMap, ToolbarActionData} from './events';
import type {
    MarkdownEditorMode as EditorMode,
    MarkdownEditorPreset as EditorPreset,
    MarkdownEditorMdOptions,
    MarkdownEditorOptions,
    MarkdownEditorMarkupConfig as MarkupConfig,
    ParseInsertedUrlAsImage,
    RenderPreview,
    MarkdownEditorSplitMode as SplitMode,
} from './types';

export type {ToolbarActionData, EventMap, ChangeEditorModeOptions};

// internal events
interface EventMapInt extends EventMap {
    rerender: null;
    'rerender-toolbar': null;
    'cm-scroll': {event: Event};
}

export type Editor = MarkdownEditorInstance;

/** @internal */
export interface EditorInt
    extends
        ResourceReplacementControl,
        CommonEditor,
        Emitter<EventMapInt>,
        Receiver<EventMapInt>,
        ActionStorage,
        CodeEditor {
    readonly logger: Logger2.ILogger;
    readonly currentMode: EditorMode;
    readonly toolbarVisible: boolean;
    readonly splitModeEnabled: boolean;
    readonly splitMode: SplitMode;
    readonly preset: EditorPreset;
    readonly mdOptions: Readonly<MarkdownEditorMdOptions>;
    readonly directiveSyntax: DirectiveSyntaxContext;
    readonly mobile: boolean;

    /**
     * Used in demo for dev-tools.
     * @internal
     */
    readonly _wysiwygView?: PMEditorView;

    readonly currentEditor: CommonEditor;
    readonly wysiwygEditor: WysiwygEditor;
    readonly markupEditor: MarkupEditor;

    readonly renderStorage: RenderStorage<ReactNode>;
    readonly fileUploadHandler?: FileUploadHandler;
    readonly needToSetDimensionsForUploadedImages: boolean;
    readonly disableHTMLParsingInMd?: boolean;

    readonly renderPreview?: RenderPreview;

    changeEditorMode(opts: ChangeEditorModeOptions): void;

    setEditorMode(mode: EditorMode, opts?: SetEditorModeOptions): void;

    moveCursor(position: 'start' | 'end' | {line: number}): void;

    changeToolbarVisibility(opts: {visible: boolean}): void;

    changeSplitModeEnabled(opts: {splitModeEnabled: boolean}): void;

    readonly previewVisible: boolean;

    changePreviewVisible(visible?: boolean): void;

    destroy(): void;
}

type SetEditorModeOptions = Pick<ChangeEditorModeOptions, 'emit'>;

export type EditorOptions = Pick<
    MarkdownEditorOptions,
    | 'resourceReplacement'
    | 'md'
    | 'initial'
    | 'handlers'
    | 'experimental'
    | 'markupConfig'
    | 'wysiwygConfig'
    | 'mobile'
> & {
    logger: Logger2.ILogger;
    renderStorage: ReactRenderStorage;
    preset: EditorPreset;
    directiveSyntax: DirectiveSyntaxContext;
    pmTransformers: TransformFn[];
};

/** @internal */
export class EditorImpl extends SafeEventEmitter<EventMapInt> implements EditorInt {
    readonly #resourceReplacement: {
        resources: ResourceSpecOverrides;
        controller?: ResourceReplacementController;
        triggers: readonly ResourceTrigger[];
    };
    #logger: Logger2.ILogger;
    #markup: MarkupString;
    #editorMode: EditorMode;
    #toolbarVisible: boolean;
    #splitModeEnabled: boolean;
    #splitMode: SplitMode;
    #previewVisible: boolean;
    #renderPreview?: RenderPreview;
    #wysiwygEditor?: WysiwygEditor;
    #extensionsManager?: ExtensionsManager;
    #markupEditor?: MarkupEditor;
    #markupConfig: MarkupConfig;
    #escapeConfig?: EscapeConfig;
    #mdOptions: Readonly<MarkdownEditorMdOptions>;
    #pmTransformers: TransformFn[] = [];
    #preserveEmptyRows: boolean;
    #modifiers?: DynamicModifiers[];

    readonly #preset: EditorPreset;
    #extensions?: WysiwygEditorOptions['extensions'];
    #renderStorage: ReactRenderStorage;
    #fileUploadHandler?: FileUploadHandler;
    #parseInsertedUrlAsImage?: ParseInsertedUrlAsImage;
    #needToSetDimensionsForUploadedImages: boolean;
    #enableNewImageSizeCalculation: boolean;
    #directiveSyntax: DirectiveSyntaxContext;
    #prepareRawMarkup?: (value: MarkupString) => MarkupString;
    #beforeEditorModeChange?: (
        options: Pick<ChangeEditorModeOptions, 'mode' | 'reason'>,
    ) => boolean | undefined;
    #mobile: boolean;

    get _wysiwygView(): PMEditorView {
        // @ts-expect-error internal typing
        return this.#wysiwygEditor?.view;
    }

    get logger(): Logger2.ILogger {
        return this.#logger;
    }

    get currentMode(): EditorMode {
        return this.#editorMode;
    }

    private set currentMode(newMode: EditorMode) {
        switch (newMode) {
            case 'markup': {
                this.#editorMode = newMode;
                if (this.#wysiwygEditor) {
                    const markupEditorValue = this.#markupEditor?.getValue();
                    const wysiwygEditorValue = this.#wysiwygEditor.getValue();
                    if (
                        !markupEditorValue ||
                        this.shouldReplaceMarkupEditorValue(markupEditorValue, wysiwygEditorValue)
                    ) {
                        this.#markup = wysiwygEditorValue;
                    } else {
                        this.#markup = markupEditorValue;
                    }
                }
                if (this.#markupEditor) this.#markupEditor.replace(this.#markup);
                break;
            }
            case 'wysiwyg': {
                this.#editorMode = newMode;
                if (this.#markupEditor) {
                    const value = this.#markupEditor.getValue();
                    this.#markup = this.#prepareRawMarkup?.(value) ?? value;
                } else if (this.#prepareRawMarkup) {
                    this.#markup = this.#prepareRawMarkup(this.#markup);
                }
                if (this.#wysiwygEditor) this.#wysiwygEditor.replace(this.#markup);
                break;
            }
            default:
                throw new Error('Unknown editor mode: ' + newMode);
        }
        setTimeout(() => {
            this.currentEditor.focus();
        }, 30);
    }

    get toolbarVisible(): boolean {
        return this.#toolbarVisible;
    }

    get splitModeEnabled(): boolean {
        return this.#splitModeEnabled;
    }

    get splitMode(): SplitMode {
        return this.#splitMode;
    }

    get previewVisible(): boolean {
        return this.#previewVisible;
    }

    get preset(): EditorPreset {
        return this.#preset;
    }

    get mdOptions(): Readonly<MarkdownEditorMdOptions> {
        return this.#mdOptions;
    }

    get directiveSyntax(): DirectiveSyntaxContext {
        return this.#directiveSyntax;
    }

    get renderPreview(): RenderPreview | undefined {
        return this.#renderPreview;
    }

    get currentEditor(): CommonEditor {
        const mode = this.currentMode;
        switch (mode) {
            case 'markup':
                return this.markupEditor;
            case 'wysiwyg':
                return this.wysiwygEditor;
            default:
                throw new Error('Unknown editor mode: ' + mode);
        }
    }

    get #sharedExtensions(): ExtensionsManager {
        if (!this.#extensionsManager) {
            const mdPreset: NonNullable<WysiwygEditorOptions['mdPreset']> =
                this.#preset === 'zero' || this.#preset === 'commonmark' ? this.#preset : 'default';
            this.#extensionsManager = createEditorExtensions({
                mdPreset,
                logger: this.logger.nested({mode: 'wysiwyg'}),
                extensions: (builder) => {
                    if (this.#extensions) builder.use(this.#extensions);
                    for (const nodeType of Object.keys(this.#resourceReplacement.resources)) {
                        if (!builder.hasNodeSpec(nodeType))
                            throw new Error(`Unknown resource node type: ${nodeType}`);
                    }
                    // Unlisted nodes must not inherit resource metadata from extensions.
                    for (const nodeType of builder.nodeSpecNames()) {
                        const resource = this.#resourceReplacement.resources[nodeType];
                        builder.overrideNodeSpec(nodeType, (spec) => ({
                            ...spec,
                            _resource: resource || undefined,
                        }));
                    }
                    if (
                        this.#resourceReplacement.controller &&
                        this.#resourceReplacement.triggers.length
                    ) {
                        builder.use(
                            createProseMirrorResourceExtension({
                                controller: this.#resourceReplacement.controller,
                                triggers: this.#resourceReplacement.triggers,
                            }),
                        );
                    }
                },
                pmTransformers: this.#pmTransformers,
                modifiers: this.#modifiers,
                allowHTML: this.#mdOptions.html,
                linkify: this.#mdOptions.linkify,
                linkifyTlds: this.#mdOptions.linkifyTlds,
            });
        }
        return this.#extensionsManager;
    }

    get wysiwygEditor(): WysiwygEditor {
        if (!this.#wysiwygEditor) {
            this.#wysiwygEditor = new WysiwygEditor({
                extensionsManager: this.#sharedExtensions,
                logger: this.logger.nested({mode: 'wysiwyg'}),
                initialContent: this.#markup,
                escapeConfig: this.#escapeConfig,
                onChange: () => this.emit('rerender-toolbar', null),
                onDocChange: () => this.emit('change', null),
            });
        }
        return this.#wysiwygEditor;
    }

    get markupEditor(): MarkupEditor {
        if (!this.#markupEditor) {
            this.#markupEditor = new MarkupEditor(
                createCodemirror({
                    doc: this.#markup,
                    logger: this.logger.nested({mode: 'markup'}),
                    placeholder: this.#markupConfig.placeholder ?? i18n('markup_placeholder'),
                    onCancel: () => this.emit('cancel', null),
                    onSubmit: () => this.emit('submit', null),
                    onChange: () => this.emit('rerender-toolbar', null),
                    onDocChange: () => this.emit('change', null),
                    onScroll: (event) => this.emit('cm-scroll', {event}),
                    reactRenderer: this.#renderStorage,
                    uploadHandler: this.fileUploadHandler,
                    parseInsertedUrlAsImage: this.parseInsertedUrlAsImage,
                    needImageDimensions: this.needToSetDimensionsForUploadedImages,
                    parseHtmlOnPaste: this.#markupConfig.parseHtmlOnPaste,
                    enableNewImageSizeCalculation: this.enableNewImageSizeCalculation,
                    extensions: [
                        ...(this.#markupConfig.extensions ?? []),
                        ...(this.#resourceReplacement.controller &&
                        this.#resourceReplacement.triggers.length
                            ? createCodeMirrorResourceExtension({
                                  controller: this.#resourceReplacement.controller,
                                  resources: this.#resourceReplacement.resources,
                                  parser: this.#sharedExtensions.buildDeps().markupParser,
                                  serializer: this.#sharedExtensions.buildDeps().serializer,
                                  escapeConfig: this.#escapeConfig,
                                  triggers: this.#resourceReplacement.triggers,
                              })
                            : []),
                    ],
                    disabledExtensions: this.#markupConfig.disabledExtensions,
                    keymaps: this.#markupConfig.keymaps,
                    preserveEmptyRows: this.#preserveEmptyRows,
                    yfmLangOptions: {
                        languageData: getAutocompleteConfig({
                            preserveEmptyRows: this.#preserveEmptyRows,
                        }).concat(this.#markupConfig?.languageData || []),
                    },
                    autocompletion: this.#markupConfig.autocompletion,
                    tooltips: this.#markupConfig.tooltips,
                    directiveSyntax: this.directiveSyntax,
                    receiver: this,
                    searchPanel: this.#markupConfig.searchPanel,
                }),
            );
        }
        return this.#markupEditor;
    }

    get renderStorage(): RenderStorage<ReactNode> {
        return this.#renderStorage;
    }

    get fileUploadHandler(): FileUploadHandler | undefined {
        return this.#fileUploadHandler;
    }

    get parseInsertedUrlAsImage() {
        return this.#parseInsertedUrlAsImage;
    }

    get needToSetDimensionsForUploadedImages(): boolean {
        return this.#needToSetDimensionsForUploadedImages;
    }

    get enableNewImageSizeCalculation(): boolean {
        return this.#enableNewImageSizeCalculation;
    }

    get mobile(): boolean {
        return this.#mobile;
    }

    constructor(opts: EditorOptions) {
        const {logger} = opts;

        const onError = (error: unknown) => {
            logger.error(error);
            globalLogger.error(error);
        };

        super({onError});

        const {
            md = {},
            initial = {},
            handlers = {},
            experimental = {},
            markupConfig = {},
            wysiwygConfig = {},
            mobile = false,
        } = opts;

        this.#resourceReplacement = {
            resources: opts.resourceReplacement?.resources ?? {},
            triggers: opts.resourceReplacement?.triggers ?? [],
        };
        if (
            opts.resourceReplacement?.resolve &&
            Object.values(this.#resourceReplacement.resources).some(Boolean)
        ) {
            this.#resourceReplacement.controller = new ResourceReplacementController(
                opts.resourceReplacement,
                onError,
                () => {
                    this.emit('rerender', null);
                    this.emit('rerender-toolbar', null);
                },
            );
        }
        this.#logger = logger;
        this.#modifiers = experimental.preserveMarkupFormatting
            ? createDynamicModifiers(
                  new MarkupManager(this.logger.nested({module: 'markup-manager'})),
              )
            : undefined;

        this.#editorMode = initial.mode ?? 'wysiwyg';
        this.#toolbarVisible = initial.toolbarVisible ?? true;
        this.#splitMode = (markupConfig.renderPreview && markupConfig.splitMode) ?? false;
        this.#splitModeEnabled = (this.#splitMode && initial.splitModeEnabled) ?? false;
        this.#previewVisible = false;
        this.#renderPreview = markupConfig.renderPreview;

        this.#markup = initial.markup ?? '';

        this.#preset = opts.preset ?? 'full';
        this.#pmTransformers = opts.pmTransformers;
        this.#mdOptions = md;
        this.#extensions = wysiwygConfig.extensions;
        this.#markupConfig = {...opts.markupConfig};

        this.#renderStorage = opts.renderStorage;
        this.#fileUploadHandler = handlers.uploadFile;
        this.#parseInsertedUrlAsImage = markupConfig.parseInsertedUrlAsImage;
        this.#needToSetDimensionsForUploadedImages = Boolean(
            experimental.needToSetDimensionsForUploadedImages,
        );
        this.#directiveSyntax = opts.directiveSyntax;
        this.#enableNewImageSizeCalculation = Boolean(experimental.enableNewImageSizeCalculation);
        this.#preserveEmptyRows = experimental.preserveEmptyRows || false;
        this.#prepareRawMarkup = experimental.prepareRawMarkup;
        this.#escapeConfig = wysiwygConfig.escapeConfig;
        this.#beforeEditorModeChange = experimental.beforeEditorModeChange;
        this.#mobile = mobile;
    }

    // ---> implements CodeEditor

    get cm() {
        return this.markupEditor.cm;
    }

    // <--- implements CodeEditor

    // ---> implements ActionStorage
    get actions(): WysiwygEditor.Actions {
        return this.wysiwygEditor.actions;
    }

    action<T extends keyof WysiwygEditor.Actions>(actionName: T): WysiwygEditor.Actions[T] {
        return this.wysiwygEditor.action(actionName);
    }

    // <--- implements ActionStorage

    getPendingResourceReplacements() {
        return this.#resourceReplacement.controller?.getPendingResourceReplacements() ?? [];
    }

    cancelResourceReplacement(operationId: string) {
        this.#resourceReplacement.controller?.cancelResourceReplacement(operationId);
    }

    destroy() {
        this.#resourceReplacement.controller?.destroy();
        this.#wysiwygEditor?.destroy();
        this.#markupEditor?.codemirror.destroy();

        this.#markupEditor = undefined;
        this.#markupEditor = undefined;
        this.#wysiwygEditor = undefined;
        this.#extensionsManager = undefined;
    }

    setEditorMode(mode: EditorMode, opts?: SetEditorModeOptions): void {
        this.changeEditorMode({mode, reason: 'manually', emit: opts?.emit});
    }

    get #resourceReplacementBusy(): boolean {
        if (this.#resourceReplacement.controller?.busy) return true;
        // An accepted insertion can notify consumers before its view starts the request.
        // Its pending state already locks the engine during this notification.
        const pmState = this.#wysiwygEditor?.view.state;
        return Boolean(
            (pmState && resourceReplacementKey.getState(pmState)?.length) ||
            this.#markupEditor?.cm.state.facet(historyLocked),
        );
    }

    changeEditorMode({emit = true, ...opts}: ChangeEditorModeOptions): void {
        if (this.#editorMode === opts.mode || this.#resourceReplacementBusy) return;

        if (this.#beforeEditorModeChange?.({mode: opts.mode, reason: opts.reason}) === false) {
            return;
        }

        // The application callback above may have synchronously started a resource operation.
        if (this.#resourceReplacementBusy) return;

        this.logger.event({
            event: 'mode-change',
            prevMode: this.#editorMode,
            nextMode: opts.mode,
            reason: opts.reason,
        });

        this.currentMode = opts.mode;
        this.emit('rerender', null);

        if (emit) {
            this.emit('change-editor-mode', opts);
        }
    }

    changeToolbarVisibility(opts: {visible: boolean}): void {
        this.#toolbarVisible = opts.visible;
        this.emit('rerender', null);
        this.emit('change-toolbar-visibility', opts);
    }

    changeSplitModeEnabled(opts: {splitModeEnabled: boolean}): void {
        if (this.#splitModeEnabled === opts.splitModeEnabled) return;
        this.#splitModeEnabled = opts.splitModeEnabled;
        this.emit('rerender', null);
        this.emit('change-split-mode-enabled', opts);
    }

    changePreviewVisible(visible = !this.#previewVisible): void {
        if (!this.#renderPreview || this.#splitModeEnabled) return;
        if (this.#previewVisible === visible) return;
        this.#previewVisible = visible;
        this.emit('rerender', null);
        this.emit('change-preview-visible', {visible});
    }

    focus(): void {
        return this.currentEditor.focus();
    }

    hasFocus(): boolean {
        return this.currentEditor.hasFocus();
    }

    getValue: () => MarkupString = () => this.currentEditor.getValue();

    isEmpty(): boolean {
        return this.currentEditor.isEmpty();
    }

    clear(): void {
        return this.currentEditor.clear();
    }

    replace(newMarkup: MarkupString): void {
        return this.currentEditor.replace(newMarkup);
    }

    prepend(markup: MarkupString): void {
        return this.currentEditor.prepend(markup);
    }

    append(markup: MarkupString): void {
        return this.currentEditor.append(markup);
    }

    insert(markup: MarkupString): void {
        return this.currentEditor.insert(markup);
    }

    moveCursor(
        position:
            | 'start'
            | 'end'
            | {
                  /** 0-based line number */
                  line: number;
              },
    ): void {
        if (typeof position === 'object') {
            return this.moveCursorToLine(position.line);
        }

        return this.currentEditor.moveCursor(position);
    }

    private moveCursorToLine(/** 0-based line number */ line: number): void {
        const mode = this.currentMode;

        switch (mode) {
            case 'markup': {
                this.markupMoveToLine(line);
                break;
            }
            case 'wysiwyg': {
                this.wysiwygMoveToLine(line);
                break;
            }
            default:
                throw new Error('Unknown editor mode: ' + mode);
        }
    }

    private markupMoveToLine(line: number): void {
        const view = this.markupEditor.cm;
        const isConnected = Boolean(view.dom.parentElement);

        let cmLine = line + 1; // lines in codemirror is 1-based
        cmLine = Math.max(cmLine, 1);
        cmLine = Math.min(cmLine, view.state.doc.lines);

        const anchor = view.state.doc.line(cmLine).from;
        view.dispatch({
            scrollIntoView: true,
            selection: {anchor},
            effects: isConnected
                ? [
                      CMEditorView.scrollIntoView(anchor, {
                          y: 'start',
                          x: 'start',
                          yMargin: getTopOffset(view.dom),
                      }),
                  ]
                : undefined,
        });
    }

    private wysiwygMoveToLine(line: number): void {
        const DATA_LINE = 'data-line';
        const SELECTOR = `[${DATA_LINE}="${line}"]` as const;

        const view = this._wysiwygView;
        const isConnected = Boolean(view.dom.parentElement);

        const setSelection = (pos: number) => {
            const {tr} = view.state;
            view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(pos), 1)));
        };

        const scrollIntoView = (elemTop: number) => {
            const topOffset = getTopOffset(this.wysiwygEditor.dom);
            window.scrollTo({top: elemTop + window.scrollY - topOffset});
        };

        const elem = this.wysiwygEditor.dom.querySelector(SELECTOR);
        if (elem) {
            const position = this._wysiwygView.posAtDOM(elem, 0);
            setSelection(position);

            if (isConnected) {
                const elemTop = elem.getBoundingClientRect().top;
                scrollIntoView(elemTop);
            }

            return;
        }

        const node = getDescedantByAttribute(view.state.doc, DATA_LINE, [line, String(line)]);
        if (node) {
            setSelection(node.pos);

            if (isConnected) {
                const elemTop = view.coordsAtPos(node.pos).top;
                scrollIntoView(elemTop);
            }
        }
    }

    private shouldReplaceMarkupEditorValue(markupValue: string, wysiwygValue: string) {
        const serializedEditorMarkup = this.#wysiwygEditor?.serializer.serialize(
            this.#wysiwygEditor.parser.parse(markupValue),
            this.#escapeConfig,
        );
        return serializedEditorMarkup?.trim() !== wysiwygValue.trim();
    }
}

function getTopOffset(elem: Element) {
    const TOOLBAR_HEIGHT = 36; //px
    const TOOLBAR_BOTTOM_OFFSET = 8; // px
    const TOOLBAR_TOP_ADDITIONAL_OFFSET = 8; // px
    const TOOLBAR_TOP_OFFSET_VAR = '--g-md-toolbar-sticky-offset';

    const topOffsetValue = window.getComputedStyle(elem).getPropertyValue(TOOLBAR_TOP_OFFSET_VAR);
    const toolbarTopOffset =
        calculateCSSNumberValue(topOffsetValue) + TOOLBAR_TOP_ADDITIONAL_OFFSET;

    return toolbarTopOffset + TOOLBAR_HEIGHT + TOOLBAR_BOTTOM_OFFSET;
}

function calculateCSSNumberValue(cssValue: string): number {
    const tmp = document.createElement('div');
    tmp.style.position = 'absolute';
    tmp.style.top = '-99999px';
    tmp.style.left = '-99999px';
    tmp.style.width = `calc(${cssValue})`;

    document.body.appendChild(tmp);
    const value = tmp.getBoundingClientRect().width;
    tmp.remove();

    return value;
}
