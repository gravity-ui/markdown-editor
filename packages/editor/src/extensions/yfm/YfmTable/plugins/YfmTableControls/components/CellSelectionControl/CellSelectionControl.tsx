import {useEffect, useMemo, useRef, useState} from 'react';

import type {VirtualElement} from '@floating-ui/react';
import {EllipsisVertical, LayoutCellsLarge, Square} from '@gravity-ui/icons';
import {Button, DropdownMenu, Icon, Menu, useDirection} from '@gravity-ui/uikit';

import type {EditorView} from '#pm/view';
import {i18n} from 'src/i18n/yfm-table';
import type {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {useRafThrottle} from '../../hooks/use-raf-throttle';
import {CellBgMenuItem} from '../CellBgMenuItem';
import {FloatingPopup, type FloatingPopupRef} from '../FloatingPopup';
import {ClearMenuItem, InsertMenuItems, RemoveMenuItem} from '../TableMenuItems';

import {type SelectionRect, getSelectionControlPosition} from './selection-geometry';

export type CellSelectionControlProps = {
    view: EditorView;
    tableElement: Element;
    selection: TableCellSelection;
    currentCellBg?: string | null;
    onCellBgChange?: (color: string | null) => void;
    onMergeCellsClick?: () => void;
    onSplitCellsClick?: () => void;
    onClearCellsClick: () => void;
    onInsertRow: (position: 'before' | 'after') => void;
    onInsertColumn: (position: 'before' | 'after') => void;
    onRemoveRowsClick?: () => void;
    onRemoveColumnsClick?: () => void;
    onRemoveTableClick?: () => void;
};

export function CellSelectionControl({
    view,
    tableElement,
    selection,
    currentCellBg,
    onCellBgChange,
    onMergeCellsClick,
    onSplitCellsClick,
    onClearCellsClick,
    onInsertRow,
    onInsertColumn,
    onRemoveRowsClick,
    onRemoveColumnsClick,
    onRemoveTableClick,
}: CellSelectionControlProps) {
    const direction = useDirection();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<FloatingPopupRef>(null);
    const anchorRect = useRef(new DOMRect());
    const anchor = useMemo<VirtualElement>(
        () => ({contextElement: tableElement, getBoundingClientRect: () => anchorRect.current}),
        [tableElement],
    );

    const updatePosition = useRafThrottle(() => {
        const button = buttonRef.current;
        const ownerWindow = view.dom.ownerDocument.defaultView;
        if (!button || !ownerWindow) return;
        const cells = getCellElements(view, selection);
        const clips = getClippingRects(tableElement, view.dom, ownerWindow);
        const buttonRect = button.getBoundingClientRect();
        const position = getSelectionControlPosition(
            cells.map((cell) => cell.getBoundingClientRect()),
            clips,
            buttonRect,
            direction,
        );
        setVisible(Boolean(position));
        if (!position) {
            setOpen(false);
            return;
        }
        anchorRect.current = new DOMRect(position.left, position.top, buttonRect.width, 0);
        popupRef.current?.forceUpdate();
    });

    useEffect(() => {
        const ownerDocument = view.dom.ownerDocument;
        const ownerWindow = ownerDocument.defaultView;
        if (!ownerWindow) return undefined;
        const containers = getAncestors(tableElement);
        const onScroll = (event: Event) => {
            if (event.target !== ownerDocument && !containers.includes(event.target as Element))
                return;
            setOpen(false);
            updatePosition();
        };
        const observer = new ResizeObserver(updatePosition);
        for (const element of [...containers, ...getCellElements(view, selection)]) {
            observer.observe(element);
        }
        if (buttonRef.current) observer.observe(buttonRef.current);
        ownerDocument.addEventListener('scroll', onScroll, true);
        ownerWindow.addEventListener('resize', updatePosition);
        updatePosition();
        return () => {
            observer.disconnect();
            ownerDocument.removeEventListener('scroll', onScroll, true);
            ownerWindow.removeEventListener('resize', updatePosition);
        };
    }, [direction, selection, tableElement, updatePosition, view]);

    return (
        <FloatingPopup
            ref={popupRef}
            open
            anchorElement={anchor}
            placement="bottom-start"
            style={{backgroundColor: 'transparent'}}
            floatingStyles={{lineHeight: 'initial', visibility: visible ? undefined : 'hidden'}}
        >
            <DropdownMenu
                open={open}
                onOpenToggle={setOpen}
                renderSwitcher={(switcherProps) => (
                    <Button
                        {...switcherProps}
                        ref={buttonRef}
                        view="raised"
                        size="s"
                        qa="g-md-yfm-table-cell-selection-btn"
                        aria-label={i18n('cells.actions')}
                        aria-haspopup="menu"
                        aria-expanded={open}
                    >
                        <Icon data={EllipsisVertical} />
                    </Button>
                )}
                popupProps={{
                    zIndex: 1010,
                    placement: ['bottom-end', 'bottom-start', 'top-end', 'top-start'],
                    returnFocus: false,
                    onClose: (event, reason) => {
                        setOpen(false);
                        if (reason === 'escapeKeyDown') {
                            event.preventDefault();
                            event.stopPropagation();
                            view.focus();
                        }
                    },
                }}
            >
                <Menu qa="g-md-yfm-table-cell-selection-menu">
                    {onCellBgChange && (
                        <Menu.Group>
                            <CellBgMenuItem
                                currentCellBg={currentCellBg}
                                onCellBgChange={(color) => {
                                    onCellBgChange(color);
                                    setOpen(false);
                                }}
                            />
                        </Menu.Group>
                    )}
                    {(onMergeCellsClick || onSplitCellsClick) && (
                        <Menu.Group>
                            {onMergeCellsClick && (
                                <DropdownMenu.Item
                                    qa="g-md-yfm-table-action-merge-cells"
                                    iconStart={<Icon data={Square} />}
                                    text={i18n('cells.merge')}
                                    action={onMergeCellsClick}
                                />
                            )}
                            {onSplitCellsClick && (
                                <DropdownMenu.Item
                                    qa="g-md-yfm-table-action-split-cells"
                                    iconStart={<Icon data={LayoutCellsLarge} />}
                                    text={i18n('cells.split')}
                                    action={onSplitCellsClick}
                                />
                            )}
                        </Menu.Group>
                    )}
                    <Menu.Group>
                        <InsertMenuItems type="row" onClick={onInsertRow} />
                        <InsertMenuItems type="column" onClick={onInsertColumn} />
                        <ClearMenuItem onClick={onClearCellsClick} />
                    </Menu.Group>
                    <Menu.Group>
                        {onRemoveRowsClick && (
                            <RemoveMenuItem
                                type="row"
                                multiple={selection.rect.bottom - selection.rect.top > 1}
                                onClick={onRemoveRowsClick}
                            />
                        )}
                        {onRemoveColumnsClick && (
                            <RemoveMenuItem
                                type="column"
                                multiple={selection.rect.right - selection.rect.left > 1}
                                onClick={onRemoveColumnsClick}
                            />
                        )}
                        {onRemoveTableClick && (
                            <RemoveMenuItem type="table" onClick={onRemoveTableClick} />
                        )}
                    </Menu.Group>
                </Menu>
            </DropdownMenu>
        </FloatingPopup>
    );
}

function getCellElements(view: EditorView, selection: TableCellSelection): Element[] {
    return selection.geometry.cellsInRect(selection.rect).flatMap((cell) => {
        const element = view.nodeDOM(selection.tablePos + cell.offset);
        return element instanceof Element ? [element] : [];
    });
}

function getAncestors(element: Element): Element[] {
    const result = [];
    for (let current: Element | null = element; current; current = current.parentElement) {
        result.push(current);
    }
    return result;
}

function getClippingRects(table: Element, editor: Element, ownerWindow: Window): SelectionRect[] {
    const clips: SelectionRect[] = [
        {left: 0, top: 0, right: ownerWindow.innerWidth, bottom: ownerWindow.innerHeight},
        editor.getBoundingClientRect(),
    ];
    for (const element of getAncestors(table)) {
        const style = ownerWindow.getComputedStyle(element);
        const clipX = /auto|scroll|hidden|clip/.test(style.overflowX);
        const clipY = /auto|scroll|hidden|clip/.test(style.overflowY);
        if (!clipX && !clipY) continue;
        const rect = element.getBoundingClientRect();
        clips.push({
            left: clipX ? rect.left : -Infinity,
            right: clipX ? rect.right : Infinity,
            top: clipY ? rect.top : -Infinity,
            bottom: clipY ? rect.bottom : Infinity,
        });
    }
    return clips;
}
