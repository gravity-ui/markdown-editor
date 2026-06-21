import {createElement, useMemo, useState} from 'react';
import type {CSSProperties, FC, ReactNode} from 'react';

import {BucketPaint, LayoutHeaderColumns, Plus} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {i18n} from 'src/i18n/yfm-html-constructor';
import {generateEntityId} from 'src/utils/entity-id';
import {removeNode} from 'src/utils/remove-node';

import {YfmHtmlConstructorConsts, emptyHtmlConstructorStructure} from '../YfmHtmlConstructorSpecs';
import {htmlConstructorStructureClass, structureClass} from '../css';
import {
    htmlConstructorQuickStyleToReactStyle,
    normalizeHtmlConstructorQuickStyle,
} from '../quickStyle';
import {normalizeHtmlConstructorTemplateSettings} from '../settings';
import {mergeTemplatesById, readStoredTemplates} from '../templates';
import type {
    HtmlConstructorBlock,
    HtmlConstructorBlockTemplate,
    HtmlConstructorQuickStyle,
    HtmlConstructorStructure,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
    YfmHtmlConstructorOptions,
} from '../types';

import {BlockInsertPanel} from './BlockInsertPopup';
import {FloatingToolbar, type FloatingToolbarPrimaryAction} from './FloatingToolbar';
import {HtmlBlockItem} from './HtmlBlockItem';
import {StructureSettingsPanel} from './SettingsPopups';
import {ThemesPanel} from './TemplateActionsPanel';
import {TemplatesPanel} from './TemplatesPopup';
import {
    applyStructureThemeToState,
    blockTemplateToBlock,
    buildPreviewCss,
    cloneHtmlConstructorBlock,
    getActiveStructureTemplateId,
    getStructureTemplateById,
    getStructureThemeTemplates,
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
type StructurePanel = 'blocks' | 'templates' | 'themes' | 'settings' | null;

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
        settings: normalizeHtmlConstructorTemplateSettings(value.settings),
        quickStyle: normalizeHtmlConstructorQuickStyle(value.quickStyle),
    };
};

const readBlocks = (node: Node): HtmlConstructorBlock[] => {
    const value = node.attrs[YfmHtmlConstructorConsts.NodeAttrs.blocks];
    if (!Array.isArray(value)) return EMPTY_BLOCKS;

    return value.flatMap((block): HtmlConstructorBlock[] => {
        if (!block || typeof block !== 'object') return [];

        return [
            {
                id: typeof block.id === 'string' ? block.id : '',
                templateId: typeof block.templateId === 'string' ? block.templateId : undefined,
                css: typeof block.css === 'string' ? block.css : '',
                content: typeof block.content === 'string' ? block.content : '',
                themeIds: Array.isArray(block.themeIds)
                    ? block.themeIds.filter((id: unknown): id is string => typeof id === 'string')
                    : [],
                settings: normalizeHtmlConstructorTemplateSettings(block.settings),
                quickStyle: normalizeHtmlConstructorQuickStyle(block.quickStyle),
            },
        ];
    });
};

export const YfmHtmlConstructorView: FC<{
    node: Node;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
    options: {templates?: YfmHtmlConstructorOptions};
}> = ({node, getPos, view, onChange, options}) => {
    const structure = readStructure(node);
    const blocks = readBlocks(node);
    const {templates} = options;

    const renderedStructureContent = useMemo(
        () => htmlToReactNodes(structure.content),
        [structure.content],
    );
    const previewCss = useMemo(() => buildPreviewCss({blocks, structure}), [blocks, structure]);
    const [structurePanel, setStructurePanel] = useState<StructurePanel>(null);

    const allowAdd = Boolean(templates?.allowAdd);
    const [storedTemplates, setStoredTemplates] =
        useState<HtmlConstructorTemplate[]>(readStoredTemplates);
    const effectiveTemplates = useMemo(
        () => mergeTemplatesById(templates?.items ?? [], storedTemplates),
        [templates?.items, storedTemplates],
    );

    const activeStructureId = getActiveStructureTemplateId(structure);
    const activeStructureTemplate = useMemo(
        () => getStructureTemplateById(effectiveTemplates, activeStructureId),
        [activeStructureId, effectiveTemplates],
    );
    const structureThemes = useMemo(
        () => getStructureThemeTemplates(effectiveTemplates, activeStructureId),
        [activeStructureId, effectiveTemplates],
    );
    const hasStructureTemplates = effectiveTemplates.some(
        (template) => template.type === 'structure',
    );
    const showStructureTemplatesButton =
        Boolean(templates?.showButton) && (allowAdd || hasStructureTemplates);

    const closeStructurePanel = () => setStructurePanel(null);
    const toggleStructurePanel = (panel: Exclude<StructurePanel, null>) => {
        setStructurePanel((current) => (current === panel ? null : panel));
    };

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
        closeStructurePanel();
    };

    const applyStructureTheme = (theme?: HtmlConstructorThemeTemplate) => {
        if (!activeStructureTemplate) return;

        setStructure(applyStructureThemeToState(structure, activeStructureTemplate, theme));
        closeStructurePanel();
    };

    const applyBlockTemplate = (
        template: HtmlConstructorBlockTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => {
        setBlocks([...blocks, blockTemplateToBlock(template, theme)]);
        closeStructurePanel();
    };

    const applyRawBlock = (block: HtmlConstructorTemplateBlock) => {
        setBlocks([...blocks, rawTemplateBlockToBlock(block)]);
        closeStructurePanel();
    };

    const patchStructure = (patch: Partial<HtmlConstructorStructure>) =>
        setStructure({...structure, ...patch});

    const patchBlock = (id: string, patch: Partial<HtmlConstructorBlock>) =>
        setBlocks(blocks.map((block) => (block.id === id ? {...block, ...patch} : block)));

    const commitBlockContent = (id: string, content: string) => {
        patchBlock(id, {content});
    };

    const updateBlockCss = (id: string, css: string) => {
        patchBlock(id, {css});
    };

    const updateBlockQuickStyle = (id: string, quickStyle: HtmlConstructorQuickStyle) => {
        patchBlock(id, {quickStyle});
    };

    const replaceBlock = (id: string, nextBlock: HtmlConstructorBlock) => {
        setBlocks(blocks.map((block) => (block.id === id ? nextBlock : block)));
    };

    const duplicateBlock = (id: string) => {
        const blockIndex = blocks.findIndex((block) => block.id === id);
        if (blockIndex === -1) return;

        const block = blocks[blockIndex];
        if (!block) return;

        setBlocks([
            ...blocks.slice(0, blockIndex + 1),
            cloneHtmlConstructorBlock(block),
            ...blocks.slice(blockIndex + 1),
        ]);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter((block) => block.id !== id));
    };

    const duplicateConstructor = () => {
        const pos = getPos();
        if (pos === undefined) return;

        const nextNode = node.type.create({
            ...node.attrs,
            [YfmHtmlConstructorConsts.NodeAttrs.structure]: {...structure},
            [YfmHtmlConstructorConsts.NodeAttrs.blocks]: blocks.map(cloneHtmlConstructorBlock),
            [YfmHtmlConstructorConsts.NodeAttrs.EntityId]: generateEntityId(
                YfmHtmlConstructorConsts.NodeName,
            ),
        });

        view.dispatch(view.state.tr.insert(pos + node.nodeSize, nextNode));
    };

    const renderStructurePanelContent = () => {
        if (structurePanel === 'blocks') {
            return (
                <BlockInsertPanel
                    templates={effectiveTemplates}
                    activeStructureId={activeStructureId}
                    onClose={closeStructurePanel}
                    onApplyTemplate={applyBlockTemplate}
                    onApplyHtml={applyRawBlock}
                />
            );
        }

        if (structurePanel === 'templates') {
            return (
                <TemplatesPanel
                    templates={effectiveTemplates}
                    allowAdd={allowAdd}
                    emptyText={i18n('structure_templates_empty')}
                    hasStoredTemplates={storedTemplates.length > 0}
                    onClose={closeStructurePanel}
                    onApply={applyStructureTemplate}
                    onAdded={setStoredTemplates}
                    onCleared={setStoredTemplates}
                />
            );
        }

        if (structurePanel === 'themes') {
            return (
                <ThemesPanel
                    themes={structureThemes}
                    activeThemeIds={structure.themeIds}
                    emptyText={i18n('themes_empty')}
                    onApply={applyStructureTheme}
                />
            );
        }

        if (structurePanel === 'settings') {
            return (
                <StructureSettingsPanel
                    html={structure.content}
                    css={structure.css}
                    onHtmlCommit={(value) => patchStructure({content: value})}
                    onCssChange={(value) => patchStructure({css: value})}
                />
            );
        }

        return null;
    };

    const structurePanelContent = renderStructurePanelContent();
    const structurePrimaryActions = [
        {
            id: 'addBlock',
            node: (
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    selected={structurePanel === 'blocks'}
                    onClick={() => toggleStructurePanel('blocks')}
                    aria-label={i18n('add_block')}
                    title={i18n('add_block')}
                >
                    <Icon data={Plus} className={stop} />
                </Button>
            ),
        },
        showStructureTemplatesButton && {
            id: 'selectStructure',
            node: (
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    selected={structurePanel === 'templates'}
                    onClick={() => toggleStructurePanel('templates')}
                    aria-label={i18n('structure_templates')}
                    title={i18n('structure_templates')}
                >
                    <Icon data={LayoutHeaderColumns} className={stop} />
                </Button>
            ),
        },
        {
            id: 'structureTheme',
            node: (
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    disabled={!activeStructureTemplate || structureThemes.length === 0}
                    selected={structurePanel === 'themes'}
                    onClick={() => toggleStructurePanel('themes')}
                    aria-label={i18n('select_theme')}
                    title={i18n('select_theme')}
                >
                    <Icon data={BucketPaint} className={stop} />
                </Button>
            ),
        },
    ].filter(Boolean) as FloatingToolbarPrimaryAction[];
    const isEmptyConstructor = !structure.content.trim() && blocks.length === 0;

    return (
        <div className={b()}>
            {previewCss && <style>{previewCss}</style>}

            <FloatingToolbar
                settings={structure.settings}
                quickStyle={structure.quickStyle}
                onQuickStyleChange={(quickStyle) => patchStructure({quickStyle})}
                onOpenSettings={() => toggleStructurePanel('settings')}
                primaryActions={structurePrimaryActions}
                onDuplicate={duplicateConstructor}
                onRemove={() => {
                    const pos = getPos();
                    if (pos === undefined) return;
                    removeNode({node, pos, tr: view.state.tr, dispatch: view.dispatch});
                }}
                codeLabel={i18n('structure_settings')}
                duplicateLabel={i18n('duplicate_constructor')}
                removeLabel={i18n('remove_constructor')}
                lockLabel={i18n('lock_constructor')}
                expandedContentView={structurePanel === 'settings' ? 'editor' : 'menu'}
                onCloseExpandedContent={closeStructurePanel}
                expandedContent={structurePanelContent}
            />
            <div
                id={structureClass()}
                className={`${b('structure')} ${htmlConstructorStructureClass} ${structureClass()}`}
                style={htmlConstructorQuickStyleToReactStyle(structure.quickStyle)}
            >
                {isEmptyConstructor ? (
                    <div className={b('initial', [stop])}>
                        <h2 className={b('initial-title', [stop])}>HTML Constructor</h2>
                        <p className={b('initial-subtitle', [stop])}>{i18n('initial_subtitle')}</p>
                        <div className={b('initial-actions', [stop])}>
                            <Button
                                view="action"
                                size="l"
                                className={stop}
                                onClick={() => toggleStructurePanel('blocks')}
                            >
                                <Icon data={Plus} className={stop} />
                                <span className={stop}>{i18n('add_block')}</span>
                            </Button>
                            {showStructureTemplatesButton && (
                                <Button
                                    view="normal"
                                    size="l"
                                    className={stop}
                                    onClick={() => toggleStructurePanel('templates')}
                                >
                                    <Icon data={LayoutHeaderColumns} className={stop} />
                                    <span className={stop}>{i18n('structure_templates')}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    renderedStructureContent
                )}
                {blocks.map((block, i) => (
                    <HtmlBlockItem
                        key={block.id}
                        block={block}
                        index={i}
                        isDragged={draggedBlockId === block.id}
                        dropTarget={dropTarget}
                        onBeginDrag={beginBlockDrag}
                        onCommitContent={commitBlockContent}
                        onCssChange={updateBlockCss}
                        onQuickStyleChange={updateBlockQuickStyle}
                        onReplace={replaceBlock}
                        onDuplicate={duplicateBlock}
                        onRemove={removeBlock}
                        templates={effectiveTemplates}
                        activeStructureId={activeStructureId}
                    />
                ))}
            </div>
        </div>
    );
};
