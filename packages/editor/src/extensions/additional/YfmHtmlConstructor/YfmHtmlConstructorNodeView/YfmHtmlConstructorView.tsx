import {createElement, useMemo, useState} from 'react';
import type {CSSProperties, FC, ReactNode} from 'react';

import {Code, LayoutHeaderColumns, Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {i18n} from 'src/i18n/yfm-html-constructor';
import {useBooleanState, useElementState} from 'src/react-utils/hooks';
import {removeNode} from 'src/utils/remove-node';

import {YfmHtmlConstructorConsts, emptyHtmlConstructorStructure} from '../YfmHtmlConstructorSpecs';
import {htmlConstructorStructureClass, structureClass} from '../css';
import {mergeTemplatesById, readStoredTemplates} from '../templates';
import type {
    HtmlConstructorBlock,
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructure,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
    YfmHtmlConstructorOptions,
} from '../types';

import {BlockInsertPopup} from './BlockInsertPopup';
import {HtmlBlockItem} from './HtmlBlockItem';
import {BlockSettingsPopup, StructureSettingsPopup} from './SettingsPopups';
import {TemplatesPopup} from './TemplatesPopup';
import {
    blockTemplateToBlock,
    buildPreviewCss,
    getActiveStructureTemplateId,
    rawTemplateBlockToBlock,
    structureTemplateToAttrs,
} from './blockUtils';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {useHtmlBlockDrag} from './drag';

import './YfmHtmlConstructor.scss';

export {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const EMPTY_BLOCKS: HtmlConstructorBlock[] = [];

const parseInlineStyle = (value: string): CSSProperties =>
    Object.fromEntries(
        value
            .split(';')
            .map((declaration) => declaration.trim())
            .filter(Boolean)
            .map((declaration) => {
                const [property, ...parts] = declaration.split(':');
                return [
                    property
                        .trim()
                        .replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
                    parts.join(':').trim(),
                ];
            })
            .filter(([property, valuePart]) => property && valuePart),
    );

const nodeToReact = (node: ChildNode, key: string): ReactNode => {
    if (node.nodeType === window.Node.TEXT_NODE) return node.textContent;
    if (!(node instanceof HTMLElement)) return null;

    const props: Record<string, unknown> = {key};
    for (const attr of Array.from(node.attributes)) {
        if (attr.name === 'class') {
            props.className = attr.value;
        } else if (attr.name === 'style') {
            props.style = parseInlineStyle(attr.value);
        } else if (attr.name === 'for') {
            props.htmlFor = attr.value;
        } else {
            props[attr.name] = attr.value;
        }
    }

    return createElement(
        node.tagName.toLowerCase(),
        props,
        ...Array.from(node.childNodes).map((child, index) => nodeToReact(child, `${key}-${index}`)),
    );
};

const htmlToReactNodes = (html: string): ReactNode[] => {
    if (!html.trim() || typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
        return [];
    }

    const doc = new DOMParser().parseFromString(`<template>${html}</template>`, 'text/html');
    const template = doc.body.firstElementChild;
    if (!(template instanceof HTMLTemplateElement)) return [];

    return Array.from(template.content.childNodes).map((node, index) =>
        nodeToReact(node, `structure-${index}`),
    );
};

const readStructure = (node: Node): HtmlConstructorStructure => {
    const value = node.attrs[YfmHtmlConstructorConsts.NodeAttrs.structure];
    if (!value || typeof value !== 'object') return emptyHtmlConstructorStructure();

    return {
        templateId: typeof value.templateId === 'string' ? value.templateId : undefined,
        css: typeof value.css === 'string' ? value.css : '',
        content: typeof value.content === 'string' ? value.content : '',
        themeIds: Array.isArray(value.themeIds)
            ? value.themeIds.filter((id: unknown): id is string => typeof id === 'string')
            : [],
    };
};

export const YfmHtmlConstructorView: FC<{
    node: Node;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
    options: {templates?: YfmHtmlConstructorOptions};
}> = ({node, getPos, view, onChange, options}) => {
    const structure = readStructure(node);
    const blocks: HtmlConstructorBlock[] =
        node.attrs[YfmHtmlConstructorConsts.NodeAttrs.blocks] ?? EMPTY_BLOCKS;
    const {templates} = options;

    const renderedStructureContent = useMemo(
        () => htmlToReactNodes(structure.content),
        [structure.content],
    );
    const previewCss = useMemo(() => buildPreviewCss({blocks, structure}), [blocks, structure]);

    const [structureAnchor, setStructureAnchor] = useElementState();
    const [structureSettingsOpen, setStructureSettingsOpen] = useState(false);

    const [blockAnchor, setBlockAnchor] = useElementState();
    const [editingBlockSettingsId, setEditingBlockSettingsId] = useState<string | null>(null);

    const allowAdd = Boolean(templates?.allowAdd);
    const [storedTemplates, setStoredTemplates] =
        useState<HtmlConstructorTemplate[]>(readStoredTemplates);
    const effectiveTemplates = useMemo(
        () => mergeTemplatesById(templates?.items ?? [], storedTemplates),
        [templates?.items, storedTemplates],
    );

    const activeStructureId = getActiveStructureTemplateId(structure);
    const hasStructureTemplates = effectiveTemplates.some(
        (template) => template.type === 'structure',
    );
    const showStructureTemplatesButton =
        Boolean(templates?.showButton) && (allowAdd || hasStructureTemplates);
    const [structureTemplatesOpen, , closeStructureTemplates, toggleStructureTemplatesOpen] =
        useBooleanState(false);
    const [structureTemplatesAnchor, setStructureTemplatesAnchor] = useElementState();
    const [blockTemplatesOpen, openBlockTemplates, closeBlockTemplates] = useBooleanState(false);
    const [blockTemplatesAnchor, setBlockTemplatesAnchor] = useState<HTMLElement | null>(null);

    const setStructure = (next: HtmlConstructorStructure) =>
        onChange({[YfmHtmlConstructorConsts.NodeAttrs.structure]: next});

    const setBlocks = (next: HtmlConstructorBlock[]) =>
        onChange({[YfmHtmlConstructorConsts.NodeAttrs.blocks]: next});

    const {beginBlockDrag, draggedBlockId, dropTarget} = useHtmlBlockDrag({
        blocks,
        onMove: setBlocks,
    });

    const applyStructureTemplate = (
        template: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => {
        const attrs = structureTemplateToAttrs(effectiveTemplates, template, theme);
        onChange({
            [YfmHtmlConstructorConsts.NodeAttrs.structure]: attrs.structure,
            [YfmHtmlConstructorConsts.NodeAttrs.blocks]: attrs.blocks,
        });
        closeStructureTemplates();
    };

    const applyBlockTemplate = (
        template: HtmlConstructorBlockTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => {
        setBlocks([...blocks, blockTemplateToBlock(template, theme)]);
        closeBlockTemplates();
    };

    const applyRawBlock = (block: HtmlConstructorTemplateBlock) => {
        setBlocks([...blocks, rawTemplateBlockToBlock(block)]);
        closeBlockTemplates();
    };

    const patchStructure = (patch: Partial<HtmlConstructorStructure>) =>
        setStructure({...structure, ...patch});

    const patchBlock = (id: string, patch: Partial<HtmlConstructorBlock>) =>
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

    const editingBlockSettings =
        blocks.find((block) => block.id === editingBlockSettingsId) ?? null;

    return (
        <div className={b()}>
            {previewCss && <style>{previewCss}</style>}

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
                        ref={setStructureAnchor}
                        className={stop}
                        onClick={() => setStructureSettingsOpen((v) => !v)}
                        aria-label={i18n('structure_settings')}
                    >
                        <Icon data={Code} className={stop} />
                    </Button>
                    {showStructureTemplatesButton && (
                        <Button
                            view="flat"
                            size="s"
                            ref={setStructureTemplatesAnchor}
                            className={stop}
                            onClick={toggleStructureTemplatesOpen}
                            aria-label={i18n('structure_templates')}
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
                        aria-label={i18n('remove_constructor')}
                    >
                        <Icon data={TrashBin} className={stop} />
                    </Button>
                </div>
                {showStructureTemplatesButton && (
                    <TemplatesPopup
                        anchor={structureTemplatesAnchor}
                        open={structureTemplatesOpen}
                        templates={effectiveTemplates}
                        allowAdd={allowAdd}
                        emptyText={i18n('structure_templates_empty')}
                        hasStoredTemplates={storedTemplates.length > 0}
                        onClose={closeStructureTemplates}
                        onApply={applyStructureTemplate}
                        onAdded={setStoredTemplates}
                        onCleared={setStoredTemplates}
                    />
                )}
            </div>

            <div
                id={structureClass()}
                className={`${b('structure')} ${htmlConstructorStructureClass} ${structureClass()}`}
            >
                {renderedStructureContent}
                {blocks.map((block, i) => (
                    <HtmlBlockItem
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
                templates={effectiveTemplates}
                activeStructureId={activeStructureId}
                onClose={closeBlockTemplates}
                onApplyTemplate={applyBlockTemplate}
                onApplyHtml={applyRawBlock}
            />

            <StructureSettingsPopup
                anchor={structureAnchor}
                open={structureSettingsOpen}
                onClose={() => setStructureSettingsOpen(false)}
                html={structure.content}
                css={structure.css}
                onHtmlCommit={(value) => patchStructure({content: value})}
                onCssChange={(value) => patchStructure({css: value})}
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
