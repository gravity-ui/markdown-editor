import {useMemo, useRef, useState} from 'react';
import type {
    CSSProperties,
    FC,
    KeyboardEvent,
    MouseEvent,
    PointerEvent as ReactPointerEvent,
} from 'react';

import {BucketPaint, GripHorizontal, Pencil, Sliders} from '@gravity-ui/icons';
import {Button, Icon, Popup, TextArea, TextInput} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {blockClass, htmlConstructorBlockClass} from '../css';
import {htmlConstructorQuickStyleToReactStyle} from '../quickStyle';
import type {
    HtmlConstructorBlock,
    HtmlConstructorBlockTemplate,
    HtmlConstructorQuickStyle,
    HtmlConstructorTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

import {FloatingToolbar, type FloatingToolbarPrimaryAction} from './FloatingToolbar';
import {BlockSettingsPanel} from './SettingsPopups';
import {TemplatePickerPanel} from './TemplatePicker';
import type {PickerCardModel, PickerGroup} from './TemplatePicker';
import {
    applyBlockTemplateToBlock,
    applyBlockThemeToBlock,
    buildBlockPreviewParts,
    getBlockTemplateById,
    getBlockTemplateStateGroup,
} from './blockUtils';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import type {DropTarget} from './drag';
import {getBlockDragAttrs} from './drag';
import {getTextNodes, setImageSrc, setLinkValues, setTextNodeValue} from './textEditing';
import type {ConfirmFn} from './useConfirm';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;
const inlineEditButtonSelector = `.${b('inline-edit-button')}`;
const textTargetSelector = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'a',
    'span',
    'strong',
    'em',
    'b',
    'i',
    'li',
    'dt',
    'dd',
    'blockquote',
    'figcaption',
    'cite',
    'small',
    'label',
    'td',
    'th',
].join(',');

interface HtmlBlockItemProps {
    block: HtmlConstructorBlock;
    index: number;
    isDragged: boolean;
    dropTarget: DropTarget | null;
    templates: HtmlConstructorTemplate[];
    activeStructureId?: string;
    onBeginDrag: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
    onCommitContent: (blockId: string, content: string) => void;
    onCssChange: (blockId: string, css: string) => void;
    onQuickStyleChange: (blockId: string, quickStyle: HtmlConstructorQuickStyle) => void;
    onReplace: (blockId: string, block: HtmlConstructorBlock) => void;
    onDuplicate: (blockId: string) => void;
    onRemove: (blockId: string) => void;
    confirm: ConfirmFn;
}

type BlockPanel = 'state' | 'theme' | 'settings' | null;

type InlineEditTarget =
    | {
          kind: 'text';
          element: HTMLElement;
          buttonStyle: CSSProperties;
          outlineStyle: CSSProperties;
      }
    | {
          kind: 'link';
          link: HTMLAnchorElement;
          element: HTMLAnchorElement;
          buttonStyle: CSSProperties;
          outlineStyle: CSSProperties;
      }
    | {
          kind: 'image';
          image: HTMLImageElement;
          element: HTMLImageElement;
          buttonStyle: CSSProperties;
          outlineStyle: CSSProperties;
      };

type EditTarget =
    | {kind: 'text'; anchor: HTMLElement; node: Text; outlineStyle: CSSProperties}
    | {
          kind: 'link';
          anchor: HTMLAnchorElement;
          node: HTMLAnchorElement;
          outlineStyle: CSSProperties;
      }
    | {
          kind: 'image';
          anchor: HTMLImageElement;
          node: HTMLImageElement;
          outlineStyle: CSSProperties;
      };

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

const INLINE_EDIT_OUTLINE_PADDING = 4;
const INLINE_EDIT_BUTTON_SIZE = 28;

const getTargetStyles = (root: HTMLElement, target: HTMLElement) => {
    const rect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = targetRect.left - rect.left;
    const top = targetRect.top - rect.top;

    const outlineLeft = Math.max(0, left - INLINE_EDIT_OUTLINE_PADDING);
    const outlineTop = Math.max(0, top - INLINE_EDIT_OUTLINE_PADDING);
    const outlineWidth = targetRect.width + INLINE_EDIT_OUTLINE_PADDING * 2;
    const outlineHeight = targetRect.height + INLINE_EDIT_OUTLINE_PADDING * 2;

    return {
        buttonStyle: {
            // A compact badge pinned to the highlight's top-right corner, nudged
            // outward so it rests on the corner rather than on top of the text.
            left: clamp(
                outlineLeft + outlineWidth - INLINE_EDIT_BUTTON_SIZE + 8,
                4,
                rect.width - INLINE_EDIT_BUTTON_SIZE,
            ),
            top: clamp(outlineTop - 8, 0, rect.height - INLINE_EDIT_BUTTON_SIZE),
        },
        outlineStyle: {
            left: outlineLeft,
            top: outlineTop,
            width: outlineWidth,
            height: outlineHeight,
        },
    };
};

const getEditableTextElement = (root: HTMLElement, target: Element) => {
    const element = target.closest<HTMLElement>(textTargetSelector);

    if (!element || !root.contains(element) || !getTextNodes(element).length) return null;

    return element;
};

const getEditableLinkElement = (root: HTMLElement, target: Element) => {
    const link = target instanceof HTMLAnchorElement ? target : target.closest('a');

    if (!(link instanceof HTMLAnchorElement) || !root.contains(link)) return null;

    return link;
};

const getInlineEditTarget = (
    root: HTMLElement,
    target: EventTarget | null,
): InlineEditTarget | null => {
    if (!(target instanceof Element) || target.closest(inlineEditButtonSelector)) return null;

    const image = target instanceof HTMLImageElement ? target : target.closest('img');
    if (image instanceof HTMLImageElement && root.contains(image)) {
        return {
            kind: 'image',
            image,
            element: image,
            ...getTargetStyles(root, image),
        };
    }

    const link = getEditableLinkElement(root, target);
    if (link) {
        return {
            kind: 'link',
            link,
            element: link,
            ...getTargetStyles(root, link),
        };
    }

    const element = getEditableTextElement(root, target);
    if (!element) return null;

    return {
        kind: 'text',
        element,
        ...getTargetStyles(root, element),
    };
};

const getInlineEditLabel = (target: InlineEditTarget) => {
    if (target.kind === 'image') return i18n('edit_image_src');
    if (target.kind === 'link') return i18n('edit_link');

    return i18n('edit_text');
};

export const HtmlBlockItem: FC<HtmlBlockItemProps> = ({
    block,
    index,
    isDragged,
    dropTarget,
    templates,
    activeStructureId,
    onBeginDrag,
    onCommitContent,
    onCssChange,
    onQuickStyleChange,
    onReplace,
    onDuplicate,
    onRemove,
    confirm,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editHref, setEditHref] = useState('');
    const [blockPanel, setBlockPanel] = useState<BlockPanel>(null);

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

    const handleContentMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        const root = contentRef.current;
        if (!root || editTarget) return;

        const nextTarget = getInlineEditTarget(root, event.target);
        if (!nextTarget) return;

        setInlineEditTarget((currentTarget) => {
            if (
                currentTarget?.kind === nextTarget.kind &&
                currentTarget.element === nextTarget.element
            ) {
                return currentTarget;
            }

            return nextTarget;
        });
    };

    const handleContentMouseOut = (event: MouseEvent<HTMLDivElement>) => {
        const element = inlineEditTarget?.element;
        if (!element || !(event.target instanceof Node) || !element.contains(event.target)) return;

        const nextElement = event.relatedTarget;
        if (
            nextElement instanceof Node &&
            (element.contains(nextElement) ||
                (nextElement instanceof Element && nextElement.closest(inlineEditButtonSelector)))
        ) {
            return;
        }

        setInlineEditTarget(null);
    };

    const clearInlineEditTarget = () => setInlineEditTarget(null);

    const cancelEditing = () => setEditTarget(null);

    const commitEditing = () => {
        const root = contentRef.current;
        if (!root || !editTarget) {
            setEditTarget(null);
            return;
        }

        if (editTarget.kind === 'text') {
            setTextNodeValue(editTarget.node, editValue);
        } else if (editTarget.kind === 'link') {
            setLinkValues(editTarget.node, editValue, editHref);
        } else {
            setImageSrc(editTarget.node, editValue);
        }

        onCommitContent(block.id, root.innerHTML);
        setEditTarget(null);
    };

    const handleEditPopupKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelEditing();
            return;
        }

        // Enter saves; Shift+Enter inserts a newline (handled natively by the textarea).
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            commitEditing();
        }
    };

    const renderEditFields = () => {
        if (!editTarget) return null;

        const controlProps = {onKeyDown: handleEditPopupKeyDown, className: stop};

        if (editTarget.kind === 'link') {
            return (
                <>
                    <TextInput
                        controlProps={controlProps}
                        value={editValue}
                        onUpdate={setEditValue}
                        placeholder={i18n('edit_link_text')}
                        autoFocus
                    />
                    <TextInput
                        controlProps={controlProps}
                        value={editHref}
                        onUpdate={setEditHref}
                        placeholder={i18n('edit_link_href')}
                    />
                </>
            );
        }

        if (editTarget.kind === 'image') {
            return (
                <TextInput
                    controlProps={controlProps}
                    value={editValue}
                    onUpdate={setEditValue}
                    placeholder={i18n('edit_image_src')}
                    autoFocus
                />
            );
        }

        return (
            <TextArea
                controlProps={controlProps}
                value={editValue}
                onUpdate={setEditValue}
                minRows={1}
                maxRows={8}
                autoFocus
            />
        );
    };

    // Editing happens in a popup anchored to the element rather than inline, so the
    // content keeps its place (no layout jump) while the user types.
    const openInlineEditTarget = (target: InlineEditTarget) => {
        const root = contentRef.current;
        if (!root) return false;

        if (target.kind === 'text') {
            const textNode = getTextNodes(target.element)[0];
            if (!textNode) return false;

            setEditTarget({
                kind: 'text',
                anchor: target.element,
                node: textNode,
                outlineStyle: target.outlineStyle,
            });
            setEditValue(textNode.nodeValue ?? '');
        } else if (target.kind === 'link') {
            setEditTarget({
                kind: 'link',
                anchor: target.link,
                node: target.link,
                outlineStyle: target.outlineStyle,
            });
            setEditValue(target.link.textContent ?? '');
            setEditHref(target.link.getAttribute('href') ?? '');
        } else {
            setEditTarget({
                kind: 'image',
                anchor: target.image,
                node: target.image,
                outlineStyle: target.outlineStyle,
            });
            setEditValue(target.image.getAttribute('src') ?? '');
        }

        setInlineEditTarget(null);

        return true;
    };

    const handleOpenInlineEdit = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!inlineEditTarget) return;

        openInlineEditTarget(inlineEditTarget);
    };

    const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
        const root = contentRef.current;
        const target = event.target;
        if (!root || !(target instanceof Element) || target.closest(inlineEditButtonSelector)) {
            return;
        }

        const link = getEditableLinkElement(root, target);
        if (!link || target.closest('img')) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget({
            kind: 'link',
            link,
            element: link,
            ...getTargetStyles(root, link),
        });
    };

    const handleContentDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
        const root = contentRef.current;
        if (!root) return;

        const target = getInlineEditTarget(root, event.target);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
    };

    const handleContentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        const root = contentRef.current;
        if (
            !root ||
            !(event.target instanceof Element) ||
            event.target.closest(inlineEditButtonSelector)
        ) {
            return;
        }

        const target = getInlineEditTarget(root, event.target) ?? inlineEditTarget;
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
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

    const buildThemeGroups = (): PickerGroup[] => {
        if (!activeBlockTemplate || blockThemes.length === 0) return [];

        const hasActiveTheme = blockThemes.some((theme) => block.themeIds.includes(theme.id));
        const autoCard: PickerCardModel = {
            id: '__auto',
            title: i18n('auto'),
            preview: buildBlockPreviewParts(activeBlockTemplate),
            active: !hasActiveTheme,
            onApply: () => applyBlockTheme(undefined),
            variants: [],
        };

        return [
            {
                title: '',
                cards: [
                    autoCard,
                    ...blockThemes.map(
                        (theme): PickerCardModel => ({
                            id: theme.id,
                            title: getTitle(theme),
                            preview: buildBlockPreviewParts(activeBlockTemplate, theme),
                            active: block.themeIds.includes(theme.id),
                            onApply: () => applyBlockTheme(theme),
                            variants: [],
                        }),
                    ),
                ],
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

        if (blockPanel === 'theme') {
            return (
                <TemplatePickerPanel
                    title={i18n('select_theme')}
                    emptyText={i18n('themes_empty')}
                    showSearch={false}
                    buildGroups={buildThemeGroups}
                    onClose={closeBlockPanel}
                />
            );
        }

        if (blockPanel === 'settings') {
            return (
                <BlockSettingsPanel
                    html={block.content}
                    css={block.css}
                    htmlFrame={{
                        top: `<div class="${htmlConstructorBlockClass} ${blockClass(index)}">`,
                        bottom: '</div>',
                    }}
                    onHtmlCommit={(value) => onCommitContent(block.id, value)}
                    onCssChange={(value) => onCssChange(block.id, value)}
                    onClose={closeBlockPanel}
                />
            );
        }

        return null;
    };

    const blockPanelContent = renderBlockPanelContent();
    const blockPrimaryActions = [
        {
            id: 'blockState',
            node: (
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    disabled={states.length <= 1}
                    selected={blockPanel === 'state'}
                    onClick={() => toggleBlockPanel('state')}
                    aria-label={i18n('select_state')}
                    title={i18n('select_state')}
                >
                    <Icon data={Sliders} className={stop} />
                </Button>
            ),
        },
        {
            id: 'blockTheme',
            node: (
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    disabled={!activeBlockTemplate || blockThemes.length === 0}
                    selected={blockPanel === 'theme'}
                    onClick={() => toggleBlockPanel('theme')}
                    aria-label={i18n('select_theme')}
                    title={i18n('select_theme')}
                >
                    <Icon data={BucketPaint} className={stop} />
                </Button>
            ),
        },
    ] as FloatingToolbarPrimaryAction[];

    return (
        <div
            className={`${b('item', {
                dragged: isDragged,
                'drop-before': isDropBefore,
                'drop-after': isDropAfter,
            })} ${stop} ${htmlConstructorBlockClass} ${blockClass(index)}`}
            style={htmlConstructorQuickStyleToReactStyle(block.quickStyle)}
            {...getBlockDragAttrs(block.id)}
        >
            <button
                type="button"
                className={`${b('item-drag')} ${stop}`}
                onPointerDown={handlePointerDown}
                aria-label={i18n('drag_block', {index: String(number)})}
            >
                <Icon data={GripHorizontal} size={14} />
            </button>
            <FloatingToolbar
                settings={block.settings}
                quickStyle={block.quickStyle}
                onQuickStyleChange={(quickStyle) => onQuickStyleChange(block.id, quickStyle)}
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
                lockLabel={i18n('lock_block')}
                expandedContentView={blockPanel === 'settings' ? 'editor' : 'panel'}
                onCloseExpandedContent={closeBlockPanel}
                expandedContent={blockPanelContent}
            />
            <div
                className={`${b('item-content')} ${stop}`}
                contentEditable={false}
                suppressContentEditableWarning
                role="button"
                tabIndex={0}
                onClick={handleContentClick}
                onKeyDown={handleContentKeyDown}
                onMouseMove={handleContentMouseMove}
                onMouseOut={handleContentMouseOut}
                onBlur={clearInlineEditTarget}
                onMouseLeave={clearInlineEditTarget}
                onDoubleClick={handleContentDoubleClick}
            >
                <div
                    ref={contentRef}
                    className={b('item-content-html')}
                    dangerouslySetInnerHTML={{__html: block.content}}
                />
                {inlineEditTarget && !editTarget && (
                    <>
                        <div
                            className={b('inline-edit-outline')}
                            style={inlineEditTarget.outlineStyle}
                        />
                        <button
                            type="button"
                            className={`${b('inline-edit-button')} ${stop}`}
                            style={inlineEditTarget.buttonStyle}
                            onClick={handleOpenInlineEdit}
                            aria-label={getInlineEditLabel(inlineEditTarget)}
                        >
                            <Icon data={Pencil} size={15} className={stop} />
                        </button>
                    </>
                )}
                {editTarget && (
                    <>
                        <div
                            className={b('inline-edit-outline', {active: true})}
                            style={editTarget.outlineStyle}
                        />
                        <Popup
                            open
                            anchorElement={editTarget.anchor}
                            placement={['bottom-start', 'top-start', 'bottom', 'top']}
                            onOpenChange={(open) => {
                                if (!open) cancelEditing();
                            }}
                        >
                            <div className={`${b('inline-edit-popup')} ${stop}`}>
                                {renderEditFields()}
                                <div className={`${b('inline-edit-popup-actions')} ${stop}`}>
                                    <Button
                                        view="flat"
                                        size="s"
                                        className={stop}
                                        onClick={cancelEditing}
                                    >
                                        {i18n('cancel')}
                                    </Button>
                                    <Button
                                        view="action"
                                        size="s"
                                        className={stop}
                                        onClick={commitEditing}
                                    >
                                        {i18n('save')}
                                    </Button>
                                </div>
                            </div>
                        </Popup>
                    </>
                )}
            </div>
        </div>
    );
};
