import {Popup, PopupPlacement, PopupProps} from '@gravity-ui/uikit';
import {keydownHandler} from 'prosemirror-keymap';
import type {Node} from 'prosemirror-model';
import {EditorState, Plugin, PluginView, TextSelection} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findChildrenByMark, findParentNode} from 'prosemirror-utils';
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view';

import {ExtensionDeps} from '../../../../../core';
import {ErrorLoggerBoundary} from '../../../../../react-utils/ErrorBoundary';
import {findMark, isMarkActive} from '../../../../../utils/marks';
import {RendererItem, getReactRendererFromState} from '../../../../behavior/ReactRenderer';
import {LinkAttr, linkType, normalizeUrlFactory} from '../../../index';

import {LinkForm} from './TooltipView';

const className = 'pm-link-focus-deco';
const placement: PopupPlacement = ['bottom-start', 'bottom-end', 'top-start', 'top-end'];

function getTextNode(state: EditorState) {
    if (
        !(state.selection instanceof TextSelection) ||
        !state.selection.empty ||
        !isMarkActive(state, linkType(state.schema))
    )
        return null;

    const parent = findParentNode(Boolean)(state.selection);

    if (!parent) {
        return null;
    }

    const textNodes = findChildrenByMark(parent?.node, linkType(state.schema));

    const textNode = textNodes.find((n: {node: Node; pos: number}) => {
        const start = n.pos + parent.pos;
        const end = start + n.node.nodeSize;
        return start <= state.selection.from && end >= state.selection.from;
    })!;

    if (!textNode) return null;

    const absolutePos = textNode.pos + parent.pos + 1;

    return {
        ...textNode,
        absolutePos,
        parent,
        from: absolutePos,
        to: absolutePos + textNode.node.nodeSize,
    };
}

export const linkTooltipPlugin = (deps: ExtensionDeps) => {
    let viewTooltip: SelectionTooltip | null = null;
    return new Plugin({
        view(view) {
            viewTooltip = new SelectionTooltip(view, deps);
            return viewTooltip;
        },
        props: {
            handleKeyDown: keydownHandler({
                Escape: () => viewTooltip?.onEscapeDown() ?? false,
            }),
            decorations(state) {
                const textNode = getTextNode(state);
                if (!textNode) return DecorationSet.empty;

                const {from, to} = textNode;
                return DecorationSet.create(state.doc, [
                    Decoration.inline(from, to, {
                        class: `pm-node-selected ${className}`,
                    }),
                ]);
            },
        },
    });
};

class SelectionTooltip implements PluginView {
    private normalizeUrl;

    private view: EditorView;

    private textNode?: ReturnType<typeof getTextNode>;
    private textNodeRef: HTMLElement | undefined;

    private isTooltipOpen = false;
    private manualHidden = false;

    private renderItem?: RendererItem;
    private selectionTooltipProps: SelectionTooltipViewBaseProps = {show: false};

    constructor(view: EditorView, deps: ExtensionDeps) {
        this.normalizeUrl = normalizeUrlFactory(deps);

        this.view = view;

        this.update(view, null);
    }

    update(view: EditorView, prevState?: EditorState | null) {
        if (!view.dom.parentNode) {
            this.hideTooltip();
            return;
        }

        const {state} = view;

        if (prevState && prevState.doc.eq(state.doc) && prevState.selection.eq(state.selection))
            return;

        const prevTextNode = this.textNode;
        this.textNode = getTextNode(view.state);

        const prevRef = this.textNodeRef;
        this.updateTextNodeRef();

        if (!this.textNode || !this.textNodeRef) {
            this.removePlaceholderLink(prevTextNode);
            this.hideTooltip();
            return;
        }

        if (prevRef !== this.textNodeRef) {
            this.manualHidden = false;
        }

        if (this.manualHidden) {
            this.hideTooltip();
        } else {
            this.renderTooltip({
                show: true,
                domElem: this.textNodeRef,
                onCancel: () => this.cancelPopup(),
                attrs: this.getMarkAttrs(),
                onChange: this.changeAttrs.bind(this),
                onOutsideClick: this.onOutisdeClick,
            });
        }
    }

    destroy() {
        this.isTooltipOpen = false;
        this.selectionTooltipProps = {show: false};
        this.renderItem?.remove();
        this.renderItem = undefined;
    }

    onEscapeDown(): boolean {
        if (this.isTooltipOpen) {
            this.removePlaceholderLink(this.textNode);
            this.manualHidden = true;
            this.hideTooltip();
            return true;
        }

        return false;
    }

    private updateTextNodeRef() {
        const decoElem = this.view.dom.getElementsByClassName(className)[0];
        this.textNodeRef = decoElem as HTMLElement | undefined;
    }

    private getMarkAttrs() {
        const {textNode} = this;
        const linkMark = textNode && findMark(textNode.node, linkType(this.view.state.schema));
        return linkMark?.attrs;
    }

    private hideTooltip() {
        this.renderTooltip({show: false});
    }

    private renderTooltip(props: SelectionTooltipViewBaseProps) {
        this.isTooltipOpen = props.show;
        this.selectionTooltipProps = props;
        this.renderItem = this.renderItem ?? this.createRenderItem();
        this.renderItem.rerender();
    }

    private onOutisdeClick = () => {
        // after all updates of the editor state
        setTimeout(() => {
            if (!this.view.hasFocus()) {
                this.removePlaceholderLink(this.textNode);
                this.hideTooltip();
                this.manualHidden = false;
            }
        });
    };

    private cancelPopup() {
        this.removePlaceholderLink(this.textNode, {returnSelection: true});
        this.manualHidden = true;
        this.hideTooltip();
        this.view.focus();
    }

    private removePlaceholderLink(
        textNode?: ReturnType<typeof getTextNode>,
        opts?: {returnSelection?: boolean},
    ) {
        if (textNode) {
            const {view} = this;
            const {state} = view;
            const attrs = findMark(textNode.node, linkType(state.schema))?.attrs;
            if (attrs?.[LinkAttr.IsPlaceholder]) {
                const {from, to} = textNode;
                let tr = state.tr.removeMark(from, to, linkType(state.schema));
                if (opts?.returnSelection) {
                    tr = tr.setSelection(TextSelection.create(tr.doc, from, to));
                }
                view.dispatch(tr);
            }
        }
    }

    private changeAttrs({href}: {href: string}) {
        const {view, textNode} = this;
        if (!textNode) return;

        const normalizeResult = this.normalizeUrl(href);
        if (normalizeResult) {
            const {url} = normalizeResult;
            const {from, to} = textNode;
            view.dispatch(
                view.state.tr.addMark(from, to, linkType(view.state.schema).create({href: url})),
            );

            setTimeout(this.cancelPopup.bind(this));
        }
    }

    private createRenderItem() {
        return getReactRendererFromState(this.view.state).createItem('link-tooltip', () => (
            <ErrorLoggerBoundary>
                <SelectionTooltipView {...this.selectionTooltipProps} />
            </ErrorLoggerBoundary>
        ));
    }
}
type SelectionTooltipViewBaseProps<T = boolean> = T extends false
    ? {
          show: T;
      }
    : {
          show: T;
          domElem: HTMLElement;
          onCancel: () => void;
          onChange: (opts: {href: string}) => void;
          attrs?: {[LinkAttr.Href]?: string; [LinkAttr.IsPlaceholder]?: boolean};
      } & Pick<PopupProps, 'onOutsideClick'>;

type SelectionTooltipViewProps = SelectionTooltipViewBaseProps;

const SelectionTooltipView: React.FC<SelectionTooltipViewProps> = (props) => {
    const {show} = props;

    if (!show) return null;

    const {domElem, onChange, onCancel, onOutsideClick, attrs = {}} = props;
    const href = attrs[LinkAttr.Href];
    const autoFocus = attrs[LinkAttr.IsPlaceholder];

    return (
        <Popup
            key={href}
            open
            anchorRef={{current: domElem}}
            placement={placement}
            onEscapeKeyDown={onCancel}
            onOutsideClick={onOutsideClick}
        >
            <LinkForm
                href={href ?? ''}
                autoFocus={autoFocus}
                onChange={onChange}
                onCancel={onCancel}
            />
        </Popup>
    );
};
