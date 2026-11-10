import {useMemo, useState} from 'react';
import type {FC} from 'react';

import {LayoutCells, LayoutHeaderColumns, Palette, Plus} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {YfmHtmlConstructorConsts} from '../YfmHtmlConstructorSpecs';
import {
    hashToScopeId,
    htmlConstructorScopeClassName,
    htmlConstructorStructureClass,
    structureClass,
} from '../css';
import {buildPreviewCss} from '../document';
import {readBlocks, readStructure} from '../model';
import {htmlConstructorQuickStyleToReactStyle} from '../quickStyle';
import {useTemplateCatalog} from '../templates/useTemplateCatalog';
import type {YfmHtmlConstructorExtensionOptions} from '../types';

import {FloatingToolbar, type FloatingToolbarPrimaryAction} from './FloatingToolbar';
import {HtmlBlockItem} from './HtmlBlockItem';
import {StructurePanel, type StructurePanelKind} from './StructurePanel';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {useHtmlBlockDrag} from './drag';
import {useConfirm} from './useConfirm';
import {useConstructorCommands} from './useConstructorCommands';
import {useInlineHtmlEditing} from './useInlineHtmlEditing';

import './YfmHtmlConstructor.scss';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

export const YfmHtmlConstructorView: FC<{
    node: Node;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
    options: YfmHtmlConstructorExtensionOptions;
}> = ({node, getPos, view, onChange, options}) => {
    const commands = useConstructorCommands({nodeType: node.type, getPos, view, onChange});
    const structure = useMemo(() => readStructure(node), [node]);
    const blocks = useMemo(() => readBlocks(node), [node]);

    const scopeClass = htmlConstructorScopeClassName(
        hashToScopeId(String(node.attrs[YfmHtmlConstructorConsts.NodeAttrs.EntityId] ?? '')),
    );

    const previewCss = useMemo(
        () =>
            buildPreviewCss({
                blocks,
                structure,
                scopeSelector: `.${scopeClass}`,
                exclude: '[data-hc-ui]',
            }),
        [blocks, structure, scopeClass],
    );
    const [structurePanel, setStructurePanel] = useState<StructurePanelKind | null>(null);

    const catalog = useTemplateCatalog(options.templates, structure.templateId);
    const {confirm, confirmElement} = useConfirm();

    const isEmptyConstructor = !structure.content.trim() && blocks.length === 0;

    const closeStructurePanel = () => setStructurePanel(null);
    const toggleStructurePanel = (panel: StructurePanelKind) => {
        setStructurePanel((current) => (current === panel ? null : panel));
    };

    const structureEditing = useInlineHtmlEditing({
        onCommit: (content) => commands.patchStructure({content}),
    });

    const {beginBlockDrag, draggedBlockId, dropTarget} = useHtmlBlockDrag({
        blocks,
        onMove: commands.setBlocks,
    });

    const removeConstructor = async () => {
        const confirmed = await confirm({
            title: i18n('confirm_remove_constructor_title'),
            message: i18n('confirm_remove_constructor_message'),
            confirmText: i18n('confirm_remove_constructor_action'),
            danger: true,
        });
        if (!confirmed) return;

        commands.remove();
    };

    const structurePrimaryActions: FloatingToolbarPrimaryAction[] = [
        {
            id: 'addBlock',
            icon: Plus,
            label: i18n('add_block'),
            selected: structurePanel === 'blocks',
            onClick: () => toggleStructurePanel('blocks'),
        },
    ];
    if (catalog.showButton)
        structurePrimaryActions.push({
            id: 'selectStructure',
            icon: LayoutHeaderColumns,
            label: i18n('structure_templates'),
            selected: structurePanel === 'templates',
            onClick: () => toggleStructurePanel('templates'),
        });
    structurePrimaryActions.push({
        id: 'structureTheme',
        icon: Palette,
        label: i18n('select_theme'),
        disabled: !catalog.activeStructure || catalog.themes.length === 0,
        selected: structurePanel === 'themes',
        onClick: () => toggleStructurePanel('themes'),
    });

    return (
        <div className={`${b({empty: isEmptyConstructor})} ${scopeClass}`}>
            {confirmElement}
            {previewCss && <style>{previewCss}</style>}

            <FloatingToolbar
                settings={structure.settings}
                quickStyle={structure.quickStyle}
                onQuickStyleChange={(quickStyle) => commands.patchStructure({quickStyle})}
                styleDisabled={isEmptyConstructor}
                onOpenSettings={() => toggleStructurePanel('settings')}
                primaryActions={structurePrimaryActions}
                onDuplicate={commands.duplicate}
                onRemove={removeConstructor}
                codeLabel={i18n('structure_settings')}
                duplicateLabel={i18n('duplicate_constructor')}
                removeLabel={i18n('remove_constructor')}
                expandedContentView={structurePanel === 'settings' ? 'editor' : 'panel'}
                onCloseExpandedContent={closeStructurePanel}
                expandedContent={
                    structurePanel && (
                        <StructurePanel
                            panel={structurePanel}
                            document={{structure, blocks}}
                            catalog={catalog}
                            commands={commands}
                            confirm={confirm}
                            onClose={closeStructurePanel}
                        />
                    )
                }
            />
            <div
                ref={structureEditing.boundsRef}
                id={structureClass()}
                className={`${b('structure')} ${htmlConstructorStructureClass} ${structureClass()}`}
                style={htmlConstructorQuickStyleToReactStyle(structure.quickStyle)}
                contentEditable={false}
                suppressContentEditableWarning
                tabIndex={isEmptyConstructor ? undefined : 0}
                aria-label={i18n('edit_element')}
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
                            {catalog.showButton && (
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
                        onChange={commands.patchBlock}
                        onReplace={commands.replaceBlock}
                        onDuplicate={commands.duplicateBlock}
                        onRemove={commands.removeBlock}
                        confirm={confirm}
                        templates={catalog.items}
                        activeStructureId={structure.templateId}
                    />
                ))}
                {!isEmptyConstructor && structureEditing.overlay}
            </div>
        </div>
    );
};
