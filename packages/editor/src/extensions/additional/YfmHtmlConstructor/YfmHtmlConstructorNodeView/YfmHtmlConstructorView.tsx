import {useEffect, useMemo, useState} from 'react';
import type {FC} from 'react';

import {LayoutCells, Palette, Plus} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {i18n} from 'src/i18n/yfm-html-constructor';
import {generateEntityId} from 'src/utils/entity-id';
import {removeNode} from 'src/utils/remove-node';

import {YfmHtmlConstructorConsts, emptyHtmlConstructorStructure} from '../YfmHtmlConstructorSpecs';
import {
    hashToScopeId,
    htmlConstructorScopeClassName,
    htmlConstructorStructureClass,
    scopeCss,
    structureClass,
} from '../css';
import {
    htmlConstructorQuickStyleToReactStyle,
    normalizeHtmlConstructorQuickStyle,
} from '../quickStyle';
import {normalizeHtmlConstructorTemplateSettings} from '../settings';
import {clearStoredTemplates, mergeTemplatesById, readStoredTemplates} from '../templates';
import type {
    HtmlConstructorBlock,
    HtmlConstructorBlockTemplate,
    HtmlConstructorQuickStyle,
    HtmlConstructorStructure,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
    YfmHtmlConstructorExtensionOptions,
} from '../types';

import {BlockTemplatesPanel} from './BlockTemplatesPanel';
import {FloatingToolbar, type FloatingToolbarPrimaryAction} from './FloatingToolbar';
import {HtmlBlockItem} from './HtmlBlockItem';
import {StructureSettingsPanel} from './SettingsPopups';
import {StructureTemplatesPanel} from './StructureTemplatesPanel';
import {TemplatePickerPanel} from './TemplatePicker';
import type {PickerCardModel, PickerGroup} from './TemplatePicker';
import {
    applyStructureThemeToState,
    assembleStructureCss,
    assembleStructureHtml,
    blockTemplateToBlock,
    buildPreviewCss,
    buildStructurePreviewParts,
    cloneHtmlConstructorBlock,
    getActiveStructureTemplateId,
    getStructureCssFrame,
    getStructureHtmlFrame,
    getStructureTemplateById,
    getStructureThemeTemplates,
    parseStructureHtml,
    rawTemplateBlockToBlock,
    regenerateHtmlIds,
    structureTemplateToAttrs,
} from './blockUtils';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {useHtmlBlockDrag} from './drag';
import {useConfirm} from './useConfirm';
import {useInlineHtmlEditing} from './useInlineHtmlEditing';

import './YfmHtmlConstructor.scss';

export {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const EMPTY_BLOCKS: HtmlConstructorBlock[] = [];
type StructurePanel = 'blocks' | 'templates' | 'themes' | 'settings' | null;

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

export type YfmHtmlConstructorEditorState = {
    structure: HtmlConstructorStructure;
    blocks: HtmlConstructorBlock[];
};

export const YfmHtmlConstructorEditor: FC<{
    state: YfmHtmlConstructorEditorState;
    entityId: string;
    options: YfmHtmlConstructorExtensionOptions;
    onChange: (state: YfmHtmlConstructorEditorState) => void;
    onDuplicate?: () => void;
    onRemove?: () => void | Promise<void>;
    duplicateLabel?: string;
    removeLabel?: string;
    lockLabel?: string;
    /** External one-shot signal to open one of the structure panels. */
    openStructurePanelSignal?: {panel: Exclude<StructurePanel, null>; tick: number};
}> = ({
    state,
    entityId,
    options,
    onChange,
    onDuplicate,
    onRemove,
    duplicateLabel,
    removeLabel = i18n('remove_constructor'),
    lockLabel,
    openStructurePanelSignal,
}) => {
    const {structure, blocks} = state;
    const {templates, scopeStyles} = options;

    const scopeClass = scopeStyles
        ? htmlConstructorScopeClassName(hashToScopeId(entityId))
        : undefined;

    const previewCss = useMemo(() => {
        const css = buildPreviewCss({blocks, structure});
        return scopeClass && css ? scopeCss(css, `.${scopeClass}`) : css;
    }, [blocks, structure, scopeClass]);
    const [structurePanel, setStructurePanel] = useState<StructurePanel>(null);

    useEffect(() => {
        if (!openStructurePanelSignal) return;
        setStructurePanel(openStructurePanelSignal.panel);
    }, [openStructurePanelSignal?.panel, openStructurePanelSignal?.tick]);

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

    const {confirm, confirmElement} = useConfirm();

    const isEmptyConstructor = !structure.content.trim() && blocks.length === 0;

    const closeStructurePanel = () => setStructurePanel(null);
    const toggleStructurePanel = (panel: Exclude<StructurePanel, null>) => {
        setStructurePanel((current) => (current === panel ? null : panel));
    };

    const setStructure = (next: HtmlConstructorStructure) =>
        onChange({structure: next, blocks});

    const setBlocks = (next: HtmlConstructorBlock[]) =>
        onChange({structure, blocks: next});

    const structureEditing = useInlineHtmlEditing({
        onCommit: (content) => setStructure({...structure, content}),
    });

    const {beginBlockDrag, draggedBlockId, dropTarget} = useHtmlBlockDrag({
        blocks,
        onMove: setBlocks,
    });

    // Applying a structure replaces everything. The first time (empty constructor)
    // it just inserts; afterwards we confirm, since existing content is overwritten.
    const confirmStructureOverwriteIfNeeded = async () => {
        if (isEmptyConstructor) return true;
        return confirm({
            title: i18n('confirm_replace_structure_title'),
            message: i18n('confirm_replace_structure_message'),
            confirmText: i18n('replace'),
            danger: true,
        });
    };

    const applyStructureTemplate = async (
        template: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => {
        if (!(await confirmStructureOverwriteIfNeeded())) return;

        const attrs = structureTemplateToAttrs(effectiveTemplates, template, theme);
        onChange({structure: attrs.structure, blocks: attrs.blocks});
        closeStructurePanel();
    };

    const applyCustomStructure = async ({content, css}: {content: string; css: string}) => {
        if (!(await confirmStructureOverwriteIfNeeded())) return;

        onChange({
            structure: {
                ...emptyHtmlConstructorStructure(),
                content,
                css,
            },
            blocks: [],
        });
        closeStructurePanel();
    };

    const clearTemplates = async () => {
        const confirmed = await confirm({
            title: i18n('confirm_clear_templates_title'),
            message: i18n('confirm_clear_templates_message'),
            confirmText: i18n('clear'),
            danger: true,
        });
        if (!confirmed) return;

        setStoredTemplates(clearStoredTemplates());
    };

    const removeConstructor = async () => {
        if (!onRemove) return;

        const confirmed = await confirm({
            title: i18n('confirm_remove_constructor_title'),
            message: i18n('confirm_remove_constructor_message'),
            confirmText: i18n('confirm_remove_constructor_action'),
            danger: true,
        });
        if (!confirmed) return;

        await onRemove();
    };

    const applyStructureTheme = (theme?: HtmlConstructorThemeTemplate) => {
        if (!activeStructureTemplate) return;

        setStructure(applyStructureThemeToState(structure, activeStructureTemplate, theme));
        closeStructurePanel();
    };

    const buildStructureThemeGroups = (): PickerGroup[] => {
        if (!activeStructureTemplate || structureThemes.length === 0) return [];

        const hasActiveTheme = structureThemes.some((theme) =>
            structure.themeIds.includes(theme.id),
        );
        const autoCard: PickerCardModel = {
            id: '__auto',
            title: i18n('auto'),
            preview: buildStructurePreviewParts(effectiveTemplates, activeStructureTemplate),
            active: !hasActiveTheme,
            onApply: () => applyStructureTheme(undefined),
            variants: [],
        };

        return [
            {
                title: '',
                cards: [
                    autoCard,
                    ...structureThemes.map(
                        (theme): PickerCardModel => ({
                            id: theme.id,
                            title: theme.title?.trim() || theme.id,
                            preview: buildStructurePreviewParts(
                                effectiveTemplates,
                                activeStructureTemplate,
                                theme,
                            ),
                            active: structure.themeIds.includes(theme.id),
                            onApply: () => applyStructureTheme(theme),
                            variants: [],
                        }),
                    ),
                ],
            },
        ];
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

    // The structure code editor shows the full assembled document. On commit the inner
    // markup is split back into structure content + blocks, and all CSS is consolidated
    // into the structure stylesheet (per-block CSS is cleared, as it now lives there).
    const commitStructureDocumentHtml = (html: string) => {
        const {content, blocks: nextBlocks} = parseStructureHtml(html, structure, blocks);
        onChange({structure: {...structure, content}, blocks: nextBlocks});
    };

    const commitStructureDocumentCss = (css: string) => {
        onChange({
            structure: {...structure, css},
            blocks: blocks.map((block) => ({
                ...block,
                css: '',
            })),
        });
    };

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

    const renderStructurePanelContent = () => {
        if (structurePanel === 'blocks') {
            return (
                <BlockTemplatesPanel
                    templates={effectiveTemplates}
                    activeStructureId={activeStructureId}
                    emptyText={i18n('block_templates_empty')}
                    onClose={closeStructurePanel}
                    onApplyTemplate={applyBlockTemplate}
                    onApplyHtml={applyRawBlock}
                />
            );
        }

        if (structurePanel === 'templates') {
            return (
                <StructureTemplatesPanel
                    templates={effectiveTemplates}
                    allowAdd={allowAdd}
                    emptyText={i18n('structure_templates_empty')}
                    hasStoredTemplates={storedTemplates.length > 0}
                    onClose={closeStructurePanel}
                    onApply={applyStructureTemplate}
                    onApplyCustom={applyCustomStructure}
                    onAdded={setStoredTemplates}
                    onClear={clearTemplates}
                />
            );
        }

        if (structurePanel === 'themes') {
            return (
                <TemplatePickerPanel
                    title={i18n('select_theme')}
                    emptyText={i18n('themes_empty')}
                    showSearch={false}
                    buildGroups={buildStructureThemeGroups}
                    onClose={closeStructurePanel}
                />
            );
        }

        if (structurePanel === 'settings') {
            return (
                <StructureSettingsPanel
                    html={assembleStructureHtml(structure, blocks)}
                    css={assembleStructureCss(structure, blocks)}
                    htmlFrame={getStructureHtmlFrame()}
                    cssFrame={getStructureCssFrame()}
                    onHtmlCommit={commitStructureDocumentHtml}
                    onCssChange={commitStructureDocumentCss}
                    onClose={closeStructurePanel}
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
                    <Icon data={Palette} className={stop} />
                </Button>
            ),
        },
    ].filter(Boolean) as FloatingToolbarPrimaryAction[];

    return (
        <div className={`${b({empty: isEmptyConstructor})}${scopeClass ? ` ${scopeClass}` : ''}`}>
            {confirmElement}
            {previewCss && <style>{previewCss}</style>}

            <FloatingToolbar
                settings={structure.settings}
                quickStyle={structure.quickStyle}
                onQuickStyleChange={(quickStyle) => patchStructure({quickStyle})}
                styleDisabled={isEmptyConstructor}
                onOpenSettings={() => toggleStructurePanel('settings')}
                hideRawButton
                primaryActions={structurePrimaryActions}
                onDuplicate={onDuplicate}
                onRemove={onRemove ? removeConstructor : undefined}
                codeLabel={i18n('structure_settings')}
                duplicateLabel={duplicateLabel}
                removeLabel={removeLabel}
                lockLabel={lockLabel}
                expandedContentView={structurePanel === 'settings' ? 'editor' : 'panel'}
                onCloseExpandedContent={closeStructurePanel}
                expandedContent={structurePanelContent}
            />
            <div
                ref={structureEditing.boundsRef}
                id={structureClass()}
                className={`${b('structure')} ${htmlConstructorStructureClass} ${structureClass()}`}
                style={htmlConstructorQuickStyleToReactStyle(structure.quickStyle)}
                contentEditable={false}
                suppressContentEditableWarning
                {...structureEditing.containerHandlers}
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
                                    <Icon data={LayoutCells} className={stop} />
                                    <span className={stop}>{i18n('select_structure')}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div
                        ref={structureEditing.contentRef}
                        className={b('structure-content')}
                        dangerouslySetInnerHTML={{__html: structure.content}}
                    />
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
                        confirm={confirm}
                        templates={effectiveTemplates}
                        activeStructureId={activeStructureId}
                    />
                ))}
                {!isEmptyConstructor && structureEditing.overlay}
            </div>
        </div>
    );
};

export const YfmHtmlConstructorView: FC<{
    node: Node;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
    options: YfmHtmlConstructorExtensionOptions;
}> = ({node, getPos, view, onChange, options}) => {
    const structure = readStructure(node);
    const blocks = readBlocks(node);
    const entityId = String(node.attrs[YfmHtmlConstructorConsts.NodeAttrs.EntityId] ?? '');

    const handleChange = (state: YfmHtmlConstructorEditorState) => {
        onChange({
            [YfmHtmlConstructorConsts.NodeAttrs.structure]: state.structure,
            [YfmHtmlConstructorConsts.NodeAttrs.blocks]: state.blocks,
        });
    };

    const duplicateConstructor = () => {
        const pos = getPos();
        if (pos === undefined) return;

        const nextNode = node.type.create({
            ...node.attrs,
            [YfmHtmlConstructorConsts.NodeAttrs.structure]: {
                ...structure,
                content: regenerateHtmlIds(structure.content),
            },
            [YfmHtmlConstructorConsts.NodeAttrs.blocks]: blocks.map(cloneHtmlConstructorBlock),
            // Fresh entity id -> fresh scope hash, so the copy's scoped CSS does not
            // collide with the original instance on the same page.
            [YfmHtmlConstructorConsts.NodeAttrs.EntityId]: generateEntityId(
                YfmHtmlConstructorConsts.NodeName,
            ),
        });

        view.dispatch(view.state.tr.insert(pos + node.nodeSize, nextNode));
    };

    const removeConstructor = () => {
        const pos = getPos();
        if (pos === undefined) return;
        removeNode({node, pos, tr: view.state.tr, dispatch: view.dispatch});
    };

    return (
        <YfmHtmlConstructorEditor
            state={{structure, blocks}}
            entityId={entityId}
            options={options}
            onChange={handleChange}
            onDuplicate={duplicateConstructor}
            onRemove={removeConstructor}
            duplicateLabel={i18n('duplicate_constructor')}
            removeLabel={i18n('remove_constructor')}
            lockLabel={i18n('lock_constructor')}
        />
    );
};
