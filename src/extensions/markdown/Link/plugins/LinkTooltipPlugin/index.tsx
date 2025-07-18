import {Popup, type PopupPlacement, type PopupProps} from '@gravity-ui/uikit';
import {keydownHandler} from 'prosemirror-keymap';
import type {Node} from 'prosemirror-model';
import {type EditorState, Plugin, type PluginView, TextSelection} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findChildrenByMark, findParentNode} from 'prosemirror-utils';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

import type {ExtensionDeps} from '../../../../../core';
import {ErrorLoggerBoundary} from '../../../../../react-utils/ErrorBoundary';
import {findMark, isMarkActive} from '../../../../../utils/marks';
import {type RendererItem, getReactRendererFromState} from '../../../../behavior/ReactRenderer';
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
    private show: boolean;

    private textNode?: ReturnType<typeof getTextNode>;
    private textNodeRef: HTMLElement | undefined;

    private manualHidden = false;

    private renderItem?: RendererItem;

    constructor(view: EditorView, deps: ExtensionDeps) {
        this.normalizeUrl = normalizeUrlFactory(deps);

        this.view = view;
        this.show = false;

        this.update(view);
    }

    update(view: EditorView) {
        if (!view.dom.parentNode) {
            this.hideTooltip();
            return;
        }

        const {state} = view;

        this.textNode = getTextNode(state);

        const prevRef = this.textNodeRef;
        this.textNodeRef = this.view.dom.getElementsByClassName(className)[0] as
            | HTMLElement
            | undefined;

        if (prevRef !== this.textNodeRef) {
            this.manualHidden = false;
        }

        if (this.manualHidden || !this.textNode || !this.textNodeRef) {
            this.hideTooltip();
            return;
        }

        this.showTooltip();
    }

    destroy() {
        this.show = false;
        this.renderItem?.remove();
        this.renderItem = undefined;
    }

    onEscapeDown(): boolean {
        if (this.show) {
            this.removePlaceholderLink(this.textNode);
            this.manualHidden = true;
            this.hideTooltip();
            return true;
        }

        return false;
    }

    private getMarkAttrs() {
        const {textNode} = this;
        const linkMark = textNode && findMark(textNode.node, linkType(this.view.state.schema));
        return linkMark?.attrs;
    }

    private renderTooltip() {
        this.renderItem = this.renderItem ?? this.createRenderItem();
        this.renderItem.rerender();
    }

    private hideTooltip() {
        this.show = false;
        this.renderTooltip();
    }

    private showTooltip() {
        this.show = true;
        this.renderTooltip();
    }

    private onOpenChange: NonNullable<PopupProps['onOpenChange']> = (open, _e, reason) => {
        if (open) return;
        if (reason === 'escape-key') {
            this.cancelPopup();
        } else {
            this.onOutsideClick();
        }
    };

    private onOutsideClick = () => {
        this.removePlaceholderLink(this.textNode);
        this.hideTooltip();
        this.manualHidden = true;
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

            const tr = view.state.tr;
            tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(to)));
            tr.addMark(from, to, linkType(view.state.schema).create({href: url}));
            view.dispatch(tr);
        }
    }

    private createRenderItem() {
        return getReactRendererFromState(this.view.state).createItem('link-tooltip', () => (
            <ErrorLoggerBoundary>
                <SelectionTooltipView
                    show={this.show}
                    domElem={this.textNodeRef as HTMLElement}
                    onCancel={this.cancelPopup.bind(this)}
                    attrs={this.getMarkAttrs()}
                    onChange={this.changeAttrs.bind(this)}
                    onOpenChange={this.onOpenChange}
                />
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
      } & Pick<PopupProps, 'onOpenChange'>;

type SelectionTooltipViewProps = SelectionTooltipViewBaseProps;

const SelectionTooltipView: React.FC<SelectionTooltipViewProps> = (props) => {
    const {show} = props;

    if (!show) return null;

    const {domElem, onChange, onCancel, onOpenChange, attrs = {}} = props;
    const href = attrs[LinkAttr.Href];
    const autoFocus = attrs[LinkAttr.IsPlaceholder];

    return (
        <Popup
            open
            key={href}
            anchorElement={domElem}
            placement={placement}
            onOpenChange={onOpenChange}
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
