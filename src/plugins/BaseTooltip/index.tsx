import {Popup, PopupPlacement, PopupProps} from '@gravity-ui/uikit';
import {Mark, MarkType, Node, NodeType} from 'prosemirror-model';
import {NodeSelection, PluginView} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findDomRefAtPos, findParentNodeOfType, findSelectedNodeOfType} from 'prosemirror-utils';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../classname';
import {RendererItem, getReactRendererFromState} from '../../extensions';
import {ErrorLoggerBoundary} from '../../react-utils/ErrorBoundary';

import './index.scss';

export type BaseTooltipNode = {
    pos: number;
    node: Node;
    dom: HTMLElement | null;
};

export type TooltipContentCb = (
    view: EditorView,
    node: BaseTooltipNode,
    onChange?: (attrs: Record<string, string>) => void,
    forceEdit?: boolean,
    onOutsideClick?: () => void,
) => React.ReactElement | null;

export interface BaseTooltipPluginOptions {
    idPrefix: string;
    content?: TooltipContentCb;
    nodeType: NodeType | MarkType;
    popupPlacement?: PopupPlacement;
    disableHideOnEscapeKeyDown?: boolean;
}

export const BaseTooltipCn = cn('base-tooltip');
export const defaultPlacement: PopupPlacement = [
    'bottom-start',
    'top-start',
    'bottom-end',
    'top-end',
];
const b = BaseTooltipCn;
export const baseTooltipContentCn = cn('base-tooltip-content');

export type TooltipOnChangeCallback = (
    attrs: Record<string, string>,
    options?: {setFocus?: boolean; setSelection?: boolean; hideTooltip?: boolean; marks?: Mark[]},
) => void;

export type TooltipContentProps = {
    node: BaseTooltipNode;
    view: EditorView;
    onChange?: TooltipOnChangeCallback;
    toggleEdit?: () => void;
};

export class BaseTooltipPluginView implements PluginView {
    protected view: EditorView;
    protected currentNode: BaseTooltipNode | null = null;
    protected readonly content?: TooltipContentCb;
    protected readonly nodeType: NodeType | MarkType;
    protected readonly popupPlacement?: PopupPlacement;
    protected manualHidden = false;
    protected destroyed = false;

    protected readonly disableHideOnEscapeKeyDown?: boolean;

    protected focusTrackingRafId: number | null = null;

    private readonly idPrefix: string;
    private renderItem?: RendererItem;

    constructor(view: EditorView, options: BaseTooltipPluginOptions) {
        this.view = view;
        this.idPrefix = options.idPrefix;
        this.content = options.content;
        this.nodeType = options.nodeType;
        this.popupPlacement = options.popupPlacement;
        this.disableHideOnEscapeKeyDown = options.disableHideOnEscapeKeyDown;
    }

    update(view: EditorView) {
        this.view = view;

        this.updateTooltipView();
    }

    destroy() {
        this.destroyed = true;
        this.renderItem?.remove();
        this.renderItem = undefined;
    }

    onEscapeDown = (): boolean => {
        if (this.disableHideOnEscapeKeyDown) return false;
        if (this.currentNode && !this.manualHidden) {
            this.hidePopupManual();
            return true;
        }
        return false;
    };

    protected setCurrentNode(node: NodeType) {
        const view = this.view;
        const domAtPos = view.domAtPos.bind(view);

        const {selection} = view.state;
        const {$from, $to} = selection;

        const parent =
            findSelectedNodeOfType(node)(selection) || findParentNodeOfType(node)(selection);

        if (!parent || !$from.node(parent.depth).eq($to.node(parent.depth))) {
            this.currentNode = null;
            this.manualHidden = false;
            this.stopTrackingViewFocus();
            return;
        }

        if (
            !this.currentNode ||
            !this.currentNode.node.eq(parent.node) ||
            this.currentNode.pos !== parent.pos
        ) {
            this.manualHidden = false;
            this.stopTrackingViewFocus();
        }

        const {pos, node: parentNode} = parent;
        const dom = findDomRefAtPos(pos, domAtPos) as HTMLElement;

        this.currentNode = {
            pos,
            node: parentNode,
            dom,
        };
    }

    protected changeAttrsCb: TooltipOnChangeCallback = (attrs, options) => {
        if (this.currentNode) {
            let tr = this.view.state.tr.setNodeMarkup(
                this.currentNode.pos,
                undefined,
                {
                    ...this.currentNode.node.attrs,
                    ...attrs,
                },
                options?.marks || [],
            );

            if (options?.setSelection) {
                tr = tr.setSelection(NodeSelection.create(tr.doc, this.currentNode.pos));
            }

            this.view.dispatch(tr);

            if (options?.setFocus) {
                this.view.focus();
            }

            if (options?.hideTooltip) {
                this.hidePopupManual();
            }
        }
    };

    protected updateTooltipView() {
        const oldNode = this.currentNode;
        this.setCurrentNode(this.view.state.schema.nodes[this.nodeType.name]);

        // Do not rerender if we have the same node in selection
        if (
            oldNode &&
            this.currentNode?.node.eq(oldNode.node) &&
            this.currentNode.pos === oldNode.pos &&
            this.currentNode.dom === oldNode.dom
        )
            return;

        this.render();
    }

    protected render() {
        if (this.destroyed) return;
        this.renderItem = this.renderItem ?? this.createRenderItem();
        this.renderItem.rerender();
    }

    protected onOutsideClick: PopupProps['onOutsideClick'] = () => {
        this.hidePopupManual();
    };

    protected popupCloseHandler: PopupProps['onClose'] = (_e, reason) => {
        if (this.disableHideOnEscapeKeyDown && reason === 'escapeKeyDown') return;
        this.hidePopupManual();
        if (reason === 'outsideClick' && !this.view.hasFocus()) {
            this.startTrackingViewFocus();
        }
    };

    protected startTrackingViewFocus() {
        this.focusTrackingRafId = requestAnimationFrame(() => {
            if (this.view.hasFocus()) {
                this.focusTrackingRafId = null;
                this.manualHidden = false;
                this.render();
                return;
            }
            this.startTrackingViewFocus();
        });
    }

    protected stopTrackingViewFocus() {
        if (this.focusTrackingRafId !== null) {
            cancelAnimationFrame(this.focusTrackingRafId);
            this.focusTrackingRafId = null;
        }
    }

    protected hidePopupManual() {
        this.manualHidden = true;
        this.render();
    }

    protected renderContent(currentNode: BaseTooltipNode): React.ReactNode {
        if (!this.content) return null;
        // hack for popup rerender
        window.dispatchEvent(new CustomEvent('scroll'));
        return (
            <Popup
                open
                hasArrow={false}
                contentClassName={b()}
                anchorRef={{current: currentNode.dom}}
                placement={this.popupPlacement || defaultPlacement}
                onClose={this.popupCloseHandler}
            >
                <div>{this.content(this.view, currentNode, this.changeAttrsCb)}</div>
            </Popup>
        );
    }

    protected createRenderItem() {
        return getReactRendererFromState(this.view.state)!.createItem(this.idPrefix, () =>
            this.currentNode && !this.manualHidden ? (
                <ErrorLoggerBoundary>{this.renderContent(this.currentNode)}</ErrorLoggerBoundary>
            ) : null,
        );
    }
}
