import type {ReactNode} from 'react';

import CodeMirror from 'codemirror';
import {TextSelection} from 'prosemirror-state';
import {EditorView as PMEditorView} from 'prosemirror-view';

import {CommonEditor, MarkupString} from '../common';
import {
    ActionStorage,
    YfmEditorImpl as WysiwygEditor,
    YfmEditorOptions as WysiwygOptions,
} from '../core';
import {ReactRenderStorage, RenderStorage} from '../extensions';
import {i18n} from '../i18n/bundle';
import {logger} from '../logger';
import {CodeEditor, MarkupEditor} from '../markup/editor';
import {Action as A, formatter as f} from '../shortcuts';
import {DataTransferType, isFilesFromHtml, isFilesOnly} from '../utils/clipboard';
import {Emitter, Receiver, SafeEventEmitter} from '../utils/event-emitter';
import type {FileUploadHandler} from '../utils/upload';

import {config as cmBaseConfig} from './cm-config';
import {CMFilesUploadManager, CMFilesUploader} from './cm-upload';

export type EditorType = 'wysiwyg' | 'markup';
export type SplitMode = false | 'horizontal' | 'vertical';
export type RenderPreview = ({
    getValue,
    mode,
}: {
    getValue: () => MarkupString;
    mode: 'preview' | 'split';
}) => ReactNode;

const PAIRING_CHARS = new Map([
    ['(', ')'],
    ['{', '}'],
    ['[', ']'],
    ['<', '>'],

    ['*', '*'],
    ['~', '~'],

    ['"', '"'],
    ["'", "'"],
    ['`', '`'],
]);

interface EventMap {
    change: null;
    cancel: null;
    submit: null;

    'toolbar-action': {
        editorType: EditorType;
        id: string;
        attrs?: {[key: string]: any};
    };

    'change-editor-type': {type: EditorType};
    'change-toolbar-visibility': {visible: boolean};
    'change-split-mode-enabled': {splitModeEnabled: boolean};
}

// internal events
interface EventMapInt extends EventMap {
    rerender: null;
    'rerender-toolbar': null;
}

export interface Editor extends Receiver<EventMap>, CommonEditor {
    readonly currentType: EditorType;
    readonly toolbarVisible: boolean;

    setEditorType(type: EditorType): void;

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
    readonly currentType: EditorType;
    readonly toolbarVisible: boolean;
    readonly splitModeEnabled: boolean;
    readonly splitMode: SplitMode;

    /** @internal used in demo for dev-tools */
    readonly _wysiwygView?: PMEditorView;

    readonly currentEditor: CommonEditor;
    readonly wysiwygEditor: WysiwygEditor;
    readonly markupEditor: MarkupEditor;

    readonly renderStorage: RenderStorage<ReactNode>;
    readonly fileUploadHandler?: FileUploadHandler;
    readonly needToSetDimensionsForUploadedImages: boolean;

    readonly renderPreview?: RenderPreview;

    changeEditorType(opts: ChangeEditorTypeOptions): void;

    setEditorType(type: EditorType): void;

    moveCursor(position: 'start' | 'end' | {line: number}): void;

    changeToolbarVisibility(opts: {visible: boolean}): void;

    changeSplitModeEnabled(opts: {splitModeEnabled: boolean}): void;

    destroy(): void;
}

/** @internal */
type ChangeEditorTypeOptions = {
    type: EditorType;
    reason: 'error-boundary' | 'settings' | 'manually';
};

export type EditorOptions = Pick<
    WysiwygOptions,
    'allowHTML' | 'linkify' | 'linkifyTlds' | 'attrs' | 'extensions'
> & {
    initialMarkup?: MarkupString;
    /** @default 'wysiwyg' */
    initialEditorType?: EditorType;
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
    splitMode?: SplitMode;
    renderPreview?: RenderPreview;
};

/** @internal */
export class EditorImpl extends SafeEventEmitter<EventMapInt> implements EditorInt {
    #markup: MarkupString;
    #editorType: EditorType;
    #toolbarVisible: boolean;
    #splitModeEnabled: boolean;
    #splitMode: SplitMode;
    #renderPreview?: RenderPreview;
    #wysiwygEditor?: WysiwygEditor;
    #markupEditor?: MarkupEditor;

    #allowHTML?: boolean;
    #linkify?: boolean;
    #linkifyTlds?: string | string[];
    #attrs?: WysiwygOptions['attrs'];
    #extensions?: WysiwygOptions['extensions'];
    #renderStorage: ReactRenderStorage;
    #fileUploadHandler?: FileUploadHandler;
    #needToSetDimensionsForUploadedImages: boolean;
    #prepareRawMarkup?: (value: MarkupString) => MarkupString;

    #cmFilesUploader?: CMFilesUploader;

    get _wysiwygView(): PMEditorView {
        // @ts-expect-error internal typing
        return this.#wysiwygEditor?.view;
    }

    get currentType(): EditorType {
        return this.#editorType;
    }

    private set currentType(newType: EditorType) {
        switch (newType) {
            case 'markup': {
                this.#editorType = newType;
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
                this.#editorType = newType;
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
                throw new Error('Unknown editor type: ' + newType);
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

    get renderPreview(): RenderPreview | undefined {
        return this.#renderPreview;
    }

    get currentEditor(): CommonEditor {
        const type = this.currentType;
        switch (type) {
            case 'markup':
                return this.markupEditor;
            case 'wysiwyg':
                return this.wysiwygEditor;
            default:
                throw new Error('Unknown editor type: ' + type);
        }
    }

    get wysiwygEditor(): WysiwygEditor {
        if (!this.#wysiwygEditor) {
            this.#wysiwygEditor = new WysiwygEditor({
                initialContent: this.#markup,
                extensions: this.#extensions,
                allowHTML: this.#allowHTML,
                linkify: this.#linkify,
                linkifyTlds: this.#linkifyTlds,
                attrs: this.#attrs,
                onChange: () => this.emit('rerender-toolbar', null),
                onDocChange: () => this.emit('change', null),
            });
        }
        return this.#wysiwygEditor;
    }

    get markupEditor(): MarkupEditor {
        if (!this.#markupEditor) {
            const config: CodeMirror.EditorConfiguration = {
                ...cmBaseConfig,
                placeholder: i18n('markup_placeholder'),
                extraKeys: {
                    ...(cmBaseConfig.extraKeys as {}),
                    [f.toCM(A.Cancel)!]: () => {
                        this.emit('cancel', null);
                    },
                    [f.toCM(A.Submit)!]: () => {
                        this.emit('submit', null);
                    },
                },
            };
            this.#markupEditor = new MarkupEditor(
                CodeMirror(() => {}, {value: this.#markup, ...config}),
            );
            this.#markupEditor.codemirror.on('changes', this.onCMChanges);
            this.#markupEditor.codemirror.on('cursorActivity', this.onCMCursorActivity);
            this.#markupEditor.codemirror.on('paste', this.onCMPaste);
            this.#markupEditor.codemirror.on('beforeChange', this.onCMBeforeChange);

            if (this.#fileUploadHandler) {
                this.#cmFilesUploader = new CMFilesUploadManager({
                    cm: this.cm,
                    reactRenderer: this.#renderStorage,
                    uploadHandler: this.#fileUploadHandler,
                    needDimmensionsForImages: this.needToSetDimensionsForUploadedImages,
                });
            }
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
        this.#editorType = (opts.initialEditorType as EditorType) ?? 'wysiwyg';
        this.#toolbarVisible = Boolean(opts.initialToolbarVisible);
        this.#splitMode = (opts.renderPreview && opts.splitMode) ?? false;
        this.#splitModeEnabled = (this.#splitMode && opts.initialSplitModeEnabled) ?? false;
        this.#renderPreview = opts.renderPreview;

        this.#markup = opts.initialMarkup ?? '';

        this.#attrs = opts.attrs;
        this.#linkify = opts.linkify;
        this.#linkifyTlds = opts.linkifyTlds;
        this.#allowHTML = opts.allowHTML;
        this.#extensions = opts.extensions;

        this.#renderStorage = opts.renderStorage;
        this.#fileUploadHandler = opts.fileUploadHandler;
        this.#needToSetDimensionsForUploadedImages = Boolean(
            opts.needToSetDimensionsForUploadedImages,
        );
        this.#prepareRawMarkup = opts.prepareRawMarkup;
    }

    // ---> implements CodeEditor
    get cm() {
        return this.markupEditor.cm;
    }

    // <--- implements CodeEditor

    // ---> implements ActionStorage
    get actions(): YfmEditor.Actions {
        return this.wysiwygEditor.actions;
    }

    action<T extends keyof YfmEditor.Actions>(actionName: T): YfmEditor.Actions[T] {
        return this.wysiwygEditor.action(actionName);
    }

    // <--- implements ActionStorage

    destroy() {
        if (this.#markupEditor) {
            this.#markupEditor.codemirror.off('changes', this.onCMChanges);
            this.#markupEditor.codemirror.off('cursorActivity', this.onCMCursorActivity);
            this.#markupEditor.codemirror.off('paste', this.onCMPaste);
            this.#markupEditor.codemirror.off('beforeChange', this.onCMBeforeChange);
            this.#markupEditor.codemirror.getWrapperElement().remove();
        }

        this.#wysiwygEditor?.destroy();

        this.#markupEditor = undefined;
        this.#wysiwygEditor = undefined;

        this.#cmFilesUploader?.destroy();
        this.#cmFilesUploader = undefined;
    }

    setEditorType(type: EditorType): void {
        this.changeEditorType({type, reason: 'manually'});
    }

    changeEditorType(opts: ChangeEditorTypeOptions): void {
        if (this.#editorType === opts.type) return;
        this.currentType = opts.type;
        this.emit('rerender', null);
        if (opts.reason !== 'error-boundary') {
            this.emit('change-editor-type', opts);
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

    moveCursor(position: 'start' | 'end' | {line: number}): void {
        if (typeof position === 'object') {
            return this.moveCursorToLine(position.line);
        }

        return this.currentEditor.moveCursor(position);
    }

    private moveCursorToLine(line: number): void {
        const type = this.currentType;

        switch (type) {
            case 'markup': {
                this.cm.setCursor(line, 0, {scroll: true});
                break;
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
                throw new Error('Unknown editor type: ' + type);
        }
    }

    private onCMCursorActivity = () => {
        this.emit('rerender-toolbar', null);
    };

    private onCMChanges = () => {
        this.emit('change', null);
    };

    private onCMPaste = (cm: CodeMirror.Editor, event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        const {clipboardData} = event;

        const fromWysiwyg = clipboardData.types.includes(DataTransferType.Yfm);
        if (fromWysiwyg) {
            const markup = clipboardData.getData(DataTransferType.Yfm);
            cm.replaceSelection(markup);
            event.preventDefault();
            return;
        }

        if (clipboardData.files.length) {
            this.#cmFilesUploader?.upload(clipboardData.files);
        }

        if (isFilesOnly(clipboardData) || isFilesFromHtml(clipboardData)) {
            event.preventDefault();
        }
    };

    private onCMBeforeChange = (
        _cm: CodeMirror.Editor,
        event: CodeMirror.EditorChangeCancellable,
    ) => {
        const {text, to, from, cancel} = event;
        const selection = this.cm.getSelection();
        const sameLine = from.line === to.line;
        const newLine = selection.endsWith('\n');

        if (
            !PAIRING_CHARS.has(text[0]) ||
            event.origin !== '+input' ||
            selection.trim().length <= 0
        )
            return;

        cancel();

        const replacement =
            text[0] +
            // If there was a line break at the end, remove it and place it behind the closing paired character
            (newLine ? selection.replace(/\n+$/, '') : selection) +
            PAIRING_CHARS.get(text[0]) +
            (newLine ? '\n' : '');

        this.cm.replaceSelection(replacement);

        // If paired characters were inserted on the same line, then 2 characters will be added
        // if not, then one closing.
        let ch = sameLine ? to.ch + 2 : to.ch + 1;
        if (to.ch === 0) ch = 0;

        this.cm.addSelection(from, {
            line: to.line,
            ch,
        });
    };

    private shouldReplaceMarkupEditorValue(markupValue: string, wysiwygValue: string) {
        const serializedEditorMarkup = this.#wysiwygEditor?.serializer.serialize(
            this.#wysiwygEditor.parser.parse(markupValue),
        );
        return serializedEditorMarkup?.trim() !== wysiwygValue.trim();
    }
}
