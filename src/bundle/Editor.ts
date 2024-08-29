import type {ReactNode} from 'react';

import type {Extension as CodemirrorExtension} from '@codemirror/state';
import {EditorView as CMEditorView} from '@codemirror/view';
import {TextSelection} from 'prosemirror-state';
import {EditorView as PMEditorView} from 'prosemirror-view';

import {CommonEditor, MarkupString} from '../common';
import {ActionStorage, WysiwygEditor, WysiwygEditorOptions} from '../core';
import {ReactRenderStorage, RenderStorage} from '../extensions';
import {i18n} from '../i18n/bundle';
import {logger} from '../logger';
import {type CreateCodemirrorParams, createCodemirror} from '../markup/codemirror';
import type {YfmLangOptions} from '../markup/codemirror/yfm';
import {CodeEditor, Editor as MarkupEditor} from '../markup/editor';
import {Emitter, Receiver, SafeEventEmitter} from '../utils/event-emitter';
import type {FileUploadHandler} from '../utils/upload';

export type EditorMode = 'wysiwyg' | 'markup';
export type SplitMode = false | 'horizontal' | 'vertical';
export type EditorPreset = 'zero' | 'commonmark' | 'default' | 'yfm' | 'full';
export type RenderPreview = ({
    getValue,
    mode,
}: {
    getValue: () => MarkupString;
    mode: 'preview' | 'split';
}) => ReactNode;

export type ToolbarActionData = {
    editorMode: EditorMode;
    id: string;
    attrs?: {[key: string]: any};
};

export interface EventMap {
    change: null;
    cancel: null;
    submit: null;

    'toolbar-action': ToolbarActionData;

    'change-editor-mode': {mode: EditorMode};
    'change-toolbar-visibility': {visible: boolean};
    'change-split-mode-enabled': {splitModeEnabled: boolean};
}

// internal events
interface EventMapInt extends EventMap {
    rerender: null;
    'rerender-toolbar': null;
    'cm-scroll': {event: Event};
}

export interface Editor extends Receiver<EventMap>, CommonEditor {
    readonly currentMode: EditorMode;
    readonly toolbarVisible: boolean;

    setEditorMode(mode: EditorMode, opts?: SetEditorModeOptions): void;

    moveCursor(position: 'start' | 'end' | {line: number}): void;

    /** @internal used in demo for dev-tools */
    readonly _wysiwygView?: PMEditorView;
}

/** @internal */
export interface EditorInt
    extends CommonEditor,
        Emitter<EventMapInt>,
        Receiver<EventMapInt>,
        ActionStorage,
        CodeEditor {
    readonly currentMode: EditorMode;
    readonly toolbarVisible: boolean;
    readonly splitModeEnabled: boolean;
    readonly splitMode: SplitMode;
    readonly preset: EditorPreset;

    /** @internal used in demo for dev-tools */
    readonly _wysiwygView?: PMEditorView;

    readonly currentEditor: CommonEditor;
    readonly wysiwygEditor: WysiwygEditor;
    readonly markupEditor: MarkupEditor;

    readonly renderStorage: RenderStorage<ReactNode>;
    readonly fileUploadHandler?: FileUploadHandler;
    readonly needToSetDimensionsForUploadedImages: boolean;

    readonly renderPreview?: RenderPreview;

    changeEditorMode(opts: ChangeEditorModeOptions): void;

    setEditorMode(mode: EditorMode, opts?: SetEditorModeOptions): void;

    moveCursor(position: 'start' | 'end' | {line: number}): void;

    changeToolbarVisibility(opts: {visible: boolean}): void;

    changeSplitModeEnabled(opts: {splitModeEnabled: boolean}): void;

    destroy(): void;
}

type SetEditorModeOptions = Pick<ChangeEditorModeOptions, 'emit'>;

type ChangeEditorModeOptions = {
    mode: EditorMode;
    reason: 'error-boundary' | 'settings' | 'manually';
    emit?: boolean;
};

export type MarkupConfig = {
    /** Additional extensions for codemirror instance. */
    extensions?: CreateCodemirrorParams['extensions'];
    /** Can be used to disable some of the default extensions */
    disabledExtensions?: CreateCodemirrorParams['disabledExtensions'];
    /** Additional keymaps for codemirror instance */
    keymaps?: CreateCodemirrorParams['keymaps'];
    /**
     * Additional language data for markdown language in codemirror.
     * Can be used to configure additional autocompletions and others.
     * See more https://codemirror.net/docs/ref/#state.EditorState.languageDataAt
     */
    languageData?: YfmLangOptions['languageData'];
    /** Config for @codemirror/autocomplete https://codemirror.net/docs/ref/#autocomplete.autocompletion%5Econfig */
    autocompletion?: CreateCodemirrorParams['autocompletion'];
};

export type EscapeConfig = {
    commonEscape?: RegExp;
    startOfLineEscape?: RegExp;
};

export type EditorOptions = Pick<
    WysiwygEditorOptions,
    'allowHTML' | 'linkify' | 'linkifyTlds' | 'extensions'
> & {
    initialMarkup?: MarkupString;
    /** @default 'wysiwyg' */
    initialEditorMode?: EditorMode;
    /** @default true */
    initialToolbarVisible?: boolean;
    /** @default false
     * Has no effect if splitMode is false or undefined
     */
    initialSplitModeEnabled?: boolean;
    renderStorage: ReactRenderStorage;
    fileUploadHandler?: FileUploadHandler;
    /**
     * If we need to set dimensions for uploaded images
     *
     * @default false
     */
    needToSetDimensionsForUploadedImages?: boolean;
    /**
     * Called before switching from the markup editor to the wysiwyg editor.
     * You can use it to pre-process the value from the markup editor before it gets into the wysiwyg editor.
     */
    prepareRawMarkup?: (value: MarkupString) => MarkupString;
    experimental_beforeEditorModeChange?: (
        options: Pick<ChangeEditorModeOptions, 'mode' | 'reason'>,
    ) => boolean | undefined;
    splitMode?: SplitMode;
    renderPreview?: RenderPreview;
    preset: EditorPreset;
    /** @deprecated Put extra extensions via MarkdownEditorMarkupConfig */
    extraMarkupExtensions?: CodemirrorExtension[];
    markupConfig?: MarkupConfig;
    escapeConfig?: EscapeConfig;
};

/** @internal */
export class EditorImpl extends SafeEventEmitter<EventMapInt> implements EditorInt {
    #markup: MarkupString;
    #editorMode: EditorMode;
    #toolbarVisible: boolean;
    #splitModeEnabled: boolean;
    #splitMode: SplitMode;
    #renderPreview?: RenderPreview;
    #wysiwygEditor?: WysiwygEditor;
    #markupEditor?: MarkupEditor;
    #markupConfig: MarkupConfig;
    #escapeConfig?: EscapeConfig;

    readonly #preset: EditorPreset;
    #allowHTML?: boolean;
    #linkify?: boolean;
    #linkifyTlds?: string | string[];
    #extensions?: WysiwygEditorOptions['extensions'];
    #renderStorage: ReactRenderStorage;
    #fileUploadHandler?: FileUploadHandler;
    #needToSetDimensionsForUploadedImages: boolean;
    #prepareRawMarkup?: (value: MarkupString) => MarkupString;
    #beforeEditorModeChange?: (
        options: Pick<ChangeEditorModeOptions, 'mode' | 'reason'>,
    ) => boolean | undefined;

    get _wysiwygView(): PMEditorView {
        // @ts-expect-error internal typing
        return this.#wysiwygEditor?.view;
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

    get preset(): EditorPreset {
        return this.#preset;
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
        if (!this.#wysiwygEditor) {
            const mdPreset: NonNullable<WysiwygEditorOptions['mdPreset']> =
                this.#preset === 'zero' || this.#preset === 'commonmark' ? this.#preset : 'default';
            this.#wysiwygEditor = new WysiwygEditor({
                mdPreset,
                initialContent: this.#markup,
                extensions: this.#extensions,
                allowHTML: this.#allowHTML,
                linkify: this.#linkify,
                linkifyTlds: this.#linkifyTlds,
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
                    placeholderText: i18n('markup_placeholder'),
                    onCancel: () => this.emit('cancel', null),
                    onSubmit: () => this.emit('submit', null),
                    onChange: () => this.emit('rerender-toolbar', null),
                    onDocChange: () => this.emit('change', null),
                    onScroll: (event) => this.emit('cm-scroll', {event}),
                    reactRenderer: this.#renderStorage,
                    uploadHandler: this.fileUploadHandler,
                    needImgDimms: this.needToSetDimensionsForUploadedImages,
                    extensions: this.#markupConfig.extensions,
                    disabledExtensions: this.#markupConfig.disabledExtensions,
                    keymaps: this.#markupConfig.keymaps,
                    yfmLangOptions: {languageData: this.#markupConfig.languageData},
                    autocompletion: this.#markupConfig.autocompletion,
                    receiver: this,
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

    get needToSetDimensionsForUploadedImages(): boolean {
        return this.#needToSetDimensionsForUploadedImages;
    }

    constructor(opts: EditorOptions) {
        super({onError: logger.error.bind(logger)});
        this.#editorMode = opts.initialEditorMode ?? 'wysiwyg';
        this.#toolbarVisible = Boolean(opts.initialToolbarVisible);
        this.#splitMode = (opts.renderPreview && opts.splitMode) ?? false;
        this.#splitModeEnabled = (this.#splitMode && opts.initialSplitModeEnabled) ?? false;
        this.#renderPreview = opts.renderPreview;

        this.#markup = opts.initialMarkup ?? '';

        this.#preset = opts.preset ?? 'full';
        this.#linkify = opts.linkify;
        this.#linkifyTlds = opts.linkifyTlds;
        this.#allowHTML = opts.allowHTML;
        this.#extensions = opts.extensions;
        this.#markupConfig = {...opts.markupConfig};
        this.#markupConfig.extensions ??= opts.extraMarkupExtensions;

        this.#renderStorage = opts.renderStorage;
        this.#fileUploadHandler = opts.fileUploadHandler;
        this.#needToSetDimensionsForUploadedImages = Boolean(
            opts.needToSetDimensionsForUploadedImages,
        );
        this.#prepareRawMarkup = opts.prepareRawMarkup;
        this.#escapeConfig = opts.escapeConfig;
        this.#beforeEditorModeChange = opts.experimental_beforeEditorModeChange;
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

    destroy() {
        this.#wysiwygEditor?.destroy();
        this.#markupEditor?.codemirror.destroy();

        this.#markupEditor = undefined;
        this.#markupEditor = undefined;
        this.#wysiwygEditor = undefined;
    }

    setEditorMode(mode: EditorMode, opts?: SetEditorModeOptions): void {
        this.changeEditorMode({mode, reason: 'manually', emit: opts?.emit});
    }

    changeEditorMode({emit = true, ...opts}: ChangeEditorModeOptions): void {
        if (this.#editorMode === opts.mode) return;

        if (this.#beforeEditorModeChange?.({mode: opts.mode, reason: opts.reason}) === false) {
            return;
        }

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
                const view = this.markupEditor.cm;

                let cmLine = line + 1; // lines in codemirror is 1-based
                cmLine = Math.max(cmLine, 1);
                cmLine = Math.min(cmLine, view.state.doc.lines);

                const yMargin = getTopOffset();
                const anchor = view.state.doc.line(cmLine).from;
                view.dispatch({
                    scrollIntoView: true,
                    selection: {anchor},
                    effects: [
                        CMEditorView.scrollIntoView(anchor, {y: 'start', x: 'start', yMargin}),
                    ],
                });

                break;

                // eslint-disable-next-line no-inner-declarations
                function getTopOffset() {
                    const TOOLBAR_HEIGHT = 36; //px
                    const TOOLBAR_BOTTOM_OFFSET = 8; // px
                    const TOOLBAR_TOP_ADDITIONAL_OFFSET = 8; // px
                    const TOOLBAR_TOP_OFFSET_VAR = '--g-md-toolbar-sticky-offset';

                    const topOffsetValue = window
                        .getComputedStyle(view.dom)
                        .getPropertyValue(TOOLBAR_TOP_OFFSET_VAR);
                    const toolbarTopOffset =
                        calculateCSSNumberValue(topOffsetValue) + TOOLBAR_TOP_ADDITIONAL_OFFSET;

                    return toolbarTopOffset + TOOLBAR_HEIGHT + TOOLBAR_BOTTOM_OFFSET;
                }
            }
            case 'wysiwyg': {
                const node = this.wysiwygEditor.dom.querySelector(`[data-line="${line}"]`);

                if (node) {
                    const position = this._wysiwygView.posAtDOM(node, 0);

                    const {tr} = this._wysiwygView.state;

                    this._wysiwygView.dispatch(
                        tr.setSelection(TextSelection.create(tr.doc, position)).scrollIntoView(),
                    );
                }

                break;
            }
            default:
                throw new Error('Unknown editor mode: ' + mode);
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
