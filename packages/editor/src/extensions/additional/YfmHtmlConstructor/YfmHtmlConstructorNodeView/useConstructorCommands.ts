import {useMemo} from 'react';

import type {Node, NodeType} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {generateEntityId} from 'src/utils/entity-id';
import {removeNode} from 'src/utils/remove-node';

import {YfmHtmlConstructorConsts} from '../YfmHtmlConstructorSpecs/const';
import {type CodeChange, type ConstructorDocument, applyCodeChange} from '../document';
import {cloneHtmlConstructorBlock, readBlocks, readStructure, regenerateHtmlIds} from '../model';
import type {HtmlConstructorBlock, HtmlConstructorStructure} from '../types';

export const useConstructorCommands = ({
    nodeType,
    getPos,
    view,
    onChange,
}: {
    nodeType: NodeType;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
}) =>
    useMemo(() => {
        const resolveNode = () => {
            if (view.isDestroyed) return null;
            const pos = getPos();
            if (pos === undefined) return null;
            const node = view.state.doc.nodeAt(pos);
            return node?.type === nodeType ? {node, pos} : null;
        };

        // Read at dispatch time: an open dialog or confirmation may outlive a document change.
        const update = (
            change: (document: ConstructorDocument) => Partial<ConstructorDocument>,
        ) => {
            const current = resolveNode();
            if (current)
                onChange(
                    change({
                        structure: readStructure(current.node),
                        blocks: readBlocks(current.node),
                    }),
                );
        };
        const updateBlocks = (change: (blocks: HtmlConstructorBlock[]) => HtmlConstructorBlock[]) =>
            update(({blocks}) => ({blocks: change(blocks)}));

        return {
            replaceDocument: (document: ConstructorDocument) => update(() => document),
            patchStructure: (patch: Partial<HtmlConstructorStructure>) =>
                update(({structure}) => ({structure: {...structure, ...patch}})),
            setBlocks: (blocks: HtmlConstructorBlock[]) => updateBlocks(() => blocks),
            addBlock: (block: HtmlConstructorBlock) => updateBlocks((blocks) => [...blocks, block]),
            patchBlock: (id: string, patch: Partial<HtmlConstructorBlock>) =>
                updateBlocks((blocks) =>
                    blocks.map((block) => (block.id === id ? {...block, ...patch} : block)),
                ),
            replaceBlock: (id: string, replacement: HtmlConstructorBlock) =>
                updateBlocks((blocks) =>
                    blocks.map((block) => (block.id === id ? replacement : block)),
                ),
            duplicateBlock: (id: string) =>
                updateBlocks((blocks) => {
                    const index = blocks.findIndex((block) => block.id === id);
                    if (index === -1) return blocks;
                    return [
                        ...blocks.slice(0, index + 1),
                        cloneHtmlConstructorBlock(blocks[index]),
                        ...blocks.slice(index + 1),
                    ];
                }),
            removeBlock: (id: string) =>
                updateBlocks((blocks) => blocks.filter((block) => block.id !== id)),
            commitCode: (change: CodeChange) =>
                update((document) => applyCodeChange(document, change)),
            duplicate: () => {
                const current = resolveNode();
                if (!current) return;
                const {node, pos} = current;
                const structure = readStructure(node);
                const copy = node.type.create({
                    ...node.attrs,
                    structure: {...structure, content: regenerateHtmlIds(structure.content)},
                    blocks: readBlocks(node).map(cloneHtmlConstructorBlock),
                    [YfmHtmlConstructorConsts.NodeAttrs.EntityId]: generateEntityId(
                        YfmHtmlConstructorConsts.NodeName,
                    ),
                });
                view.dispatch(view.state.tr.insert(pos + node.nodeSize, copy));
            },
            remove: () => {
                const current = resolveNode();
                if (current) removeNode({...current, tr: view.state.tr, dispatch: view.dispatch});
            },
        };
    }, [getPos, nodeType, onChange, view]);
