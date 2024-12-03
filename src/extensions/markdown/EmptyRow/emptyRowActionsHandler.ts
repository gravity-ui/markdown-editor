import {TextSelection} from 'prosemirror-state';

import {ExtensionDeps} from 'src/core';

import {DeflistNode, TableNode} from '../../../extensions/markdown';
import {CheckboxNode, CutNode, TabsNode, YfmNoteNode} from '../../../extensions/yfm';
import {debounce} from '../../../lodash';
import {Node} from '../../../pm/model';
import {EditorView} from '../../../pm/view';
import {BaseNode} from '../../base/specs';
import {CommandMenuOptions} from '../../behavior/CommandMenu';
import {CommandHandler} from '../../behavior/CommandMenu/handler';
import {getReactRendererFromState} from '../../behavior/ReactRenderer';

import {ActionButtonExtraProps, ActionButtonRenderer} from './actionButtonRenderer';
import {getActionPlug} from './config';
import {ActionButtonNodesFilter, ActionButtonNodesStrictFilter} from './types';

type ActiveNode = Readonly<{
    dom: Element;
    posBefore: number;
    node: Node;
    el: Element;
    props?: ActionButtonExtraProps;
}>;

export type ActionButtonHandlerParams = {
    nodeFilter?: ActionButtonNodesFilter;
    opts: CommandMenuOptions;
};

export class EmptyRowEventsHandler {
    handleViewMousemoveDebounced = debounce((event: MouseEvent): void => {
        const {target: targetElem} = event;
        if (!(targetElem instanceof Element)) {
            this._hideActionButton();
            return;
        }

        this._activeNode = this._selectRootNodeByDom(targetElem);

        if (this._activeNode) {
            this._showActionButton();
        } else {
            this._hideActionButton();
        }
    }, 10);

    private _activeNode: ActiveNode | null = null;
    private readonly _view: EditorView;
    private readonly _actionButtonRenderer: ActionButtonRenderer;
    private menuRenderer: CommandHandler;
    private clickListener: (event: MouseEvent) => void;

    constructor(view: EditorView, params: ActionButtonHandlerParams, deps: ExtensionDeps) {
        this.menuRenderer = new CommandHandler({
            storage: deps.actions,
            actions: params.opts.actions,
            nodesIgnoreList: (params.opts.nodesIgnoreList ?? []).concat([
                DeflistNode.Term,
                TableNode.HeaderCell,
                TableNode.DataCell,
                CheckboxNode.Label,
                YfmNoteNode.NoteTitle,
                CutNode.CutTitle,
                TabsNode.Tab,
            ]),
        });

        this.clickListener = (event: MouseEvent) => {
            if ((event.target as HTMLButtonElement).getAttribute('id') === 'ActionButtonButton') {
                return;
            }
            this.menuRenderer.onClose(getActionPlug(view));
            this._hideActionButton();
            document.removeEventListener('click', this.clickListener);
        };

        this._view = view;
        this._actionButtonRenderer = new ActionButtonRenderer({
            reactRenderer: getReactRendererFromState(this._view.state),
            handler: this,
        });
    }

    destroy = (): void => {
        this._activeNode = null;
        this._actionButtonRenderer.destroy();
    };

    handleActionButtonClick: React.MouseEventHandler<HTMLButtonElement> = () => {
        const dom = this._activeNode?.dom as HTMLElement;
        if (dom && this._activeNode) {
            const {tr} = this._view.state;
            this._view.dispatch(
                tr.setSelection(TextSelection.create(tr.doc, this._activeNode.posBefore + 1)),
            );

            this.menuRenderer.onOpen(getActionPlug(this._view), dom);
            document.addEventListener('click', this.clickListener);
        }
    };

    handleActionButtonMouseLeave: React.MouseEventHandler<HTMLButtonElement> = () => {
        this._hideActionButton();
    };

    handleViewMousemove = (event: MouseEvent): boolean | void => {
        this.handleViewMousemoveDebounced(event);
        return false;
    };

    private _selectRootNodeByDom(dom: Element): ActiveNode | null {
        const root = this._view.dom.parentElement;
        if (!root) return null;
        while (!dom.pmViewDesc) {
            if (!dom.parentElement) return null;
            dom = dom.parentElement;
        }
        const filter = filterNodes();
        let nodeDesc = dom.pmViewDesc;
        let parentDesc: typeof nodeDesc | null = null;
        do {
            if (!nodeDesc.node) {
                if (!nodeDesc.parent) return null;
                nodeDesc = nodeDesc.parent;
                parentDesc = null;
                continue;
            }
            if (nodeDesc.node.type.name === BaseNode.Doc) return null;
            parentDesc = nodeDesc.parent ?? null;
            if (filter(nodeDesc.node, parentDesc && parentDesc.node)) break;
            if (!parentDesc) return null;
            nodeDesc = parentDesc;
            parentDesc = null;
            // eslint-disable-next-line no-constant-condition
        } while (true);

        const el = nodeDesc.dom as Element;
        const node = nodeDesc.node;
        const parent = parentDesc && parentDesc.node;

        const {ActionButton} = node.type.spec;
        const props = typeof ActionButton === 'object' ? ActionButton.props : undefined;

        return {
            dom,
            el,
            node,
            posBefore: nodeDesc.posBefore,
            props: typeof props === 'function' ? props(node, parent) : props,
        };
    }
    private _showActionButton() {
        if (!this._activeNode) return;
        this._actionButtonRenderer.show(this._activeNode.el, this._activeNode.props);
    }
    private _hideActionButton() {
        this._activeNode = null;
        this._actionButtonRenderer.hide();
    }
}

const filterNodes =
    (): ActionButtonNodesStrictFilter => (node: Node | null, parent: Node | null) => {
        return (
            node?.type.name === 'paragraph' &&
            node.content.firstChild === null &&
            parent?.type.name === 'doc'
        );
    };
