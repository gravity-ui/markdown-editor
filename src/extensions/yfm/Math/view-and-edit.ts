import {keydownHandler} from 'prosemirror-keymap';
import type {Node} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';
import {Decoration, DecorationSet, NodeView} from 'prosemirror-view';

import type {ReactRenderer, RendererItem} from '../../../extensions/behavior/ReactRenderer';
import {isTextSelection} from '../../../utils/selection';

import {handleArrowKey} from './commands';
import {CLASSNAMES, MathNode} from './const';
import {b, renderMathHint} from './hint';
import type {KatexOptions, RunOptions} from './types';

import './view-and-edit.scss';

const MATH_ACTIVE_DECO = 'math_active_decoration';

export type MathNodeViewOptions = Pick<RunOptions, 'sanitize'> & {
    katexOptions?: KatexOptions;
    loadRuntimeScript: () => void;
    reactRenderer: ReactRenderer;
};

export abstract class MathNodeView implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;

    protected node: Node;
    protected texContent: string;
    protected mathViewDOM: HTMLElement;
    protected mathHintContainerDOM: HTMLElement;

    protected hintRendererItem: RendererItem;
    protected readonly reactRenderer: ReactRenderer;
    protected readonly loadRuntimeScript: () => void;
    protected readonly katexRunOptions: RunOptions;

    protected hasActiveDeco = false;

    abstract createDOM(): Record<
        'dom' | 'contentDOM' | 'mathViewDOM' | 'mathHintContainerDOM',
        HTMLElement
    > & {hintRendererItem: RendererItem};
    abstract isDisplayMode(): boolean;

    constructor(node: Node, opts: MathNodeViewOptions) {
        this.node = node;
        this.texContent = this.getTexContent();
        this.katexRunOptions = {
            ...opts.katexOptions,
            sanitize: opts.sanitize,
        };

        this.reactRenderer = opts.reactRenderer;
        this.loadRuntimeScript = opts.loadRuntimeScript;

        const elems = this.createDOM();
        this.dom = elems.dom;
        this.contentDOM = elems.contentDOM;
        this.mathViewDOM = elems.mathViewDOM;
        this.mathHintContainerDOM = elems.mathHintContainerDOM;
        this.hintRendererItem = elems.hintRendererItem;

        window.latexJsonp ??= [];
        this.loadRuntimeScript();
        this.renderKatex();
    }

    update(node: Node, decos: readonly Decoration[]): boolean {
        if (this.node.type !== node.type) return false;
        this.node = node;

        const isActive = decos.some((deco) => deco.spec[MATH_ACTIVE_DECO]);
        if (isActive === this.hasActiveDeco) return true;

        if (!isActive) {
            const newTexContent = this.getTexContent();
            if (this.texContent !== newTexContent) {
                this.texContent = newTexContent;
                this.renderKatex();
            }
        }

        this.hasActiveDeco = isActive;

        return true;
    }

    ignoreMutation(mutation: MutationRecord): boolean {
        // @ts-expect-error
        if (mutation.type === 'selection' || mutation.type === 'attributes') return true;

        return (
            mutation.type === 'childList' &&
            (mutation.target === this.mathHintContainerDOM ||
                this.mathViewDOM.contains(mutation.target))
        );
    }

    destroy() {
        this.hintRendererItem.remove();
    }

    protected renderKatex() {
        const displayMode = this.isDisplayMode();
        const runOptions: RunOptions = {displayMode};

        const econtent = encodeURIComponent(this.texContent);
        const eoptions = encodeURIComponent(JSON.stringify(runOptions));

        const elem = document.createElement(displayMode ? 'p' : 'span');
        elem.classList.add('yfm-latex');
        elem.setAttribute('data-content', econtent);
        elem.setAttribute('data-options', eoptions);
        this.mathViewDOM.replaceChildren(elem);

        this.toggleErrorView(false);

        window.latexJsonp.push(async (api) => {
            try {
                await api.run({
                    ...this.katexRunOptions,
                    ...runOptions,
                    nodes: [elem],
                    throwOnError: true,
                });
            } catch (err) {
                const errorElem = document.createElement('span');
                errorElem.classList.add('math-error');
                errorElem.innerText = `(error) ${this.texContent}`;
                errorElem.title = String(err);
                this.mathViewDOM.replaceChildren(errorElem);
                this.toggleErrorView(true);
            }
        });
    }

    protected toggleErrorView(isError: boolean) {
        this.dom.classList.toggle('math-container-error', isError);
        this.mathViewDOM.classList.toggle('math-view-error', isError);
    }

    protected getTexContent() {
        return this.node.textContent;
    }
}

export class MathInlineNodeView extends MathNodeView {
    destroy() {
        this.hintRendererItem?.remove();
    }

    isDisplayMode(): boolean {
        return false;
    }

    createDOM() {
        const dom = document.createElement('span');
        dom.classList.add('math-container', 'math-inline-container');

        const mathViewDOM = document.createElement('span');
        mathViewDOM.classList.add('math-view', 'math-inline-view');
        mathViewDOM.contentEditable = 'false';

        const mathInlineDOM = this.createMathInlineDOM();

        const mathHintContainerDOM = document.createElement('div');
        mathHintContainerDOM.contentEditable = 'false';
        mathHintContainerDOM.classList.add(...b({view: 'inline'}).split(' '));

        dom.appendChild(mathViewDOM);
        dom.appendChild(mathInlineDOM.container);
        dom.appendChild(mathHintContainerDOM);

        const hintRendererItem = this.reactRenderer.createItem('math-inline-hint', () =>
            renderMathHint({offset: {left: 3, top: -1}}, mathHintContainerDOM),
        );

        return {
            dom,
            contentDOM: mathInlineDOM.content,
            mathViewDOM,
            mathHintContainerDOM,
            hintRendererItem,
        };
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

    createDOM() {
        const dom = document.createElement('div');
        dom.classList.add('math-container', 'math-block-container');

        const mathViewDOM = document.createElement('div');
        mathViewDOM.classList.add('math-view', 'math-block-view');
        mathViewDOM.contentEditable = 'false';

        const contentDOM = document.createElement('div');
        contentDOM.classList.add('math-block');

        const mathHintContainerDOM = document.createElement('div');
        mathHintContainerDOM.contentEditable = 'false';
        mathHintContainerDOM.classList.add(...b({view: 'block'}).split(' '));

        dom.appendChild(mathHintContainerDOM);
        dom.appendChild(mathViewDOM);
        dom.appendChild(contentDOM);

        const hintRendererItem = this.reactRenderer.createItem('math-block-hint', () =>
            renderMathHint({offset: {left: -3}}, mathHintContainerDOM),
        );

        return {dom, contentDOM, mathViewDOM, mathHintContainerDOM, hintRendererItem};
    }
}

export type MathViewAndEditPluginOptions = MathNodeViewOptions;

export const mathViewAndEditPlugin = (options: MathViewAndEditPluginOptions) =>
    new Plugin({
        props: {
            handleKeyDown: keydownHandler({
                ArrowRight: handleArrowKey('right'),
                ArrowLeft: handleArrowKey('left'),
            }),
            nodeViews: {
                [MathNode.Block]: (node) => new MathBlockNodeView(node, options),
                [MathNode.Inline]: (node) => new MathInlineNodeView(node, options),
            },
            decorations: (state) => {
                const {selection} = state;
                if (isTextSelection(selection)) {
                    const decorations: Decoration[] = [];
                    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                        const typeName = node.type.name;
                        if (typeName === MathNode.Inline || typeName === MathNode.Block) {
                            decorations.push(
                                Decoration.node(
                                    pos,
                                    pos + node.nodeSize,
                                    {
                                        class: 'math-active',
                                    },
                                    {[MATH_ACTIVE_DECO]: true},
                                ),
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
