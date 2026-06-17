import {useMemo, useState} from 'react';

import {Gear, LayoutHeaderColumns, Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {i18n} from 'src/i18n/grid-block-templates';
import {useBooleanState, useElementState} from 'src/react-utils/hooks';
import {removeNode} from 'src/utils/remove-node';

import {GridBlockTemplatesConsts} from '../GridBlockTemplatesSpecs/const';
import {mergeTemplatesById, readStoredTemplates} from '../templates';
import type {
    GridBlock,
    GridBlockBlockTemplate,
    GridBlockContainerTemplate,
    GridBlockTemplate,
    GridBlockTemplateBlock,
    GridBlockTemplatesOptions,
} from '../types';

import {BlockInsertPopup} from './BlockInsertPopup';
import {GridBlockItem} from './GridBlockItem';
import {BlockSettingsPopup, ContainerSettingsPopup} from './SettingsPopups';
import {TemplatesPopup} from './TemplatesPopup';
import {
    buildContainerHtml,
    buildScopedCss,
    containerTemplateToAttrs,
    getGridScopeClass,
    isBlockTemplate,
    isContainerTemplate,
    parseContainerHtml,
    rawTemplateBlockToBlock,
    templateToBlock,
} from './blockUtils';
import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';
import {getBlockTemplatesForMenu} from './derivedBlockTemplates';
import {useGridBlockDrag} from './drag';

import './GridBlockTemplates.scss';

export {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;
const EMPTY_BLOCKS: GridBlock[] = [];

export const GridBlockTemplatesView: React.FC<{
    node: Node;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
    options: {templates?: GridBlockTemplatesOptions};
}> = ({node, getPos, view, onChange, options}) => {
    const entityId: string = node.attrs[GridBlockTemplatesConsts.NodeAttrs.EntityId];
    const customCss: string = node.attrs[GridBlockTemplatesConsts.NodeAttrs.customCss] ?? '';
    const blocks: GridBlock[] =
        node.attrs[GridBlockTemplatesConsts.NodeAttrs.blocks] ?? EMPTY_BLOCKS;
    const {templates} = options;

    const scopeClass = useMemo(() => getGridScopeClass(entityId), [entityId]);
    const scopedCss = useMemo(
        () => buildScopedCss({blocks, customCss, scopeClass}),
        [customCss, blocks, scopeClass],
    );

    const [containerAnchor, setContainerAnchor] = useElementState();
    const [containerCssOpen, setContainerCssOpen] = useState(false);

    const [blockAnchor, setBlockAnchor] = useElementState();
    const [editingBlockSettingsId, setEditingBlockSettingsId] = useState<string | null>(null);

    const allowAdd = Boolean(templates?.allowAdd);
    const [storedTemplates, setStoredTemplates] =
        useState<GridBlockTemplate[]>(readStoredTemplates);
    const effectiveTemplates = useMemo(
        () => mergeTemplatesById(templates?.items ?? [], storedTemplates),
        [templates?.items, storedTemplates],
    );
    const containerTemplates = useMemo(
        () => effectiveTemplates.filter(isContainerTemplate),
        [effectiveTemplates],
    );
    const explicitBlockTemplates = useMemo(
        () => effectiveTemplates.filter(isBlockTemplate),
        [effectiveTemplates],
    );
    const blockTemplates = useMemo(
        () =>
            getBlockTemplatesForMenu({
                blockTemplates: explicitBlockTemplates,
                containerTemplates,
            }),
        [explicitBlockTemplates, containerTemplates],
    );

    const showContainerTemplatesButton =
        Boolean(templates?.showButton) && (allowAdd || containerTemplates.length > 0);
    const [containerTemplatesOpen, , closeContainerTemplates, toggleContainerTemplatesOpen] =
        useBooleanState(false);
    const [containerTemplatesAnchor, setContainerTemplatesAnchor] = useElementState();
    const [blockTemplatesOpen, openBlockTemplates, closeBlockTemplates] = useBooleanState(false);
    const [blockTemplatesAnchor, setBlockTemplatesAnchor] = useState<HTMLElement | null>(null);
    const containerHtml = useMemo(() => buildContainerHtml(blocks), [blocks]);

    const setBlocks = (next: GridBlock[]) =>
        onChange({[GridBlockTemplatesConsts.NodeAttrs.blocks]: next});

    const {beginBlockDrag, draggedBlockId, dropTarget} = useGridBlockDrag({
        blocks,
        onMove: setBlocks,
    });

    const applyContainerTemplate = (template: GridBlockContainerTemplate) => {
        const {customCss: nextCustomCss, blocks: nextBlocks} = containerTemplateToAttrs(template);

        onChange({
            [GridBlockTemplatesConsts.NodeAttrs.customCss]: nextCustomCss,
            [GridBlockTemplatesConsts.NodeAttrs.blocks]: nextBlocks,
        });
        closeContainerTemplates();
    };

    const applyBlockTemplate = (template: GridBlockBlockTemplate) => {
        setBlocks([...blocks, templateToBlock(template)]);
        closeBlockTemplates();
    };

    const applyRawBlock = (block: GridBlockTemplateBlock) => {
        setBlocks([...blocks, rawTemplateBlockToBlock(block)]);
        closeBlockTemplates();
    };

    const patchBlock = (id: string, patch: Partial<GridBlock>) =>
        setBlocks(blocks.map((block) => (block.id === id ? {...block, ...patch} : block)));

    const openBlockSettings = (id: string, anchor: HTMLElement) => {
        setBlockAnchor(anchor);
        setEditingBlockSettingsId(id);
    };

    const commitBlockContent = (id: string, content: string) => {
        patchBlock(id, {content});
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter((block) => block.id !== id));
        if (editingBlockSettingsId === id) setEditingBlockSettingsId(null);
    };

    const commitContainerHtml = (html: string) => {
        const nextBlocks = parseContainerHtml(html, blocks);
        if (nextBlocks) setBlocks(nextBlocks);
    };

    const editingBlockSettings =
        blocks.find((block) => block.id === editingBlockSettingsId) ?? null;

    return (
        <div className={`${b()} ${scopeClass}`}>
            {/* PROTOTYPE scoping: selectors in user CSS are prefixed with the instance scope. */}
            <style>{`.${scopeClass} .grid{display:grid;gap:8px}\n${scopedCss}`}</style>

            <div className={b('toolbar', [stop])}>
                <div className={b('toolbar-group', {side: 'left'})}>
                    <Button
                        view="flat"
                        size="s"
                        ref={setBlockTemplatesAnchor}
                        className={stop}
                        onClick={openBlockTemplates}
                        aria-label={i18n('add_block')}
                    >
                        <Icon data={Plus} className={stop} />
                    </Button>
                </div>
                <div className={b('toolbar-group', {side: 'right'})}>
                    <Button
                        view="flat"
                        size="s"
                        ref={setContainerAnchor}
                        className={stop}
                        onClick={() => setContainerCssOpen((v) => !v)}
                        aria-label={i18n('grid_css')}
                    >
                        <Icon data={Gear} className={stop} />
                    </Button>
                    {showContainerTemplatesButton && (
                        <Button
                            view="flat"
                            size="s"
                            ref={setContainerTemplatesAnchor}
                            className={stop}
                            onClick={toggleContainerTemplatesOpen}
                            aria-label={i18n('container_templates')}
                        >
                            <Icon data={LayoutHeaderColumns} className={stop} />
                        </Button>
                    )}
                    <Button
                        view="flat"
                        size="s"
                        className={stop}
                        onClick={() => {
                            const pos = getPos();
                            if (pos === undefined) return;
                            removeNode({node, pos, tr: view.state.tr, dispatch: view.dispatch});
                        }}
                        aria-label={i18n('remove_grid')}
                    >
                        <Icon data={TrashBin} className={stop} />
                    </Button>
                </div>
                {showContainerTemplatesButton && (
                    <TemplatesPopup
                        anchor={containerTemplatesAnchor}
                        open={containerTemplatesOpen}
                        templates={containerTemplates}
                        allowAdd={allowAdd}
                        emptyText={i18n('container_templates_empty')}
                        hasStoredTemplates={storedTemplates.length > 0}
                        onClose={closeContainerTemplates}
                        onApply={applyContainerTemplate}
                        onAdded={setStoredTemplates}
                        onCleared={setStoredTemplates}
                    />
                )}
            </div>

            <div className={`${b('grid')} grid`}>
                {blocks.map((block, i) => (
                    <GridBlockItem
                        key={block.id}
                        block={block}
                        index={i}
                        isDragged={draggedBlockId === block.id}
                        dropTarget={dropTarget}
                        onBeginDrag={beginBlockDrag}
                        onOpenSettings={openBlockSettings}
                        onCommitContent={commitBlockContent}
                        onRemove={removeBlock}
                    />
                ))}
            </div>

            <BlockInsertPopup
                anchor={blockTemplatesAnchor}
                open={blockTemplatesOpen}
                templates={blockTemplates}
                onClose={closeBlockTemplates}
                onApplyTemplate={applyBlockTemplate}
                onApplyHtml={applyRawBlock}
            />

            <ContainerSettingsPopup
                anchor={containerAnchor}
                open={containerCssOpen}
                onClose={() => setContainerCssOpen(false)}
                html={containerHtml}
                css={customCss}
                onHtmlCommit={commitContainerHtml}
                onCssChange={(value) =>
                    onChange({[GridBlockTemplatesConsts.NodeAttrs.customCss]: value})
                }
            />

            {editingBlockSettings && (
                <BlockSettingsPopup
                    anchor={blockAnchor}
                    open
                    onClose={() => setEditingBlockSettingsId(null)}
                    html={editingBlockSettings.content}
                    css={editingBlockSettings.css}
                    onHtmlCommit={(value) => patchBlock(editingBlockSettings.id, {content: value})}
                    onCssChange={(value) => patchBlock(editingBlockSettings.id, {css: value})}
                />
            )}
        </div>
    );
};
