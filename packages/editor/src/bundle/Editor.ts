import type {ReactNode} from 'react';

import type {EditorView as PMEditorView} from 'prosemirror-view';

import type {CommonEditor, MarkupString} from 'src/common';
import type {ActionStorage, EscapeConfig, WysiwygEditor} from 'src/core';
import type {Logger2} from 'src/logger';
import type {CodeEditor, Editor as MarkupEditor} from 'src/markup/editor';
import type {ReactRenderStorage, RenderStorage} from 'src/modules/react-renderer';
import type {DirectiveSyntaxContext} from 'src/utils/directive';
import type {Emitter, Listener, Receiver, SafeEventEmitter} from 'src/utils/event-emitter';
import type {FileUploadHandler} from 'src/utils/upload';

import type {ChangeEditorModeOptions, MarkdownEditorInstance} from './editor-public-types';
import type {EventMap, ToolbarActionData} from './events';
import type {EditorEventMap as EventMapInt} from './shared/events';
import type {EditorMarkupState, ModeCore, ModeCoreOptions} from './shared/types';
import type {
    MarkdownEditorMode as EditorMode,
    MarkdownEditorPreset as EditorPreset,
    MarkdownEditorMdOptions,
    MarkdownEditorOptions,
    ParseInsertedUrlAsImage,
    RenderPreview,
    MarkdownEditorSplitMode as SplitMode,
} from './types';

export type {ToolbarActionData, EventMap, ChangeEditorModeOptions};

export type Editor = MarkdownEditorInstance;

/** @internal */
export interface EditorInt
    extends CommonEditor, Emitter<EventMapInt>, Receiver<EventMapInt>, ActionStorage, CodeEditor {
    readonly logger: Logger2.ILogger;
    readonly currentMode: EditorMode;
    readonly toolbarVisible: boolean;
    readonly splitModeEnabled: boolean;
    readonly splitMode: SplitMode;
    readonly preset: EditorPreset;
    readonly mdOptions: Readonly<MarkdownEditorMdOptions>;
    readonly directiveSyntax: DirectiveSyntaxContext;
    readonly mobile: boolean;

    /** @internal used in demo for dev-tools */
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

/** @internal */
export type EditorOptions = ModeCoreOptions &
    Pick<MarkdownEditorOptions, 'md' | 'initial' | 'markupConfig' | 'wysiwygConfig' | 'mobile'>;

interface EditorRuntime {
    markupState: EditorMarkupState;
    events: SafeEventEmitter<EventMapInt>;
    wysiwyg: ModeCore<WysiwygEditor>;
    markup: ModeCore<MarkupEditor>;
}

/** @internal */
export class EditorImpl implements EditorInt {
    readonly #events: SafeEventEmitter<EventMapInt>;
    readonly #wysiwygCore: ModeCore<WysiwygEditor>;
    readonly #markupCore: ModeCore<MarkupEditor>;
    #destroyed = false;
    #logger: Logger2.ILogger;
    readonly #markupState: EditorMarkupState;
    #editorMode: EditorMode;
    #toolbarVisible: boolean;
    #splitModeEnabled: boolean;
    #splitMode: SplitMode;
    #previewVisible: boolean;
    #renderPreview?: RenderPreview;
    #markupEditorNeedsReplace = false;
    readonly #escapeConfig?: EscapeConfig;
    #mdOptions: Readonly<MarkdownEditorMdOptions>;

    readonly #preset: EditorPreset;
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
        return this.#wysiwygCore.editor?.view;
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
                if (this.#wysiwygCore.editor) {
                    const markupEditorValue = this.#markupEditorNeedsReplace
                        ? undefined
                        : this.#markupCore.editor?.getValue();
                    const wysiwygEditorValue = this.#wysiwygCore.editor.getValue();
                    if (
                        !markupEditorValue ||
                        this.shouldReplaceMarkupEditorValue(markupEditorValue, wysiwygEditorValue)
                    ) {
                        this.#markupState.markup = wysiwygEditorValue;
                    } else {
                        this.#markupState.markup = markupEditorValue;
                    }
                }
                if (this.#markupCore.editor) {
                    this.#markupEditorNeedsReplace = true;
                    this.#markupCore.editor.replace(this.#markupState.markup);
                    this.#markupEditorNeedsReplace = false;
                }
                break;
            }
            case 'wysiwyg': {
                this.#editorMode = newMode;
                if (this.#markupCore.editor) {
                    const value = this.#markupCore.editor.getValue();
                    this.#markupState.markup = this.#prepareRawMarkup?.(value) ?? value;
                } else if (this.#prepareRawMarkup) {
                    this.#markupState.markup = this.#prepareRawMarkup(this.#markupState.markup);
                }
                if (this.#wysiwygCore.editor)
                    this.#wysiwygCore.editor.replace(this.#markupState.markup);
                break;
            }
            default:
                throw new Error('Unknown editor mode: ' + newMode);
        }
        const ownerDocument =
            this.#markupCore.editor?.cm.dom.ownerDocument ??
            this.#wysiwygCore.editor?.dom.ownerDocument;
        const activeElement = ownerDocument?.activeElement;
        setTimeout(() => {
            if (this.#destroyed) return;
            // Search may open before this timer runs. Do not take focus from its input.
            // Removing the old editor can move focus to body; still focus the new editor then.
            if (
                ownerDocument &&
                ownerDocument.activeElement !== activeElement &&
                ownerDocument.activeElement !== ownerDocument.body
            ) {
                return;
            }
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

    get wysiwygEditor(): WysiwygEditor {
        return this.#wysiwygCore.getEditor();
    }

    get markupEditor(): MarkupEditor {
        return this.#markupCore.getEditor();
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

    constructor(opts: EditorOptions, runtime: EditorRuntime) {
        const {logger} = opts;

        this.#events = runtime.events;
        this.#wysiwygCore = runtime.wysiwyg;
        this.#markupCore = runtime.markup;

        const {
            md = {},
            initial = {},
            handlers = {},
            experimental = {},
            markupConfig = {},
            mobile = false,
        } = opts;

        this.#logger = logger;
        this.#editorMode = initial.mode ?? 'wysiwyg';
        this.#toolbarVisible = initial.toolbarVisible ?? true;
        this.#splitMode = (markupConfig.renderPreview && markupConfig.splitMode) ?? false;
        this.#splitModeEnabled = (this.#splitMode && initial.splitModeEnabled) ?? false;
        this.#previewVisible = false;
        this.#renderPreview = markupConfig.renderPreview;

        this.#markupState = runtime.markupState;

        this.#preset = opts.preset ?? 'full';
        this.#mdOptions = md;

        this.#renderStorage = opts.renderStorage;
        this.#fileUploadHandler = handlers.uploadFile;
        this.#parseInsertedUrlAsImage = markupConfig.parseInsertedUrlAsImage;
        this.#needToSetDimensionsForUploadedImages = Boolean(
            experimental.needToSetDimensionsForUploadedImages,
        );
        this.#directiveSyntax = opts.directiveSyntax;
        this.#enableNewImageSizeCalculation = Boolean(experimental.enableNewImageSizeCalculation);
        this.#prepareRawMarkup = experimental.prepareRawMarkup;
        this.#escapeConfig = opts.wysiwygConfig?.escapeConfig;
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

    on<K extends keyof EventMapInt>(type: K, listener: Listener<EventMapInt[K]>): void {
        this.#events.on(type, listener);
    }

    off<K extends keyof EventMapInt>(type: K, listener: Listener<EventMapInt[K]>): void {
        this.#events.off(type, listener);
    }

    emit<K extends keyof EventMapInt>(type: K, value: EventMapInt[K]): void {
        this.#events.emit(type, value);
    }

    countOf<K extends keyof EventMapInt>(type: K): number {
        return this.#events.countOf(type);
    }

    destroy() {
        this.#destroyed = true;
        this.#wysiwygCore.destroy();
        this.#markupCore.destroy();
    }

    setEditorMode(mode: EditorMode, opts?: SetEditorModeOptions): void {
        this.changeEditorMode({mode, reason: 'manually', emit: opts?.emit});
    }

    changeEditorMode({emit = true, ...opts}: ChangeEditorModeOptions): void {
        if (this.#editorMode === opts.mode) return;

        if (this.#beforeEditorModeChange?.({mode: opts.mode, reason: opts.reason}) === false) {
            return;
        }

        this.logger.event({
            event: 'mode-change',
            prevMode: this.#editorMode,
            nextMode: opts.mode,
            reason: opts.reason,
        });

        const previousMode = this.#editorMode;
        const previousMarkup = this.#markupState.markup;
        try {
            this.currentMode = opts.mode;
        } catch (error) {
            this.#editorMode = previousMode;
            this.#markupState.markup = previousMarkup;
            throw error;
        }

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
                this.#markupCore.moveCursorToLine(line);
                break;
            }
            case 'wysiwyg': {
                this.#wysiwygCore.moveCursorToLine(line);
                break;
            }
            default:
                throw new Error('Unknown editor mode: ' + mode);
        }
    }

    private shouldReplaceMarkupEditorValue(markupValue: string, wysiwygValue: string): boolean {
        const editor = this.#wysiwygCore.editor;
        const serializedEditorMarkup = editor?.serializer.serialize(
            editor.parser.parse(markupValue),
            this.#escapeConfig,
        );
        return serializedEditorMarkup?.trim() !== wysiwygValue.trim();
    }
}
