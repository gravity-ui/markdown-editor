import type {ReactNode} from 'react';

import {EditorView as CMEditorView} from '@codemirror/view';
import {TextSelection} from 'prosemirror-state';
import {EditorView as PMEditorView} from 'prosemirror-view';

import type {CommonEditor, MarkupString} from '../common';
import {
    type ActionStorage,
    type EscapeConfig,
    WysiwygEditor,
    type WysiwygEditorOptions,
} from '../core';
import {ReactRenderStorage, type RenderStorage} from '../extensions';
import {i18n} from '../i18n/bundle';
import {logger} from '../logger';
import {createCodemirror} from '../markup';
import {type CodeEditor, Editor as MarkupEditor} from '../markup/editor';
import {type Emitter, FileUploadHandler, type Receiver, SafeEventEmitter} from '../utils';
import type {DirectiveSyntaxContext} from '../utils/directive';

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
    readonly mdOptions: Readonly<MarkdownEditorMdOptions>;
    readonly directiveSyntax: DirectiveSyntaxContext;

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

    destroy(): void;
}

type SetEditorModeOptions = Pick<ChangeEditorModeOptions, 'emit'>;

export type ChangeEditorModeOptions = {
    mode: EditorMode;
    reason: 'error-boundary' | 'settings' | 'manually';
    emit?: boolean;
};

export type EditorOptions = Pick<
    MarkdownEditorOptions,
    'md' | 'initial' | 'handlers' | 'experimental' | 'markupConfig' | 'wysiwygConfig'
> & {
    renderStorage: ReactRenderStorage;
    preset: EditorPreset;
    directiveSyntax: DirectiveSyntaxContext;
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
    #mdOptions: Readonly<MarkdownEditorMdOptions>;

    readonly #preset: EditorPreset;
    #extensions?: WysiwygEditorOptions['extensions'];
    #renderStorage: ReactRenderStorage;
    #fileUploadHandler?: FileUploadHandler;
    #parseInsertedUrlAsImage?: ParseInsertedUrlAsImage;
    #needToSetDimensionsForUploadedImages: boolean;
    #disableHTMLParsingInMd = false;
    #enableNewImageSizeCalculation: boolean;
    #directiveSyntax: DirectiveSyntaxContext;
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
        if (!this.#wysiwygEditor) {
            const mdPreset: NonNullable<WysiwygEditorOptions['mdPreset']> =
                this.#preset === 'zero' || this.#preset === 'commonmark' ? this.#preset : 'default';
            this.#wysiwygEditor = new WysiwygEditor({
                mdPreset,
                initialContent: this.#markup,
                extensions: this.#extensions,
                allowHTML: this.#mdOptions.html,
                linkify: this.#mdOptions.linkify,
                linkifyTlds: this.#mdOptions.linkifyTlds,
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
                    disableHTMLParsingInMd: this.disableHTMLParsingInMd,
                    enableNewImageSizeCalculation: this.enableNewImageSizeCalculation,
                    extensions: this.#markupConfig.extensions,
                    disabledExtensions: this.#markupConfig.disabledExtensions,
                    keymaps: this.#markupConfig.keymaps,
                    yfmLangOptions: {languageData: this.#markupConfig.languageData},
                    autocompletion: this.#markupConfig.autocompletion,
                    directiveSyntax: this.directiveSyntax,
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

    get parseInsertedUrlAsImage() {
        return this.#parseInsertedUrlAsImage;
    }

    get needToSetDimensionsForUploadedImages(): boolean {
        return this.#needToSetDimensionsForUploadedImages;
    }

    get disableHTMLParsingInMd(): boolean {
        return this.#disableHTMLParsingInMd;
    }

    get enableNewImageSizeCalculation(): boolean {
        return this.#enableNewImageSizeCalculation;
    }

    constructor(opts: EditorOptions) {
        super({onError: logger.error.bind(logger)});

        const {
            md = {},
            initial = {},
            handlers = {},
            experimental = {},
            markupConfig = {},
            wysiwygConfig = {},
        } = opts;

        this.#editorMode = initial.mode ?? 'wysiwyg';
        this.#toolbarVisible = initial.toolbarVisible ?? true;
        this.#splitMode = (markupConfig.renderPreview && markupConfig.splitMode) ?? false;
        this.#splitModeEnabled = (this.#splitMode && initial.splitModeEnabled) ?? false;
        this.#renderPreview = markupConfig.renderPreview;

        this.#markup = initial.markup ?? '';

        this.#preset = opts.preset ?? 'full';
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
        this.#disableHTMLParsingInMd = Boolean(experimental.disableHTMLParsingInMd);
        this.#enableNewImageSizeCalculation = Boolean(experimental.enableNewImageSizeCalculation);
        this.#prepareRawMarkup = experimental.prepareRawMarkup;
        this.#escapeConfig = wysiwygConfig.escapeConfig;
        this.#beforeEditorModeChange = experimental.beforeEditorModeChange;
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

                const yMargin = getTopOffset(view.dom);
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
            }
            case 'wysiwyg': {
                const elem = this.wysiwygEditor.dom.querySelector(`[data-line="${line}"]`);

                if (elem) {
                    const elemTop = elem.getBoundingClientRect().top;
                    const topOffset = getTopOffset(this.wysiwygEditor.dom);
                    window.scrollTo({top: elemTop + window.scrollY - topOffset});

                    const position = this._wysiwygView.posAtDOM(elem, 0);
                    const {tr} = this._wysiwygView.state;
                    this._wysiwygView.dispatch(
                        tr.setSelection(TextSelection.create(tr.doc, position)),
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
