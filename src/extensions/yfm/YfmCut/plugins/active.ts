import type {NodeType, ResolvedPos} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';
import type {NodeWithPos} from 'prosemirror-utils';
import {Decoration, DecorationSet} from 'prosemirror-view';

import {isNodeSelection, isTextSelection} from '../../../../utils/selection';
import {cutType} from '../const';

const YFM_CUT_ACTIVE_CLASSNAME = 'yfm-cut-active';

export const cutActivePlugin = () => {
    return new Plugin({
        props: {
            decorations(state) {
                const decos: Decoration[] = [];
                const sel = state.selection;
                const yfmCutType = cutType(state.schema);

                const createDeco = ({pos, node}: NodeWithPos) => {
                    decos.push(
                        Decoration.node(pos, pos + node.nodeSize, {
                            class: YFM_CUT_ACTIVE_CLASSNAME,
                        }),
                    );
                };

                if (isNodeSelection(sel)) {
                    if (sel.node.type === yfmCutType) createDeco({pos: sel.from, node: sel.node});
                    findParentNodesOfType(yfmCutType, sel.$from).forEach(createDeco);
                } else if (isTextSelection(sel)) {
                    findParentNodesOfType(yfmCutType, sel.$from).forEach(createDeco);
                    if (!sel.$from.sameParent(sel.$to)) {
                        findParentNodesOfType(yfmCutType, sel.$to).forEach(createDeco);
                        state.doc.nodesBetween(sel.from, sel.to, (node, pos) => {
                            if (node.type === yfmCutType) createDeco({pos, node});
                            if (node.isTextblock) return false;
                            return true;
                        });
                    }
                } else {
                    // some other selection
                    findParentNodesOfType(yfmCutType, sel.$from).forEach(createDeco);
                }

                return decos.length ? DecorationSet.create(state.doc, decos) : DecorationSet.empty;
            },
        },
    });
};

function findParentNodesOfType(
    type: NodeType,
    $pos: ResolvedPos,
): (NodeWithPos & {depth: number})[] {
    let {depth} = $pos;
    const nodes: (NodeWithPos & {depth: number})[] = [];

    while (depth >= 0) {
        const node = $pos.node(depth);
        if (node.type === type) nodes.push({depth, node, pos: $pos.before(depth)});
        depth--;
    }

    return nodes;
}
