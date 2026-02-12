import type {Node} from '#pm/model';
import type {
    NodeView,
    NodeViewConstructor,
    NodeViewProps,
    NodeViewUpdateFn,
} from 'src/types/node-view';

import {CodeBlockNodeAttr, type LineNumbersOptions} from '../CodeBlockSpecs';

import {hasLineWrappingDecoration} from './plugins/codeBlockLineWrappingPlugin';
import {isLineNumbersVisible} from './utils';

/** @internal */
export type CodeBlockNodeViewOpts = {
    lineWrapping?: {enabled?: boolean};
    lineNumbers?: LineNumbersOptions;
};

/** @internal */
export class CodeBlockNodeView implements NodeView {
    static withOpts(opts: CodeBlockNodeViewOpts): NodeViewConstructor {
        return (node, view, getPos, decorations, innerDecorations) =>
            new this({node, view, getPos, decorations, innerDecorations}, opts);
    }

    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;

    private _lang: string | undefined;
    private readonly _codeElem: HTMLElement;
    private readonly _opts: CodeBlockNodeViewOpts;

    private _applyLineNumbersResult: ReturnType<typeof applyLineNumbers> | undefined;

    constructor({node, view, decorations}: NodeViewProps, opts: CodeBlockNodeViewOpts) {
        this._opts = opts;
        this._lang = node.attrs[CodeBlockNodeAttr.Lang];

        const document = view.dom.ownerDocument;

        this.dom = document.createElement('pre');
        updateDomAttribute(this.dom, CodeBlockNodeAttr.Line, node.attrs[CodeBlockNodeAttr.Line]);

        this._codeElem = document.createElement('code');
        this._codeElem.classList.add('hljs');

        if (this._lang) {
            this.dom.setAttribute(CodeBlockNodeAttr.Lang, this._lang);
            this._codeElem.classList.add(this._lang);
        }

        this.contentDOM = document.createElement('div');

        const hasLineWrapping = hasLineWrappingDecoration(decorations);
        if (this._opts.lineNumbers?.enabled && hasLineWrapping) {
            this._applyLineNumbersResult = applyLineNumbers(node, this._codeElem, true);
        }

        this._codeElem.append(this.contentDOM);
        this.dom.append(this._codeElem);
    }

    update: NodeViewUpdateFn = (node, decorations) => {
        const lang = node.attrs[CodeBlockNodeAttr.Lang];
        if (lang !== this._lang) {
            this._codeElem.className = 'hljs';
            updateDomAttribute(this.dom, CodeBlockNodeAttr.Lang, lang);
            if (lang) {
                this._codeElem.classList.add(lang);
            }
            this._lang = lang;
        }

        updateDomAttribute(this.dom, CodeBlockNodeAttr.Line, node.attrs[CodeBlockNodeAttr.Line]);

        const hasLineWrapping = hasLineWrappingDecoration(decorations);
        this._codeElem.classList.toggle('wrap', hasLineWrapping);

        if (this._opts.lineNumbers?.enabled) {
            this._applyLineNumbersResult = applyLineNumbers(
                node,
                this._codeElem,
                hasLineWrapping,
                this._applyLineNumbersResult?.container,
                this._applyLineNumbersResult?.lineCount,
            );
        }

        return true;
    };
}

function updateDomAttribute(elem: Element, attr: string, value: string | null | undefined) {
    if (value) {
        elem.setAttribute(attr, value);
    } else {
        elem.removeAttribute(attr);
    }
}

function applyLineNumbers(
    node: Node,
    code: HTMLElement,
    hasLineWrapping: boolean,
    prevContainer?: HTMLDivElement,
    prevLineCount = 0,
): {container?: HTMLDivElement; lineCount: number} {
    const document = code.ownerDocument;
    const showLineNumbers = isLineNumbersVisible(node);

    if (!showLineNumbers || !hasLineWrapping) {
        if (prevContainer) {
            code.removeChild(prevContainer);
            code.classList.remove('show-line-numbers');
        }
        return {container: undefined, lineCount: 0};
    }

    const lines = node.textContent ? node.textContent.split('\n') : [''];
    const currentLineCount = lines.length;

    let container = prevContainer;
    if (!container) {
        container = document.createElement('div');
        container.className = 'yfm-line-numbers';
        container.contentEditable = 'false';
        code.prepend(container);
    }

    code.classList.add('show-line-numbers');

    if (currentLineCount !== prevLineCount) {
        const maxDigits = String(currentLineCount).length;

        const lineNumberElement = document.createElement('div');
        lineNumberElement.classList.add('yfm-line-number', 'fake-line-number');
        lineNumberElement.textContent = ''.padStart(maxDigits, '0');
        container.replaceChildren(lineNumberElement);
    }

    return {container, lineCount: currentLineCount};
}
