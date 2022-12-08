import katex from 'katex';
import {Plugin} from 'prosemirror-state';
import type {Node} from 'prosemirror-model';
import {keydownHandler} from 'prosemirror-keymap';
import {Decoration, DecorationSet, NodeView} from 'prosemirror-view';
import {isTextSelection} from '../../../utils/selection';
import {moveCursorToEndOfMathInline} from './commands';
import {CLASSNAMES, MathNode} from './const';

import 'katex/dist/katex.min.css';
import './view-and-edit.scss';

export abstract class MathNodeView implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;
    protected node: Node;
    protected texContent: string;
    protected mathViewDOM: HTMLElement;

    abstract createDOM(): Record<'dom' | 'contentDOM' | 'mathViewDOM', HTMLElement>;
    abstract isDisplayMode(): boolean;

    constructor(node: Node) {
        this.node = node;
        this.texContent = this.getTexContent();
        const elems = this.createDOM();
        this.dom = elems.dom;
        this.contentDOM = elems.contentDOM;
        this.mathViewDOM = elems.mathViewDOM;
        this.renderKatex();
    }

    update(node: Node): boolean {
        if (this.node.type !== node.type) return false;
        this.node = node;
        const newTexContent = this.getTexContent();
        if (this.texContent !== newTexContent) {
            this.texContent = newTexContent;
            this.renderKatex();
        }
        return true;
    }

    protected renderKatex() {
        try {
            katex.render(this.texContent, this.mathViewDOM, {
                throwOnError: false,
                displayMode: this.isDisplayMode(),
            });
        } catch (err) {
            const errorElem = document.createElement('span');
            errorElem.classList.add('math-error');
            errorElem.innerText = `(error) ${this.texContent}`;
            errorElem.title = String(err);
            this.mathViewDOM.appendChild(errorElem);
        }
    }

    protected getTexContent() {
        return this.node.textContent;
    }
}

export class MathInlineNodeView extends MathNodeView {
    isDisplayMode(): boolean {
        return false;
    }

    createDOM(): Record<'dom' | 'contentDOM' | 'mathViewDOM', HTMLElement> {
        const dom = document.createElement('span');
        dom.classList.add('math-container', 'math-inline-container');

        const mathViewDOM = document.createElement('span');
        mathViewDOM.classList.add('math-view', 'math-inline-view');
        mathViewDOM.contentEditable = 'false';

        const mathInlineDOM = this.createMathInlineDOM();

        dom.appendChild(mathViewDOM);
        dom.appendChild(mathInlineDOM.container);

        return {dom, contentDOM: mathInlineDOM.content, mathViewDOM};
    }

    // same as math-inline spec toDOM()
    protected createMathInlineDOM() {
        const container = document.createElement('span');
        container.classList.add(CLASSNAMES.Inline.Container);

        const sharpBefore = document.createElement('span');
        sharpBefore.classList.add(CLASSNAMES.Inline.Sharp);
        sharpBefore.contentEditable = 'false';
        sharpBefore.textContent = '$';

        const sharpAfter = sharpBefore.cloneNode(true);

        const content = document.createElement('span');
        content.classList.add(CLASSNAMES.Inline.Content);

        container.replaceChildren(sharpBefore, content, sharpAfter);

        return {container, content};
    }
}

export class MathBlockNodeView extends MathNodeView {
    isDisplayMode(): boolean {
        return true;
    }

    createDOM(): Record<'dom' | 'contentDOM' | 'mathViewDOM', HTMLElement> {
        const dom = document.createElement('div');
        dom.classList.add('math-container', 'math-block-container');

        const mathViewDOM = document.createElement('div');
        mathViewDOM.classList.add('math-view', 'math-block-view');
        mathViewDOM.contentEditable = 'false';

        const contentDOM = document.createElement('div');
        contentDOM.classList.add('math-block');

        dom.appendChild(mathViewDOM);
        dom.appendChild(contentDOM);

        return {dom, contentDOM, mathViewDOM};
    }
}

export const mathViewAndEditPlugin = () =>
    new Plugin({
        props: {
            nodeViews: {
                [MathNode.Block]: (node) => new MathBlockNodeView(node),
                [MathNode.Inline]: (node) => new MathInlineNodeView(node),
            },
            handleKeyDown: keydownHandler({
                ArrowLeft: moveCursorToEndOfMathInline,
            }),
            decorations: (state) => {
                const {selection} = state;
                if (isTextSelection(selection)) {
                    const decorations: Decoration[] = [];
                    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                        const typeName = node.type.name;
                        if (typeName === MathNode.Inline || typeName === MathNode.Block) {
                            decorations.push(
                                Decoration.node(pos, pos + node.nodeSize, {
                                    class: 'math-active',
                                }),
                            );
                        }
                    });
                    if (decorations.length) {
                        return DecorationSet.create(state.doc, decorations);
                    }
                }
                return DecorationSet.empty;
            },
        },
    });
