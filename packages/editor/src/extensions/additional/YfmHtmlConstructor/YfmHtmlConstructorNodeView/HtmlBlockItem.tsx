import {useMemo, useState} from 'react';
import type {FC, PointerEvent as ReactPointerEvent} from 'react';

import {GripHorizontal, Palette, Sliders} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {blockClass, htmlConstructorBlockClass} from '../css';
import {htmlConstructorQuickStyleToReactStyle} from '../quickStyle';
import {buildBlockPreviewParts} from '../templates/preview';
import {
    applyBlockTemplateToBlock,
    applyBlockThemeToBlock,
    getBlockTemplateById,
    getBlockTemplateStateGroup,
} from '../templates/state';
import type {
    HtmlConstructorBlock,
    HtmlConstructorBlockTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

import {CodeSettingsPanel} from './CodeSettingsPanel';
import {FloatingToolbar, type FloatingToolbarPrimaryAction} from './FloatingToolbar';
import {TemplatePickerPanel} from './TemplatePicker';
import type {PickerCardModel, PickerGroup} from './TemplatePicker';
import {ThemePickerPanel} from './ThemePickerPanel';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import type {DropTarget} from './drag';
import {getBlockDragAttrs} from './drag';
import type {ConfirmFn} from './useConfirm';
import {useInlineHtmlEditing} from './useInlineHtmlEditing';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

interface HtmlBlockItemProps {
    block: HtmlConstructorBlock;
    index: number;
    isDragged: boolean;
    dropTarget: DropTarget | null;
    templates: HtmlConstructorTemplate[];
    activeStructureId?: string;
    onBeginDrag: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
    onChange: (blockId: string, patch: Partial<HtmlConstructorBlock>) => void;
    onReplace: (blockId: string, block: HtmlConstructorBlock) => void;
    onDuplicate: (blockId: string) => void;
    onRemove: (blockId: string) => void;
    confirm: ConfirmFn;
}

type BlockPanel = 'state' | 'theme' | 'settings' | null;

export const HtmlBlockItem: FC<HtmlBlockItemProps> = ({
    block,
    index,
    isDragged,
    dropTarget,
    templates,
    activeStructureId,
    onBeginDrag,
    onChange,
    onReplace,
    onDuplicate,
    onRemove,
    confirm,
}) => {
    const [blockPanel, setBlockPanel] = useState<BlockPanel>(null);

    const {contentRef, boundsRef, containerHandlers, overlay} = useInlineHtmlEditing({
        onCommit: (html) => onChange(block.id, {content: html}),
    });

    const number = index + 1;
    const isDropBefore = dropTarget?.id === block.id && dropTarget.placement === 'before';
    const isDropAfter = dropTarget?.id === block.id && dropTarget.placement === 'after';
    const activeBlockTemplate = useMemo(
        () => getBlockTemplateById(templates, block.templateId),
        [block.templateId, templates],
    );
    const {states, themesByBlockId} = useMemo(
        () => getBlockTemplateStateGroup(templates, block.templateId, activeStructureId),
        [activeStructureId, block.templateId, templates],
    );
    const blockThemes = activeBlockTemplate ? (themesByBlockId[activeBlockTemplate.id] ?? []) : [];

    const closeBlockPanel = () => setBlockPanel(null);
    const toggleBlockPanel = (panel: Exclude<BlockPanel, null>) => {
        setBlockPanel((current) => (current === panel ? null : panel));
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        onBeginDrag(block.id, event);
    };

    const applyBlockState = async (
        template: HtmlConstructorBlockTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => {
        // Switching state replaces the block's content, so confirm when there is
        // something to lose.
        if (block.content.trim()) {
            const confirmed = await confirm({
                title: i18n('confirm_change_state_title'),
                message: i18n('confirm_change_state_message'),
                confirmText: i18n('change'),
                danger: true,
            });
            if (!confirmed) return;
        }

        onReplace(block.id, applyBlockTemplateToBlock(block, template, theme));
        closeBlockPanel();
    };

    const applyBlockTheme = (theme?: HtmlConstructorThemeTemplate) => {
        if (!activeBlockTemplate) return;

        onReplace(block.id, applyBlockThemeToBlock(block, activeBlockTemplate, theme));
        closeBlockPanel();
    };

    const buildStateGroups = (): PickerGroup[] => {
        if (states.length === 0) return [];

        return [
            {
                title: '',
                cards: states.map((state): PickerCardModel => {
                    const stateThemes = themesByBlockId[state.id] ?? [];

                    return {
                        id: state.id,
                        title: getTitle(state),
                        preview: buildBlockPreviewParts(state),
                        active: state.id === block.templateId,
                        badge: stateThemes.length
                            ? i18n('variants_count', {count: stateThemes.length})
                            : undefined,
                        onApply: () => applyBlockState(state),
                        variants: stateThemes.map((theme) => ({
                            key: theme.id,
                            label: getTitle(theme),
                            preview: buildBlockPreviewParts(state, theme),
                            onApply: () => applyBlockState(state, theme),
                        })),
                    };
                }),
            },
        ];
    };

    const renderBlockPanelContent = () => {
        if (blockPanel === 'state') {
            return (
                <TemplatePickerPanel
                    title={i18n('select_state')}
                    emptyText={i18n('states_empty')}
                    showSearch={false}
                    buildGroups={buildStateGroups}
                    onClose={closeBlockPanel}
                />
            );
        }

        if (blockPanel === 'theme' && activeBlockTemplate) {
            return (
                <ThemePickerPanel
                    themes={blockThemes}
                    activeIds={block.themeIds}
                    buildPreview={(theme) => buildBlockPreviewParts(activeBlockTemplate, theme)}
                    onApply={applyBlockTheme}
                    onClose={closeBlockPanel}
                />
            );
        }

        if (blockPanel === 'settings') {
            return (
                <CodeSettingsPanel
                    html={block.content}
                    css={block.css}
                    htmlFrame={{
                        top: `<div class="${htmlConstructorBlockClass} ${blockClass(index)}">`,
                        bottom: '</div>',
                    }}
                    onCommit={(change) =>
                        onChange(block.id, {
                            ...(change.html === undefined ? {} : {content: change.html}),
                            ...(change.css === undefined ? {} : {css: change.css}),
                        })
                    }
                    onClose={closeBlockPanel}
                />
            );
        }

        return null;
    };

    const blockPanelContent = renderBlockPanelContent();
    const blockPrimaryActions: FloatingToolbarPrimaryAction[] = [
        {
            id: 'blockState',
            icon: Sliders,
            label: i18n('select_state'),
            disabled: states.length <= 1,
            selected: blockPanel === 'state',
            onClick: () => toggleBlockPanel('state'),
        },
        {
            id: 'blockTheme',
            icon: Palette,
            label: i18n('select_theme'),
            disabled: !activeBlockTemplate || blockThemes.length === 0,
            selected: blockPanel === 'theme',
            onClick: () => toggleBlockPanel('theme'),
        },
    ];

    return (
        <div
            className={`${b('item', {
                dragged: isDragged,
                'drop-before': isDropBefore,
                'drop-after': isDropAfter,
                'panel-open': blockPanel !== null,
            })} ${stop} ${htmlConstructorBlockClass} ${blockClass(index)}`}
            style={htmlConstructorQuickStyleToReactStyle(block.quickStyle)}
            {...getBlockDragAttrs(block.id)}
        >
            <button
                type="button"
                className={`${b('item-drag')} ${stop}`}
                data-hc-ui
                onPointerDown={handlePointerDown}
                aria-label={i18n('drag_block', {index: String(number)})}
            >
                <Icon data={GripHorizontal} size={14} />
            </button>
            <FloatingToolbar
                constrainToParent
                settings={block.settings}
                quickStyle={block.quickStyle}
                onQuickStyleChange={(quickStyle) => onChange(block.id, {quickStyle})}
                onOpenSettings={() => toggleBlockPanel('settings')}
                primaryActions={blockPrimaryActions}
                onDuplicate={() => onDuplicate(block.id)}
                onRemove={async () => {
                    const confirmed = await confirm({
                        title: i18n('confirm_remove_block_title'),
                        message: i18n('confirm_remove_block_message'),
                        confirmText: i18n('remove_block'),
                        danger: true,
                    });
                    if (!confirmed) return;

                    closeBlockPanel();
                    onRemove(block.id);
                }}
                codeLabel={i18n('block_css', {index: String(number)})}
                duplicateLabel={i18n('duplicate_block')}
                removeLabel={i18n('remove_block')}
                expandedContentView={blockPanel === 'settings' ? 'editor' : 'panel'}
                onCloseExpandedContent={closeBlockPanel}
                expandedContent={blockPanelContent}
            />
            <div
                ref={boundsRef}
                className={`${b('item-content')} ${stop}`}
                contentEditable={false}
                suppressContentEditableWarning
                role="button"
                aria-label={i18n('edit_element')}
                tabIndex={0}
                {...containerHandlers}
            >
                <div
                    ref={contentRef}
                    className={b('item-content-html')}
                    data-placeholder={i18n('block_placeholder')}
                    dangerouslySetInnerHTML={{__html: block.content}}
                />
                {overlay}
            </div>
        </div>
    );
};
