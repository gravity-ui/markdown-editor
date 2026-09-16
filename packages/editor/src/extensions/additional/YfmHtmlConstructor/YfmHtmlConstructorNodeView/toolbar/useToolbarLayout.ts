import {useLayoutEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';

const ITEM_GAP = 4;
const GROUP_GAP = 21;
const MORE_BUTTON_WIDTH = 32;
const HORIZONTAL_PADDING = 16;
const VIEWPORT_WIDTH_RATIO = 0.9;
const GROUP_ORDER = ['primary', 'style', 'actions'] as const;
const HIDE_ORDER = ['duplicate', 'delete', 'border', 'textColor', 'background', 'raw'];

export type ToolbarAction = {
    id: string;
    group: (typeof GROUP_ORDER)[number];
    node: ReactNode;
};

export const groupToolbarActions = (actions: ToolbarAction[]) =>
    GROUP_ORDER.map((group) => ({
        group,
        actions: actions.filter((action) => action.group === group),
    })).filter(({actions: items}) => items.length > 0);

const getToolbarWidth = (actions: ToolbarAction[], widths: Record<string, number>) => {
    const groups = new Set(actions.map((action) => action.group)).size;
    return (
        actions.reduce((sum, action) => sum + widths[action.id], 0) +
        (actions.length - groups) * ITEM_GAP +
        Math.max(0, groups - 1) * GROUP_GAP
    );
};

export const splitToolbarActions = (
    actions: ToolbarAction[],
    widths: Record<string, number>,
    availableWidth: number,
) => {
    if (
        !actions.every(({id}) => widths[id]) ||
        getToolbarWidth(actions, widths) <= availableWidth
    ) {
        return {visible: actions, hidden: []};
    }

    const order = [
        ...HIDE_ORDER,
        ...actions
            .map(({id}) => id)
            .filter((id) => !HIDE_ORDER.includes(id))
            .reverse(),
    ];
    const hidden = new Set<string>();
    let visible = actions;
    for (const id of order) {
        if (!visible.some((action) => action.id === id)) continue;
        hidden.add(id);
        visible = visible.filter((action) => action.id !== id);
        const overflowWidth = MORE_BUTTON_WIDTH + (visible.length ? GROUP_GAP : 0);
        if (getToolbarWidth(visible, widths) + overflowWidth <= availableWidth) break;
    }
    return {visible, hidden: actions.filter(({id}) => hidden.has(id))};
};

export const useToolbarLayout = (actions: ToolbarAction[], constrainToParent: boolean) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const [sizes, setSizes] = useState({width: Infinity, items: {} as Record<string, number>});
    const actionIds = actions.map(({id}) => id).join('|');

    useLayoutEffect(() => {
        const measure = () => {
            const row = rowRef.current;
            if (!row) return;

            const measured = Array.from(
                row.querySelectorAll<HTMLElement>('[data-toolbar-action-id]'),
            )
                .map((item) => [item.dataset.toolbarActionId!, item.offsetWidth] as const)
                .filter(([, width]) => width > 0);
            const parent = toolbarRef.current?.offsetParent;
            const parentWidth =
                constrainToParent && parent instanceof HTMLElement ? parent.clientWidth : Infinity;
            const width =
                Math.min(Math.floor(window.innerWidth * VIEWPORT_WIDTH_RATIO), parentWidth) -
                HORIZONTAL_PADDING;

            setSizes((current) => {
                if (
                    current.width === width &&
                    measured.every(([id, size]) => current.items[id] === size)
                ) {
                    return current;
                }
                return {width, items: {...current.items, ...Object.fromEntries(measured)}};
            });
        };

        measure();
        window.addEventListener('resize', measure);
        const observer =
            typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
        const parent = toolbarRef.current?.parentElement;
        if (parent) observer?.observe(parent);
        if (rowRef.current) observer?.observe(rowRef.current);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [actionIds, constrainToParent]);

    const {visible, hidden} = splitToolbarActions(actions, sizes.items, sizes.width);
    return {
        toolbarRef,
        rowRef,
        visibleGroups: groupToolbarActions(visible),
        hiddenGroups: groupToolbarActions(hidden),
    };
};
