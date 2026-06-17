import {useEffect, useMemo, useRef, useState} from 'react';

import {Gear, GripHorizontal, LayoutHeaderColumns, Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Popup} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/grid-block-templates';
import {useBooleanState, useElementState} from 'src/react-utils/hooks';
import {removeNode} from 'src/utils/remove-node';

import {blockClass, gridScopeClass, inlineToRule, scopeCss} from '../css';
import {GridBlockTemplatesConsts} from '../GridBlockTemplatesSpecs/const';
import type {
    GridBlock,
    GridBlockBlockTemplate,
    GridBlockContainerTemplate,
    GridBlockTemplate,
    GridBlockTemplateBlock,
    GridBlockTemplatesOptions,
} from '../types';
import {mergeTemplatesById, readStoredTemplates} from '../templates';

import {BlockInsertPopup} from './BlockInsertPopup';
import {TemplatesPopup} from './TemplatesPopup';
import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

import './GridBlockTemplates.scss';

export {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;
const BLOCK_ID_ATTR = 'data-grid-block-id';

const genId = () => Math.random().toString(36).slice(2, 10);

const toBlock = (template: GridBlockBlockTemplate): GridBlock => ({
    id: genId(),
    css: inlineToRule(template.block.css),
    content: template.block.content,
});

type DropPlacement = 'before' | 'after';

const EDITABLE_TEXT_NODE_ATTR = 'data-grid-block-editable-text';
const EDITABLE_TEXT_NODE_SELECTOR = `[${EDITABLE_TEXT_NODE_ATTR}="true"]`;

const focusEditableTextNode = (element: HTMLElement) => {
    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
};

const enableTextNodeEditing = (root: HTMLElement) => {
    const existingTextNode = root.querySelector<HTMLElement>(EDITABLE_TEXT_NODE_SELECTOR);
    if (existingTextNode) {
        focusEditableTextNode(existingTextNode);
        return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
        const current = walker.currentNode as Text;
        if (current.nodeValue?.trim()) textNodes.push(current);
    }

    for (const textNode of textNodes) {
        const span = document.createElement('span');
        span.setAttribute(EDITABLE_TEXT_NODE_ATTR, 'true');
        span.className = `${b('editable-text')} ${stop}`;
        span.contentEditable = 'true';
        span.textContent = textNode.nodeValue;
        textNode.replaceWith(span);
    }

    const firstTextNode = root.querySelector<HTMLElement>(EDITABLE_TEXT_NODE_SELECTOR);
    if (firstTextNode) focusEditableTextNode(firstTextNode);
};

const readTextOnlyEditedHtml = (root: HTMLElement) => {
    const clone = root.cloneNode(true) as HTMLElement;
    for (const wrapper of clone.querySelectorAll(EDITABLE_TEXT_NODE_SELECTOR)) {
        wrapper.replaceWith(document.createTextNode(wrapper.textContent ?? ''));
    }
    return clone.innerHTML;
};

const insertPlainTextAtSelection = (text: string) => {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!selection || !range) return;

    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
};

const getDropPlacement = (rect: DOMRect, clientX: number, clientY: number): DropPlacement => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const useHorizontalAxis = Math.abs(clientX - centerX) > Math.abs(clientY - centerY);

    return useHorizontalAxis
        ? clientX < centerX
            ? 'before'
            : 'after'
        : clientY < centerY
          ? 'before'
          : 'after';
};

const moveBlock = (
    blocks: GridBlock[],
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
) => {
    if (draggedId === targetId) return blocks;

    const dragged = blocks.find((block) => block.id === draggedId);
    if (!dragged) return blocks;

    const withoutDragged = blocks.filter((block) => block.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((block) => block.id === targetId);
    if (targetIndex === -1) return blocks;

    const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
    return [...withoutDragged.slice(0, insertIndex), dragged, ...withoutDragged.slice(insertIndex)];
};

const BlockSettingsPopup: React.FC<{
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    html: string;
    css: string;
    onHtmlChange: (value: string) => void;
    onCssChange: (value: string) => void;
}> = ({anchor, open, onClose, html, css, onHtmlChange, onCssChange}) => (
    <Popup anchorElement={anchor} open={open} onOpenChange={onClose} placement="bottom-end">
        <div className={b('block-settings-editor', [stop])}>
            <div className={b('field')}>
                <div className={b('field-label')}>{i18n('html')}</div>
                <TextArea
                    controlProps={{className: stop}}
                    value={html}
                    onUpdate={onHtmlChange}
                    placeholder={i18n('block_html_placeholder')}
                    minRows={6}
                    autoFocus
                />
            </div>
            <div className={b('field')}>
                <div className={b('field-label')}>{i18n('css')}</div>
                <TextArea
                    controlProps={{className: stop}}
                    value={css}
                    onUpdate={onCssChange}
                    placeholder={'& {\n  padding: 16px;\n  border-radius: 8px;\n}\nh3 {\n  margin: 0;\n}'}
                    minRows={5}
                />
            </div>
        </div>
    </Popup>
);

const ContainerCssPopup: React.FC<{
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    css: string;
    onCssChange: (value: string) => void;
}> = ({anchor, open, onClose, css, onCssChange}) => (
    <Popup anchorElement={anchor} open={open} onOpenChange={onClose} placement="bottom-end">
        <div className={b('css-editor', [stop])}>
            <TextArea
                controlProps={{className: stop}}
                value={css}
                onUpdate={onCssChange}
                placeholder={'.grid {\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.block-1 {\n  background: #eee;\n}'}
                minRows={6}
                autoFocus
            />
        </div>
    </Popup>
);

export const GridBlockTemplatesView: React.FC<{
    node: Node;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
    options: {templates?: GridBlockTemplatesOptions};
}> = ({node, getPos, view, onChange, options}) => {
    const entityId: string = node.attrs[GridBlockTemplatesConsts.NodeAttrs.EntityId];
    const customCss: string = node.attrs[GridBlockTemplatesConsts.NodeAttrs.customCss] ?? '';
    const blocks: GridBlock[] = node.attrs[GridBlockTemplatesConsts.NodeAttrs.blocks] ?? [];
    const {templates} = options;

    const scopeClass = useMemo(() => gridScopeClass(entityId), [entityId]);
    const scopedCss = useMemo(() => {
        const rules = [
            customCss.trim() && scopeCss(customCss, `.${scopeClass}`).trim(),
            ...blocks.map(
                (block, i) =>
                    block.css.trim() &&
                    scopeCss(block.css, `.${scopeClass} .${blockClass(i)}`).trim(),
            ),
        ].filter(Boolean);
        return rules.join('\n');
    }, [customCss, blocks, scopeClass]);

    const [containerAnchor, setContainerAnchor] = useElementState();
    const [containerCssOpen, setContainerCssOpen] = useState(false);

    const [blockAnchor, setBlockAnchor] = useElementState();
    const [editingBlockSettingsId, setEditingBlockSettingsId] = useState<string | null>(null);
    const [editingBlockContentId, setEditingBlockContentId] = useState<string | null>(null);
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{
        id: string;
        placement: DropPlacement;
    } | null>(null);
    const dragStateRef = useRef<{
        draggedId: string;
        target: {id: string; placement: DropPlacement} | null;
    } | null>(null);
    const cleanupDragListenersRef = useRef<(() => void) | null>(null);

    const allowAdd = Boolean(templates?.allowAdd);
    const [storedTemplates, setStoredTemplates] =
        useState<GridBlockTemplate[]>(readStoredTemplates);
    const effectiveTemplates = useMemo(
        () => mergeTemplatesById(templates?.items ?? [], storedTemplates),
        [templates?.items, storedTemplates],
    );
    const containerTemplates = effectiveTemplates.filter(
        (template): template is GridBlockContainerTemplate => template.type === 'container',
    );
    const blockTemplates = effectiveTemplates.filter(
        (template): template is GridBlockBlockTemplate => template.type === 'block',
    );

    const showContainerTemplatesButton =
        Boolean(templates?.showButton) && (allowAdd || containerTemplates.length > 0);
    const [containerTemplatesOpen, , closeContainerTemplates, toggleContainerTemplatesOpen] =
        useBooleanState(false);
    const [containerTemplatesAnchor, setContainerTemplatesAnchor] = useElementState();
    const [blockTemplatesOpen, openBlockTemplates, closeBlockTemplates] = useBooleanState(false);
    const [blockTemplatesAnchor, setBlockTemplatesAnchor] = useState<HTMLElement | null>(null);

    const setBlocks = (next: GridBlock[]) =>
        onChange({[GridBlockTemplatesConsts.NodeAttrs.blocks]: next});

    const applyContainerTemplate = (template: GridBlockContainerTemplate) => {
        onChange({
            [GridBlockTemplatesConsts.NodeAttrs.customCss]: inlineToRule(
                template.containerCss,
                '.grid',
            ),
            [GridBlockTemplatesConsts.NodeAttrs.blocks]: template.blocks.map((block) => ({
                id: genId(),
                css: inlineToRule(block.css),
                content: block.content,
            })),
        });
        closeContainerTemplates();
    };

    const applyBlockTemplate = (template: GridBlockBlockTemplate) => {
        setBlocks([...blocks, toBlock(template)]);
        closeBlockTemplates();
    };

    const applyRawBlock = (block: GridBlockTemplateBlock) => {
        setBlocks([...blocks, {id: genId(), css: block.css, content: block.content}]);
        closeBlockTemplates();
    };

    const patchBlock = (id: string, patch: Partial<GridBlock>) =>
        setBlocks(blocks.map((block) => (block.id === id ? {...block, ...patch} : block)));

    const clearDragging = () => {
        setDraggedBlockId(null);
        setDropTarget(null);
        dragStateRef.current = null;
    };

    const beginBlockDrag = (blockId: string, event: React.PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);

        cleanupDragListenersRef.current?.();

        dragStateRef.current = {draggedId: blockId, target: null};
        setDraggedBlockId(blockId);
        setDropTarget(null);

        const handlePointerMove = (pointerEvent: PointerEvent) => {
            const target = document
                .elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)
                ?.closest<HTMLElement>(`[${BLOCK_ID_ATTR}]`);
            const targetId = target?.getAttribute(BLOCK_ID_ATTR) ?? null;

            if (!target || !targetId || targetId === blockId) {
                if (dragStateRef.current) dragStateRef.current.target = null;
                setDropTarget(null);
                return;
            }

            const nextTarget = {
                id: targetId,
                placement: getDropPlacement(
                    target.getBoundingClientRect(),
                    pointerEvent.clientX,
                    pointerEvent.clientY,
                ),
            };

            if (dragStateRef.current) dragStateRef.current.target = nextTarget;
            setDropTarget(nextTarget);
        };

        const handlePointerUp = () => {
            const dragState = dragStateRef.current;
            if (dragState?.target) {
                setBlocks(
                    moveBlock(
                        blocks,
                        dragState.draggedId,
                        dragState.target.id,
                        dragState.target.placement,
                    ),
                );
            }
            cleanupDragListenersRef.current?.();
            cleanupDragListenersRef.current = null;
            clearDragging();
        };

        const handlePointerCancel = () => {
            cleanupDragListenersRef.current?.();
            cleanupDragListenersRef.current = null;
            clearDragging();
        };

        cleanupDragListenersRef.current = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerCancel);
    };

    useEffect(() => () => cleanupDragListenersRef.current?.(), []);

    const editingBlockSettings =
        blocks.find((block) => block.id === editingBlockSettingsId) ?? null;

    return (
        <div className={`${b()} ${scopeClass}`}>
            {/* PROTOTYPE scoping: selectors in user CSS are prefixed with the instance scope. */}
            <style>{`.${scopeClass} .grid{display:grid;gap:8px}\n${scopedCss}`}</style>

            <div className={b('toolbar', [stop])}>
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
                    <>
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
                        <TemplatesPopup
                            anchor={containerTemplatesAnchor}
                            open={containerTemplatesOpen}
                            templates={containerTemplates}
                            allowAdd={allowAdd}
                            emptyText={i18n('container_templates_empty')}
                            onClose={closeContainerTemplates}
                            onApply={(template) =>
                                applyContainerTemplate(template as GridBlockContainerTemplate)
                            }
                            onAdded={setStoredTemplates}
                            onCleared={setStoredTemplates}
                        />
                    </>
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

            <div className={`${b('grid')} grid`}>
                {blocks.map((block, i) => (
                    <div
                        key={block.id}
                        className={`${b('item', {
                            dragged: draggedBlockId === block.id,
                            'drop-before':
                                dropTarget?.id === block.id && dropTarget.placement === 'before',
                            'drop-after':
                                dropTarget?.id === block.id && dropTarget.placement === 'after',
                        })} ${stop} ${blockClass(i)}`}
                        data-grid-block-id={block.id}
                    >
                        <button
                            type="button"
                            className={`${b('item-drag')} ${stop}`}
                            onPointerDown={(e) => beginBlockDrag(block.id, e)}
                            aria-label={i18n('drag_block', {index: String(i + 1)})}
                        >
                            <Icon data={GripHorizontal} size={14} />
                        </button>
                        <Button
                            view="flat"
                            size="s"
                            className={`${b('item-gear')} ${stop}`}
                            onClick={(e) => {
                                setBlockAnchor(e.currentTarget);
                                setEditingBlockSettingsId(block.id);
                            }}
                            aria-label={i18n('block_css', {index: String(i + 1)})}
                        >
                            <Icon data={Gear} size={14} className={stop} />
                        </Button>
                        <div
                            className={`${b('item-content', {
                                editing: editingBlockContentId === block.id,
                            })} ${stop}`}
                            contentEditable={false}
                            suppressContentEditableWarning
                            onDoubleClick={(e) => {
                                setEditingBlockContentId(block.id);
                                enableTextNodeEditing(e.currentTarget);
                            }}
                            onPaste={(e) => {
                                if (editingBlockContentId !== block.id) return;
                                e.preventDefault();
                                insertPlainTextAtSelection(e.clipboardData.getData('text/plain'));
                            }}
                            onBlur={(e) => {
                                const nextFocused = e.relatedTarget;
                                if (
                                    nextFocused instanceof window.Node &&
                                    e.currentTarget.contains(nextFocused)
                                ) {
                                    return;
                                }

                                patchBlock(block.id, {
                                    content: readTextOnlyEditedHtml(e.currentTarget),
                                });
                                setEditingBlockContentId(null);
                            }}
                            dangerouslySetInnerHTML={{__html: block.content}}
                        />
                    </div>
                ))}
            </div>

            <button
                type="button"
                className={`${b('add', [stop])} ${stop}`}
                onClick={(e) => {
                    setBlockTemplatesAnchor(e.currentTarget);
                    openBlockTemplates();
                }}
                aria-label={i18n('add_block')}
            >
                <Icon data={Plus} />
            </button>
            <BlockInsertPopup
                anchor={blockTemplatesAnchor}
                open={blockTemplatesOpen}
                templates={blockTemplates}
                onClose={closeBlockTemplates}
                onApplyTemplate={applyBlockTemplate}
                onApplyHtml={applyRawBlock}
            />

            <ContainerCssPopup
                anchor={containerAnchor}
                open={containerCssOpen}
                onClose={() => setContainerCssOpen(false)}
                css={customCss}
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
                    onHtmlChange={(value) => patchBlock(editingBlockSettings.id, {content: value})}
                    onCssChange={(value) => patchBlock(editingBlockSettings.id, {css: value})}
                />
            )}
        </div>
    );
};
